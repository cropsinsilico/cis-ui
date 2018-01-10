/* global angular:false */

angular.module('cis')

/** Wraps TheGraph React component into a reusable AngularJS directive */
.directive('editor', [ '$window', 'React', 'ReactDOM', 'TheGraph',
        function($window, React, ReactDOM, TheGraph) {
    return {
        restrict: 'E',
        scope: {
            width: '=',
            height: '=',
            graph: '=',
            library: '=',
            loading: '='
        },
        link: function(scope, ele, attributes) {
            let element = ele[0];
            
            // Signal to React that the element has changed and needs to be redrawn
            let render = function() {
                if (!scope.graph || !scope.library) {
                    scope.loading = true;
                    return;
                } else {
                    scope.loading = false;
                }
                
                let props = {
                    readonly: false,
                    height: scope.height,
                    width: scope.width,
                    graph: scope.graph,
                    library: scope.library,
                };
                console.log('rendering', props);
                
                let editor = element;
                editor.width = props.width;
                editor.height = props.height;
                let reactEle = React.createElement(TheGraph.App, props);
                ReactDOM.render(reactEle, editor);
            };
            
            // Re-render if the graph changes
            scope.$watch("graph", function(newValue, oldValue) { 
                // Check that new graph is valid
                if (newValue.nodes && newValue.nodes.length) {
                    console.log("Graph changed... rendering", newValue);
                    
                    // Check if new graph has been loaded before component library
                    if (!scope.library || !scope.library.length) {
                        console.log("Library mismatch... preloading library from graph", newValue);
                        
                        // Pre-load library from current graph
                        // (overwritten by real models once they finish loading)
                        TheGraph.library.libraryFromGraph(newValue);
                    }
                    render();
                }
            });
            
            angular.element($window).bind('resize', function() {
                scope.height = $window.innerHeight - 300;
                scope.width = $window.innerWidth;
                console.log(`Resize event detected: ${scope.width}x${scope.height}... reloading!`);
                render();
    
                // manual $digest required as resize event is outside of angular
                scope.$digest();
            });
            
            scope.$watch("library", function(newValue, oldValue) {
                console.log("Library changed... reloading!", newValue);
                render();
            });
            
            /* TODO: do we need a watcher on edges? */
            scope.$watch("graph.nodes.length", function(newValue, oldValue) {
                console.log(`Node count changed: ${oldValue} -> ${newValue}... reloading!`);
                render();
            });
        }
    }
}])

/** Our main view controller */
.controller('MainCtrl', [ '$scope', '$window', '$timeout', '$q', '$http', 'TheGraph', 'Links', 'Nodes', 'Models', 'CisApi', 
    function($scope, $window, $timeout, $q, $http, TheGraph, Links, Nodes, Models, CisApi) {
  "use strict";
  
  let nodeStorageKey = 'cis::nodes';
  let edgeStorageKey = 'cis::edges';
  
  // Load up an empty graph
  let fbpGraph = TheGraph.fbpGraph;
  $scope.graph = new fbpGraph.Graph();
  
  $scope.saveChanges = false;
  
  // Load from localStorage on startup
  let loadedNodes = angular.fromJson($window.localStorage.getItem(nodeStorageKey));
  let loadedEdges = angular.fromJson($window.localStorage.getItem(edgeStorageKey));
  
  // TODO: Save to localStorage on changes
  $scope.$watch("graph", (newValue, oldValue) => {
    if ($scope.saveChanges) {
      $window.localStorage.setItem(nodeStorageKey, angular.toJson($scope.graph.nodes));
      $window.localStorage.setItem(edgeStorageKey, angular.toJson($scope.graph.edges));
    }
  });
  
  // TODO: Hook this up to a real API
  $scope.environment = {
    nitrogen: "0.0",
    carbonDioxide: "400.0",
    light: "2000.0",
    temperature: "25.0"
  };
  
  // Our component library
  $scope.library = {};
  CisApi.get_models().then(function(data) {
    console.log("Fetched models:", data);
    $scope.library = data;
    
    // Import our previous state, if one was found
    loadedNodes && angular.forEach(loadedNodes, node => { $scope.graph.addNode(node.id, node.component, node.metadata); });
    loadedEdges && angular.forEach(loadedEdges, edge => { $scope.graph.addEdge(edge.from.node, edge.from.port, edge.to.node, edge.to.port, edge.metadata); });
    
    $scope.saveChanges = true;
  });
  
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
  
  $scope.randomModel = function() {
    let x = Math.random();
    switch (true) {
      case (x >= 0 && x < 0.125):
        return 'env';
      case (x >= 0.125 && x < 0.250):
        return 'atm';
      case (x >= 0.250 && x < 0.375):
        return 'grnm';
      case (x >= 0.375 && x < 0.500):
        return 'grcm';
      case (x >= 0.500 && x < 0.625):
        return 'mem';
      case (x >= 0.625 && x < 0.750):
        return 'lem';
      case (x >= 0.750 && x < 0.875):
        return 'cam';
      case (x >= 0.875):
        return 'light';
    };
  };
  
  /** Adds a random node */
  $scope.addNodeInstance = function(modelId) {
    // Assign a pseudorandom ID
    let id = Math.round(Math.random()*100000).toString(36);
    
    // Build up metadata for our new instance
    let metadata = {
      label: modelId,
      x: Math.round(Math.random()*800),
      y: Math.round(Math.random()*600)
    };
    let newNode = $scope.graph.addNode(id, modelId, metadata);
    return newNode;
  };
  
  /** Adds a random node */
  $scope.randomNode = function(useTransaction) {
    let model = $scope.randomModel();
    return $scope.addNodeInstance(model);
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
  /*let nodePromise = Nodes.get().then(function(response) {
    $scope.nodes = response.data;
  }, function(err) {
    console.error("Error pulling Nodes:", err);
  });*/
  
  $scope.links = [];
  /*let linkPromise = Links.get().then(function(response) {
    $scope.links = response.data;
  }, function(err) {
    console.error("Error pulling Links:", err);
  });*/

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
}]);