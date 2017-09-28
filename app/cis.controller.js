/* global angular:false go:false */

angular.module('cis', [ 'ui.slider' ])
.controller('CisCtrl', [ '$scope', '$timeout', '$q', 'Links', 'Nodes', 'Models', function($scope, $timeout, $q, Links, Nodes, Models) {
  // TODO: Save to localStorage on changes
  // TODO: "Palette" drag and drop functionality
  
  // TODO: Hook this up to a real API
  $scope.environment = {
    nitrogen: "0.0",
    carbonDioxide: "400.0",
    light: "2000.0",
    temperature: "25.0"
  };
  
  // TODO: Hook this up to a real API
  //$scope.models = Models.get();
  
  
  // Populate by default with full plant model
  $scope.nodes = [];
  let nodePromise = Nodes.get().then(function(response) {
    $scope.nodes = response.data;
  }, function(err) {
    console.error("Error pulling Nodes:", err);
  });
  
  $scope.links = [];
  let linkPromise = Links.get().then(function(response) {
    $scope.links = response.data;
  }, function(err) {
    console.error("Error pulling Links:", err);
  });

  $scope.model = null;
  $q.all([ nodePromise, linkPromise ]).then(function() {
    $scope.model = new go.GraphLinksModel($scope.nodes, $scope.links);
    $scope.model.selectedNodeData = null;
  });
  
  $scope.running = false;
  $scope.runSimulation = function() {
    $scope.running = true;
    
    // TODO: Hook this up to a real API
    alert("This button could POST to an API endpoint that would collect the current nodes, links, and parameters.");
    let timeout = $timeout(function() {
      $scope.running = false;
      $timeout.cancel(timeout);
      alert("Fake simulation complete!");
    }, 5000);
  };
}])
.factory('Models', [ '$http', function($http) {
  var factory = {};
  factory.get = function() {
    return $http.get('./data/models.json');
  };
  return factory;
}])
.factory('Nodes', [ '$http', function($http) {
  var factory = {};
  factory.get = function() {
    return $http.get('./data/nodes.json');
  };
  return factory;
}])
.factory('Links', [ '$http', function($http) {
  var factory = {};
  factory.get = function() {
    return $http.get('./data/links.json');
  };
  return factory;
}]);