/* global angular:false */

angular.module('cis')
  
/** Constants for the keys to store our localStorage data */
.constant('LocalStorageKeys', { edges: 'cis::edges', nodes: 'cis::nodes' })

/** Our main view controller */
.controller('MainCtrl', [ '$scope', '$window', '$timeout', '$q', '$http', '$log', '$uibModal', '_', 'DEBUG', 'TheGraph', 'Links', 'Nodes', 'Models', 'CisApi', 'LocalStorageKeys', 'TheGraphSelection',
    function($scope, $window, $timeout, $q, $http, $log, $uibModal, _, DEBUG, TheGraph, Links, Nodes, Models, CisApi, LocalStorageKeys, TheGraphSelection) {
  "use strict";
  
  
  // Load up an empty graph
  let fbpGraph = TheGraph.fbpGraph;
  
  let height = $window.innerHeight
  let width = $window.innerWidth;
  
  $scope.state = {
    graph: new fbpGraph.Graph(),
    loading: true,
    height: height - (0.25 * height),
    width: width - (0.220 * width),
    library: []
  };
  
  // Enable DEBUG features?
  $scope.DEBUG = DEBUG;
  
  $scope.lastSavedNodes = [];
  $scope.lastSavedEdges = [];
  
  /**
   * Window resize event handling
   */
  /*angular.element($window).on('resize', function () {
    $scope.$apply(function() {
      $scope.editorWidth = $window.innerWidth - 260;
      $scope.editorHeight = $window.innerHeight - 200;
      console.log(`Editor width/height: ${$scope.editorWidth}/${$scope.editorHeight}`);
    });
  
    // manual $digest required as resize event is outside of angular
    $scope.$digest();
  });*/
  
  let editValue = null;
  
  // Update selected item when service data changes
  $scope.selectedItem = null;
  $scope.$watch(function() { return TheGraphSelection.selection; }, function(newValue, oldValue) {
    $scope.selectedItem = newValue;
    if (!oldValue && newValue) {
      // Clear out existing transaction if it was not saved
      if (editValue !== null) {
        $scope.cancelEdit();
      }
      // Start a new transaction
      $scope.state.graph.startTransaction("edit");
      editValue = angular.copy(newValue);
    }
  });
  
  // Fetch our model library
  $scope.state.library = {};
  CisApi.get_models().then(function(data) {
    $log.debug("Fetched models:", data);
    $scope.state.library = data;
  
    // Load from localStorage once models are fetched
    let nodes = angular.fromJson($window.localStorage.getItem(LocalStorageKeys.nodes));
  
    // Import our previous state, if one was found
    if (nodes && nodes.length) {
      // Import all nodes from localStorage into TheGraph
      angular.forEach(nodes, node => { $scope.state.graph.addNode(node.id, node.component, node.metadata); });
      
      // Then, import all edges
      let edges = angular.fromJson($window.localStorage.getItem(LocalStorageKeys.edges));
      edges && angular.forEach(edges, edge => { $scope.state.graph.addEdge(edge.from.node, edge.from.port, edge.to.node, edge.to.port, edge.metadata); });
      
      // Store our previously saved state
      $scope.lastSavedNodes = angular.copy($scope.state.graph.nodes);
      $scope.lastSavedEdges = angular.copy($scope.state.graph.edges);
    }
    
    $scope.state.loading = false;
  });
  
  $scope.saveEdit = function() {
    console.log("Saving over previous value:", editValue);
    console.log("Saved!");
    editValue.metadata = $scope.selectedItem.metadata;
    editValue = null;
    TheGraphSelection.selection = null;
    $scope.state.graph.endTransaction("edit");
  };
  
  $scope.cancelEdit = function() {
    console.log("Canceled!");
    $scope.selectedItem.metadata = editValue.metadata;
    editValue = null;
    TheGraphSelection.selection = null;
    $scope.state.graph.endTransaction("edit");
  };
  
  $scope.graphIsChanged = function() {
    let changed = false;
    angular.forEach($scope.state.graph.nodes, function(node) {
      
    });
    
    return changed;
    //return $scope.lastSavedNodes !== $scope.state.graph.nodes || 
    //       $scope.lastSavedEdges !== $scope.state.graph.edges;
  };
  
  $scope.saveGraph = function() {
    $window.localStorage.setItem(LocalStorageKeys.nodes, angular.toJson($scope.state.graph.nodes));
    $window.localStorage.setItem(LocalStorageKeys.edges, angular.toJson($scope.state.graph.edges));
    
    $scope.lastSavedNodes = angular.copy($scope.state.graph.nodes);
    $scope.lastSavedEdges = angular.copy($scope.state.graph.edges);
  };
  
  /** Clears out the current graph, returns true if cleared */
  $scope.clearGraph = function() {
    let result = confirm("Are you sure you want to clear your canvas?\nAll saved graph data will be cleared.");
    return result && ($scope.state.graph = new fbpGraph.Graph());
  };
  
  /** Adds an inport to the current graph */
  $scope.addInport = function() {
    $scope.addNodeInstance($scope.state.library['inport']);
  };
  
  /** Adds an outport to the current graph */
  $scope.addOutport = function() {
    $scope.addNodeInstance($scope.state.library['outport']);
  };
  
  /** Simple filter function */
  $scope.getModelOptions = function(library) {
    return _.omit(library, ['inport', 'outport']);
  };
  
  /** Simple random function */
  $scope.getRandomFrom = function(items) {
    let len = items.length || Object.keys(items).length
    let ran = Math.random()*len;
    let floor = Math.floor(ran);
  	return items[floor];
  };
  
  /** Adds a random node */
  $scope.addNodeInstance = function(model) {
    // Assign a pseudorandom ID
    let id = Math.round(Math.random()*100000).toString(36);
    
    // Build up metadata for our new instance
    let metadata = {
      label: model.label,
      x: Math.round(Math.random()*800),
      y: Math.round(Math.random()*600)
    };
    let newNode = $scope.state.graph.addNode(id, model.name, metadata);
    return newNode;
  };
  
  /** Exports the current graph to JSON */
  $scope.exportGraph = function() {
    $scope.showResults({ results: $scope.state.graph.toJSON(), title: "View Raw Graph", isJson: true });
    
    // FIXME: Make this a modal or something prettier.
    // See https://github.com/nds-org/ndslabs/blob/master/gui/dashboard/catalog/modals/export/exportSpec.html
  };
  
  $scope.formatting = false;
  $scope.formatYaml = function() {
    $scope.formatting = true;
    
    let modelCounter = 1;
    let getModelFromNode = (node) => {
      let model =  _.find($scope.state.library, ['name', node.component]);
      // TODO: ModelDriver / type / name
      model.id = modelCounter++;
      angular.forEach(model.inports, (port) => port.model_id = model.name);
      angular.forEach(model.outports, (port) => port.model_id = model.name);
        
      model.inputs = model.inports;
      model.outputs = model.outports;
      
      return model;
    };
    
    let getSrcNodeFromEdge = (edge) => _.find($scope.state.graph.nodes, ['id', edge.from.node]);
    let getDestNodeFromEdge = (edge) => _.find($scope.state.graph.nodes, ['id', edge.to.node]);
    let getOutportFromModel = (portName, model) => _.find(model.outports, ['name', portName]);
    let getInportFromModel = (portName, model) => _.find(model.inports, ['name', portName]);
    
    // Format nodes as the API expects
    let nodes = [];
    let nodeCount = 1;
    $log.debug("Transforming nodes: ", $scope.state.graph.nodes);
    angular.forEach($scope.state.graph.nodes, function(node) {
      let model = getModelFromNode(node);
      
      // TODO: Read ModelDriver / args from model object
      let args = model.args || 'placeholder';
      let driver = model.driver || 'PlaceholderModelDriver';
      
      nodes.push({
        id: nodeCount++, //node.id, 
        model: model,
        name: node.id,
        args: args,
        driver: driver,
        inputs: [],
        outputs: []
        //description: node.metadata.description,
      });
    });
    
    // Format edges as the API expects
    let edges = [];
    $log.debug("Transforming edges: ", $scope.state.graph.edges);
    angular.forEach($scope.state.graph.edges, function(edge) {
      let src_node = getSrcNodeFromEdge(edge);
      let dest_node = getDestNodeFromEdge(edge);
      let src_model = getModelFromNode(src_node);
      let dest_model = getModelFromNode(dest_node);
      let src_port = getOutportFromModel(edge.from.port, src_model);
      let dest_port = getInportFromModel(edge.to.port, dest_model);
      
      // Add model_id? is this even necessary?
      src_port.model_id = src_model.name;
      dest_port.model_id = dest_model.name;
      
      // Add node_id? is this even necessary?
      src_port.node_id = src_node.id;
      dest_port.node_id = dest_node.id;
      
      // TODO: edge name / type
      let args = edge.metadata.name || 'unused';
      let type = edge.metadata.type || 'File';
      if (src_model.name == 'inport') {
        args = src_node.metadata.name;
        type = src_node.metadata.type;
      } else if (dest_model.name == 'outport') {
        args = dest_node.metadata.name;
        type = dest_node.metadata.type;
      }
      
      let id = src_node.id + ":" + src_port.name + "_" + dest_node.id + ":" + dest_port.name;
      
      edges.push({ 
        //id: id, 
        name: edge.metadata.label || edge.id || id,
        type: type,
        args: args, 
        source: src_port,
        destination: dest_port
        //description: node.metadata.description,
      });
    });
    
    console.log("Sending nodes: ", nodes);
    console.log("Sending edges: ", edges);
    
    CisApi.post_graphs({ 
      body: {
        nodes: nodes,
        edges: edges
      }
    }).then(function(data) {
      $scope.showResults({ results: data, title: "View Graph YAML", isJson: false });
    }).finally(function() {
      $scope.formatting = false;
    });
  };
  
  $scope.running = false;
  $scope.runGraph = function() {
    $scope.running = true;
    alert("Coming Soon!");
    $scope.running = false;
  };
  
  
  /**
   * Display a modal window showing details about the requested resource
   * @param {} results - the result to show in the modal body
   * @param {} isJson - if false, format as YAML
   */ 
  $scope.showResults = function(params) { 
    // See 'app/dashboard/modals/logViewer/logViewer.html'
    $uibModal.open({
      animation: true,
      templateUrl: 'app/main/modals/export.template.html',
      controller: 'ExportCtrl',
      size: 'md',
      keyboard: false,      // Force the user to explicitly click "Close"
      backdrop: 'static',   // Force the user to explicitly click "Close"
      resolve: {
        results: () => params.results,
        title: () => params.title || "View Details",
        isJson: () => params.isJson || null
      }
    });
  };
}]);