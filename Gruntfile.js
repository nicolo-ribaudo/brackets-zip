/*jslint node: true */

module.exports = function (grunt) {
    "use strict";

    require("load-grunt-tasks")(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),

        jshint: {
            all: [
                "**/*.js", "!**/node_modules/**/*.js"
            ]
        },
        compress: {
            dist: {
                options: {
                    archive: "release/<%= pkg.name %>.<%= pkg.version %>.zip"
                },
                expand: true,
                src: [
                    "**/*", "!*.md", "!Gruntfile.js", "!.*", "!node_modules/**", "!release/**", "!screenshots/**", "!.git/**"
                ]
            }
        }
    });
};