/**
 * Configuration params for the editor plugin
 * **/
WAT.module('$editorConfig', ['$config'], function($config){

	$config.chromeInterfaceStorage = 'WAT_EDITOR_INTERFACE';
	$config.editor = {};
	//$config.lang = 'ES';

	return $config;
});
 