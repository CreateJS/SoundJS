module.exports = function (grunt) {
	grunt.initConfig(
			{
				pkg: grunt.file.readJSON('package.json'),

				jasmine: {
					run: {
						src: [
							'../lib/soundjs-NEXT.combined.js'
						],

						options: {
							specs: 'spec/*Spec.js',
							helpers: [
								'spec/Helpers.js'
							],
							vendor: [],
							host: 'http://127.0.0.1:<%=connect.serve.options.port%>/'
						}
					}
				},

				connect: {
					serve: {
						options: {
							keepalive: true,
							base: [
								{
									path: __dirname,
									options: {
										index: '_SpecRunner.html'
									}
								}, '..', '../_assets/', '../lib/', './'
							],
							useAvailablePort: true,
							port: 8000,
							open: true,
						}
					}
				},

				listips: {
					run: {
						options: {
							label: "Normal"
						}
					}
				}
			}
	);

	grunt.registerTask('configureConnectHeadless', function () {
		grunt.config('connect.serve.options.keepalive', false);
		grunt.config('connect.serve.options.open', false);
	});

	// Load all the tasks we need
	grunt.loadNpmTasks('grunt-contrib-jasmine');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadTasks('tasks/');

	grunt.registerTask("default", "Launches browser-based tests", "serve");
	grunt.registerTask("serve", "Launches browser-based tests", ["jasmine:run:build", "listips", "connect"]);

	grunt.registerTask("headless", "phantom");
	grunt.registerTask("phantom", "Launches phantom-based tests", ["configureConnectHeadless", "connect", "jasmine"]);
};
