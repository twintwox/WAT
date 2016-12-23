/**
 * Controls Tool:
 *
 * Tools are modules loaded by the $player only after a template has been installed successfully on the client.
 * The tool must call the $player.bindTool function in order to be called, and must contain the public functions
 * start, close and refresh.
 *
 * Start will be called after the template installation.
 * Close will be called if the player is turned down.
 * Refresh will be called each time new patterns are found and after the parser run.
 *
 * In this case, the controls tool will bind those commands events defined on the $playerConfig to an specific action
 * such as showing the login form, or binding the event into a navigation action.
 *
 * **/
WAT.module('$controlsTool',['JQuery','$playerConfig','$playerLang','$session','$player','$playerForms'],function($,$config,$lang,$session,$player,$playerForms){


// ------------------------------------------------------------//
// SETUP
//
	/** Public scope **/
	var service = {};
	/** Private scope **/
	var _private = {};


// ------------------------------------------------------------//
// PRIVATE
//
	/** handlers for each bounded action **/
	_private.handlers = {
		showUserDataForm: function(){
			$playerForms.showUserDataForm().done(function(userData){
				$session.save($config.player.userStoreKey,$session.asPersistentObject(userData),true);
			})
		}
	};
	/** Attach handlers **/
	_private.attachListeners = function() {
		$(window).on($config.player.events.commands.login_form,_private.handlers.showUserDataForm);
	};
	/** Detach handlers **/
	_private.detachListeners = function(){
		$(window).off($config.player.events.commands.login_form,_private.handlers.showUserDataForm);
	};

// ------------------------------------------------------------//
// PUBLIC API, REQUIRED BY THE PLAYER
//
	/** On start **/
	service.start = function(){
		_private.attachListeners();
	};
	/** On Close **/
	service.close = function(){
		_private.detachListeners();
	};
	/** On refresh **/
	service.refresh = function(){
		// do nothing
	};

	/** Bind the tool into the player **/
	$player.bindTool('$controlsTool',$lang.get('controls_tool_name'),service,true);
	return service;
});