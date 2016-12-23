/**
 * PLAYER:
 * This module initialize the environment for the player plugin.
 * Setups the template to use, the parser, refreshDaemon and the ChromeInterface, as well as the the enable/disable functions.
 **/
WAT.module('$player',['JQuery','$assert','$playerConfig','Logger','$playerLang','$session','$refreshDaemon','$parser','$patterns','$templateManager','$utils','$handlersManager','ChromeInterface'],
	function($,$assert,$config,Logger,$lang,$session,$refreshDaemon,$parser,$patterns,$templateManager,$utils,$handlersManager,ChromeInterface){

// ------------------------------------------------------------//
// SETUP
//
	var $logger = new Logger('$player');
	/** Public scope  **/
	var service  = {};
	/** Private scope **/
	var _private = {};

// ------------------------------------------------------------//
// PRIVATE: SET UP THE REFRESH DAEMON:
//
		/** Set up the refresh daemon for the player plugin refresh **/
		_private.startPlayerRefresh = function(){
			// Setup the refresh daemon
			$refreshDaemon.ignoreClassMutation($config.appElementClass);
			$refreshDaemon.addTask(_private.refresh);
		};
		/** Remove the player plugin refresh call **/
		_private.stopPlayerRefresh = function(){
			$refreshDaemon.removeFromIgnoreClass($config.appElementClass);
			$refreshDaemon.removeTask(_private.refresh);
		};

// ------------------------------------------------------------//
// PRIVATE PLUGIN ACTIONS:
//
		/** Setup **/
		_private.enabled = false; // Whether the plugin is enabled or not.
		_private.templateLoaded = false;  // Whether the template has been loaded or not.

		/** Define what happens when the plugin starts **/
		_private.start = function(){
			if(_private.enabled) return;
			_private.enabled = true;

			// Look for a template:
			_private.getTemplateForThisSite().done(function(template){
				// Template found
				_private.loadTemplate(template).done(function(){
					// Template loaded
					_private.templateLoaded = true;
					_private.startTools(); // Initialize all the tools.
					_private.startPlayerRefresh(); // Initialize refresh daemon
				});
			}).fail(function(err){
				// Template not found, or couldn't log user:
				_private.templateLoaded = false;
				console.log(err);
				$logger.log(err);
				if(err && err.status == 401){
					alert($lang.get('login_not_final_user_error'))
				}
			});
		};

		/** Close the plugin **/
		_private.close = function(){
			if(!_private.enabled) return;
			_private.enabled = false;
			_private.templateLoaded = false;
			_private.closeTools(); // Close all the tools
			_private.stopPlayerRefresh(); // Stop the refresh daemon
			_private.unloadTemplate(); // Restore the HTML document as it was before.
		};

		/** Define what should happen on each refresh cycle, called by the refresh daemon
		 *  In this case: Refresh the patterns -> Refresh the parser -> Refresh the tools.
		 * **/
		_private.refresh = function(targets){
			var defer = $.Deferred();

			if(!_private.template || $config.player.playerRefreshInProgress) {
				// No template or another refresh in progress. Cancel this one:
				defer.resolve();
				return defer.promise();
			}

			// Do the refresh:
			$config.player.playerRefreshInProgress = true;
			$logger.log('Player refreshing');

			//Parse again looking for new elements...
			$patterns.refresh(targets).done(function(){
				// Patterns refreshed
				$parser.run().done(function(){
					// HTML Page has been parsed:
					// Refresh the tools again:
					_private.refreshTools(targets);
					$config.player.playerRefreshInProgress = false;
					defer.resolve();
				});
			});
			return defer.promise();
		};


		/** Look for a template related to this domain **/
		_private.getTemplateForThisSite = function(){
			var defer = $.Deferred();
			var domain = document.domain; // The current domain.
			// Trigger lookup event:
			$utils.trigger($config.player.events.template.lookup);
			// Look for template:
			$templateManager.getTemplateForSite(domain).done(function(template){
				// Trigger template found:
				$utils.trigger($config.player.events.template.found);
				defer.resolve(template);
			}).fail(function (err) {
				// Trigger template NOT found:
				$utils.trigger($config.player.events.template.not_found);
				defer.reject(err);
			});
			return defer.promise();
		};

		/** Load a template into this site **/
		_private.loadTemplate = function(template){
			var defer = $.Deferred();
			$logger.info("Loading template",template);
			_private.template = template;

			// Wait document ready:
			$(document).ready(function() {
				// Load the patterns.
				$patterns.fromString(template.data);
				// Look for the patterns fast with refresh:
				$patterns.refresh().done(function(){
					// Patterns loaded
					$parser.run().done(function(){
						// HTML Page has been parsed:
						$utils.trigger($config.player.events.parser.finish);
						defer.resolve();
					});
				});
			});
			return defer.promise();
		};

		/** Unload the template from the site **/
		_private.unloadTemplate = function(){
			var defer = $.Deferred();
			if(!_private.template){
				defer.resolve();
				return defer.promise();
			}
			var template = _private.template;
			// Do it async:
			var async = $utils.asAsync(function(){
				$logger.info("Unloading template",template);
				$parser.restore();
				$patterns.removeAllPatterns();
				$utils.trigger($config.player.events.parser.unloaded);
				defer.resolve();
			});
			async(); // Execute async
			return defer.promise();
		};


// ------------------------------------------------------------//
// PRIVATE PLUGIN TOOLS HANDLING
//
		/** Setup **/
		_private.toolsState   = {};		// Whether each tool is enabled or not.
		_private.tools 	 = {};  // Collection of tools.
		_private.doNotRequireTemplate = {}; // Tools that are allowed to be executed without template.


		/** Run all the tools **/
		_private.startTools = function(){
			for(var t in _private.tools)
				if(_private.toolsState[t]) // Only start it if enabled:
					_private.tools[t].tool.start();
		};
		/** Close all the tools **/
		_private.closeTools = function(){
			for(var t in _private.tools)
				_private.tools[t].tool.close(); // Close it anyway (without looking its state)
		};
		/** Call refresh on each tool **/
		_private.refreshTools = function(targets){
			for(var t in _private.tools) _private.tools[t].tool.refresh(targets);
		};

		/** Call it each time a tool toggle is triggered **/
		_private.toggleTool = function(key,value){
			var ableToStart = _private.templateLoaded || _private.doNotRequireTemplate[key];

			// Store the actual toggle value:
			_private.toolsState[key] = value;
			// Check whether to start the tool or not:
			if(ableToStart && value) _private.tools[key].tool.start();
			else _private.tools[key].tool.close();
			// Return the state:
			return _private.templateLoaded && value;
		};

// ------------------------------------------------------------//
// SET UP THE PUBLIC API:
//
		/** Enable the plugin **/
		service.enable = function(){
			$logger.log('Starting plugin');
			_private.start();
		};
		/** Disable the plugin **/
		service.disable = function(){
			$logger.log('Closing plugin');
			_private.close();
		};

		/** Define a new tool
		 *  Tool modules should call this function to be bounded into the player.
		 *  They must have declared 3 functions (start,close,refresh), that will be called when necessary.
		 *  the initWithoutTemplate params, allows the tool to be started regarding the template is not loaded.
		 *  **/
		service.bindTool = function (key,description,obj,initWithoutTemplate) {
			$assert.ok(typeof obj.start === 'function',"Object should have function called start to be defined as a player's tool");
			$assert.ok(typeof obj.close === 'function',"Object should have function called close to be defined as a player's tool");
			$assert.ok(typeof obj.refresh === 'function',"Object should have function called refresh to be defined as a player's tool");
			var defer = $.Deferred();
			_private.tools[key] = {
				key:key,
				description:description,
				tool:obj
			};
			if(initWithoutTemplate) _private.doNotRequireTemplate[key] = true;
			// Create chrome interface:
			service.createToggle(key,description,true,function(val){
				_private.toggleTool(key,val);
			}).done(function(previousValue){
				var state = _private.toggleTool(key,previousValue);
				defer.resolve(state);
			});
			$logger.log('Tool',key,'bounded');
			return defer.promise();
		};
		/** Remove the tool from the list of tools **/
		service.unbindTool = function (key) {
			$logger.log('Tool',key,'unbound');
			delete _private.tools[key];
			service.removeInterface(key);
		};
		/** Create a toggle button in the ChromeInterface **/
		service.createToggle = function (key,description,def,callback){
			var defer = $.Deferred();
			_private.interface.addToggle(key,description,def,callback);
			_private.interface.initialize().done(function(previousValues){
				// Return previous value if any or default value
				var value = typeof previousValues[key] !== 'undefined'? previousValues[key] : def;
				defer.resolve(value);
			});
			return defer.promise();
		};
		/** Remove a toggle or entry button in the ChromeInterface **/
		service.removeInterface = function (key){
			_private.interface.remove(key);
			_private.interface.initialize();
		};

// ------------------------------------------------------------//
// SET UP THE CHROME INTERFACE (a popup that is displayed under the chrome plugin icon)
//
		/** Initialize the chrome interface for the player plugin **/
		_private.setUpChromeInterface = function(){
			// Create the Chrome interface
			_private.interface = new ChromeInterface();

			_private.interface.addToggle("enablePlayer",$lang.get('enable'),true,
				function(val){ if(val) service.enable(); else service.disable(); });

			//_private.interface.addEntry("entry1","Test 1",function(){console.log('hola')});
			//_private.interface.addToggle("entry4","Test 3",true,function(val){console.log(val)});
			// Call init
			_private.interface.initialize().done(function(previousValues){
				// Check whether the plugin should be enabled:
				if(typeof previousValues["enablePlayer"] === 'undefined' || previousValues["enablePlayer"] === true)
					service.enable();
			});

		};
		/** This must be called only once **/
		_private.setUpChromeInterface();

	return service;
});


