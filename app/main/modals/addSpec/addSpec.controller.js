/* global angular:false */

angular
.module('cis')

/**
 * The Controller for our "Add Spec" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('AddSpecCtrl', [ '$scope', '$log', '$uibModalInstance', '_', 'specs',
    function($scope, $log, $uibModalInstance, _, specs) {
  "use strict";
  
  $scope.newInput = '';
  $scope.newOutput = '';
  $scope.modelArgsString = ''; // TODO: Parse this into an array on submit
  
  $scope.specs = specs;
  
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
  
  /** Returns true if a spec with this name already exists */
  $scope.nameIsNotUnique = function(name) {
    return _.find($scope.specs, [ 'name', name.toLowerCase() ]);
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
    
    $scope.newModel.name = $scope.newModel.label.toLowerCase();
    
    $uibModalInstance.close(model);
  };

  $scope.close = function() {
    $log.debug("Closing modal with dismissal!");
    $uibModalInstance.dismiss('cancel');
  };
}]);