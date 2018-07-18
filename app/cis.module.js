/* global angular:false */

// React + AngularJS: see https://blog.rapid7.com/2016/02/03/combining-angularjs-and-reactjs-for-better-applications/


angular.module('cis', [ 'ngMessages', 'ngResource', 'ngRoute', 'ngCookies', 'cis-api', 
  'angular-clipboard', 'ui.bootstrap', 'ui.slider', 'swaggerUi' ])

/** Enable DEBUG mode? */
.constant('DEBUG', true)

.factory('User', [ function() { 
  let userStore = {
    profile: {}
  };
  
  return userStore;
}])

/** Set up our connection to REST API */
.constant('ApiUri', '/api/v1')
.constant('AuthCookieName', 'girderToken')
.constant('AuthHeaderName', 'Girder-Token')
.factory('CisApi', [ 'ApiUri', 'ApiServer', (ApiUri, ApiServer) => {
  return new ApiServer(ApiUri);
}])

.factory('_', [ function() { return window._; } ])

.factory('GraphPortService', [ '$resource', function ($resource) {
    return $resource('/data/graphPorts.json');
}])

.factory('OAuthProviderService', [ '$resource', 'ApiUri', function ($resource, ApiUri) {
    return $resource(ApiUri + '/oauth/provider?redirect=https://www.cis.ndslabs.org', {});
}])

.factory('UserService', [ '$resource', 'ApiUri', function ($resource, ApiUri) {
    return $resource(ApiUri + '/user/me', {});
}])

.factory('SpecService', [ '$resource', 'ApiUri', function ($resource, ApiUri) {
    return $resource(ApiUri + '/spec/:id', {id: "@_id"}, {
      update: {method: 'PUT'}
    });
}])

.factory('GraphService', [ '$resource', 'ApiUri', function ($resource, ApiUri) {
    return $resource(ApiUri + '/graph/:id', {id: "@_id"}, {
      update: {method: 'PUT'}
    });
}])

.factory('Clipboard', function() {
  let clipboardContent = {nodes:[], edges:[]}; // XXX: hidden state
  let factory = {};
  
  let makeNewId = function(label) {
    var num = 60466176; // 36^5
    num = Math.floor(Math.random() * num);
    var id = label + '_' + num.toString(36);
    return id;
  }
  
  factory.copy = function(graph, keys) {
    //Duplicate all the nodes before putting them in clipboard
    //this will make this work also with cut/Paste and once we
    //decide if/how we will implement cross-document copy&paste will work there too
    clipboardContent = { nodes:[], edges:[] };
    
    let map = {};
    let i, len;
    for (i = 0, len = keys.length; i < len; i++) {
      let key = keys[i];
      let node = graph.getNode(key);
      let newNode = angular.copy(node);
      newNode.id = makeNewId(node.component);
      clipboardContent.nodes.push(newNode);
      map[node.id] = newNode.id;
    }
    for (i = 0, len = graph.edges.length; i < len; i++) {
      let edge = graph.edges[i];
      let fromNode = edge.from.node;
      let toNode = edge.to.node;
      if (map.hasOwnProperty(fromNode) && map.hasOwnProperty(toNode)) {
        let newEdge = angular.copy(edge);
        newEdge.from.node = map[fromNode];
        newEdge.to.node = map[toNode];
        clipboardContent.edges.push(newEdge);
      }
    }
  
  }
  
  factory.paste = function(graph) {
    let map = {};
    let pasted = { nodes:[], edges:[] };
    
    let i, len;
    for (i = 0, len = clipboardContent.nodes.length; i < len; i++) {
      let node = clipboardContent.nodes[i];
      let meta = angular.copy(node.metadata);
      meta.x += 36;
      meta.y += 36;
      let newNode = graph.addNode(makeNewId(node.component), node.component, meta);
      map[node.id] = newNode.id;
      pasted.nodes.push(newNode);
    }
    for (i = 0, len = clipboardContent.edges.length; i < len; i++) {
      let edge = clipboardContent.edges[i];
      let newEdgeMeta = angular.copy(edge.metadata);
      let newEdge;
      if (edge.from.hasOwnProperty('index') || edge.to.hasOwnProperty('index')) {
        // One or both ports are addressable
        let fromIndex = edge.from.index || null;
        let toIndex = edge.to.index || null;
        newEdge = graph.addEdgeIndex(map[edge.from.node], edge.from.port, fromIndex, map[edge.to.node], edge.to.port, toIndex, newEdgeMeta);
      } else {
        newEdge = graph.addEdge(map[edge.from.node], edge.from.port, map[edge.to.node], edge.to.port, newEdgeMeta);
      }
      pasted.edges.push(newEdge);
    }
    return pasted;
  }
  
  return factory;
})

