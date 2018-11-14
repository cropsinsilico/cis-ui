/* global angular:false */

angular.module('cis')

/** Constants for the keys to store our localStorage data */
.constant('LocalStorageKeys', { edges: 'cis::edges', nodes: 'cis::nodes' })

/** Our main view controller */
.controller('MainCtrl', [ '$scope', '$rootScope', '$window', '$cookies', '$timeout', '$q', '$interval', '$http', '$log', '$uibModal', '_', 'ApiUri', 'DEBUG', 'TheGraph', 'GraphPortService', 'SpecService', 'GraphService', 'LocalStorageKeys', 'TheGraphSelection', 'User',
    function($scope, $rootScope, $window, $cookies, $timeout, $q, $interval, $http, $log, $uibModal, _, ApiUri, DEBUG, TheGraph, GraphPortService, SpecService, GraphService, LocalStorageKeys, TheGraphSelection, User) {
  "use strict";
  
  /** If true, display the model palette on the left side of TheGraph */
  $scope.showPalette = false;
  
  /**
   * If specified, force the model palette to the given state (e.g. shown/hidden).
   * If no state is given, toggle display of the model palette.
   */
  $scope.togglePalette = function(newValue) {
    if (typeof(newValue) === "undefined") {
      // Toggle value if no newValue specified
      return $scope.showPalette = !$scope.showPalette;
    } else {
      // Set value explicitly in newValue is specified
      return $scope.showPalette = newValue;
    }
  }
  
  /** Auto-saves TheGraph's state to local storage every 10 seconds */
  $scope.interval = $interval(function() {
    $scope.saveGraph();
    $log.log("Graph auto-saved");
  }, 10000);
  
  /**
   * Watch for the user's profile to change (e.g. on login / logout).
   * If a change is detected, re-fetch all server data.
   */
  $scope.$watch(
    // When we see the user profile change
    function() { return User.profile; },
    // Reload our list of specs
    function(newValue, oldValue) {
      $rootScope.user = newValue;
      $scope.requeryGraphs();
      $scope.requerySpecs();
    }
  );
  
  $scope.running = false;
  $scope.executeGraph = function(timeout) {
    // Submit the graph JSON for conversion to cisrun YAML format
    $scope.running = true;
    $http.post(ApiUri + '/graph/execute', {
      "content": $scope.graph.toJSON()
    }).then(function(response) {
      $timeout(function() {
        $scope.showLogs(response.data);
      }, 3000);
    }, function(response) {
      var error = response.data;
      console.error("Error running graph:", error.message);
      $scope.running = false;
    });
  };
  
  $scope.showLogs = function(jobId) {
    $http.get(ApiUri + '/graph/execute/' + jobId + '/logs', {
      "content": $scope.graph.toJSON()
    }).then(function(response) {
      //$scope.showLogs(response.data);
      $scope.running = false;
      $uibModal.open({
        animation: true,
        templateUrl: 'app/main/modals/logViewer/logViewer.template.html',
        controller: 'LogViewerCtrl',
        size: 'lg',
        keyboard: false,      // Force the user to explicitly click "Close"
        backdrop: 'static',   // Force the user to explicitly click "Close"
        resolve: {
          jobId: function() { return jobId; },
          results: function() { return response.data; },
          title: function() { return "View Logs"; }
        }
      });
    }, function(response) {
      var error = response.data;
      console.error("Error running graph:", error.message);
      $scope.running = false;
    });
  };
  
  $scope.modifyNotebookCell = function() {
    // GET https://hub.cis.ndslabs.org/user/bodom0015/api/contents/HelloWorld.ipynb
    //   returns {"name": "HelloWorld.ipynb", "path": "HelloWorld.ipynb", "last_modified": "2018-08-30T21:37:38.794797Z", "created": "2018-08-30T21:37:38.794797Z", 
    //            "content": {"cells": [{"cell_type": "code", "execution_count": 1, "metadata": {"trusted": true}, "outputs": [{"name": "stdout", "output_type": "stream", "text": "Hello World!\n"}], 
    //            "source": "print('Hello' + ' ' + 'World!')"}, {"cell_type": "code", "execution_count": null, "metadata": {"trusted": true}, "outputs": [], "source": ""}], 
    //            "metadata": {"kernelspec": {"display_name": "Python [default]", "language": "python", "name": "python3"}, "language_info": {"codemirror_mode": {"name": "ipython", "version": 3}, 
    //            "file_extension": ".py", "mimetype": "text/x-python", "name": "python", "nbconvert_exporter": "python", "pygments_lexer": "ipython3", "version": "3.6.5"}}, "nbformat": 4, "nbformat_minor": 2}, 
    //            "format": "json", "mimetype": null, "size": 830, "writable": true, "type": "notebook"}
    
    // Notebook name
    let notebookName = 'HelloWorld.ipynb';
    let username = 'bodom0015';
    let url = JupyterHubURI + '/user/' + username + '/api/contents/' + notebookName;
    
    $http({ method: 'GET', url: url, headers: getJupyterHubAuthHeader() })
      .then(function(response) {
          $log.info('Successfully fetched notebook contents from JupyterHub', response);
          
          // Create a new Jupyter notebook cell
          let notebook = response.data;
          let newCell = {
            "cell_type": "code", 
            "execution_count": 0, 
            "metadata": {
              "trusted": true
            }, 
            "outputs": [], 
            "source": "print('Hello Remote Execution!')"
          };
          notebook.content.cells.push(newCell);
          
          // Update the notebook to contain the new cell
          $http({ method: 'PUT', url: url, data: notebook, headers: getJupyterHubAuthHeader() })
            .then(function(response) {
              $log.info('Successfully updated notebook contents in JupyterHub', response);
              
              // TODO: Execute the notebook cell
              // TODO: Print the resulting output?
            }, function(repsonse) {
              $log.error('Error updating notebook contents (' + url + '):', response);
            });
      },function(response) {
        $log.error('Error fetching notebook contents (' + url + '):', response);
      });
  };
  
  /**
   * Returns only real model specs. While InPort and OutPort are types of nodes
   * in TheGraph, they are not really models that cis_interface can run.
   */
  $scope.getModelOptions = function(library) {
    return _.omit(library, ['inport', 'outport'])
  };
  
  // Enable DEBUG features?
  // NOTE: See app/cis.module.js
  $scope.DEBUG = DEBUG;
  
  // Graph metadata
  let fbpGraph = TheGraph.fbpGraph;
  $scope.loading = true;
  $scope.height = $window.innerHeight;
  $scope.width = $window.innerWidth;
  $scope.graph = null;
  $scope.lastSavedNodes = [];
  $scope.lastSavedEdges = [];
  $scope.editValue = null;
  $scope.library = {};
  
  /**
   * Fetches our graph port definitions from static file. 
   */
  var graphPorts = GraphPortService.query();
  graphPorts.$promise.then(function() {
    $scope.inport = _.find(graphPorts, ['name', 'inport']);
    $scope.outport = _.find(graphPorts, ['name', 'outport']);
  });
  
  /**
   * Fetches our saved graphs from the database. 
   * NOTE: This helper function is defined and executed instantly.
   */
  ($scope.requeryGraphs = function() {
    $scope.savedGraphs = GraphService.query();
  })();
  
  /**
   * Fetches our model library from the database. 
   * NOTE: This helper function is defined and executed instantly.
   */
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
      
      $scope.loadGraph();
    });
  })();

  // We have finished fetching all of our server-side data
  $scope.loading = false;
  
  /**
   * Watch for our selection in TheGraph to change. If it does, open the Edit Sidebar
   * to edit the selected entity.
   */
  $scope.selectedItem = null;
  $scope.$watch(function() { return TheGraphSelection.selection; }, function(newValue, oldValue) {
    // Clear out existing transaction if it was not saved
    if ($scope.editValue !== null) {
      $scope.cancelEdit();
    }
    
    $scope.selectedItem = newValue;
    if (!oldValue && newValue && oldValue !== newValue) {
      // Start a new transaction
      $scope.graph.startTransaction("edit");
      $scope.editValue = angular.copy(newValue);
      
      /*let modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'app/main/modals/editSelection/editSelection.template.html',
        controller: 'EditSelectionCtrl',
        size: 'md',
        keyboard: false,      // Force the user to explicitly click "Close"
        backdrop: 'static',   // Force the user to explicitly click "Close"
        resolve: {
          selectedItem: function() { return angular.copy(newValue) }
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
  
  /**
   * Close the Edit Sidebar, saving any changes made since "Edit" was last pressed.
   */ 
  $scope.saveEdit = function() {
    $log.info("Saving over previous value:", $scope.editValue);
    $scope.selectedItem.new = false;
    $scope.editValue.metadata = $scope.selectedItem.metadata;
    $scope.editValue = null;
    TheGraphSelection.selection = null;
    $scope.graph.endTransaction("edit");
    $log.debug("Saved!");
  };
  
  /**
   * Close the Edit Sidebar, reverting any changes made to the node since last save.
   */ 
  $scope.cancelEdit = function() {
    $log.debug("Canceling edit...");
    if ($scope.selectedItem.new) {
      let existing = _.find($scope.graph.nodes, [ 'id', $scope.selectedItem.id ]);
      $scope.graph.nodes.splice($scope.graph.nodes.indexOf(existing), 1);
      // This was an aborted "add" operation.. delete the invalid leftover state
      //$scope.graph.removeNode()
    } else {
      $scope.selectedItem.metadata = $scope.editValue.metadata;
    }
    $scope.editValue = null;
    TheGraphSelection.selection = null;
    $scope.graph.endTransaction("edit");
    $log.debug("Canceled!");
  };
  
  /**
   * Adds a new InPort to TheGraph at random x/y coordinates 
   * and opens the edit sidebar. If "Cancel" is selected in the sidebar before
   * the node is first saved, the node will be deleted from TheGraph.
   */ 
  $scope.addInport = function() {
    // Add a new inport to the graph, then select it for editing
    let inport = $scope.addNodeInstance($scope.library['inport']);

    // Mark this node as "new" so we know to delete it if "Cancel" is clicked
    inport.new = true;
    
    // Select this new node to open the Edit Sidebar
    return TheGraphSelection.selection = inport;
  };
  
  /**
   * Adds a new OutPort to TheGraph at random x/y coordinates 
   * and opens the edit sidebar. If "Cancel" is selected in the sidebar before
   * the node is first saved, the node will be deleted from TheGraph.
   */ 
  $scope.addOutport = function() {
    // Add a new outport to the graph, then select it for editing
    let outport = $scope.addNodeInstance($scope.library['outport']);
    
    // Mark this node as "new" so we know to delete it if "Cancel" is clicked
    outport.new = true;
    
    // Select this new node to open the Edit Sidebar
    return TheGraphSelection.selection = outport;
  };
  
  /**
   * Adds an instance of the given node at random x/y coordinates
   * @param {} model - the model/component from the library to create the node
   */ 
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
  
  /**
   * Returns true iff the given model exists as a node/process in TheGraph
   * @param {string} modelKey - the key of the model to look for
   */ 
  $scope.graphHasModel = function(modelKey) {
    let exists = _.find($scope.graph.nodes, ["component", modelKey]);
    return exists;
  };
  
  /**
   * Returns true if the graph has changed since the last time the user has saved.
   */ 
  $scope.graphIsChanged = function() {
    let changed = false;
    /*angular.forEach($scope.graph.nodes, function(node) {
      
    });*/
    
    return changed;
    //return $scope.lastSavedNodes !== $scope.graph.nodes || 
    //       $scope.lastSavedEdges !== $scope.graph.edges;
  };
  
  /**
   * Prompts the user to delete a particular model spec, returns true if deleted.
   * NOTE: The API will prevent users from deleting public model specs.
   */ 
  $scope.deleteSpec = function(spec, skipConfirmation) {
    var result = false;
    if (skipConfirmation) {
      result = true;
    } else {
      result = confirm("WARNING: The selected model will no longer be accessible and cannot be recovered.\n"
      + "Any saved graphs containing this model will be deleted, as they will no longer be valid.\n" +
      "Are you sure you want to delete this model?");
    }
    
    if (result) {
      // Find all graphs containing the spec to be deleted
      var graphsContainingSpec = _.filter($scope.savedGraphs, function(graph) {
        return _.find(graph.content.processes, ['component', spec.name ]);
      });
      
      // Delete any saved graphs containing the spec (they are no longer valid)
      angular.forEach(graphsContainingSpec, function(graph) {
        $log.info("Deleting graph to delete spec (" + spec.name + "):", graph);
        $scope.deleteGraph(graph, true);
      });
      
      // Delete this node from our canvas/localStorage, if necessary
      var existingNode = _.find($scope.graph.nodes, [ 'component', spec.name ]);
      if (existingNode) {
        $scope.graph.removeNode(existingNode.id);
      }
      
      // Find our target spec id and delete the spec
      var specs = SpecService.query();
      specs.$promise.then(function() {
        var specResource = _.find(specs, [ 'content.name', spec.name ]);
        specResource.$remove().then(function() {
          $scope.saveGraph();
          $window.location.reload();
        });
      });
    }
    return result;
  };
  
  /**
   * Prompts the user to delete a particular saved graph, returns true if deleted.
   * NOTE: The API will prevent users from deleting public graphs.
   */ 
  $scope.deleteGraph = function(graph, skipConfirmation) {
    var result = false;
    if (skipConfirmation) {
      result = true;
    } else {
      result = confirm("WARNING: The selected graph will no longer be accessible and cannot be recovered.\nAre you sure you want to delete this graph?");
    }
    if (result) {
      graph.$remove().then(function() {
        $scope.requeryGraphs();
      });
    }
    return result;
  };
  
  /**
   * Import a saved graph of the given name over the top of the existing state of TheGraph
   */ 
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
    $scope.loadGraph(saved.content.processes, saved.content.connections)
  };
  
  /**
   * Save the current graph to the database with the given name.
   */ 
  $scope.saveGraphToDB = function(name) {
    var name = prompt("Please enter a name for this graph", "");
    // TODO: Prompt only if not given a name?
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
  
  /**
   * Populates TheGraph from the last auto-save in the browser's localStorage.
   */ 
  $scope.loadGraph = function(nodes, edges) {
      // Get confirmation, then clear the user's graph
      if (nodes && nodes.length) {
        if (!$scope.clearGraph()) {
          return;
        }
      }
      
      // Load up an empty graph
      $scope.graph = new fbpGraph.Graph();
      
      // Load from localStorage once models are fetched
      let loadedNodes = nodes || angular.fromJson($window.localStorage.getItem(LocalStorageKeys.nodes));
       
      // Import our previous state, if one was found
      if (loadedNodes && loadedNodes.length) {
        // Import all nodes from localStorage into TheGraph
        angular.forEach(loadedNodes, function(node) {
          let exists = _.find($scope.graph.nodes, [ 'id', node.id ]);
          if (!exists) {
            $scope.graph.addNode(node.id, node.component, node.metadata);
          } else {
            $log.info("Node ID " + node.id + " already exists in TheGraph.. skipping");
          }
        });
        
        // Then, import all edges
        let loadedEdges = edges || angular.fromJson($window.localStorage.getItem(LocalStorageKeys.edges));
        loadedEdges && angular.forEach(loadedEdges, function(edge) { $scope.graph.addEdge(edge.from.node, edge.from.port, edge.to.node, edge.to.port, edge.metadata); });
        
        // Store our previously saved state
        $scope.lastSavedNodes = angular.copy($scope.graph.nodes);
        $scope.lastSavedEdges = angular.copy($scope.graph.edges);
      }
  };
  
  /**
   * Auto-saves the current graph to the browser's localStorage.
   */ 
  $scope.saveGraph = function() {
    $window.localStorage.setItem(LocalStorageKeys.nodes, angular.toJson($scope.graph.nodes));
    $window.localStorage.setItem(LocalStorageKeys.edges, angular.toJson($scope.graph.edges));
    
    $scope.lastSavedNodes = angular.copy($scope.graph.nodes);
    $scope.lastSavedEdges = angular.copy($scope.graph.edges);
  };
  
  /**
   * Prompts the user to clear out the current graph, returns true if cleared.
   */ 
  $scope.clearGraph = function() {
    let result = confirm("Are you sure you want to clear your canvas?\nAll saved graph data will be cleared from your browser's local storage.");
    if (result) {
      $scope.graph = new fbpGraph.Graph();
      $scope.saveGraph();
    }
    return result;
  };
  
  /**
   * Display a modal window exporting the current graph to JSON
   */ 
  $scope.exportGraph = function() {
    $scope.showResults({ results: $scope.graph.toJSON(), title: "View Raw Graph", isJson: true });
  };
  
  /**
   * Convert TheGraph JSON to the YAML format expected by cis_interface.
   * @param {} results - the result to show in the modal body
   * @param {bool} isJson - if true, format as JSON, else assume result is pre-formatted
   */ 
  $scope.formatting = false;
  $scope.formatYaml = function() {
    // Submit the graph JSON for conversion to cisrun YAML format
    $scope.formatting = true;
    $http.post(ApiUri + '/graph/convert', {
      "content": $scope.graph.toJSON()
    }).then(function(response) {
      $scope.showResults({ title: "Formatted Manifest", results: response.data });
    }, function(response) {
      var error = response.data;
      console.error("Error formatting graph:", error.message)
    }).finally(function() {
      $scope.formatting = false;
    });
  };
  
  /**
   * Display a modal window showing details about the requested resource.
   * @param {} results - the result to show in the modal body
   * @param {bool} isJson - if true, format as JSON, else assume result is pre-formatted
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
        results: function() { return params.results },
        title: function() { return params.title || "View Details" }
      }
    });
  };
  
  /**
   * Display a modal allowing the user to enter fields necessary to create a new model spec.
   * 
   * If the modal is dismissed with success, the user's graph will be saved to localStorage
   * and a refresh will be forced, after which the previous state of the user's browser is 
   * loaded again from localStorage. The user should now see the new spec listed in their 
   * palette.
   */ 
  $rootScope.createNewModel = function() {
    let modalInstance = $uibModal.open({
      animation: true,
      templateUrl: 'app/main/modals/addSpec/addSpec.template.html',
      controller: 'AddSpecCtrl',
      size: 'lg',
      keyboard: false,      // Force the user to explicitly click "Close"
      backdrop: 'static',   // Force the user to explicitly click "Close"
      resolve: { 
        specs: function() { return $scope.library; },
        specToEdit: function() { return null; },
      }
    });
    
    modalInstance.result.then(function (newModel) {
      // POST result to /spec
      $log.debug("Submitting new model:", newModel);
      var spec = SpecService.save({
        name: newModel.name,
        content: newModel
      })
      
      spec.$promise.then(function() {
        $log.info("Refreshing catalog...");
        $scope.saveGraph();
        $window.location.reload();
      });
    });
  };
  
  /**
   * Display a modal allowing the user to edit fields of a model spec in their perosnal catalog.
   * 
   * If the modal is dismissed with success, the user's graph will be saved to localStorage
   * and a refresh will be forced, after which the previous state of the user's browser is 
   * loaded again from localStorage. The updated version of the spec will be used going forward.
   */ 
  $rootScope.editSpec = function(spec) {
    let modalInstance = $uibModal.open({
      animation: true,
      templateUrl: 'app/main/modals/addSpec/addSpec.template.html',
      controller: 'AddSpecCtrl',
      size: 'lg',
      keyboard: false,      // Force the user to explicitly click "Close"
      backdrop: 'static',   // Force the user to explicitly click "Close"
      resolve: { 
        specs: function() { return $scope.library; }, 
        specToEdit: function() { return angular.copy(spec); },
      }
    });
    
    modalInstance.result.then(function (updatedModel) {
      // PUT result to /spec
      $log.debug("Submitting updated model:", updatedModel);
      
      // This additional property causes cisrun to choke.
      // See main.controller.js -> $scope.requerySpecs() above for definition
      delete updatedModel.creatorId;
      
      // Find our target spec id and update the spec content
      var specs = SpecService.query();
      specs.$promise.then(function() {
        var specResource = _.find(specs, [ 'content.name', spec.name ]);
        specResource.content = updatedModel;
        specResource.$update().then(function() {
          $log.info("Refreshing catalog...");
          $scope.saveGraph();
          $window.location.reload();
        });
        
      });
    });
  };
  
  $scope.gotoJupyterHub = function() {
    $window.location.href = JupyterHubURI + '/hub/oauth_login?next=' + encodeURIComponent(JupyterHubURI + '/hub/spawn')
  };
  
  $scope.submitSpecToGitHub = function(spec) {
    // Find our target spec id and delete the spec
    var specs = SpecService.query();
    specs.$promise.then(function() {
      var specResource = _.find(specs, [ 'content.name', spec.name ]);
      var url = ApiUri + '/spec/' + specResource._id + '/issue';
      $http.post(url, specResource).then(function(response) {
        $log.info((response.status === 201 ? "Successfully" : "Already") +  " submitted spec to GitHub:", specResource);
        $scope.requerySpecs();
        if (confirm("Issue has " + (response.status === 201 ? "successfully" : "already") + " been submitted to GitHub. View the issue now?")) {
          var apiResponseSuffix = response.data['issue_url'].split("repos")[1];
          var targetUrl = 'https://github.com' + apiResponseSuffix;
          $window.location.href = targetUrl;
        }
      }, function(response) {
        var error = response.data;
        if (error) {
          $log.error("Error submitting spec to GitHub:" + error.message);
        }
      });
    });
  };
}]);
