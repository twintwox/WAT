/**
 * Loading Message Handler:
 * These handlers are modules that perform specific actions from our private events to avoid nesting this code into the
 * application logic and get as a result a cleaner code.
 *
 * In this case, this handler will show a loading Message each time a new template is being loaded.
 * */
WAT.module('$loadingMsgHandler',['JQuery','$playerConfig','Logger','$playerLang','LoadingMsg'],function($,$config,Logger,$lang,LoadingMsg){


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
	/** Setup a new loading msg to use **/
	_private.windowMsg = new LoadingMsg();
	_private.started = false;

	/** Start showing message handler **/
	_private.onTemplateLookup = function(){
		_private.windowMsg.initialize($lang.get('loading_template_msg'));
		_private.windowMsg.show();
	};
	/** Stop showing message handler **/
	_private.onTemplateLookupFinish = function(){
		_private.windowMsg.hide();
	};


// ------------------------------------------------------------//
// PUBLIC API
//
	/** Start handling the event **/
	service.start = function(){
		if(_private.started) return;
		_private.started = true;

		$(window).on($config.player.events.template.lookup,_private.onTemplateLookup);
		$(window).on($config.player.events.template.not_found,_private.onTemplateLookupFinish);
		$(window).on($config.player.events.parser.finish,_private.onTemplateLookupFinish);
		$logger.log('Started');
	};
	/** Stop handling the event **/
	service.close = function(){
		if(!_private.started) return;
		_private.started = false;

		$(window).off($config.player.events.template.lookup,_private.onTemplateLookup);
		$(window).off($config.player.events.template.not_found,_private.onTemplateLookupFinish);
		$(window).off($config.player.events.parser.finish,_private.onTemplateLookupFinish);

		$logger.log('Closed');
	};

	/** Return the handler name **/
	service.getName = function(){
		return "$loadingMsgHandler";
	};

	/** Start it by default **/
	service.start();
	return service;

});
