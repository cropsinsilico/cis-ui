/* global angular:false */

// React + AngularJS: see https://blog.rapid7.com/2016/02/03/combining-angularjs-and-reactjs-for-better-applications/


angular.module('cis', [ 'ngMessages', 'ngRoute', 'cis-api', 
  'angular-clipboard', 'ui.bootstrap', 'ui.slider', 'swaggerUi' ])

/** Enable DEBUG mode? */
.constant('DEBUG', false)

/** Set up our connection to the API server */
.constant('ApiUri', '/api/v1')
.factory('CisApi', [ 'ApiUri', 'ApiServer', (ApiUri, ApiServer) => {
  return new ApiServer(ApiUri);
}])

.factory('_', [ function() { return window._; } ])

/** some helpers/wrappers to cache data we receive from the server */
.factory('Models', [ '$http', function($http) {
  return { get: function() { return $http.get('./data/models.json'); } };
}])

// FIXME: Do we still need this?
.factory('Nodes', [ '$http', function($http) {
  return { get: function() { return $http.get('./data/nodes.json'); } };
}])

// FIXME: Do we still need this?
.factory('Links', [ '$http', function($http) {
  return { get: function() { return $http.get('./data/links.json'); } };
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
.config([ '$locationProvider', '$logProvider', '$routeProvider', 'DEBUG',
    function($locationProvider, $logProvider, $routeProvider, DEBUG) {
  "use strict";
  
  // TODO: Google Analytics?
  
  // Squelch debug-level log messages
  $logProvider.debugEnabled(DEBUG); 
  
  // FIXME: Enable HTML 5 mode
  $locationProvider.html5Mode(false);
  
  // Set up the route(s) for our module
  $routeProvider
    .when('/', {
      title: 'Crops in Silico',
      controller: 'MainCtrl',
      templateUrl: 'app/main/main.template.html',
      pageTrack: '/'
    })
    .when('/swagger', {
      title: 'Crops in Silico API',
      controller: 'SwaggerCtrl',
      templateUrl: 'app/swagger/swagger.template.html',
      pageTrack: '/swagger'
    })
    .otherwise('/');
}]);
