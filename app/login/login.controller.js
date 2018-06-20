/* global angular:false */

angular
.module('cis')

/**
 * The controller for our "Login" View
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('LoginCtrl', [ '$scope', '$log', '$location', '$window', 'OAuthProviderService', 
    function($scope, $log, $location, $window, OAuthProviderService) {
  "use strict";
  
  $scope.signIn = function() {
    OAuthProviderService.get().$promise.then(function(providers) {
      $window.location.href = providers['GitHub'];
    });
  };
}]);
