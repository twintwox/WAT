/**
 * Template Manager
 * Module that encapsulates the request to get the correct template for the site, as well as the final user login setup.
 * **/
WAT.module('$templateManager',['JQuery','$playerConfig','$server','Logger','$session','$playerForms'],function($,$config,$server,Logger,$session,$playerForms){


// ------------------------------------------------------------//
// SETUP
//
	var $logger = new Logger('$templateManager');
	/** Public scope **/
	var service = {};
	/** Private scope **/
	var _private= {};

// ------------------------------------------------------------//
// PRIVATE USER SETUP
//

	/** Save the user data used for the login **/
	_private.saveUserData = function(userData){
		return $session.save($config.player.userStoreKey,$session.asPersistentObject(userData),true);
	};

	/** Restore user data stored on the persistent storage **/
	_private.restoreUserData = function(){
		return $session.get($config.player.userStoreKey) || {};
	};

	/** Try to restore previous user data, or ask the user for  new one **/
	_private.getUserData = function(){
		var defer = $.Deferred();
		var userData = _private.restoreUserData();
		if(userData && userData.email && userData.password){
			defer.resolve(userData);
		}else{
			// Show user data form:
			$playerForms.showUserDataForm().done(function(newUserData){
				defer.resolve(newUserData);
			}).fail(function(err){
				defer.reject(err);
			});
		}
		return defer.promise();
	};

	/** Creates a new session to avoid forbidden error **/
	_private.getNewUserSession = function(){
		var defer = $.Deferred();
		$server.logout().done(function(){
			// User logged out
			_private.getUserData().done(function(userData){
				// User data found
				$server.login(userData).done(function(user){
					if(user.type !== $config.finalUser){
						// Login failed
						$logger.error("Login failed","Not a final user");
						_private.saveUserData({});
						defer.reject({status:401,msg:'Login failed, Not a final user'});
					}else{
						// User logged in, store user data used for login
						_private.saveUserData(userData);
						defer.resolve(user);
					}
				}).fail(function(err){
					// Login failed
					$logger.error(err);
					_private.saveUserData({});
					defer.reject({status:401,msg:'Login failed',err:err});
				});
			}).fail(function(err){
				// Couldn't get user data
				// Clear user data stored
				_private.saveUserData({});
				defer.reject({status:401,msg:'Login failed, no user data',err:err});
			});
		});
		return defer.promise();
	};

// ------------------------------------------------------------//
// PRIVATE TEMPLATE HANDLING
//
	/** Choose the best template from an array of templates
	 *  Rules are:
	 *  1- If the user has any of the templates installed, it will choose that one (he only can have 1 template installed per domain)
	 *  2- Else choose the template with better ranking -> (positive point - negative points)
	 * **/
	_private.chooseTemplate = function(user,templates){
		var max = -1;
		var selected;
		for(var i=0; i<templates.length;i++){
			// Check if user has the template installed:
			if(user.installedTemplates && user.installedTemplates[templates[i].id]) return templates[i];
			// Or choose the one with best points.
			var rank = templates[i].pp + templates[i].np;
			if(max < 0 || rank > max){
				max=rank;
				selected = templates[i];
			}
		}
		return selected;
	};

// ------------------------------------------------------------//
// PUBLIC API
//
	/** Create a new session and choose the best template to install on the domain **/
	service.getTemplateForSite = function(domain){
		var defer = $.Deferred();
		// Init session again to avoid forbidden error:
		_private.getNewUserSession().done(function(user){
			// New session created
			$server.post('Template/forDomain',{domain:domain,lang:user.lang}).done(function(res){
				// Templates request success

				if(res.length > 0){
					// Choose best template:
					var t = _private.chooseTemplate(user,res);
					defer.resolve(t);
				} else
					defer.reject({msg:'Failed getting Template. Request returned an empty response',res:res});

			}).fail(function(err){
				// Request failed
				$logger.error('ForDomain failed',err);
				defer.reject(err);
			});

		}).fail(function(err){
			// New session creation failed:
			defer.reject({status: err && err.status, msg:'Could not login user',err:err});
		});
		return defer.promise();
	};


	return service;
});


