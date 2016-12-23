/**
 * 	Other setups module:
 * 	In this module we include any kind of setups or configuration
 * 	to allow the application to work better with external applications like screen readers.
 * **/

WAT.module('$otherSetups',['$refreshDaemon'],function($refreshDaemon){

	// Exclude ChromeVox indicator changes from our refresh daemon.
		$refreshDaemon.ignoreClassMutation('cvox_indicator_region');
		$refreshDaemon.ignoreClassMutation('cvox_indicator_container');


	return {};

});
