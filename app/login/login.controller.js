/* global angular:false */

angular
.module('cis')

/**
 * The controller for our "Login" View
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('LoginCtrl', [ '$scope', '$rootScope', '$log', '$location', '$window', '$cookies', 'UserService', 'OAuthProviderService', 'User',
    function($scope, $rootScope, $log, $location, $window, $cookies, UserService, OAuthProviderService, User) {
  "use strict";
  
  $rootScope.user = User.profile;
  
  $rootScope.signOut = function() {
    $rootScope.user = User.signOut();
  };
  
  $rootScope.signInWithGithub = User.signInWithGithub;
  $rootScope.signInWithGirder = User.signInWithGirder;
  $rootScope.signUpWithGirder = User.signUpWithGirder;
  
}]);
