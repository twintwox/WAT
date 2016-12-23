/**
 * Project Manager module
 * This is used by the toolbarSetUp module to handle all the project related actions, like initalize a new project,
 * restore it from the session, save it, etc.
 *
 * In this module you can find the creation of all the form dialogs that are shown to the user when creating and editing a
 * project.
 * **/
WAT.module('$projectManager',['JQuery','$editorConfig','$editorLang','$toolbar','Logger','LoadingMsg','$session','$server','$dialogs','$patterns','$patternsEditor'],
	function($,$config,$lang,$toolbar,Logger,LoadingMsg,$session,$server,$dialogs,$patterns,$patternsEditor){

// ------------------------------------------------------------//
// SETUP
//
	var $logger = new Logger('$projectManager');
	var service = {};
	var _private = {};


// ------------------------------------------------------------//
// Project class
// Handles the logic of a single project management.
//

	var Project = function(){
		this.storeId = '$projectManager_project';
		return this;
	};
	Project.prototype.initialize = function(user,props){
		var defer = $.Deferred();
		this.id = props.id || -1;
		this.author = user.id;
		this.alias = props.alias || "";
		this.domain = props.domain || document.domain;
		this.description = props.description || " ";
		this.lang = props.lang || user.lang;
		this.date = props.date || new Date();

		// Load the patterns:
		var projectPatterns = props.data || '[]';
		var self = this;
		$patterns.fromString(projectPatterns);
		// Make a heavy lookup of patterns using findPatternsInDOM
		$patterns.findPatternsInDOM().done(function(){
			$logger.log('Project initialized');
			self.save();
			defer.resolve(self);
		});
		return defer.promise();
	};
	Project.prototype.update = function(props){
		$.extend(this,props);
		$logger.log('Project updated');
		this.save();
		return this;
	};
	Project.prototype.save = function(){
		var store = this.export();
		delete store.data;
		$session.save(this.storeId,$session.asPersistentObject(store));
		$logger.log('Project saved',store);
		return this;
	};
	Project.prototype.load = function(){
		var defer = $.Deferred();
		var self = this;
		var user = $server.getUser();
		var project = $session.get(this.storeId);

		if(!user || !project){
			defer.reject();
		}else{
			var data = $patterns.stringify();
			project.data = data;
			this.initialize(user,project).done(function(){
				$logger.log('Project loaded',self.export());
				defer.resolve();
			});
		}
		return defer.promise();
	};

	Project.prototype.destroy = function(){
		$session.remove(this.storeId);
		$logger.log('Project deleted');
	};
	Project.prototype.export = function(){
		return {
			id: this.id,
			author: this.author,
			alias: this.alias,
			description: this.description,
			domain: this.domain.url || this.domain,
			data: $patterns.stringify() || '[]',
			date: this.date,
			lang: this.lang
		}
	};


// ------------------------------------------------------------//
// PRIVATE SCOPE
// Stores the form dialog creation for each instance of the project management.
// as well as the Server queries to get the project information related to the current domain.
//

	/** Creates and shows the loading dialog **/
	_private.showLoading = function(msg){
		_private.dialogFinished = false;
		_private.loadingDialog = $dialogs.getDialog('loading-dialog',$lang.get('loading'));
		_private.loadingDialog.onClose(_private.checkDialogFinished);
		_private.loadingDialog.addText(msg);
		_private.loadingDialog.addErrorBox(1);
		_private.loadingDialog.initialize().display();
	};

	/** Hides the loading dialog **/
	_private.hideLoading = function(){
		_private.dialogFinished = true;
		_private.loadingDialog.hide();
	};

	/** Displays an error in the loading dialog **/
	_private.showErrorInLoading = function(msg){
		_private.loadingDialog.showError(1,msg);
	};

	/** Creates and shows the login form dialog **/
	_private.requireLoginForm = function(){
		// Show login dialog
		var defer = $.Deferred();
		var form = $dialogs.getForm('init-session',$lang.get('login_form_title'));
		form.onClose(_private.checkDialogFinished);
		_private.dialogFinished = false;

		form.startColumnBox()
			.addLabel($lang.get('username_label'))
			.addInput({name: 'user' , placeholder: $lang.get('username_pl') ,type: "email"})
			.closeBox();

		form.startColumnBox()
			.addLabel($lang.get('password_label'))
			.addInput({name: 'pass' ,type: "password"})
			.closeBox();

		form.startColumnBox()
			.addLink({href:$server.getServerUlr()+'#/register',},$lang.get('register_link'))
			.closeBox();

		form.startColumnBox()
			.addErrorBox(1)
			.closeBox();

		form.addButton($lang.get('init_session_btn'),function(f){
			form.clearError(1);
			var values = f.getValues();
			var userData = {};
			userData.email = values['user'];
			userData.password = values['pass'];
			$server.login(userData).done(function(user){
				if(user.type !== $config.volunteerUser){
					$server.logout().done(function(){
						defer.reject();
					});
					form.showError(1,$lang.get('login_fail_not_volunteer_error'));
					$logger.warn("Login failed","Not a volunteer user");
				}else{
					_private.dialogFinished = true;
					form.hide();
					defer.resolve(user);
				}
			}).fail(function(err){
				$server.logout().done(function(){
					defer.reject();
				});
				form.showError(1,$lang.get('login_fail_error'));
				$logger.warn("Login failed",err);
			});
		});
		form.initialize().display();
		return defer.promise();
	};

	/** Creates and shows the logout form **/
	_private.logoutForm = function(){
		var defer = $.Deferred();
		var form = $dialogs.getForm('logout-session',$lang.get('logout_form_title'));

		form.startColumnBox()
			.addLabel($lang.get('logout_session_msg'))
			.addText($server.getUser().email)
			.closeBox();

		form.addButton($lang.get('logout_session_btn'),function(f){
			$server.logout().done(function(){
				defer.resolve();
				form.hide();
			}).fail(function(){
				defer.reject();
				form.hide();
			});
		});
		form.initialize().display();
		return defer.promise();

	};

	/** Creates and shows the select project form dialog **/
	_private.selectProjectForm = function(){
		// Show templates dialog
		_private.showLoading($lang.get('loading_dialog_text'));
		var defer = $.Deferred();
		$server.get('Template?sort=domain DESC&where={"author":"'+$server.getUser().id+'"}')
			.done(function(templatesFromServer){
				$logger.log(templatesFromServer);
				templatesFromServer = templatesFromServer || [];
				var form = $dialogs.getForm('show-templates',$lang.get('templates_form_title'));

				form.addText($lang.get('template_form_head_text'));
				var map = {};
				for(var i = 0; i<templatesFromServer.length;i++){
					// For each template received from server
					var template = templatesFromServer[i];
					// Check that the template domain match the current domain:
					if (document.domain !== template.domain.url) continue;
					map[template.id] = template;
					var props = {type:'radio',id:'wat_temp_radio'+i,name:'templateId',value:template.id};
					// Add a radio button with the values of the template:
					form.startRowBox()
						.addInput(props)
						.addSpace()
						.addLabel([template.alias,' (',template.domain.url,')'].join(''),'wat_temp_radio'+i)
						.closeBox();
				}
				// Add an extra radio button for creating a new template:
				form.startRowBox()
					.addInput({checked:true, type:'radio',id:'wat_temp_radio'+templatesFromServer.length,name:'templateId',value:-1})
					.addSpace()
					.addLabel($lang.get('create_new_template'),'wat_temp_radio'+templatesFromServer.length)
					.closeBox();

				// Add SELECT button for finish the form:
				form.addButton($lang.get('template_form_select_btn'),function(f){
					var values = f.getValues();
					var user = $server.getUser();
					if(!user) defer.reject("No user");

					var properties = (values.templateId+'' === '-1')? {} : map[values.templateId];
					var project = new Project();
					var msg = new LoadingMsg(); // Do an async task
					msg.initialize($lang.get('loading_template_msg'));
					msg.show();
					project.initialize(user,properties).done(function(){
						msg.hide();
					});
					_private.dialogFinished = true;
					form.hide();
					defer.resolve(project);
				});

				// Hide loading and show form:
				_private.hideLoading();
				_private.dialogFinished = false;
				form.onClose(_private.checkDialogFinished);
				form.initialize().display();
			}).fail(function(res){
				_private.showErrorInLoading($lang.get('loading_error_msg'));
				defer.reject(res);
			});
		return defer.promise();
	};

	/** Creates and shows the edit project form dialog **/
	_private.editProjectForm = function(project){
		// Show edit project dialog
		var defer = $.Deferred();
		var form = $dialogs.getForm('edit-tempalte',$lang.get('edit_form_title'));
		// Language
		form.startColumnBox()
			.addLabel($lang.get('template_lang_label'))
			.addInput({name: 'lang', value: project.lang})
			.closeBox();
		// Alias
		form.startColumnBox()
			.addLabel($lang.get('template_alias_label'))
			.addInput({name: 'alias' , placeholder: $lang.get('template_alias_pl') ,type: "text", value: project.alias || ''})
			.closeBox();
		// Domain
		form.startColumnBox()
			.addLabel($lang.get('template_domain_label'))
			.addInput({name: 'domain', disabled: true, value: (project.domain.url || project.domain)})
			.closeBox();
		// Description
		form.startColumnBox()
			.addLabel($lang.get('template_description_label'))
			.addTextarea({name: 'description'},project.description)
			.closeBox();
		// Data
		form.startColumnBox()
			.addLabel($lang.get('template_data_label'))
			.addTextarea({name: 'data' , disabled: true }, (project.data || $lang.get('template_data_pl')) )
			.closeBox();

		form.addButton($lang.get('save'),function(f){
			var values = f.getValues();
			if(values.data === $lang.get('template_data_pl')) delete values.data;
			form.hide();
			defer.resolve(values);
		});

		form.initialize().display();
		return defer.promise();
	};

	/** Callback used to close the toolbar in case the form hasn't been finished **/
	_private.checkDialogFinished = function(){
		// What happens if any dialog is close before finish:
		if(!_private.dialogFinished) $toolbar.goBack();
	};

// ------------------------------------------------------------//
// Public API
// Public methods for the project management.
//

	/** Restart the project **/
	service.init = function(){
		_private.project = null;
		$logger.log('Project manager init');
	};

	service.getSessionForm = function(){
		$server.loggedIn($config.volunteerUser).done(function(isLoggedIn){
			if(isLoggedIn) _private.logoutForm();
			else _private.requireLoginForm();
		});
	};

	/** Displays the logic form if necessary, then shows the project selection form **/
	service.startProject = function(){
		service.init();
		var defer = $.Deferred();
		$server.loggedIn($config.volunteerUser).done(function(isLoggedIn){
			if(!isLoggedIn){
				// Require login.
				_private.requireLoginForm().done(function(){
					// Select template as a project
					_private.selectProjectForm().done(function(selectedProject){
						_private.project = selectedProject;
						defer.resolve();
					})
						.fail(function(){
							$server.logout().done(function(){
								defer.reject();
							});
						});
				})
					.fail(function(){
						defer.reject();
					});
			}else{
				// If already logged in, just select template
				_private.selectProjectForm().done(function(selectedProject){
					_private.project = selectedProject;
					defer.resolve();
				}).fail(function(){
					$server.logout().done(function(){
						defer.reject();
					});
				});
			}
		});
		return defer.promise();
	};

	/** Closes the current project, deleting it from the session data. **/
	service.closeProject = function(){
		$logger.log('Closing previous project');

		var defer = $.Deferred();
		if(_private.edited){
			// Show close without saving alert
		}
		// Clear project
		if(_private.project){
			_private.project.destroy();
			delete _private.project;
		}
		$patternsEditor.removeAllHighlights();
		$patterns.removeAllPatterns();
		$toolbar.destroy();

		defer.resolve();
		return defer.promise();
	};

	/** Displays the project edition form  **/
	service.editProject = function(){
		var defer = $.Deferred();
		var project = service.getProject();
		if(project.data === "[]") delete project.data;
		_private.editProjectForm(project).done(function(newValues){
			_private.project.update(newValues);
			_private.edited = true;
			defer.resolve();
		});
	};

	/**  Saves the current project on the SERVER **/
	service.saveProject = function(){
		var project = service.getProject();
		// Create save form:
		var form = $dialogs.getDialog('save-dialog',$lang.get('save_template_title'));
			form.addText($lang.get('save_template_body'));
		// Add SAVE button
		form.addButton($lang.get('save'),function(f){
			$logger.log('Saving project');

			// Check data not empty:
			project.data = project.data || "[]";

			// Set url for create or update method:
			var url;
			if(project.id+'' === '-1'){
				// Create template:
				url = 'Template';
				delete project.id;
			}else{
				// Update template:
				url = 'Template/'+project.id;
			}

			form.hide();
			_private.showLoading($lang.get('loading_save_text'));
			$server.post(url,project).done(function(savedProject){
				_private.project.update({id:savedProject.id});
				_private.hideLoading();
			}).fail(function(err){
				$logger.error('Saving project error',err);
				//if(err.status === 401){ // Unauthorized, try to log again:
					$server.logout().done(function(){
						_private.hideLoading();
						_private.requireLoginForm().done(function(){
							service.saveProject();
						}).fail(function(){
							_private.showLoading($lang.get('loading_save_text'));
							_private.showErrorInLoading($lang.get('save_fail_msg'));
						});
					});
				//}else{
				//	_private.showErrorInLoading($lang.get('save_fail_msg'));
				//};
			});
		});
		// Add CANCEL button
		form.addButton($lang.get('cancel'),function(f){
			form.hide();
		});
		form.initialize().display();
	};

	/** Download the current project info as a text document **/
	service.downloadProject = function(){
		var reader = new FileReader();
		reader.onload = function (event) {
			var save = document.createElement('a');
			save.href = event.target.result;
			save.target = '_blank';
			save.download =  (service.getProject().alias? $config.prefix+service.getProject().alias+'.txt' : $config.defaultDownloadName);
			var clicEvent = new MouseEvent('click', {
				'view': window,
				'bubbles': true,
				'cancelable': true
			});
			save.dispatchEvent(clicEvent);
			(window.URL || window.webkitURL).revokeObjectURL(save.href);
		};
		reader.readAsDataURL( new Blob([JSON.stringify(service.getProject())],{type: 'text/plain'}));

	};

	/**  Whether there is a current project laded or not **/
	service.hasProject = function(){
		return _private.project != null;
	};
	/**  Returns the exported project  **/
	service.getProject = function(){
		return  _private.project && _private.project.export();
	};

	/** Tries to restore a project from the Session **/
	service.restore = function(){
		var defer = $.Deferred();
		var project = new Project();
		project.load().done(function(){
			_private.project = project;
			defer.resolve(true);
		}).fail(function(){
			$logger.log('No project loaded');
			defer.resolve(false);
		});
		return defer.promise();
	};

		return service;
});

