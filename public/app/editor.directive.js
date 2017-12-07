/* global angular:false */



angular.module('cis')

.directive('editor', [ '$window', 'React', 'ReactDOM', 'TheGraph', function($window, React, ReactDOM, TheGraph) {
    
    
    return{
        restrict: 'E',
        scope: {
            width: '=',
            height: '=',
            graph: '=',
            library: '=',
            loading: '='
        },
        link:function(scope, ele, attributes) {
            let element = ele[0];
            
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
                console.log('render', props);
                console.log('elements', element);
                
                let editor = element;
                editor.width = props.width;
                editor.height = props.height;
                let reactEle = React.createElement(TheGraph.App, props);
                ReactDOM.render(reactEle, editor);
            };
            
            // HACK: Re-render if inputs change
            scope.$watch("graph || graph.nodes || graph.edges", function(newValue, oldValue) { 
                console.log("Graph changed... rendering", scope.graph);
                render();
            });
            
            // HACK: Re-render if inputs change
            scope.$watch("library || width || height", function(newValue, oldValue) { render(); });
            
            angular.element($window).bind('resize', function() {
                scope.height = $window.innerHeight - 300;
                scope.width = $window.innerWidth;
                render();
    
                // manual $digest required as resize event
                // is outside of angular
                scope.$digest();
            });
        }
    }
}]);


/*


  // TODO: abstract to directive
  // The graph editor
  //$scope.editor = document.getElementById('editor');
  function renderEditor() {
    let props = {
        readonly: false,
        height: window.innerHeight,
        width: window.innerWidth,
        graph: $scope.graph,
        library: $scope.library,
    };
    //console.log('render', props);
    let editor = document.getElementById('editor');
    editor.width = props.width;
    editor.height = props.height;
    let element = React.createElement(TheGraph.App, props);
    ReactDOM.render(element, editor);
  }
  //$scope.graph.on('endTransaction', renderEditor); // graph changed
  window.addEventListener("resize", renderEditor);




*/