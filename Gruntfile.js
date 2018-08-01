module.exports = function(grunt) {

  // Display the elapsed execution time of grunt tasks
  require('time-grunt')(grunt);
  // Load all grunt-* packages from package.json
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    
    // configure grunt to execute jshint
    jshint: {
      files: ['Gruntfile.js', 'app/**/*.js', 'tests/**/*.js'],
      options: {
        ignores: ['app/cis-api.js', 'node_modules/**/*', 'tests/reports/**/*'],
        reporterOutput: "",
        force: true,
        esversion: 6,
        globals: {
          //jQuery: true,     // jQuery
          window: true,     // JavaScript
          Buffer: true,     // JavaScript?
          
          require: true,    // nodejs
          
          angular: true,    // angular
          
          module: true,     // angular-mocks
          inject: true,     // angular-mocks
          
          describe: true,   // jasmine
          it: true,         // jasmine
          beforeAll: true,  // jasmine
          beforeEach: true, // jasmine
          afterEach: true,  // jasmine
          afterAll: true,   // jasmine
          expect: true,     // jasmine
          element: true,    // jasmine
          
          browser: true,    // protractor
          by: true,         // protractor
        }
      }
    },
    
    csslint: {
      strict: {
        options: {
          import: 2
        },
        src: ['asset/css/*.css']
      },
      lax: {
        options: {
          import: false
        },
        src: ['asset/css/*.css']
      }
    },

    cacheBust: {
        taskName: {
            options: {
                queryString: true,
                assets: [
                   'asset/**',
                   'app/**',
                   'node_modules/**'
                ]
            },
            src: ['index.html']
        }
    },
  });
  
  // Adjust task execution order here
  grunt.registerTask('lint', [ 'jshint', /*'csslint'*/ ]);
  grunt.registerTask('ship', [ 'cache-bust', 'lint', /*'optimize'*/ ]);
  grunt.registerTask('cache-bust', [ 'cacheBust' ]);
  grunt.registerTask('default', [ 'ship' ]);
};
