/**
 * LANGUAGE
 * Module to manage all the exposed strings of the application.
 *
 * New messages can be added here or by using the extend function.
 * ***/

WAT.module('$lang',['$config','Logger'],function($config,Logger){

	var $logger = new Logger('$lang');

	var service = {};
	var DEFAULT_LANG = 'ES';

	var strings = {};

	/** Get a string from the selected language (set in the $config.lang) **/
	service.get = function(msg){
		var selected = $config.lang || DEFAULT_LANG;
		if(!strings[selected][msg]){
			$logger.warn('Undefined string',msg,'for',selected);
			return "UNDEFINED";
		}
		return strings[selected][msg];
	};

	/** Extend a language with new messages **/
	service.extend = function(lan,msgs){
		if(!strings[lan]) strings[lan] = {};
		for(var key in msgs){
			strings[lan][key] = msgs[key];
		}
	};

	return service;
});

