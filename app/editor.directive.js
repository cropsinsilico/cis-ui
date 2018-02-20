/* global angular:false */

angular.module('cis')

/** some helpers/wrappers to provide React / ReactDOM / TheGraph */
.factory('TheGraph', [ function() { return window.TheGraph; } ])
.factory('React', [ function() { return window.React; } ])
.factory('ReactDOM', [ function() { return window.ReactDOM; } ])
.factory('TheGraphSelection', [function() {
  let factory = {};
  factory.selection = null;
  return factory;
}])

/** Wraps TheGraph React component into a reusable AngularJS directive */
.directive('theGraphEditor', [ '$window', '$log', 'React', 'ReactDOM', 'TheGraph', 'Clipboard', 'TheGraphSelection',
        function($window, $log, React, ReactDOM, TheGraph, Clipboard, TheGraphSelection) {
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
            
            // Context menu specification
            let deleteNode = function(graph, itemKey, item) {
              graph.removeNode(itemKey);
            }
            let deleteEdge = function(graph, itemKey, item) {
              graph.removeEdge(item.from.node, item.from.port, item.to.node, item.to.port);
            }
            let copyNode = function(graph, itemKey, item) {
              Clipboard.copy(graph, [itemKey]);
            }
            let editNode = function(graph, itemKey, item) {
              console.log("Selected node for editing: " + item.id);
              
              // Must call $apply here to propagate update
              scope.$apply(function() {
                TheGraphSelection.selection = item;
              });
            };
            let editEdge = function(graph, itemKey, item) {
              console.log("Selected edge for editing: " + item.id);
              
              // Must call $apply here to propagate update
              scope.$apply(function() {
                TheGraphSelection.selection = item;
              });
            };
            let contextMenus = {
              main: {
                icon: "sitemap",
                e4: {
                  icon: "paste",
                  iconLabel: "paste",
                  action: function (graph, itemKey, item) {
                    // FIXME: Clipboard
                    let pasted = Clipboard.paste(graph);
                    this.selectedNodes = pasted.nodes;
                    this.selectedEdges = [];
                  }
                }
              },
              selection: {
                icon: "th",
                w4: {
                  icon: "copy",
                  iconLabel: "copy",
                  action: function (graph, itemKey, item) {
                    Clipboard.copy(graph, item.nodes);
                  }
                }
              },
              nodeInport: null,
              nodeOutport: null,
              graphInport: {
                icon: "sign-in",
                iconColor: 2,
                n4: {
                  label: "inport"
                },
                s4: {
                  icon: "trash-o",
                  iconLabel: "delete",
                  action: function (graph, itemKey, item) {
                    graph.removeInport(itemKey);
                  }
                }
              },
              graphOutport: {
                icon: "sign-out",
                iconColor: 5,
                n4: {
                  label: "outport"
                },
                s4: {
                  icon: "trash-o",
                  iconLabel: "delete",
                  action: function (graph, itemKey, item) {
                    graph.removeOutport(itemKey);
                  }
                }
              },
              edge: {
                icon: "long-arrow-right",
                s4: {
                  icon: "trash-o",
                  iconLabel: "delete",
                  action: deleteEdge
                },
                e4: {
                  icon: "edit",
                  iconLabel: "edit",
                  action: editEdge
                }
              },
              node: {
                s4: {
                  icon: "trash-o",
                  iconLabel: "delete",
                  action: deleteNode
                },
                w4: {
                  icon: "copy",
                  iconLabel: "copy",
                  action: copyNode
                },
                e4: {
                  icon: "edit",
                  iconLabel: "edit",
                  action: editNode
                }
              },
              group: {
                icon: "th",
                s4: {
                  icon: "trash-o",
                  iconLabel: "ungroup",
                  action: function (graph, itemKey, item) {
                    graph.removeGroup(itemKey);
                  },
                },
              },
            };
            
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
                    menus: contextMenus,
                    library: scope.library,
                };
                $log.info('rendering', props);
                
                let editor = element;
                editor.width = props.width;
                editor.height = props.height;
                let reactEle = React.createElement(TheGraph.App, props);
                ReactDOM.render(reactEle, editor);
                
            };
            
            scope.graph.on('endTransaction', render); // graph changed
            window.addEventListener("resize", render);
            
            // Re-render if the graph changes
            scope.$watch("graph", function(newValue, oldValue) { 
                // Check that new graph is valid
                if (newValue.nodes && newValue.nodes.length) {
                    $log.debug("Graph changed... rendering", newValue);
                    
                    // Check if new graph has been loaded before component library
                    if (!scope.library || !Object.keys(scope.library).length) {
                        $log.warn("Library mismatch... preloading library from graph", newValue);
                        
                        // Pre-load library from current graph
                        // (overwritten by real models once they finish loading)
                        scope.library = TheGraph.library.libraryFromGraph(newValue);
                    }
                    render();
                }
            }, true);
            
            /*angular.element($window).bind('resize', function() {
                scope.height = $window.innerHeight;
                scope.width = $window.innerWidth;
                $log.debug(`Resize event detected: ${scope.width}x${scope.height}... reloading!`);
                render();
    
                // manual $digest required as resize event is outside of angular
                scope.$digest();
            });
            
            scope.$watch("width", function(newValue, oldValue) {
                $log.debug(`Width changed: ${oldValue} -> ${newValue}... reloading!`, newValue);
                render();
            });
            scope.$watch("height", function(newValue, oldValue) {
                $log.debug(`Height changed: ${oldValue} -> ${newValue}... reloading!`, newValue);
                render();
            });*/
            
            scope.$watchCollection("library", function(newValue, oldValue) {
                $log.debug("Library changed... reloading!", newValue);
                render();
            });
            
            /*
            scope.$watchCollection("graph.nodes", function(newValue, oldValue) {
                $log.debug(`Node count changed: ${oldValue} -> ${newValue}... reloading!`);
                render();
            });
            
            scope.$watchCollection("graph.edges", function(newValue, oldValue) {
                $log.debug(`Edge count changed: ${oldValue} -> ${newValue}... reloading!`);
                render();
            });*/
        }
    }
}])