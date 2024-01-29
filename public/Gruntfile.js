/**
 * Grunt commands
 *
 *  default         - watches styles
 *  dev             - builds dev
 *  build           - builds production
 *  
 *
 */


module.exports = function (grunt) {

  // Load grunt modules

  require('load-grunt-tasks')(grunt);

  // Vars

  var path      = '/';
  var resources = '/';
  var libsass   = false;
  var stylesDevTask, stylesWatchTask, stylesBuildTask

  // Project configuration.

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    /*-------------------------------------/
    //  Style tasks
    //------------------------------------*/

    compass: {
      options: {
        require : ['modernizr-mixin', 'sass-globbing']
      },
      dev: {
        options: {
          httpPath       : "/",
          cssDir         : "precss",
          sassDir        : "scss",
          imagesDir      : "img",
          javascriptsDir : "js",
          fontsDir       : "fonts",
          outputStyle    : "expanded",
          relativeAssets : true,
          noLineComments : true,
          boring         : false,
          sourcemap      : true,
          watch          : true
        }
      },
      build: {
        options: {
          httpPath       : "/",
          cssDir         : "precss",
          sassDir        : "scss",
          imagesDir      : "img",
          javascriptsDir : "js",
          fontsDir       : "fonts",
          outputStyle    : "compressed",
          environment    : 'production',
          relativeAssets : true,
          noLineComments : true,
          boring         : true,
          sourcemap      : false
        }
      }
    },
    sass: {
      dev: {
        options: {
          sourceMap: true
        },
        files: [{
           expand: true,
           cwd: resources + '/scss',
           src: ['**/*.scss'],
           dest: 'precss',
           ext: '.css'
        }]
      },
      build: {
        options: {
          sourceMap: false
        },
        files: [{
           expand: true,
           cwd: 'scss/',
           src: ['**/*.scss'],
           dest: 'css/',
           ext: '.css'
        }]
      }
    },
    postcss: {
      options: {
        syntax: require('postcss-scss'),
        parser: require('postcss-scss')
      },
      dev: {
        options: {
          map: true,
          processors: [
            require('postcss-sorting'),
            require('postcss-assets')({
              loadPaths: ["img"]
            }),
            require('postcss-image-set-polyfill'),
            require('autoprefixer')({
              browsers: ['> 0%']
            }),
            require('css-mqpacker'),
            require('postcss-initial')({
              reset: 'inherited'
            }),
            require('postcss-font-magician')({

            })
          ]
        },
        files: [{
          expand: true,
          cwd: "precss/",
          src: ["*.css", "pages/**/*.css"],
          dest: "css"
        }]
      },
      build: {
        options: {
          map: false,
          processors: [
            require('postcss-strip-inline-comments'),
            require('postcss-sorting'),
            require('postcss-assets')({
              loadPaths: ["img"]
            }),
            require('postcss-image-set-polyfill'),
            require('autoprefixer')({
              browsers: ['> 0%']
            }),
            require('css-mqpacker'),
            require('postcss-initial')({
              reset: 'inherited'
            }),
            require('postcss-font-magician')({
              
            })
          ]
        },
        files: [{
          expand: true,
          cwd: "precss",
          src: ["*.css", "pages/**/*.css"],
          dest: "css"
        }]
      },
      lint: {
        options: {
          processors: [
            require("stylelint")({ /* your options */ }),
            require("postcss-reporter")({ clearMessages: true })
          ]
        },
        files: [{
          expand: true,
          cwd: "precss/",
          src: ["*.css", "pages/**/*.css"],
          dest: "css"
        }]
      }
    }, // postcss

    /*-------------------------------------/
    //  Clean
    //------------------------------------*/

    clean: {
      cssmaps: ["css/*.css.map"],
      precss: ["precss"]
    },

    /*------------------------------------//
    //  Concat
    //------------------------------------*/
    concat: {
      options: {
        separator: ';',
      },
      vendor: {
        src: ['js/vendor/*.js'],
        dest: 'js/vendor.js',
      },
    },
    /*-------------------------------------/
    //  Concurrent
    //------------------------------------*/
    
    concurrent: {
      watch: {
        tasks: ['watch', 'compass:dev'],
        // tasks: ['watch', 'sass:dev'],
        options: {
          logConcurrentOutput: true
        }
      }
    },

    /*-------------------------------------/
    //  Assets
    //------------------------------------*/
    
    imagemin: {
      dynamic: {
        files: [{
          expand: true,
          src: ["img/**/*.{png,jpg,gif,jpeg}"]
        }]
      }
    },

    /*-------------------------------------/
    //  Watch
    //------------------------------------*/

    watch: {
      // sass: {
      //   files: [resources + "/sass/**/*.sass"],
      //   tasks: ['sass:dev']
      // },
      jsvendor: {
        files: ["js/vendor/**/*.js"],
        tasks: ['concat:vendor']
      },
      postcss: {
        files: ["precss/**/*.css"],
        tasks: ['postcss:dev']
      },
      css: {
        files: ["css/**/*.css"]
      },
      livereload: {
        files: ["css/**/*.css"],
        options: {
          livereload: true
        }
      }
    },
    notify: {
      js_compiled: {
        options: {
          title: 'Task Complete', 
          message: 'Grunt finished running.',
        }
      }
    }
  });


  // Tasks
  // 

  if(libsass) {
    stylesWatchTask = 'watch';
    stylesDevTask   = 'sass:dev';
    stylesBuildTask = 'sass:build';
  }
  else {
    stylesWatchTask = 'concurrent:watch';
    stylesDevTask   = 'compass:dev';
    stylesBuildTask = 'compass:build';

  }

  // Default task.
  grunt.registerTask('default', [
    stylesWatchTask
  ]);

  // Build vendor js
  grunt.registerTask('vendor', [
    'concat:vendor'
  ]);

  // Dev
  grunt.registerTask('dev', [
    'postcss:dev',
    stylesDevTask
  ]);

  // Build
  grunt.registerTask('build', [
    // 'imagemin',
    stylesBuildTask,
    'postcss:build',
    'concat:vendor',
    'clean:precss'
  ]);

};