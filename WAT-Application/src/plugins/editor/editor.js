/**
 * EDITOR:
 * This module initialize the environment for the editor plugin.
 * Setups the toolbar, refreshDaemon and ChromeInterface, as well as the the enable/disable functions.
**/

WAT.module('$editor',
	['JQuery','$editorConfig','$editorLang','Logger','$session','$server','$projectManager','$refreshDaemon','LoadingMsg','$patterns','$patternsEditor','$toolbar','$toolbarSetUp','ChromeInterface'],
	function($,$config,$lang,Logger,$session,$server,$projectManager,$refreshDaemon,LoadingMsg,$patterns,$patternsEditor,$toolbar,$toolbarSetUp,ChromeInterface){


// ------------------------------------------------------------//
// SETUP
//
		// Set the logger:
		var $logger = new Logger('Editor');
		// Set the public API:
		var service = {};
		// Set the private scope.
		var _private = {};
		_private.started = false;

// ------------------------------------------------------------//
// PRIVATE:
//
	/** Define what happens when the plugin starts **/
	_private.start = function(){
		if(_private.started) return;
		_private.started = true;

		// Load patterns
		$(document).ready(function(){
			var msg = new LoadingMsg(); // Do an async task
			msg.initialize($lang.get('loading_template_msg'));
			msg.show();
			// Restore preivous data:
			$server.restore();
			$projectManager.restore().done(function(projectRestored){
				// Start toolbar
				$toolbarSetUp.run(projectRestored);
				$toolbar.start();

				// Start daemon refresh
				_private.startEditorRefresh();

				// Show patterns
				$patternsEditor.highlight();
				msg.hide();
			});
		});
	};

	/** Close the plugin **/
	_private.close = function(){
		if(!_private.started) return;
		_private.started = false;
		$logger.log('Disabled');
		$toolbar.stop();
		$patternsEditor.stopHighlight();
		_private.stopEditorRefresh();
	};

	/** Define what should happen on each refresh cycle, called by the refresh daemon
	 *  In this case: Refresh the patterns -> Refresh the highlights
	 * **/
	_private.refresh = function(targets){
		var defer = $.Deferred();
		if(!$config.editor.editorRefreshInProgress) {
			// Start lock
			$config.editor.editorRefreshInProgress = true;
			// Refresh patterns
			$patterns.refresh(targets).done(function(patternsChanged){
				var currentPatterns = $patterns.get();
				// Check the patterns hasn't been deleted during refresh
				patternsChanged = $(patternsChanged).filter(function(key,obj){
					return typeof currentPatterns[obj.getId()] != 'undefined';
				});
				if(patternsChanged.length > 0)
					$patternsEditor.highlight(patternsChanged);

				defer.resolve();
			});
			// Release lock
			$config.editor.editorRefreshInProgress = false;
		}else{
			defer.resolve();
		}
		return defer.promise();
	};

// ------------------------------------------------------------//
// SET UP THE REFRESH DAEMON:
//
	/** Set up the refresh daemon for the editor plugin refresh **/
	_private.startEditorRefresh = function(){
		// Setup the refresh daemon
		$refreshDaemon.ignoreClassMutation($config.appElementClass);
		$refreshDaemon.ignoreClassMutation('jquery-postit-actions');
		$refreshDaemon.addTask(_private.refresh);
	};

	/** Remove the editor plugin refresh call **/
	_private.stopEditorRefresh = function(){
		$refreshDaemon.removeFromIgnoreClass($config.appElementClass);
		$refreshDaemon.removeFromIgnoreClass('jquery-postit-actions');
		$refreshDaemon.removeTask(_private.refresh);
	};

// ------------------------------------------------------------//
// SET UP THE PUBLIC API:
//

		service.enable = function(){
			$logger.log('Starting plugin');
			_private.start();
		};

		service.disable = function(){
			$logger.log('Closing plugin');
			_private.close();
		};


// ------------------------------------------------------------//
// SET UP THE CHROME INTERFACE (a popup that is displayed under the chrome plugin icon)
//
	/** Initialize the chrome interface for the editor plugin **/
	_private.setUpChromeInterface = function(){
		// Create the Chrome interface
		_private.interface = new ChromeInterface();
		_private.interface.addToggle("enableEditor",$lang.get('enable'),true,
			function(val){ if(val) service.enable(); else service.disable(); });

		// Call init
		_private.interface.initialize().done(function(previousValues){
			// Check whether the plugin should be enabled:
			if(typeof previousValues["enableEditor"] === 'undefined' || previousValues["enableEditor"] === true)
				service.enable();
		});
	};
	/** This must be called only once **/
	_private.setUpChromeInterface();


// ------------------------------------------------------------//
// Return the public API
//
		return service;
});
 