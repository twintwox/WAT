/**
 * Labels Tool:
 *
 * Tools are modules loaded by the $player only after a template has been installed successfully on the client.
 * The tool must call the $player.bindTool function in order to be called, and must contain the public functions
 * start, close and refresh.
 *
 * Start will be called after the template installation.
 * Close will be called if the player is turned down.
 * Refresh will be called each time new patterns are found and after the parser run.
 *
 * In this case, the labels tool will look for those elements with the class "wat-labelledby" added by the parser,
 * in order to properly set the aria-labelledby attribute with a new value, in case the element didn't have one before.
 *
 * The tool will look for internal elements containing the role=heading attributes, or with a header or label tagName.
 * **/
WAT.module('$labelsTool',['JQuery','$playerConfig','$playerLang','$player'],function($,$config,$lang,$player){

// ------------------------------------------------------------//
// SETUP
//
	/** Public scope **/
	var service = {};
	/** Private scope **/
	var _private = {};

// ------------------------------------------------------------//
// PUBLIC API, REQUIRED BY THE PLAYER
//
	/** On start **/
	service.start = function(){
		_private.started = true;
		service.refresh();
	};
	/** On close **/
	service.close = function(){
		_private.started = false;
	};

	/** On Refresh: look for elements with class 'wat-labelledby' and without any aria-labelledby attribute
	 *  and define a value for it.
	 * **/
	service.refresh = function () {
		if(!_private.started)return;
		// Add labelledby attributes:
		$('.wat-labelledby').each(function(){
			if($(this).attr('aria-labelledby')) return;

			var heading = $(this).find('[role=heading]').first()[0] || $(this).find('h1,h2,h3,h4,h5,h6,label').first()[0] ;
			if(!$(heading).attr('id')){
				// Create a fake id if none:
				$(heading).attr('id',"wat-label-"+Date.now()+'-'+(Math.round(Math.random()*1000)));
			}
			$(this).attr('aria-labelledby',$(heading).attr('id'));
		});
	};

	/** Bind the tool into the player **/
	$player.bindTool('$labelsTool',$lang.get('labels_tool_name'),service);

	return service;
});
