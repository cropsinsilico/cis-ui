/* global angular:false */

angular
.module('cis')

/**
 * The Controller for our "Add Spec" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('AddSpecCtrl', [ '$scope', '$log', '$uibModalInstance', '_', 'specs', 'isEdit',
    function($scope, $log, $uibModalInstance, _, specs, isEdit) {
  "use strict";
  
  $scope.newInput = '';
  $scope.newOutput = '';
  $scope.modelArgsString = ''; // TODO: Parse this into an array on submit
  
  $scope.specs = specs;
  
  
  $scope.isEdit = isEdit;
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
    inports: [],
    outports: [],
  };
  
  /** Returns true if a spec with this name already exists */
  $scope.nameIsNotUnique = function(name) {
    return _.find($scope.specs, [ 'name', name.toLowerCase() ]);
  };

  $scope.submit = function() {
    $log.debug("Closing modal with success!");
    let model = $scope.newModel;
    
    // Split args string into array
    if (!$scope.modelArgsString || $scope.modelArgsString.replace(/ /g,'') === '') {
      model.args = null;
    } else {
      model.args = _.split($scope.modelArgsString, ' ');
    }
    
    // Coerce inports from strings into objects
    var inports = angular.copy(model.inports);
    model.inports = [];
    angular.forEach(inports, function(port) {
      model.inports.push({ label: port, name: port.toLowerCase(), type: "all" });
    });
    
    // Coerce outports from strings into objects
    var outports = angular.copy(model.outports);
    model.outports = [];
    angular.forEach(outports, function(port) {
      model.outports.push({ label: port, name: port.toLowerCase(), type: "all" });
    });
    
    $scope.newModel.name = $scope.newModel.label.toLowerCase();
    
    $uibModalInstance.close(model);
  };

  $scope.close = function() {
    $log.debug("Closing modal with dismissal!");
    $uibModalInstance.dismiss('cancel');
  };
}]);