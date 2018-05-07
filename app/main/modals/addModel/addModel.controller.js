/* global angular:false */

angular
.module('cis')

/**
 * The Controller for our "Export JSON" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('ExportJsonCtrl', [ '$scope', '$log', '$uibModalInstance', '_', 'clipboard', 'results', 'title',
    function($scope, $log, $uibModalInstance, _, clipboard, results, title) {
  "use strict";
  
  $scope.title = title;
  $scope.newModel = {
    inputs: [],
    outputs: [],
  };

  $scope.submit = function() {
    $log.debug("Closing modal with success!");
    $uibModalInstance.dismiss('cancel');
  };

  $scope.close = function() {
    $log.debug("Closing modal with dismissal!");
    $uibModalInstance.dismiss('cancel');
  };
}]);