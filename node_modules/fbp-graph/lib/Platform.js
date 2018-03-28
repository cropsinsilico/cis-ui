(function() {
  exports.isBrowser = function() {
    if (typeof process !== 'undefined' && process.execPath && process.execPath.match(/node|iojs/)) {
      return false;
    }
    return true;
  };

  exports.deprecated = function(message) {
    if (exports.isBrowser()) {
      if (window.NOFLO_FATAL_DEPRECATED) {
        throw new Error(message);
      }
      console.warn(message);
      return;
    }
    if (process.env.NOFLO_FATAL_DEPRECATED) {
      throw new Error(message);
    }
    return console.warn(message);
  };

}).call(this);
