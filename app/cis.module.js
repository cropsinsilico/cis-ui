/* global angular:false */

// React + AngularJS: see https://blog.rapid7.com/2016/02/03/combining-angularjs-and-reactjs-for-better-applications/


angular.module('cis', [ 'ngRoute', 'cis-api', 'ui.slider' ])

/** Set up our connection to the API server */
.constant('ApiUri', '/api/v1')
.factory('CisApi', [ 'ApiUri', 'ApiServer', function(ApiUri, ApiServer) {
  return new ApiServer(ApiUri);
}])

/** some helpers/wrappers to provide React / ReactDOM / TheGraph */
.factory('TheGraph', [ function() { return window.TheGraph; }])
.factory('React', [ function() { return window.React; }])
.factory('ReactDOM', [ function() { return window.ReactDOM; }])

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

/** Configure routes for our module */
.config([ '$locationProvider', '$logProvider', '$routeProvider',
    function($locationProvider, $logProvider, $routeProvider) {
  "use strict";
  
  // TODO: Google Analytics?
  
  // Squelch debug-level log messages
  $logProvider.debugEnabled(true); 
  
  // Enable HTML 5 mode
  // FIXME: Double navigation is weird/annoying
  $locationProvider.html5Mode(true);
  
  // Set up the route(s) for our module
  $routeProvider.when('/', {
      title: 'Crops in Silico',
      controller: 'MainCtrl',
      templateUrl: 'app/main/main.template.html',
      pageTrack: '/'
    }).otherwise('/');
}]);