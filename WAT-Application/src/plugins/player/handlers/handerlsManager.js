/**
 * Handlers Manager:
 * A module to encapsulate all the handlers in only one module, so the player only needs to import these module.
 * */
WAT.module('$handlersManager',['Logger','$elementFocusHandler','$loadingMsgHandler','$soundFeedbackHandler'],
	function(Logger,$elementFocusHandler,$loadingMsgHandler,$soundFeedbackHandler,$playerCommandsHandler){

	var $logger = new Logger('$handlersManager');

	$logger.log('Player handlers loaded');
	/** Return all the handlers as an array **/
	var handlers = [$elementFocusHandler,$loadingMsgHandler,$soundFeedbackHandler,$playerCommandsHandler];
	return handlers;
});