module.exports = function (grunt) {

	var DEBUG = !!grunt.option("debug");

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		copy: {
			hdocsTestJs: {
				files: [{
					expand: true,
					flatten: false,
					cwd: "src/js",
					src: ["test.js"],
					dest: "junk/build"
				}]
			},
			hdocsHtml: {
				files: [{
					expand: true,
					flatten: false,
					cwd: "src/html",
					src: ["*.html"],
					dest: "junk/build"
				}]
			},
			hdocsTest: {
				files: [{
					expand: true,
					flatten: false,
					cwd: "junk/build",
					src: ["**/*.*"],
					dest: "test/mocks/consumer-app/app/hdocs"
				}]
			},
			wiki: {
				files: [{
					expand: true,
					flatten: true,
					src: ["docs/*.md", "!docs/global.md"],
					dest: "../wikis/<%= pkg.shortName %>.wiki/"
				}]
			}
		},
		concat: {
			hdocs: {
				src: [
					"src/js/module.js",
					"src/js/hdoc.controller.js",
					"src/js/data.service.js",
					"src/js/medium.service.js",
					"src/js/directives.js"
				],
				dest: "junk/build/noinfopath-biz-forms.js"
			},
			readme: {
				src: ["docs/restapi.md"],
				dest: "readme.md"
			},
			wiki: {
				src: ["docs/index.md"],
				dest: "../wikis/<%= pkg.shortName %>.wiki/home.md"
			}
		},
		bumpup: {
			file: "package.json"
		},
		version: {
			options: {
				prefix: "@version\\s*"
			},
			defaults: {
				src: ["index.js"]
			}
		},
		nodocs: {
			"internal": {
				options: {
					src: ["index.js", "no-mysql-crud.js", "no-odata.js"],
					dest: "docs/restapi.md",
					start: ["/*", "/**"],
					multiDocs: {
						multiFiles: true,
						dest: "docs/"
					}
				}
			}
		},
		watch: {
			test: {
				files: ["src/**/*.*"],
				tasks: ["test"],
				options: {
					spawn: false
					// livereload: true
				}
			},
			document: {
				files: ["*.js"],
				tasks: ["document"],
				options: {
					spawn: false
					// livereload: true
				}
			}
		},
		shell: {
			wiki1: {
				command: [
					"cd ../wikis/<%= pkg.shortName %>.wiki",
					"pwd",
					"git stash",
					"git pull"
				].join(" && ")
			},
			wiki2: {
				command: [
					"cd ../wikis/<%= pkg.shortName %>.wiki",
					"pwd",
					"git add .",
					"git commit -m",
					"echo 'Wiki Updated'",
					"git push"
				].join(" && ")
			}
		}
	});

	grunt.loadNpmTasks("grunt-contrib-concat");
	grunt.loadNpmTasks("grunt-bumpup");
	grunt.loadNpmTasks("grunt-version");
	grunt.loadNpmTasks("grunt-nodocs");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-shell");
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("@noinfopath/grunt-noinfopath-config");

	//Default task(s).

	//Only globals.js in readme.md
	grunt.registerTask("wikiWack", ["shell:wiki1", "concat:wiki", "copy:wiki", "shell:wiki2"]);
	grunt.registerTask("release", ["bumpup", "version", "nodocs:internal", "concat:readme", "wikiWack"]);
	grunt.registerTask("document", ["nodocs:internal", "concat:readme"]);
	grunt.registerTask("updateWiki", ["document", "wikiWack"]);
	grunt.registerTask("test", ["copy:hdocsHtml", "concat:hdocs", "copy:hdocsTestJs", "copy:hdocsTest"]);

};
