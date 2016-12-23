/**
 * Player commands Handler:
 * These handlers are modules that perform specific actions from our private events to avoid nesting this code into the
 * application logic and get as a result a cleaner code.
 *
 * In this case, this handler will bind each of the command to the player events defined in the player conf.
 * */
WAT.module('$playerCommandsHandler',['JQuery','$playerConfig','$utils','Logger'],
	function($,$config,$utils,Logger){

// ------------------------------------------------------------//
// SETUP
//
	var $logger = new Logger('$playerCommandsHandler');
	/** Public scope **/
	var  service = {};
	/** Private scope **/
	var _private = {};

// ------------------------------------------------------------//
// PRIVATE
//


		/** Store the current keys pressed **/
		_private.keysDown = {}

		/** Define handler for the keyup **/
		_private.keyupHandler = function(e){
			// Just delete the key from the keysDown collection.
			delete _private.keysDown[e.keyCode];
		};

		/** Define handler for those single key controls **/
		_private.singleKeydownHandler = function(e){
			if(!e.keyCode) return; // Check there is a keyCode property.

			// Check there is only 1 key pressed:
			if(e.ctrlKey || e.shiftKey || e.metaKey) return;
			if(Object.keys(_private.keysDown).length > 0) return;

			// There is only 1 key pressed:
			_private.keysDown[e.keyCode] = true;
			// Bind events:
			switch (e.keyCode){
				case 13: //Enter
					$logger.log('Enter triggered');
					$utils.trigger($config.player.events.navigation.forward);
					break;
				case 27: //Esc
					$logger.log('Escape triggered');
					$utils.trigger($config.player.events.navigation.backward);
					break;
				case 37: //Left
					$logger.log('Left arrow triggered');
					$utils.trigger($config.player.events.navigation.backward);
					break;
				case 38: //Up
					$logger.log('Up arrow triggered');
					$utils.trigger($config.player.events.navigation.previous);
					break;
				case 39: //Right
					$logger.log('Right arrow triggered');
					$utils.trigger($config.player.events.navigation.forward);
					break;
				case 40: //Down
					$logger.log('Down arrow triggered');
					$utils.trigger($config.player.events.navigation.next);
					break;
				default: break;
			}
		};

		/** Define handler for those Ctrl+key controls **/
		_private.ctrlKeydownHandler = function(e){
			if(!e.keyCode) return; // Check there is a keyCode property.
			if(!e.ctrlKey) return; // No Ctrl pressed.
			if( e.keyCode == 17) return; // This is the Ctrl pressed event.

			// Check there is no other key pressed:
			if(e.shiftKey || e.metaKey) return;
			if(Object.keys(_private.keysDown).length > 0) return;

			// There is only ctrl key pressed:
			_private.keysDown[e.keyCode] = true;

			// Now the control and the key are being pressed:
			// Bind events:
			switch (e.keyCode){
				case 76: // L Key
					$logger.log('L triggered');
					$utils.trigger($config.player.events.commands.login_form);
					break;
				default: break;
			}
		};

		/** Setup toggle state variable **/
		_private.started = false;

// ------------------------------------------------------------//
// PUBLIC API
//
	/** Start handling the event **/
	service.start = function(){
		if(_private.started) return;
		_private.started = true;
		$(window).on('keyup',_private.keyupHandler);
		$(window).on('keydown',_private.singleKeydownHandler);
		$(window).on('keydown',_private.ctrlKeydownHandler);
		$logger.log('Started');
	};

	/** Stop handling the event **/
	service.close = function(){
		if(!_private.started) return;
		_private.started = false;
		$(window).off('keyup',_private.keyupHandler);
		$(window).off('keydown',_private.singleKeydownHandler);
		$(window).off('keydown',_private.ctrlKeydownHandler);
		$logger.log('Closed');
	};

	/** Return the handler name **/
	service.getName = function(){
		return "$playerCommandsHandler";
	};

	/** Start it by default **/
	service.start();

	return service;
});