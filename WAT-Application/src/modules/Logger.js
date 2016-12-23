/**
 *
 * Module to manage all the console logs.
 * This allows to set different levels of verbosity (set in $config.log)
 * It also allows to exclude some specific modules from the logs while showing others.
 *
 * A new instance must be created for each module that pretends to use it.
 * ***/

WAT.module('Logger',['$config'],function($config){


// ------------------------------------------------------------//
// Private scope
//
//
	var _private = {};
	_private.showOnly = $config.log_showOnly;
	_private.excluded = $config.log_excluded;

	_private.level = 0;

	/** Check the log level **/
	switch ($config.log) {
		case 'verbose':
			break;
		case 'info':
			_private.level = 1;
			break;
		case 'warning':
			_private.level = 2;
			break;
		case 'error':
			_private.level = 3;
			break;
		case 'none':
			_private.level = 4;
			break;
	}

	_private.contains = function(arr,elem){
		return arr.indexOf(elem) > -1;
	};
	_private.isExcluded = function(namespace){
		if(_private.showOnly.length > 0){
			return !_private.contains(_private.showOnly,namespace);
		}else{
			return _private.contains(_private.excluded,namespace);
		}

	};


// ------------------------------------------------------------//
// Logger class
// The namespace will be used in each log to know who call it.
//
	var Logger = function (namespace){
		this.namespace = namespace+": ";
		this.isExcluded = _private.isExcluded(namespace);
	};
	Logger.prototype.log = function (){
		if(this.isExcluded) return;
		if(_private.level > 0) return;
		var args = Array.prototype.slice.call(arguments);
		args.unshift(this.namespace);
		console.log.apply(console,args);
	};
	Logger.prototype.info = function (){
		if(this.isExcluded) return;
		if(_private.level > 1) return;
		var args = Array.prototype.slice.call(arguments);
		args.unshift(this.namespace);
		console.info.apply(console,args);
	};

	Logger.prototype.warn = function (){
		if(this.isExcluded) return;
		if(_private.level > 2) return;
		var args = Array.prototype.slice.call(arguments);
		args.unshift(this.namespace);
		console.warn.apply(console,args);
	};
	Logger.prototype.error = function (){
		if(this.isExcluded) return;
		if(_private.level > 3) return;
		var args = Array.prototype.slice.call(arguments);
		args.unshift(this.namespace);
		console.error.apply(console,args);
	};
	return Logger;
});

