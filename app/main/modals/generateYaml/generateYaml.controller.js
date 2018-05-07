/* global angular:false */

angular
.module('cis')

.factory('jsyaml', [() => window.jsyaml])

/**
 * The Controller for our "Formatted Manifest" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('GenerateYamlCtrl', [ '$scope', '$log', '$uibModalInstance', '_', 'clipboard', 'jsyaml', 'results', 'title', 
    function($scope, $log, $uibModalInstance, _, clipboard, jsyaml, results, title) {
  "use strict";
  
  $scope.title = title;
  $scope.results = angular.copy(results);
  
  $scope.legacy = false;
  
  $scope.reformat = function(legacy) {
    let toYaml = { models: angular.copy(results.nodes) };
    if (!legacy) {
        toYaml.connections = angular.copy(results.connections);
    } else {
      const edges = angular.copy(results.edges);
      angular.forEach(toYaml.models, function(node) {
        // Coerce to array if necessary
        let inputs = angular.isArray(node.inputs) ? node.inputs : [node.inputs]; 
        let outputs = angular.isArray(node.outputs) ? node.outputs : [node.outputs];
        
        let transformedInputs = [];
        angular.forEach(inputs, function(input) {
          let edge = _.find(edges, (edge) => edge.destination.label === input);
          if (edge) {
            transformedInputs.push({
              name: edge.destination.label,
              driver: edge.type || 'RMQInputDriver',
              args: edge.args || edge.id
            });
          }
        });
        let transformedOutputs = [];
        angular.forEach(outputs, function(output) {
          let edge = _.find(edges, (edge) => edge.source.label === output);
          if (edge) {
            transformedOutputs.push({
              name: edge.source.label,
              driver: edge.type || 'RMQOutputDriver',
              args: edge.args || edge.id
            });
          }
        });
        
        node.inputs = transformedInputs;
        node.outputs = transformedOutputs;
      });
    }
    return jsyaml.safeDump(toYaml);
  };
    
  $scope.copy = function() {
    if (!clipboard.supported) {
      alert('Sorry, copy to clipboard is not supported');
      return;
    }
    let formatted = $scope.reformat($scope.legacy);
    clipboard.copyText(formatted);
  };

  $scope.close = function() {
    $log.debug("Closing modal with dismissal!");
    $uibModalInstance.dismiss('cancel');
  };
}]);