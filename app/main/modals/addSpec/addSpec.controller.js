/* global angular:false */

angular
.module('cis')

/**
 * The Controller for our "Add Spec" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('AddSpecCtrl', [ '$scope', '$log', '$uibModalInstance', '_', 'specs', 'specToEdit',
    function($scope, $log, $uibModalInstance, _, specs, specToEdit) {
  "use strict";
  
  $scope.newInput = '';
  $scope.newOutput = '';
  
  // Parse this into an array on submit
  $scope.modelArgsString = '';
  
  
  $scope.specs = specs;
  
  $scope.editMode = specToEdit !== null;
  if (specToEdit) {
    // Join args array into a string
    if (specToEdit.args) {
      $scope.modelArgsString = specToEdit.args.join(' ');
    }
    
    $scope.newModel = angular.copy(specToEdit);
  } else {
    $scope.newModel = {
      // model metadata
      label: '',
      name: '',
      description: '',
      icon: '',
      
      // execution info
      language: '',
      args: [],
      sourcedir: '',
      cmakeargs: '',
      makefile: '',
      makedir: '',
      
      // runtime info
      inports: [],
      outports: [],
    };
  }
  
  /** Returns true if a spec with this name already exists */
  $scope.nameIsNotUnique = function(name) {
    return _.find($scope.specs, [ 'name', name.toLowerCase() ]);
  };
  
  var deleteIfEmpty = function(propName) {
    if (!$scope.newModel[propName]) {
      delete $scope.newModel[propName];
    }
  };

  $scope.submit = function() {
    $log.debug("Closing modal with success!");
    let model = $scope.newModel;
    
    // Explode args string into array
    if (!$scope.modelArgsString || $scope.modelArgsString.replace(/ /g,'') === '') {
      model.args = null;
    } else {
      model.args = _.split($scope.modelArgsString, ' ');
    }
    
    // Coerce inports from strings into objects, if necessary
    var inports = angular.copy(model.inports);
    model.inports = [];
    angular.forEach(inports, function(port) {
      if (angular.isString(port)) {
        model.inports.push({ label: port, name: port.toLowerCase(), type: "all" });
      } else {
        model.inports.push(port);
      }
    });
    
    // Coerce outports from strings into objects, if necessary
    var outports = angular.copy(model.outports);
    model.outports = [];
    angular.forEach(outports, function(port) {
      if (angular.isString(port)) {
        model.outports.push({ label: port, name: port.toLowerCase(), type: "all" });
      } else {
        model.outports.push(port);
      }
    });
    
    $scope.newModel.name = $scope.newModel.label.toLowerCase();
    
    deleteIfEmpty('sourcedir');
    deleteIfEmpty('cmakeargs');
    deleteIfEmpty('makefile');
    deleteIfEmpty('makedir');
    
    $uibModalInstance.close(model);
  };

  $scope.close = function() {
    $log.debug("Closing modal with dismissal!");
    $uibModalInstance.dismiss('cancel');
  };
}]);