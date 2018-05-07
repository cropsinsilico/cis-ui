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
              main: null,
              selection: null,
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
                /*w4: {
                  icon: "copy",
                  iconLabel: "copy",
                  action: copyNode
                },*/
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
                    height: $window.innerHeight + 50,
                    width: $window.innerWidth,
                    graph: scope.graph,
                    menus: contextMenus,
                    library: scope.library,
                };
                $log.info('rendering', props);
                
                // Save internal state
                let editor = element;
                editor.width = props.width;
                editor.height = props.height;
                
                // FIXME: This seems to work despite many errors in the console
                //ReactDOM.unmountComponentAtNode(editor);
                
                window.removeEventListener('resize', render);
                let reactEle = React.createElement(TheGraph.App, props);
                ReactDOM.render(reactEle, editor);
            
            };
            
            //scope.graph.on('endTransaction', render); // graph changed
            window.addEventListener("resize", render);
            
            // Re-render if the graph changes
            scope.$watch("graph", function(newValue, oldValue) { 
                // Check that new graph is valid
                if (newValue.nodes && newValue.nodes.length) {
                    $log.warn("Graph changed... rendering", newValue);
                    $log.warn("Old value was:", oldValue);
                    
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
            
            angular.element($window).bind('resize', function() {
                scope.height = $window.innerHeight;
                scope.width = $window.innerWidth;
                $log.info(`Resize event detected: ${scope.width}x${scope.height}... reloading!`);
                render();
    
                // manual $digest required as resize event is outside of angular
                scope.$digest();
            });
            
            // Detect when the parent's dimensions change and resize accordingly
            // FIXME: This seems hacky, but nothing else seemed to work
            scope.$watch(
                function () { 
                    return {
                       width: $window.innerWidth,
                       height: $window.innerHeight,
                    }
               },
               function (newValue, oldValue) {
                  // Only rerender when dimensions actually change
                  if (!newValue || !newValue.width || !newValue.height 
                      || (newValue.width === oldValue.width 
                        && newValue.height === oldValue.height)) {
                    return;
                  }
                  let w = scope.width = $window.innerWidth;
                  let h = scope.height = $window.innerHeight;
                  $log.warn(`Resize event detected: ${w}x${h}... reloading!`);
                  render();
               }, //listener 
               true //deep watch
            );
            
            scope.$watchCollection("library", function(newValue, oldValue) {
                $log.debug("Library changed... reloading!", newValue);
                render();
            });
            
            scope.$watchCollection("graph.nodes", function(newValue, oldValue) {
                $log.debug("Nodes changed... reloading!", newValue);
                render();
            });
            
            scope.$watchCollection("graph.edges", function(newValue, oldValue) {
                $log.debug("Edges changed... reloading!", newValue);
                render();
            });
        }
    }
}])