/**
 * Toolbar Setup module
 *
 * This module binds all the Editor tools with the Editor Toolbar
 *
 * As the toolbar must by generated dynamically, this module encapsulates all the toolbar definition.
 * The $ROOT object contains each of the toolbar states and actions which are included inside the
 * toolbar module by using the generator function.
 *
 * **/

WAT.module('$toolbarSetUp',['$editorConfig','$editorLang','Logger','$toolbar','$grouperTool','$manageTool','$projectManager','$patterns','$patternsEditor','$server','$helpTool'],
	function($config,$lang,Logger,$toolbar,$grouperTool,$manageTool,$projectManager,$patterns,$patternsEditor,$server,$helpTool){


// ------------------------------------------------------------//
// SETUP
//

	var $logger = new Logger('$toolbarSetUp');
	var service = {};
	var _private = {};

// ------------------------------------------------------------//
// PUBLIC API:
//
		/** Run the toolbar loader **/
		service.run = function(projectRestored) {
			// Load the $toolbar using the generator fn and the $ROOT definition object.
			_private.generator("$ROOT", $ROOT);
			if(projectRestored){
				$toolbar.restore();
				if($toolbar.getCurrentState() !== "$WORKSPACE") $toolbar.setRootState('$ROOT');
			}else{
				$toolbar.setRootState('$ROOT');
			}
		};

// ------------------------------------------------------------//
// TOOLBAR GENERATOR:
// This function will recursively load the $toolbar states from a "definition" object.
//
		_private.generator = function(stateName,definition){
			$toolbar.onStateInit(stateName,definition.setUp);
			$toolbar.onStateClose(stateName,definition.beforeLeave);
			for ( var i = 0; i < definition.actions.length; i++ ){
				var action = definition.actions[i];
				action.state = stateName;
				$toolbar.buildTool(action);
				// Recursion
				if(action.transition)
					_private.generator(action.transition,action[action.transition]);
			}
		};

// ------------------------------------------------------------//
// Toolbar Definition object
// This object is send as a param for the generator function, to dynamically load the $toolbar.
//
//	Structure:
//
// $STATE_NAME: {
// 		setUp: A function to be called when this state starts
//		beforeLeave: A function to be called before closing this state
//		actions: An array that defines each button to be displayed on the toolbar when this state is active
//		[   /*  Action definition: */
// 			{
//				name: The string to use as the tooltip
//		 		icon: The font-awesome class to define the icon to be displayed on the button
//		 		transition (optional): String ID of the state to open after the action is triggered.
// 				(you should then provide an object that defines that state recursively using the "string ID" as the key)
//		 		callback: A callback function to be executed when the button is pressed
//	 		}
//		]
// }
//

	/** Define the root state **/
	var $ROOT = {

		/** Function called before displaying this state **/
		setUp: function(){
			$projectManager.closeProject();
		},

		/** Function called before leaving this state **/
		beforeLeave: function(){},

		/** Buttons to show in the toolbar when this state is active **/
		actions:[
			{
				name: $lang.get('session'),
				icon: 'fa-user',
				callback: function(){
					$projectManager.getSessionForm();
				}
			},
			{
				/** Define the name of the action (used for the tooltip) **/
				name: $lang.get('new_template'),
				/** Define the font-awesome css class to use as the button icon **/
				icon:'fa-file',

				/** Define the callback to be triggered when the button is pressed **/
				callback: function () {
					// Select a new project:
					$projectManager.startProject().done(function () {
						// Show edit dialog only if project is new
						if($projectManager.getProject().id === -1)
							$projectManager.editProject();

						// Load patterns
						$logger.log("Patterns are:",$patterns.get());
						$patternsEditor.highlight();
					})
				},
				/** Define the new state to go after the callback is executed (optional) **/
				transition:'$WORKSPACE',

				/** Define the new state **/
				$WORKSPACE:{
					/** RECURSION **/

					setUp: function(){
					},
					beforeLeave: function(){},
					actions:[
						{
							name: $lang.get('edit_template'),
							icon:'fa-pencil',
							callback: function () {
								$projectManager.editProject();
							}
						},
						{
							name: $lang.get('save_template'),
							icon:'fa-cloud-upload',
							callback: function () {
								$projectManager.saveProject();
							}
						},
						{
							name: $lang.get('download_template'),
							icon:'fa-download',
							callback: function () {
								$projectManager.downloadProject();
							}
						},
						{
							name: $lang.get('new_grouper'),
							icon:'fa-object-group',
							callback: function () {
								$grouperTool.start();
							},
							transition:'$GROUPER',
							$GROUPER:{
								setUp: function(){
									$logger.log('Start grouping');
								},
								beforeLeave: function(){
									$logger.log('Close grouping');
									$grouperTool.close();
								},
								actions:[
									{
										name: $lang.get('finish'),
										icon:'fa-check',
										callback: function () {
											$grouperTool.check();
											$toolbar.goBack();
										}
									},
									{
										name: $lang.get('help_tool'),
										icon:'fa-question-circle',
										callback: function () {
											$grouperTool.detachListeners();
											$helpTool.showHelpFor(['new_group_check','new_group_cancel']).done(function(){
												$grouperTool.attachListeners();
											});
										}
									}
								]
							}
						},
						{
							name: $lang.get('manage_tool'),
							icon:'fa-list',
							callback: function () {
								$manageTool.start();
							}
						},
						{
							name: $lang.get('help_tool'),
							icon:'fa-question-circle',
							callback: function () {
								$helpTool.showHelpFor(['edit_template','save_template','download_template','new_grouper','manage_tool','close_project']);
							}
						}
					]
				}
			},
			{
				name: $lang.get('help_tool'),
				icon:'fa-question-circle',
				callback: function () {
					$helpTool.showHelpFor(['session','new_template']);
				}
			}
		]
	};

	/** Return the public API **/
	return service;
});

