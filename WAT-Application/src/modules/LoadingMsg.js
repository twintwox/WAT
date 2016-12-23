/**
 * This module provides a full screen message.
 * It can be used in 2 ways:
 *
 * 	1- Provide a full screen message while performing an action (by using the DO function).
 *  2- Manage the display of the full screen message by using SHOW and HIDE functions.
 *
 * Several instance can be created.
 * **/

WAT.module('LoadingMsg',['JQuery','$config'],function($,$config){

	var LoadingMsg = function(){
	 	this.id = 'lmsg-'+Date.now();
	};

	/** Initialize the message and add the content to the DOM **/
	LoadingMsg.prototype.initialize = function(msg) {
		if(this.templ) this.remove();
		this.templ = $.parseHTML(['<div>',msg,'</div>'].join(''));

		// Add the app general class:
		$(this.templ)
			.attr('id',this.id)
			.attr('tabindex','0')
			.addClass($config.resetCssClass)
			.addClass($config.appElementClass)
			.addClass('wat-loading-msg');

		$('body').first().append(this.templ);
	};

	/** Show the full screen message while performing an action **/
	LoadingMsg.prototype.do = function(msg,f,context) {
		//Fn que recibe y ejecuta una funcion mientras despliega el mensaje
		var defer = $.Deferred();
		var loadingMsg = this;
		setTimeout(function(){
			loadingMsg.initialize(msg);
			loadingMsg.show();
			if(context) f.apply(context);
			else f();
			loadingMsg.hide();
			defer.resolve('Loading msg done');
		},300); // Delay a while just to show the msg correctly.
		return defer;
	};

	/** Show the full screen message **/
	LoadingMsg.prototype.show = function() {
		$(this.templ).fadeIn("fast");
		$(this.templ).focus();
	};

	/** Hide the full screen message **/
	LoadingMsg.prototype.hide = function() {
		$(this.templ).fadeOut("fast");
	};

	/** Remove the message from the DOM **/
	LoadingMsg.prototype.remove = function() {
		$(this.templ).detach();		
	};

	return LoadingMsg;
	
});
