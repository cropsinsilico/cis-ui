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

    'swagger-js-codegen': {
        cis: {
            options: {
                apis: [
                    {
                        swagger: 'swagger.yaml',
                        className: 'ApiServer',
                        moduleName: 'cis-api', // This is the model and file name 
                        angularjs: true
                    }
                ],
                dest: 'public/app/'
            },
            dist: {
            }
        }
    },
    
    // TODO: configure grunt to run karma unit tests + coverage
    karma: {
      unit: {
        configFile: 'karma.conf.js',
        singleRun: true,        // Stop after running once?
        autoWatch: false,       // Auto-run tests when files change on disk?
        background: false,      // Prevent this task from blocking subsequent tasks?
      }
    },
	  
    // TODO: configure grunt to run protractor e2e tests (TODO: coverage)
    protractor: {
      options: {
        configFile: "node_modules/protractor/example/conf.js", // Default config file 
        keepAlive: true, // If false, the grunt process stops when the test fails. 
        noColor: false, // If true, protractor will not use colors in its output. 
      },
      cis: {   // Grunt requires at least one target to run so you can simply put 'all: {}' here too. 
        options: {
          configFile: "protractor.conf.js", // Target-specific config file 
          args: {
            
          }, // Target-specific arguments 
        }
      },
    },
  });
  

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-csslint');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-protractor-runner');

  // Adjust task execution order here
  //grunt.registerTask('start', [ 'express:prod' ]);
  grunt.registerTask('lint', [ 'jshint', /*'csslint'*/ ]);
  //grunt.registerTask('optimize', [ 'imagemin', 'cssmin', 'uglify' ]);

  grunt.registerTask('ship', [ 'swagger', 'lint', /*'optimize'*/ ]);
  grunt.registerTask('swagger', [ 'swagger-js-codegen' ]);

  grunt.registerTask('default', [ 'ship', 'start' ]);
};
