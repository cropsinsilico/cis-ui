/* global angular:false */

angular.module('cis')

/** Constants for the keys to store our localStorage data */
.constant('LocalStorageKeys', { edges: 'cis::edges', nodes: 'cis::nodes' })

/** Our main view controller */
.controller('MainCtrl', [ '$scope', '$window', '$timeout', '$q', '$interval', '$http', '$log', '$uibModal', '_', 'DEBUG', 'TheGraph', 'GraphPortService', 'SpecService', 'GraphService', 'LocalStorageKeys', 'TheGraphSelection', 'User',
    function($scope, $window, $timeout, $q, $interval, $http, $log, $uibModal, _, DEBUG, TheGraph, GraphPortService, SpecService, GraphService, LocalStorageKeys, TheGraphSelection, User) {
  "use strict";
  
  $scope.showPalette = false;
  
  $scope._ = _;
  $scope.refresh = false;
  
  var graphPorts = GraphPortService.query();
  graphPorts.$promise.then(function() {
    $scope.inport = _.find(graphPorts, ['name', 'inport']);
    $scope.outport = _.find(graphPorts, ['name', 'outport']);
  });
  
  $scope.togglePalette = function(newValue) {
    if (typeof(newValue) === "undefined") {
      // Toggle value if no newValue specified
      return $scope.showPalette = !$scope.showPalette;
    } else {
      // Set value explicitly in newValue is specified
      return $scope.showPalette = newValue;
    }
  }
  
  // Auto-save to local storage every 3 seconds
  $scope.interval = $interval(function() {
    $scope.saveGraph();
    $log.log("Graph auto-saved");
  }, 3000);
  
  $scope.$watch(
    // When we see the user profile change
    function() { return User.profile; },
    // Reload our list of specs
    function(newValue, oldValue) {
      $scope.user = newValue;
      $scope.requeryGraphs();
      $scope.requerySpecs();
    }
  );
  
  $scope.$watch('refresh', function(newValue, oldValue) {
    if (newValue !== oldValue && newValue === true) {
      console.log("Refresh signal detected... refreshing!");
      $scope.requerySpecs();
      $scope.refresh = false;
    }
  });
  
  $scope.getModelOptions = function(library) {
    return _.omit(library, ['inport', 'outport'])
  };
  
  // Enable DEBUG features?
  $scope.DEBUG = DEBUG;
  
  // Graph metadata
  let fbpGraph = TheGraph.fbpGraph;
  $scope.loading = true;
  $scope.height = $window.innerHeight;
  $scope.width = $window.innerWidth;
  $scope.graph = null;
  $scope.lastSavedNodes = [];
  $scope.lastSavedEdges = [];
  let editValue = null;
  $scope.library = {};
  
  // Fetch our saved graphs
  ($scope.requeryGraphs = function() {
    $scope.savedGraphs = GraphService.query();
  })();
  
  // Fetch our model library
  ($scope.requerySpecs = function() {
    $log.debug('Fetching models...');
    let specs = SpecService.query();
    specs.$promise.then(function(specs) {
      // Inject creatorId
      angular.forEach(specs, function(spec) {
        spec.content.creatorId = spec.creatorId;
      });
      
      let specContents = _.map(specs, 'content');
      $scope.library = _.keyBy(specContents, 'name');
      $scope.library['inport'] = $scope.inport;
      $scope.library['outport'] = $scope.outport;
      
      // Load up an empty graph
      $scope.graph = new fbpGraph.Graph();
      
      // Load from localStorage once models are fetched
      let nodes = angular.fromJson($window.localStorage.getItem(LocalStorageKeys.nodes));
       
      // Import our previous state, if one was found
      if (nodes && nodes.length) {
        // Import all nodes from localStorage into TheGraph
        angular.forEach(nodes, node => { $scope.graph.addNode(node.id, node.component, node.metadata); });
        
        // Then, import all edges
        let edges = angular.fromJson($window.localStorage.getItem(LocalStorageKeys.edges));
        edges && angular.forEach(edges, edge => { $scope.graph.addEdge(edge.from.node, edge.from.port, edge.to.node, edge.to.port, edge.metadata); });
        
        // Store our previously saved state
        $scope.lastSavedNodes = angular.copy($scope.graph.nodes);
        $scope.lastSavedEdges = angular.copy($scope.graph.edges);
      }
    });
  })();
  
  // Update selected item when service data changes
  $scope.selectedItem = null;
  $scope.$watch(function() { return TheGraphSelection.selection; }, function(newValue, oldValue) {
    // Clear out existing transaction if it was not saved
    if (editValue !== null) {
      $scope.cancelEdit();
    }
      
    $scope.selectedItem = newValue;
    if (!oldValue && newValue && oldValue !== newValue) {
      // Start a new transaction
      $scope.graph.startTransaction("edit");
      editValue = angular.copy(newValue);
      
      /*let modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'app/main/modals/editSelection/editSelection.template.html',
        controller: 'EditSelectionCtrl',
        size: 'md',
        keyboard: false,      // Force the user to explicitly click "Close"
        backdrop: 'static',   // Force the user to explicitly click "Close"
        resolve: {
          selectedItem: () => angular.copy(newValue)
        }
      });
      
      
      modalInstance.result.then(function (selectedItem) {
        $ctrl.selected = selectedItem;
      }, function () {
        $log.info('Modal dismissed at: ' + new Date());
      });
      */
    }
  });

  $scope.loading = false;
  
  $scope.submitNewModel = function() {
    let modalInstance = $uibModal.open({
      animation: true,
      templateUrl: 'app/main/modals/addSpec/addSpec.template.html',
      controller: 'AddSpecCtrl',
      size: 'lg',
      keyboard: false,      // Force the user to explicitly click "Close"
      backdrop: 'static',   // Force the user to explicitly click "Close"
      resolve: { specs: function() { return $scope.library; } }
    });
    
    modalInstance.result.then(function (newModel) {
      // POST result to /spec
      console.log("Submitting new model:", newModel);
      var spec = SpecService.save({
        name: newModel.name,
        content: newModel
      })
      
      spec.$promise.then(function() {
        console.log("Refreshing catalog...");
        // TODO: save Graph to "temp-$timestamp"
        $scope.saveGraph();
        $window.location.reload();
      });
    }, function () {
      $log.info('Modal dismissed at: ' + new Date());
    });
  };
  
  $scope.deleteSpec = function(spec) {
    let specs = SpecService.query();
    specs.$promise.then(function() {
      let specResource = _.find(specs, [ 'content.name', spec.name ]);
      specResource.$remove().then(function() {
        $scope.saveGraph();
        $window.location.reload();
      });
    });
  };
  
  $scope.saveEdit = function() {
    console.log("Saving over previous value:", editValue);
    $scope.selectedItem.new = false;
    editValue.metadata = $scope.selectedItem.metadata;
    editValue = null;
    TheGraphSelection.selection = null;
    $scope.graph.endTransaction("edit");
    console.log("Saved!");
  };
  
  $scope.cancelEdit = function() {
    console.log("Canceling edit...");
    if ($scope.selectedItem.new) {
      let existing = _.find($scope.graph.nodes, [ 'id', $scope.selectedItem.id ]);
      $scope.graph.nodes.splice($scope.graph.nodes.indexOf(existing), 1);
      // This was an aborted "add" operation.. delete the invalid leftover state
      //$scope.graph.removeNode()
    } else {
      $scope.selectedItem.metadata = editValue.metadata;
    }
    editValue = null;
    TheGraphSelection.selection = null;
    $scope.graph.endTransaction("edit");
    console.log("Canceled!");
  };
  
  $scope.graphIsChanged = function() {
    let changed = false;
    /*angular.forEach($scope.graph.nodes, function(node) {
      
    });*/
    
    return changed;
    //return $scope.lastSavedNodes !== $scope.graph.nodes || 
    //       $scope.lastSavedEdges !== $scope.graph.edges;
  };
  
  $scope.deleteGraph = function(graph) {
    graph.$remove().then(function() {
      $scope.requeryGraphs();
    });
  };
  
  $scope.loadGraphFromDB = function(name) {
    if (!name) {
      $log.warn("Cannot load graph - no name specified");
      return;
    }
    
    let saved = _.find($scope.savedGraphs, [ 'name', name ]);
    
    if (!saved) {
      $log.warn("Unable to load graph - no graph found with name: " + name);
      return;
    }
    
    // Load from API
    //let nodes = angular.fromJson($window.localStorage.getItem(LocalStorageKeys.nodes));
    let nodes = saved.content.processes;
     
    // Import our previous state, if one was found
    if (nodes && Object.keys(nodes).length) {
      // Import all nodes from localStorage into TheGraph
      angular.forEach(nodes, node => { $scope.graph.addNode(node.id, node.component, node.metadata); });
      
      // Then, import all edges
      let edges = saved.content.connections;
      edges && angular.forEach(edges, edge => { $scope.graph.addEdge(edge.from.node, edge.from.port, edge.to.node, edge.to.port, edge.metadata); });
      
      // Store our previously saved state
      $scope.lastSavedNodes = angular.copy($scope.graph.nodes);
      $scope.lastSavedEdges = angular.copy($scope.graph.edges);
    }
  };
  
  $scope.saveGraphToDB = function(name) {
    var name = prompt("Please enter a name for this graph", "");
    if (!name) {
      $log.warn("Cannot save graph - no name specified");
      return;
    }
    
    // Save graph to localStorage
    $scope.saveGraph();
    
    let existing = _.find($scope.savedGraphs, [ 'name', name ])
    if (existing) {
      // Name already exists - overwrite existing contents
      existing.content = {
        processes: $scope.graph.nodes, 
        connections: $scope.graph.edges
      };
      
      // Save and synchronize our list of saved graphs
      existing.$update().then(function() {
        $scope.requeryGraphs();
      });
    } else {
      // Does not exist - save a new graph with this name
      let graph = {
        name: name,
        content: {
          processes: $scope.graph.nodes, 
          connections: $scope.graph.edges
        }
      };
      
      // Save and synchronize our list of saved graphs
      GraphService.save(graph).$promise.then(function() {
        $scope.requeryGraphs();
      });
    }
  };
  
  $scope.saveGraph = function() {
    $window.localStorage.setItem(LocalStorageKeys.nodes, angular.toJson($scope.graph.nodes));
    $window.localStorage.setItem(LocalStorageKeys.edges, angular.toJson($scope.graph.edges));
    
    $scope.lastSavedNodes = angular.copy($scope.graph.nodes);
    $scope.lastSavedEdges = angular.copy($scope.graph.edges);
  };
  
  /** Clears out the current graph, returns true if cleared */
  $scope.clearGraph = function() {
    let result = confirm("Are you sure you want to clear your canvas?\nAll saved graph data will be cleared from your browser's local storage.");
    if (result) {
      $scope.graph = new fbpGraph.Graph();
      $scope.saveGraph();
    }
    return result;
  };
  
  /** Adds an inport to the current graph */
  $scope.addInport = function() {
    // Add a new inport to the graph, then select it for editing
    let inport = $scope.addNodeInstance($scope.library['inport']);
    inport.new = true;
    return TheGraphSelection.selection = inport;
  };
  
  /** Adds an outport to the current graph */
  $scope.addOutport = function() {
    // Add a new outport to the graph, then select it for editing
    let outport = $scope.addNodeInstance($scope.library['outport']);
    outport.new = true;
    return TheGraphSelection.selection = outport;
  };
  
  /** Simple random function */
  $scope.getRandomFrom = function(items) {
    let len = items.length || Object.keys(items).length;
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
    let newNode = $scope.graph.addNode(id, model.name, metadata);
    return newNode;
  };
  
  $scope.graphHasModel = function(modelKey) {
    let exists = _.find($scope.graph.nodes, ["component", modelKey]);
    return exists;
  };
  
  /** Exports the current graph to JSON */
  $scope.exportGraph = function() {
    $scope.showResults({ results: $scope.graph.toJSON(), title: "View Raw Graph", isJson: true });
  };
  
  $scope.formatting = false;
  $scope.formatYaml = function() {
    let modelCounter = 1;
    let getModelFromNode = (node) => {
      let model =  _.find($scope.library, ['name', node.component]);
      // TODO: ModelDriver / type / name
      model.id = modelCounter++;
      angular.forEach(model.inports, (port) => port.model_id = model.name);
      angular.forEach(model.outports, (port) => port.model_id = model.name);
        
      model.inputs = model.inports;
      model.outputs = model.outports;
      
      return model;
    };
    
    let getSrcNodeFromEdge = (edge) => _.find($scope.graph.nodes, ['id', edge.from.node]);
    let getDestNodeFromEdge = (edge) => _.find($scope.graph.nodes, ['id', edge.to.node]);
    let getOutportFromModel = (portName, model) => _.find(model.outports, ['name', portName]);
    let getInportFromModel = (portName, model) => _.find(model.inports, ['name', portName]);
    
    // Format nodes as the API expects
    let nodes = [];
    $log.debug("Transforming nodes: ", $scope.graph.nodes);
    angular.forEach($scope.graph.nodes, function(node) {
      if (node.component === 'inport' || node.component === 'outport') {
        return;
      }
      let model = getModelFromNode(node);
      
      // TODO: Read ModelDriver / args from model object
      let args = model.args;
      let driver = model.driver;
      
      let inputs = [];
      if (model.inports.length > 1) {
        angular.forEach(model.inports, function(item) { inputs.push(item.label || item.name); });
      } else if (model.inports.length === 1)  {
        inputs = model.inports[0].label;
      }
      
      let outputs = [];
      if (model.outports.length > 1) {
        angular.forEach(model.outports, function(item) { outputs.push(item.label || item.name); });
      } else if (model.outports.length === 1) {
        outputs = model.outports[0].label;
      }
      
      let newModel = {
        //id: nodeCount++, //node.id, 
        //model: model,
        name: model.label || model.name || node.id,
        args: args,
        driver: driver,
        inputs: inputs,
        outputs: outputs
        //description: node.metadata.description,
      };
      
      if (model.cmakeargs) { newModel.cmakeargs = model.cmakeargs }
      if (model.makefile) { newModel.makefile = model.makefile }
      if (model.makedir) { newModel.makedir = model.makedir }
      if (model.sourcedir) { newModel.sourcedir = model.sourcedir }
      if (model.builddir) { newModel.builddir = model.builddir }
      if (model.preserve_cache) { newModel.preserve_cache = model.preserve_cache }
      
      nodes.push(newModel);
    });
    
    // Format edges as the API expects
    let edges = [];
    let connections = [];
    $log.debug("Transforming edges: ", $scope.graph.edges);
    angular.forEach($scope.graph.edges, function(edge) {
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
      
      let id = src_node.id + ":" + src_port.name + "_" + dest_node.id + ":" + dest_port.name;
      
      // TODO: edge name / type
      let args = edge.metadata.name; // || 'unused';
      let type = edge.metadata.type; // || 'InputDriver';
      if (src_model.name == 'inport') {
        args = src_node.metadata.name;
        if (src_node.metadata.type === 'File') {
          type = 'FileInputDriver';
        } else {
          args = id;
          type = 'InputDriver';
        }
      } else if (dest_model.name == 'outport') {
        args = dest_node.metadata.name;
        type = dest_node.metadata.type;
        if (dest_node.metadata.type === 'File') {
          type = 'FileOutputDriver';
        } else {
          args = id;
          type = 'OutputDriver';
        }
      }
      
      
      // TODO: Reconnect to API
      edges.push({ 
        id: id, 
        name: edge.metadata.label || edge.id || id,
        type: type,
        args: args, 
        source: src_port,
        destination: dest_port,
        //description: node.metadata.description,
      });
      let connection = {
        input: src_port.label || src_node.metadata.name,
        output: dest_port.label || dest_node.metadata.name
      };
      
      if (src_node.metadata['read_meth']) {
        connection['read_meth'] = src_node.metadata['read_meth'];
      }
      
      if (dest_node.metadata['write_meth']) {
        connection['write_meth'] = dest_node.metadata['write_meth'];
      }
      
      if (edge.metadata['field_names']) {
        connection['field_names'] = edge.metadata['field_names'];
      }
      
      if (edge.metadata['field_units']) {
        connection['field_units'] = edge.metadata['field_units'];
      }
      
      connections.push(connection);
    });
    
    let toYaml = { nodes: nodes, edges: edges, connections: connections };
    
    console.log("Submitting for formatting", toYaml);
    $scope.showResults({ title: "Formatted Manifest", results: toYaml });
  };
  
  
  /**
   * Display a modal window showing details about the requested resource
   * @param {} results - the result to show in the modal body
   * @param {} isJson - if false, format as YAML
   */ 
  $scope.showResults = function(params) { 
    $uibModal.open({
      animation: true,
      templateUrl: 'app/main/modals/' + (params.isJson ? 'exportJson/exportJson.template.html' : 'generateYaml/generateYaml.template.html'),
      controller: params.isJson ? 'ExportJsonCtrl' : 'GenerateYamlCtrl',
      size: 'md',
      keyboard: false,      // Force the user to explicitly click "Close"
      backdrop: 'static',   // Force the user to explicitly click "Close"
      resolve: {
        results: () => params.results,
        title: () => params.title || "View Details"
      }
    });
  };
}]);
