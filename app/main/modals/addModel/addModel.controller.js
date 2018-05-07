/* global angular:false */

angular
.module('cis')

/**
 * The Controller for our "Export JSON" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('AddModelCtrl', [ '$scope', '$log', '$uibModalInstance', '_',
    function($scope, $log, $uibModalInstance, _) {
  "use strict";
  
  $scope.newInput = '';
  $scope.newOutput = '';
  $scope.modelArgsString = ''; // TODO: Parse this into an array on submit
  
  $scope.newModel = {
    // model metadata
    label: '',
    name: '',
    description: '',
    icon: '',
    
    // execution info
    driver: '',
    args: [],
    sourcedir: '',
    cmakeargs: '',
    makefile: '',
    makedir: '',
    
    // runtime info
    inputs: [],
    outputs: [],
  };

  $scope.submit = function() {
    $log.debug("Closing modal with success!");
    let model = $scope.newModel;
    
    // TODO: Convert args string into array
    if (!$scope.modelArgsString.args || $scope.modelArgsString.args.replace(/ /g,'') === '') {
      model.args = null;
    } else {
      model.args = _.split($scope.modelArgsString.args, ' ');
    }
    
    $uibModalInstance.close(model);
  };

  $scope.close = function() {
    $log.debug("Closing modal with dismissal!");
    $uibModalInstance.dismiss('cancel');
  };
}]);