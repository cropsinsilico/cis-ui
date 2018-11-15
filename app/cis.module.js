/* global angular:false */

// React + AngularJS: see https://blog.rapid7.com/2016/02/03/combining-angularjs-and-reactjs-for-better-applications/


angular.module('cis', [ 'ngMessages', 'ngResource', 'ngRoute', 'ngCookies', 'angular-clipboard', 'ui.bootstrap', 'ngCacheBuster', 'ngTheGraph' ])

/** Enable DEBUG mode? */
.constant('DEBUG', false)

.constant('JupyterHubURI', 'https://hub.cis-iu.ndslabs.org')

.factory('User', [ '$window', '$log', '$cookies', 'UserService', 'OAuthProviderService', 'JupyterHubURI', function($window, $log, $cookies, UserService, OAuthProviderService, JupyterHubURI) { 
  let userStore = {
    profile: UserService.get(),
    signUpWithGirder: function() { $window.location.href = '/girder#?dialog=register'; },
    signInWithGirder: function() { $window.location.href = '/girder#?dialog=login'; },
    signInWithGithub: function() {
      $log.debug("Signing in...");
      OAuthProviderService.get().$promise.then(function(providers) {
        // Build up URL to JupyterHub oauth_login endpoint
        let jupyterHubOauth = JupyterHubURI + '/hub/oauth_login';
        
        // Grab the location of Girder's OAuth login from the Girder API
        let girderOauth = providers['GitHub'];
        
        let urlEncodedSuffix = encodeURIComponent(girderOauth);
        
        // Chain the two OAuth requests together and redirect the user through the chain
        $window.location.href = jupyterHubOauth + '?next=' + urlEncodedSuffix;
      });
    },
    signOut: function() {
      $log.debug("Signing out...");
      $cookies.remove('girderToken');
      // TODO: Should we try to clear Jupyter cookies here too?
      return userStore.profile = UserService.get();
    }
  };
  
  return userStore;
}])

/** Set up our connection to REST API */
.constant('ApiUri', '/api/v1')
.constant('AuthCookieName', 'girderToken')
.constant('AuthHeaderName', 'Girder-Token')
.factory('CisApi', [ 'ApiUri', 'ApiServer', function(ApiUri, ApiServer) {
  return new ApiServer(ApiUri);
}])

.factory('_', [ function() { return window._; } ])

.factory('GraphPortService', [ '$resource', function ($resource) {
    return $resource('/data/graphPorts.json');
}])

.factory('OAuthProviderService', [ '$resource', 'ApiUri', function ($resource, ApiUri) {
    return $resource(ApiUri + '/oauth/provider?redirect=%2F', {});
}])

.factory('UserService', [ '$resource', 'ApiUri', function ($resource, ApiUri) {
    return $resource(ApiUri + '/user/me', {});
}])

.factory('SpecService', [ '$resource', 'ApiUri', function ($resource, ApiUri) {
    return $resource(ApiUri + '/spec/:id', {id: "@_id"}, {
      update: {method: 'PUT'}
    });
}])

.factory('FileService', [ '$resource', 'JupyterHubURI', function ($resource, JupyterHubURI) {
    return $resource(JupyterHubURI + '/user/:username/api/contents/:fileId', {username: "@username", fileId: "@id" }, {
      save: {method: 'PUT'}
    });
}])

.factory('GraphService', [ '$resource', 'ApiUri', function ($resource, ApiUri) {
    return $resource(ApiUri + '/graph/:id', {id: "@_id"}, {
      update: {method: 'PUT'}
    });
}])

/** Configure routes for our module */
.config([ '$locationProvider', '$logProvider', '$routeProvider', '$provide', '$httpProvider', 'httpRequestInterceptorCacheBusterProvider', 'DEBUG', 
    function($locationProvider, $logProvider, $routeProvider, $provide, $httpProvider, httpRequestInterceptorCacheBusterProvider, DEBUG) {
  "use strict";
  
  // TODO: Google Analytics?
  
  // Set our match list for the cache buster
  httpRequestInterceptorCacheBusterProvider.setMatchlist([/.*node_modules.*/,/.*api.*/,/.*uib.*/,/.*hub.*/]);
  
  // Squelch debug-level log messages
  $logProvider.debugEnabled(DEBUG); 
  
  // FIXME: Enable HTML 5 mode?
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
      // Route to login page if our API server returns a 401
      'responseError': function(rejection) {
        // If this is a response from our API server
        if (_.includes(rejection.config.url, ApiUri)) {
          $log.error("Response error encountered: " + rejection.config.url);
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
      controllerAs: 'mainCtrl',
      templateUrl: 'app/main/main.template.html',
      pageTrack: '/'
    })
    .when('/login', {
      title: 'Sign In',
      controller: 'LoginCtrl',
      controllerAs: 'loginCtrl',
      templateUrl: 'app/login/login.template.html',
      pageTrack: '/login'
    })
    .otherwise('/');
}]);
