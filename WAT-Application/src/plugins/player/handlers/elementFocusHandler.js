/**
 * Element focus Handler:
 * These handlers are modules that perform specific actions from our private events to avoid nesting this code into the
 * application logic and get as a result a cleaner code.
 *
 * In this case, this handler will move our Element Highlighter to the current focused element.
 * */
WAT.module('$elementFocusHandler',['JQuery','$playerConfig','Logger','Highlighter'],function($,$config,Logger,Highlighter){

// ------------------------------------------------------------//
// SETUP
//
	var $logger = new Logger('$loadingMsgHandler');
	/** Public scope **/
	var service = {};
	/** Private scope **/
	var _private = {};

// ------------------------------------------------------------//
// PRIVATE
//
	/** A private highlighter to focus the current element **/
	_private.highlighter = new Highlighter('elementHover','rgba(0, 185, 233, .75)');
	_private.highlighter.initialize();
	_private.started = false;

	/** the event handler **/
	_private.callback = function(event,data){
		if(event.params && event.params.target)
			_private.highlighter.refresh(event.params.target);
	};

// ------------------------------------------------------------//
// PUBLIC API
//
	/** Start handling the event **/
	service.start = function(){
		if(_private.started) return;
		_private.started = true;

		$(window).on($config.player.events.navigation.focus,_private.callback);
		$logger.log('Started');
	};
	/** Stop handling the event **/
	service.close = function(){
		if(!_private.started) return;
		_private.started = false;

		$(window).off($config.player.events.navigation.focus,_private.callback);
		$logger.log('Closed');
	};
	/** Return the handler name **/
	service.getName = function(){
		return "$elementFocusHandler";
	};

	/** Start it by default **/
	service.start();

	return service;
});
