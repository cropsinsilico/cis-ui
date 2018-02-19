/* global angular:false */

angular
.module('cis')

.factory('jsyaml', [() => window.jsyaml])

/**
 * The Controller for our "Export Spec" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('ExportCtrl', [ '$scope', '$log', '$uibModalInstance', '_', 'clipboard', 'jsyaml', 'results', 'title', 'isJson',
    function($scope, $log, $uibModalInstance, _, clipboard, jsyaml, results, title, isJson) {
  "use strict";
  
  $scope.title = title;
  $scope.isJson = isJson;
  $scope.results = angular.copy(results);
  
  
  $scope.formatted = "";
  if (isJson) {
      $scope.formatted = JSON.stringify($scope.results, null, 2);
  } else {
      $scope.formatted = jsyaml.safeDump($scope.results);
  }
    
  
  $scope.copy = function() {
    if (!clipboard.supported) {
      alert('Sorry, copy to clipboard is not supported');
      return;
    }
    clipboard.copyText($scope.formatted);
  };

  $scope.close = function() {
    $log.debug("Closing modal with dismissal!");
    $uibModalInstance.dismiss('cancel');
  };
}]);