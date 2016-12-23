/**
 * Sound feedback Handler:
 * These handlers are modules that perform specific actions from our private events to avoid nesting this code into the
 * application logic and get as a result a cleaner code.
 *
 * In this case, this handler will play a sound related to the event triggered
 * */
WAT.module('$soundFeedbackHandler',['JQuery','$playerConfig','$playerLang','Logger'],
	function($,$config,$lang,Logger){

// ------------------------------------------------------------//
// SETUP
//
	var $logger = new Logger('$soundFeedbackHandler');
	/** Public scope **/
	var  service = {};
	/** Private scope **/
	var _private = {};
	/** Sounds cache **/
	var _audio  = {};

// ------------------------------------------------------------//
// PRIVATE
//
	/** Play a sound by name **/
	_private.play  = function(name){
		if(!_audio[name]) _audio[name] = new Audio($config.pluginPath+'assets/sounds/'+name+'.mp3');
		_audio[name].play();
	};
	/** The event callback **/
	_private.callback = function(event,data){
		_private.play(data.name);
	};
	/** A callback function generator **/
	_private.doCallback = function(name){
		return function() {
			_private.play(name);
		}
	};
	/** Initialize sounds for each event **/
	_private.lookup 	= _private.doCallback('lookup');
	_private.not_found = _private.doCallback('not_found');
	_private.loaded = _private.doCallback('loaded');
	_private.open 	= _private.doCallback('open');
	_private.close 	= _private.doCallback('close');
	_private.shift 	= _private.doCallback('shift');
	_private.end 	= _private.doCallback('end');

	/** Setup toggle state variable **/
	_private.started = false;


// ------------------------------------------------------------//
// PUBLIC API
//
	/** Start handling the event **/
	service.start = function(){
		if(_private.started) return;
		_private.started = true;
		$(window).on("soundFeedback",_private.callback);
		$(window).on($config.player.events.template.lookup,_private.lookup);
		$(window).on($config.player.events.template.not_found,_private.not_found);
		$(window).on($config.player.events.parser.finish,_private.loaded);
		$(window).on($config.player.events.navigation.expand,_private.open);
		$(window).on($config.player.events.navigation.collapse,_private.close);
		$(window).on($config.player.events.navigation.limitReached,_private.end);
		$(window).on($config.player.events.navigation.focus,_private.shift);
		$logger.log('Started');
	};

	/** Stop handling the event **/
	service.close = function(){
		if(!_private.started) return;
		_private.started = false;
		$(window).off("soundFeedback",_private.callback);
		$(window).off($config.player.events.template.found,_private.found);
		$(window).off($config.player.events.template.not_found,_private.not_found);
		$(window).off($config.player.events.parser.finish,_private.loaded);
		$(window).off($config.player.events.navigation.expand,_private.open);
		$(window).off($config.player.events.navigation.collapse,_private.close);
		$(window).off($config.player.events.navigation.limitReached,_private.end);
		$(window).off($config.player.events.navigation.focus,_private.shift);
		$logger.log('Closed');
	};

	/** Return the handler name **/
	service.getName = function(){
		return "$soundFeedbackHandler";
	};

	/** Start it by default **/
	service.start();

	return service;
});