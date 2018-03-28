var failedTests, flattenTitles, runner;

runner = mocha.run();

failedTests = [];

flattenTitles = function(test) {
  var titles;
  titles = [];
  while (test.parent.title) {
    titles.push(test.parent.title);
    test = test.parent;
  }
  return titles.reverse();
};

runner.on('fail', function(test, err) {
  var info;
  info = {
    name: test.title,
    result: false,
    message: err.message,
    stack: err.stack,
    titles: flattenTitles(test)
  };
  return failedTests.push(info);
});

runner.on('end', function() {
  window.mochaResults = runner.stats;
  return window.mochaResults.reports = failedTests;
});
