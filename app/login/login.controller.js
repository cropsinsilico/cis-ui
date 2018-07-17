/* global angular:false */

angular
.module('cis')

/**
 * The controller for our "Login" View
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('LoginCtrl', [ '$scope', '$log', '$location', '$window', '$cookies', 'UserService', 'OAuthProviderService', 'User',
    function($scope, $log, $location, $window, $cookies, UserService, OAuthProviderService, User) {
  "use strict";
  
  User.profile = $scope.user = UserService.get();
  
  $scope.signOut = function() {
    $cookies.remove('girderToken');
    User.profile = $scope.user = UserService.get();
  };
  
  $scope.signInWithGithub = function() {
    OAuthProviderService.get().$promise.then(function(providers) {
      $window.location.href = providers['GitHub'];
    });
  };
  
  $scope.signInWithGirder = function() {
    $window.location.href = '/girder#?dialog=login';
  };
  
  $scope.signUpWithGirder = function() {
    $window.location.href = '/girder#?dialog=register';
  };
}]);
