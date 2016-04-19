// Run "grunt watch" from public/ directory
module.exports = function(grunt) {
	grunt.initConfig({
		// running `grunt less` will compile once
		less: {
			development: {
				options: {
					paths: ["./less"],
					yuicompress: true
				},
			files: {
				"./style/calendar.css": "./style/calendar.less",
				"./style/days.css": "./style/days.less",
				"./style/imports.css": "./style/imports.less",
				"./style/index.css": "./style/index.less",
				"./style/miles.css": "./style/miles.less",
				"./style/legend.css": "./style/legend.less",
				"./style/new-day.css": "./style/new-day.less",
			}
		}
	},
	watch: {
		files: "./style/*.less",
		tasks: ["less"]
	}
});
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-watch');
};
