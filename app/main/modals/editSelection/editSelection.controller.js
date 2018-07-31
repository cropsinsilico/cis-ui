/* global angular:false */

angular
.module('cis')

/**
 * The Controller for our "Edit Selection" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('EditSelectionCtrl', [ '$scope', '$log', '$uibModalInstance', '_', 'selectedItem',
    function($scope, $log, $uibModalInstance, _, selectedItem) {
  "use strict";
  
  $scope.selectedItem = selectedItem;

  $scope.save = function() {
    $log.debug("Closing modal with success!");
    $uibModalInstance.dismiss('saved');
  };

  $scope.close = function() {
    $log.debug("Closing modal with dismissal!");
    $uibModalInstance.dismiss('cancel');
  };
}]);