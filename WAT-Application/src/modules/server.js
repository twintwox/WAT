/**
 * Server Module
 * This module provides communication to our Server API.
 * **/

WAT.module('$server',['JQuery','$config','Logger','$session'],
	function($,$config,Logger,$session){


// ------------------------------------------------------------//
// SETUP
//
	var $logger = new Logger('$server');
	// URL of the server:
	var HOST_URL = window.location.protocol+"//transcoding.herokuapp.com/";


// ------------------------------------------------------------//
// Private scope
//
	var _private = {};

	/** Get the headers for each request: **/
	_private.getHeaders = function(){
		var headers = {};
		if(_private.user && _private.user.token){
			headers['Authorization'] = 'Bearer ' + _private.user.token;
		}
		return headers;
	};

	/** Do a request **/
	_private.request = function(url,method,data){
		if(!url)return;
		var headers = _private.getHeaders();
		var request = {
			url: HOST_URL+url,
			headers:headers,
			method:method || 'GET',
			data:data || {},
			context: document.body,
			crossDomain:true,
			timeout:15000
		};
		$logger.log(request);
		return $.ajax(request);
	};

	/** Do a request with cross site request forgery token **/
	_private.csrfRequest = function(url,method,data){
		if(!url)return;
		var defer = $.Deferred();
		data = data || {};
		//Get CSRF Token
		_private.request('csrfToken')
			.done(function(res){
				data['_csrf'] = res['_csrf'];
				_private.request(url,method,data)
					.done(function(res){defer.resolve(res);})
					.fail(function(err){
						if(err.status === 200) defer.resolve(err);
						defer.reject(err);
					})
			})
			.fail(function(){
				//CSRF token may be disabled, try request:
				_private.request(url,method,data)
					.done(function(res){defer.resolve(res);})
					.fail(function(err){
						if(err.status === 200) defer.resolve(err);
						defer.reject(err);
					})
			});
		return defer.promise();
	};

// ------------------------------------------------------------//
// Public scope
//
	var service = {};

	service.getServerUlr = function (){
		return HOST_URL;
	};
	/** GET request **/
	service.get =  function(url){
		return _private.csrfRequest(url);
	};
	/** POST request **/
	service.post =  function(url,data){
		return _private.csrfRequest(url,'POST',data);
	};
	/** DELETE requet **/
	service.delete =  function(url){
		return _private.csrfRequest(url,'DELETE');
	};
	/** UPDATE request **/
	service.update =  function(url,data){
		return _private.csrfRequest(url,'PUT',data);
	};
	/** Get the current session if any **/
	service.getSession = function(){
		return service.get('auth');
	};

	/** Do login **/
	service.login = function(user){
		var defer = $.Deferred();
		service.post('auth',user).done(function(res){
			if(!res.user) defer.reject(res);
			var user = {};
			user.id = res.user.id;
			user.lang = res.user.lang;
			user.name = res.user.name;
			user.email = res.user.email;
			user.token = res.token;
			user.type = res.user.userType;
			if(user.type === $config.finalUser){
				user.installedTemplates = {};
				// Create a hashmap for the installed templates:
				var t = res.user.installedTemplates;
				for(var i=0; i< t.length;i++){
					user.installedTemplates[t[i].id] = t[i];
				}
			}
			_private.user = user;
			service.persist();
			defer.resolve(service.getUser());
		}).fail(function(err){
			defer.reject(err);
		});
		return defer.promise();
	};
	/** Check if is logged in **/
	service.loggedIn = function(userType){
		var defer = $.Deferred();
		var userInfo = _private.user && _private.user.token;
		var typeMatch = userType?(_private.user && _private.user.type == userType) :true;
		if(typeMatch){
			defer.resolve(userInfo);
		}else{
			service.logout().done(function(){
				defer.resolve(false);
			});
		}
		return defer.promise();
	};

	/** Get the stored user **/
	service.getUser = function(){
		if(!_private.user) return null;
		var user = {};
		user.id = _private.user.id;
		user.lang = _private.user.lang;
		user.name = _private.user.name;
		user.email = _private.user.email;
		user.type = _private.user.type;
		if(_private.user.type === $config.finalUser)
			user.installedTemplates = JSON.parse(JSON.stringify(_private.user.installedTemplates));
		return user;
	};

	/** Do logout **/
	service.logout = function(){
		var defer = $.Deferred();
		_private.request('auth/logout','GET',{}).done(function(){
			defer.resolve();
			delete _private.user;
		}).fail(function(){
			defer.resolve();
			delete _private.user;
		});
		return defer.promise();
	};

// ------------------------------------------------------------//
// Persistent actions:
// To restore the module state each time user navigates:

	/** Persist the server data (user) **/
	service.persist = function(){
		var store = {
			user : {
				id: _private.user.id,
				lang: _private.user.lang,
				name: _private.user.name,
				email: _private.user.email,
				type: _private.user.type,
				token: _private.user.token
			}
		};
		$session.save('$server',$session.asPersistentObject(store),true);
	};

	/** Restore the server data (user) **/
	service.restore = function(){
		var stored = $session.get('$server');
		if(!stored) return;
		$.extend(_private,stored);
		$logger.log('Server restored',_private);
	};


	return service;

});

