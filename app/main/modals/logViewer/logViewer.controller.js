/* global angular:false */

angular
.module('cis')

/**
 * The Controller for our "View Logs" Modal Window
 * 
 * @author lambert8
 * @see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/3.%29+Controllers%2C+Scopes%2C+and+Partial+Views
 */
.controller('LogViewerCtrl', [ '$scope', '$log', '$http', '$interval', '$uibModalInstance', '_', 'clipboard', 'ApiUri', 'results', 'title', 'jobId',
    function($scope, $log, $http, $interval, $uibModalInstance, _, clipboard, ApiUri, results, title, jobId) {
  "use strict";
  
  let refreshIntervalMs = 3000;
  
  $scope.title = title;
  $scope.jobID = jobId;
  $scope.results = results;
  
  let interval = $interval(function() {
    $scope.refresh();
  }, refreshIntervalMs);
  
  $scope.refresh = function() {
    console.log("Fetching logs for: " + jobId);
    $http.get(ApiUri + '/graph/execute/' + jobId + '/logs')
      .then(function(response) {
        console.log("Fetched logs for: " + jobId);
        //$scope.showLogs(response.data);
        $scope.results = response.data;
      }, function(response) {
        var error = response.data;
        console.error("Error running graph:", error.message)
      });
  };
    
  $scope.copy = function() {
    if (!clipboard.supported) {
      alert('Sorry, copy to clipboard is not supported');
      return;
    }
    clipboard.copyText(results);
  };

  $scope.close = function() {
    $log.debug("Closing modal with dismissal!");
    $interval.cancel(interval);
    $uibModalInstance.dismiss('cancel');
  };
}]);