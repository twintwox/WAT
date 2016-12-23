/**
 * Shortcuts Tool:
 *
 * Tools are modules loaded by the $player only after a template has been installed successfully on the client.
 * The tool must call the $player.bindTool function in order to be called, and must contain the public functions
 * start, close and refresh.
 *
 * Start will be called after the template installation.
 * Close will be called if the player is turned down.
 * Refresh will be called each time new patterns are found and after the parser run.
 *
 * In this case, the  ShortcutsTool provides an index that is added at the beginning of the HTML document with
 * internal links that reference into some elements of role "region" (or similar). When one of these internal links are
 * pressed (using the enter key) the focus of the document will be send to the referenced element.
 *
 * The parser will add a class called "wat-direct-access" on those elements that will be added into the shortcuts index.
 ***/

WAT.module('$shortcutsTool',['JQuery','$playerConfig','$playerLang','$utils','Logger','$player','$navigationTool'],function($,$config,$lang,$utils,Logger,$player,$navigationTool){

// ------------------------------------------------------------//
// SETUP
//
	var $logger = new Logger('$shortcutsTool');
	/** Public scope **/
	var service = {};
	/** Private scope **/
	var _private = {};

// ------------------------------------------------------------//
// PRIVATE
//
	/** Setup templates**/
	_private.shortcutsIndex = $.parseHTML('<wat role="navigation" aria-label="Accesos directos"></wat>');
	_private.startPageReferencePoint = $.parseHTML('<span class="wat-navigate" tabindex="0">Inicio del documento</span>')
	_private.endPageReferencePoint = $.parseHTML('<span class="wat-navigate" tabindex="0">Final del documento</span>')

	/** Update the shortcuts index with any new value **/
	_private.updateShortcutsIndex = function (){
		$logger.log($('.wat-direct-access'));
		$('.wat-direct-access').each(function(){
		// For each element with direct access enabled:

			if($(this).data('wat-shortcutCreated')) return;
			// Add link for element in the shortcutsIndex:

			////////////
			// Get name for the link:
			var linkText = $(this).attr('wat-direct-access-name');
			if(typeof linkText === 'undefined' || (linkText.replace(/ /g,'')).length == 0)
				linkText = $utils.getSpeechTextForElement(this);

			var goToText = $lang.get('shortcut_name_prefix')+' '+linkText;

			////////////
			// Create link:
			var uniqueId = $(this).attr('id') || "wat-internal-link-"+Date.now()+'-'+(Math.round(Math.random()*1000));

			// Add origin:
			var origin = $.parseHTML('<a>'+goToText+'</a>');
			$(origin).addClass($config.appElementClass).attr('wat-reference','#'+uniqueId).addClass('wat-navigate');
			$(_private.shortcutsIndex).append(origin);

			// Add destiny:
			//var destiny = $.parseHTML('<a>'+linkText+'</a>');
			//$(destiny).addClass($config.appElementClass)
			$(this).attr('id',uniqueId);

			$(this).data('wat-shortcutCreated',true);
			//$(element).before('<span style="height: 1px;overflow: hidden;position: absolute;width: 1px;"id="'+id+'">'+msg+'</span>');
		});
	};

	/** Append the shortcut index into the HTML document **/
	_private.appendShortcutsIndex = function (){
		$('body').first().prepend(_private.shortcutsIndex);
		$('body').first().prepend(_private.startPageReferencePoint);
		$('body').first().append(_private.endPageReferencePoint);
	};
	/** Remove the shortcut index from the HTML document **/
	_private.removeShortcutsIndex = function (){
		$(_private.shortcutsIndex).detach();
	};

	/** On keyDown over a link index callback:
	 *  When user press enter over an index, focus should move to the element that the index is referencing.
	 * **/
	_private.onLinkTriggered = function(e){
		if(e.keyCode == 13){
			$logger.log('Navigation link',e);
			var link = e.target;
			var reference = $($(link).attr('wat-reference')).first()[0];
			$navigationTool.moveTo(reference,true);
			console.log(reference);
			$(reference).focus();
		}
	};


// ------------------------------------------------------------//
// PUBLIC API, REQUIRED BY THE PLAYER
//
	/** On Start **/
	service.start = function(){
		_private.updateShortcutsIndex();
		_private.appendShortcutsIndex();
		$(_private.shortcutsIndex).on('keydown','a',_private.onLinkTriggered);
	};
	/** On close **/
	service.close = function(){
		$(_private.shortcutsIndex).off('keydown','a',_private.onLinkTriggered);
		_private.removeShortcutsIndex();
	};
	/** On refresh: Update the shorcuts index **/
	service.refresh = function(){
		_private.updateShortcutsIndex();
	};

	/** Bind tool into the player **/
	$player.bindTool('$shortcutsTool',$lang.get('shortcuts_tool_name'),service);

	return service;
});