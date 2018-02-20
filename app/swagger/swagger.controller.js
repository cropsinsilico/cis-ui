/* global angular:false */

angular
.module('cis')

/**
 * The controller for our "Swagger API" View
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('SwaggerCtrl', [ '$scope', '$log', '$http', 
    function($scope, $log, $http) {
  "use strict";
  
  var url = '/swagger.yaml';
  
  $scope.swaggerSpec = '';
  
  $http.get(url).then(function(data) {
    $log.debug("Successfully pulled swagger spec");
    $scope.swaggerSpec = data.data;
  }, function(response) {
    $log.error("Failed to retrieve swagger spec");
  });
}]);
