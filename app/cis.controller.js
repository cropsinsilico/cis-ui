/* global angular:false */

// React + AngularJS: see https://blog.rapid7.com/2016/02/03/combining-angularjs-and-reactjs-for-better-applications/

angular.module('cis', [ 'cis-api', 'ui.slider', 'react' ])

.constant('ApiUri', '/api/v1')
.factory('CisApi', [ 'ApiUri', 'ApiServer', function(ApiUri, ApiServer) {
  return new ApiServer(ApiUri);
}])

/** Configure routes / HTTP for our app */
.config([ '$locationProvider', '$logProvider',
    function($locationProvider, $logProvider) {
  "use strict";
  
   // Squelch debug-level log messages
  $logProvider.debugEnabled(true); 
  
  // Enable HTML 5 mode
  // FIXME: Double navigation is weird/annoying
  $locationProvider.html5Mode(true);
}])
.factory('TheGraph', [ function() { return window.TheGraph; }])
.factory('React', [ function() { return window.React; }])
.factory('ReactDOM', [ function() { return window.ReactDOM; }])
.controller('CisCtrl', [ '$scope', '$window', '$timeout', '$q', '$http', 'TheGraph', 'Links', 'Nodes', 'Models', 'CisApi', 
    function($scope, $window, $timeout, $q, $http, TheGraph, Links, Nodes, Models, CisApi) {
  "use strict";
  
  let nodeStorageKey = 'cis::nodes';
  let edgeStorageKey = 'cis::edges';
  
  // Load up an empty graph
  let fbpGraph = TheGraph.fbpGraph;
  $scope.graph = new fbpGraph.Graph();
  
  // Load from localStorage on startup
  let loadedNodes = angular.fromJson($window.localStorage.getItem(nodeStorageKey));
  if (loadedNodes) {
    let loadedEdges = angular.fromJson($window.localStorage.getItem(edgeStorageKey));
    
    // Import our previous state, if one was found
    angular.forEach(loadedNodes, node => { $scope.graph.addNode(node.id, node.component, node.metadata); });
    angular.forEach(loadedEdges, edge => { $scope.graph.addEdge(edge.from.node, edge.from.port, edge.to.node, edge.to.port, edge.metadata); });
  }
  
  // TODO: Save to localStorage on changes
  $scope.$watch("graph", (newValue, oldValue) => {
    $window.localStorage.setItem(nodeStorageKey, angular.toJson($scope.graph.nodes));
    $window.localStorage.setItem(edgeStorageKey, angular.toJson($scope.graph.edges));
  });
  
  // TODO: Hook this up to a real API
  $scope.environment = {
    nitrogen: "0.0",
    carbonDioxide: "400.0",
    light: "2000.0",
    temperature: "25.0"
  };
  
  // Our component library
  $scope.library = {
    basic: {
      name: 'basic',
      description: 'basic demo component',
      icon: 'eye',
      inports: [
        {'name': 'in0', 'type': 'all'},
        {'name': 'in1', 'type': 'all'},
        {'name': 'in2', 'type': 'all'}
      ],
      outports: [
        {'name': 'out', 'type': 'all'}
      ]
    },
    tall: {
      name: 'tall',
      description: 'tall demo component',
      icon: 'eye',
      inports: [
        {'name': 'in0', 'type': 'all'},
        {'name': 'in1', 'type': 'all'},
        {'name': 'in2', 'type': 'all'},
        {'name': 'in3', 'type': 'all'},
        {'name': 'in4', 'type': 'all'},
        {'name': 'in5', 'type': 'all'},
        {'name': 'in6', 'type': 'all'},
        {'name': 'in7', 'type': 'all'},
        {'name': 'in8', 'type': 'all'},
        {'name': 'in9', 'type': 'all'},
        {'name': 'in10', 'type': 'all'},
        {'name': 'in11', 'type': 'all'},
        {'name': 'in12', 'type': 'all'}
      ],
      outports: [
        {'name': 'out0', 'type': 'all'}
      ]
    }
  };
  
  $scope.editorHeight = window.innerHeight - 300;
  $scope.editorWidth = window.innerWidth;
  
  /** Clears out the current graph, returns true if cleared */
  $scope.clearGraph = function() {
    let result = confirm("Are you sure you want to clear the canvas?\nAll existing graph data will be lost.");
    return result && ($scope.graph = new fbpGraph.Graph());
  };
  
  /** Creates a random graph */
  $scope.randomGraph = function() {
    if ($scope.clearGraph()) {
      $scope.graph.startTransaction('randomgraph');
      for (let i=0; i<20; i++) {
        let node = $scope.randomNode();
        $scope.randomEdge(node.id);
        $scope.randomEdge(node.id);
      }
      $scope.graph.endTransaction('randomgraph');
    }
  };
  
  /** Adds a random node */
  $scope.randomNode = function (useTransaction) {
    let id = Math.round(Math.random()*100000).toString(36);
    let component = Math.random() > 0.5 ? 'basic' : 'tall';
    let metadata = {
      label: component,
      x: Math.round(Math.random()*800),
      y: Math.round(Math.random()*600)
    };
    let newNode = $scope.graph.addNode(id, component, metadata);
    return newNode;
  };
  
  /** Adds a random edge to our graph */
  $scope.randomEdge = function(outNodeID) {
    let nodes = $scope.graph.nodes;
    let len = nodes.length;
    if ( len<1 ) { return; }
    let node1 = outNodeID || nodes[Math.floor(Math.random()*len)].id;
    let node2 = nodes[Math.floor(Math.random()*len)].id;
    let port1 = 'out' + Math.floor(Math.random()*3);
    let port2 = 'in' + Math.floor(Math.random()*12);
    let meta = { route: Math.floor(Math.random()*10) };
    let newEdge = $scope.graph.addEdge(node1, port1, node2, port2, meta);
    return newEdge;
  };
  
  /** Exports the current graph to JSON */
  $scope.exportGraph = function() {
    let graphJSON = JSON.stringify($scope.graph.toJSON(), null, 2);
    alert(graphJSON);
  };
  
  /***********************/
  
  // The graph editor
  //$scope.editor = document.getElementById('editor');
  
  // TODO: handle re-draw / re-size
  //$scope.graph.on('endTransaction', renderEditor); // graph changed
  //window.addEventListener("resize", renderEditor);


  /***********************/
  
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

  //$scope.models = Models.get();
  $scope.model = null;
  /*$q.all([ nodePromise, linkPromise ]).then(function() {
    $scope.model = new go.GraphLinksModel($scope.nodes, $scope.links);
    $scope.model.selectedNodeData = null;
  });*/
  
  $scope.running = false;
  $scope.runSimulation = function() {
    $scope.running = true;
    
    // Just run example C model for now
    let name = "example:hello_c";
    let path = "hello/hello_c";
    
    let simulationData = {models: [{ name, path }]};
    
    CisApi.post_simulations({ body: simulationData })
    .then(function(data) {
      alert(data);
    })
    .finally(function() {
      $scope.running = false;
    });
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