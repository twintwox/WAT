module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            before: ['build/**', 'dist/**'],
            after:  ['dist/*.js','dist/*.css', '!dist/*.min.js','!dist/*.min.css']
        },
        concat: {
            framework: {
                src: ['vendors/**/*.js','src/wat.js','src/modules/*.js'],
                dest: 'dist/wat-framework.js'
            },
            editor: {
                src: ['dist/wat-framework.js','src/plugins/editor/**/*.js'],
                dest: 'dist/wat-editor.js'
            },
            editorCSS: {
                src: ['src/plugins/reset.css','vendors/**/*.css','src/modules/**/*.css','src/plugins/editor/**/*.css'],
                dest: 'dist/wat-editor.css'
            },
            player: {
                src: ['dist/wat-framework.js','src/plugins/player/**/*.js'],
                dest: 'dist/wat-player.js'
            },
            playerCSS: {
                src: ['src/plugins/reset.css','vendors/**/*.css','src/modules/**/*.css','src/plugins/player/**/*.css'],
                dest: 'dist/wat-player.css'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> framework <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                files: [{
                    flatten: true,
                    expand: true,
                    src: ['dist/*.js','!*.min.js'],
                    dest: 'dist/',
                    ext: '.min.js'
                }]
            }
        },
        cssmin: {
            target: {
                files: [{
                    expand: true,
                    cwd:'dist/',
                    src: ['*.css','!*.min.css'],
                    dest: 'dist/',
                    ext: '.min.css'
                }]
            }
        },
        rename: {
            main: {
                // For dev, as we are not runnning the uglify, create the min files just coping the non minified code
                files: [
                    {src: ['dist/wat-framework.js'], dest: 'dist/wat-framework.min.js'},
                    {src: ['dist/wat-editor.js'], dest: 'dist/wat-editor.min.js'},
                    {src: ['dist/wat-player.js'], dest: 'dist/wat-player.min.js'},
                    {src: ['dist/wat-editor.css'], dest: 'dist/wat-editor.min.css'},
                    {src: ['dist/wat-player.css'], dest: 'dist/wat-player.min.css'},
                ]
            }
        },
        copy: {
            main: {
                files: [
                    {expand: true, cwd: 'chrome_frame/', src: ['./**'], dest: 'build/'},
                    {expand: true, flatten: true, src: ['dist/wat-editor.min.js'], dest: 'build/editor/', filter: 'isFile'},
                    {expand: true, flatten: true, src: ['dist/wat-player.min.js'], dest: 'build/player/', filter: 'isFile'},
                    {expand: true, flatten: true, src: ['dist/wat-editor.min.css'], dest: 'build/editor/', filter: 'isFile'},
                    {expand: true, flatten: true, src: ['dist/wat-player.min.css'], dest: 'build/player/', filter: 'isFile'},

                    // Export images for jquery-ui:
                    {expand: true, flatten: true, src: ['vendors/jquery-ui/images/*'], dest: 'build/editor/images'},
                    {expand: true, flatten: true, src: ['src/plugins/editor/**/*.html'], dest: 'build/editor/assets/templates', filter: 'isFile'},

                ],
            },
        },
        qunit: {
            //all: ['tests/modules/XpathBuilder.test.html'],
            all: ['tests/**/*.html'],
            options: {
                timeout: 20000
            }
        },
        watch: {
            scripts: {
                files: ['**/*.js'],
                tasks: ['build'],
                options: {
                    spawn: false,
                },
            },
        }
    });

    // Load the plugins that provides the tasks.
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-rename');

    // Default task(s).
    grunt.registerTask('default', ['clean:before','concat','uglify','cssmin','clean:after','copy','qunit']);
    grunt.registerTask('release', ['clean:before','concat','uglify','cssmin','clean:after','copy','qunit']);
    grunt.registerTask('build',   ['clean:before','concat','rename','clean:after','copy']);
    grunt.registerTask('test',    ['qunit']);
};