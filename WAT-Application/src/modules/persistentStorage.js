/**
 * Adapter for the Chrome.storage API (For more info, read Chrome.storage documentation).
 * ***/
chrome.storage.sync.get('wat_storage',function(obj){
	var store = obj['wat_storage'] || {};

	/**
	 * * This module is loaded after reading the "wat_storage" key from the Chrome storage.
	 *
	 * Unlike the $localStorage, the $persistentStorage will store the data over different tabs and domains
	 * But this storage is kind of limited, so avoid to store big things in it.
	 * ***/
	WAT.module('$persistentStorage',['JQuery','Logger'],function($,Logger){

		var $logger = new Logger('$persistentStorage');
		$logger.log('Persistent storage loaded',store);
	// ------------------------------------------------------------//
	// Public interface:
	// Provide an interface similar to the $localStorage
	//
		var service = {};
		service.getItem = function(key){
			var temp = store[key];
			$logger.log('Get',key,temp);
			return temp;
		};
		service.setItem = function(key,val){
			$logger.log('Save',key,val);
			store[key] = val;
			service.sync();
		};
		service.clear = function(){
			store = {};
			chrome.storage.sync.clear();
		};
		service.remove = function(key){
			delete store[key];
			chrome.storage.sync.remove(key);
		};
		service.sync = function(){
			var defer = $.Deferred();
			chrome.storage.sync.set({'wat_storage':store},function(){
				defer.resolve();
			});
			return defer.promise();
		};

		return service;
	});
});

