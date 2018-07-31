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
.directive('theGraphEditor', [ '$window', '$log', 'React', 'ReactDOM', 'TheGraph', 'TheGraphSelection',
        function($window, $log, React, ReactDOM, TheGraph, TheGraphSelection) {
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
            let edit = function(graph, itemKey, item) {
              $log.debug("Selected entity for editing: " + item.id);
              
              // Must call $apply here to propagate update
              scope.$apply(function() {
                TheGraphSelection.selection = item;
              });
            };
            let contextMenus = {
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
                  action: edit
                }
              },
              node: {
                s4: {
                  icon: "trash-o",
                  iconLabel: "delete",
                  action: deleteNode
                },
                e4: {
                  icon: "edit",
                  iconLabel: "edit",
                  action: edit
                }
              }
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
                
                //window.removeEventListener('resize', render);
                let reactEle = React.createElement(TheGraph.App, props);
                ReactDOM.render(reactEle, editor);
            };
            
            // Re-render if the graph changes
            scope.$watch("graph", function(newValue, oldValue) { 
                // Check that new graph is valid
                if (newValue && newValue.nodes && newValue.nodes.length) {
                    $log.warn("Graph changed... rendering", newValue);
                    $log.warn("Old value was:", oldValue);
                    
                    // Check if new graph has been loaded before component library
                    if (!scope.library || !Object.keys(scope.library).length) {
                        $log.warn("Library mismatch... attempting to preload library from graph", newValue);
                        
                        // Pre-load library from current graph
                        // (overwritten by real models once they finish loading)
                        scope.library = TheGraph.library.libraryFromGraph(newValue);
                    }
                    render();
                }
            }, true);
            
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
            
            var onResize = function() {
                scope.height = window.innerHeight;
                scope.width = window.innerWidth;
                $log.debug(`Resize event detected 2: ${scope.width}x${scope.height}... reloading!`);
                
                ReactDOM.unmountComponentAtNode(element);
                render();
    
                // manual $digest required as resize event is outside of angular
                scope.$digest();
            };
            
            function cleanUp() {
                angular.element($window).off('resize', onResize);
            }
            
            angular.element($window).on('resize', onResize);
            scope.$on('$destroy', cleanUp);
            
        }
    }
}])