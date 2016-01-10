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
				"./style/miles.css": "./style/miles.less",
				"./style/calendar.css": "./style/calendar.less",
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
