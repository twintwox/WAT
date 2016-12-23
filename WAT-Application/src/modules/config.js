/**
 * Configuration module.
 * Module to store general app configuration.
 * ***/

WAT.module('$config',[],function(){
	var configuration = {
		prefix: 'wat_',
		defaultDownloadName: 'wat_project.txt',
		log: 'warning',  // verbose < info < warning < error < none
		log_showOnly: [],
		log_excluded: [],
		appElementClass: 'wat-element-generic',
		resetCssClass:'wat-reset-css',
		patternTagClass: 'wat-tags',
		pluginPath : chrome.extension.getURL('/'),
		excludeClassRegex:/(^wat-|^wat_)/, // A regex for excluding elements from being part of a pattern, (this allows to exclude our application elements).
		finalUser:"FINAL_USER",
		volunteerUser:"VOLUNTEER_USER"
	};
	return configuration;
});

