/**
 * Configuration params for the player plugin
 * **/
WAT.module('$playerConfig', ['$config'], function($config){

	$config.chromeInterfaceStorage = 'WAT_PLAYER_INTERFACE';
	$config.player = {
		userStoreKey : 'wat_player_userData',
		events: {
			// Define those events that are going to be triggered and intercepted by tools
			template: {
				lookup: 	'wat-template-lookup',
				found: 		'wat-template-found',
				not_found:  'wat-template-not-found',
			},
			parser: {
				finish: 	'wat-parser-finished',
				unloaded:	'wat-parser-unloaded'
			},
			navigation: {
				backward: 	'wat-nav-backward',
				forward: 	'wat-nav-forward',
				previous: 	'wat-nav-previous',
				next: 		'wat-nav-next',

				expand:		'wat-nav-expand',
				collapse:	'wat-nav-collapse',
				limitReached:'wat-nav-limitReached',

				focus:		'wat-nav-focus',
			},
			commands: {
				login_form: 'wat-cmd-login',
				tools_form: 'wat-cmd-tools'
			}
		}
	};

	return $config;
});
 