/** Configure routes for our module */
.config([ '$locationProvider', '$logProvider', '$routeProvider', '$provide', '$httpProvider', 'DEBUG',
    function($locationProvider, $logProvider, $routeProvider, $provide, $httpProvider, DEBUG) {
  "use strict";
  
  // TODO: Google Analytics?
  
  // Squelch debug-level log messages
  $logProvider.debugEnabled(DEBUG); 
  
  // FIXME: Enable HTML 5 mode
  $locationProvider.html5Mode(false);
  
  // Register an HTTP interceptor to handle passing and checking our auth token
  $provide.factory('authHttpInterceptor', [ '$q', '$log', '$location', '$cookies', 'AuthHeaderName', 'AuthCookieName', '_', 'ApiUri', 
      function($q, $log, $location, $cookies, AuthHeaderName, AuthCookieName, _, ApiUri) {
    return {
            // Attach our auth token to each outgoing request (to the api server)
      'request': function(config) {
        // If this is a request for our API server
        if (config && _.includes(config.url, ApiUri)) {
          // If this was *not* an attempt to authenticate
          if (!_.includes(config.url, '/user/authentication')) {
            // We need to attach our token to this request
            config.headers[AuthHeaderName] = $cookies.get(AuthCookieName);
          }
        }
        return config;
      },
      'requestError': function(rejection) {
        if (_.includes(rejection.config.url, ApiUri)) {
          $log.error("Request error encountered: " + rejection.config.url);
        }
        return $q.reject(rejection);
      },
      'response': function(response) {
        // If this is a response from our API server
        if (_.includes(response.config.url, ApiUri)) {
          // If this was in response to a Girder /user/authentication request
          if (_.includes(response.config.url, '/user/authentication') && response.config.method === 'GET') {
            // This response should contain a new token, so save it as a cookie
            //$cookies.put('Girder-Token', response.data.authToken.token, CookieOptions);
          }
        }
        
        return response;
      },
      // Route to login page if our API server returns a 401
      'responseError': function(rejection) {
        // If this is a response from our API server
        if (_.includes(rejection.config.url, ApiUri)) {
          $log.error("Response error encountered: " + rejection.config.url);
        
          // Read out the HTTP error code
          var status = rejection.status;
          
          // Handle HTTP 401: Not Authorized - User needs to provide credentials
          if (status == 401) {
            //$log.debug("Routing to login...");
            //$location.path('/login')
          }
        }
        
        // otherwise
        return $q.reject(rejection);
      }
    };
  }]);
  
  $httpProvider.interceptors.push('authHttpInterceptor');
  
  // Set up the route(s) for our module
  $routeProvider
    .when('/', {
      title: 'Crops in Silico',
      controller: 'MainCtrl',
      templateUrl: 'app/main/main.template.html',
      pageTrack: '/'
    })
    .when('/login', {
      title: 'Sign In',
      controller: 'LoginCtrl',
      templateUrl: 'app/login/login.template.html',
      pageTrack: '/login'
    })
    .otherwise('/');
}]);
