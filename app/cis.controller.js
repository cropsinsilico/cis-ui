angular.module('cis', [])
  .controller('CisCtrl', function($scope) {
    // TODO: Save to localStorage
    // TODO: "Palette" drag and drop functionality
    
    $scope.model = new go.GraphLinksModel(
      [
        { key: 1, name: "Alpha", color: "lightblue" },
        { key: 2, name: "Beta", color: "orange" },
        { key: 3, name: "Gamma", color: "lightgreen" },
        { key: 4, name: "Delta", color: "pink" }
      ],
      [
        { from: 1, to: 2 },
        { from: 1, to: 3 },
        { from: 2, to: 2 },
        { from: 3, to: 4 },
        { from: 4, to: 1 }
      ]);

    $scope.model.selectedNodeData = null;

    $scope.replaceModel = function() {
      $scope.model = new go.GraphLinksModel(
          [
            { key: 11, name: "zeta", color: "red" },
            { key: 12, name: "eta", color: "green" }
          ],
          [
            { from: 11, to: 12 }
          ]
        );
    }
  });