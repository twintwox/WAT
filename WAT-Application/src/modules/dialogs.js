/**
 * Provides a dialogs service with 2 variants.
 * 1- A simple modal dialog for showing messages.
 * 2- A form modal dialog that allows inputs from the user.
 *
 * We can define some extra style properties in the dialogs.css
 * ***/

WAT.module('$dialogs',['JQuery','$config'],function($,$config){


// ------------------------------------------------------------//
// SETUP:
// Since we are using jquery_ui library for this module we defined a namespace to avoid the jquery_ui to alter other
// elements from the DOM. Please DO NOT CHANGE the jquery_ui_scope value
//
	// DO NOT CHANGE: Jquery_ui namespace value:
	var jquery_ui_scope = ' wat-ui-dialog ';
	var initConf = {
		dialogClass	: [$config.appElementClass,$config.resetCssClass,jquery_ui_scope].join(' '),
		autoOpen	: false,
		width		: 450,
		modal		: true,
		close		: function(){},
		beforeClose: function() {
			$('.wat-ui-dialog-background').detach();
		}
	};
//
//


// ------------------------------------------------------------//
// ABSTRACT DIALOG
// An abstract class to define some common function of simple dialogs and form
//
	var AbstractDialog = function(){
		this.background = $.parseHTML('<div class="wat-ui-dialog-background"></div>')
		this.dialog;
		this.DOMDialog;
		this.elements;
		this.conf = {};
		return this;
	};
	AbstractDialog.prototype.initialize = function() {
		this.dialog = $( this.DOMDialog ).dialog( this.conf );
		return this;
	};
	AbstractDialog.prototype.settings = function(settings) {
		$.extend(this.conf,settings);
		return this;
	};
	AbstractDialog.prototype.display = function() {
		$('body').append(this.background);
		this.dialog.dialog( "open" );
		return this;
	};
	AbstractDialog.prototype.hide = function() {
		this.dialog.dialog( "close" );
		return this;
	};
	AbstractDialog.prototype.setHtml = function(html) {
		this.DOMDialog = html;
		return this;
	};
	AbstractDialog.prototype.onClose = function(fn) {
		this.conf.close = fn;
		return this;
	};
	AbstractDialog.prototype.addElement = function(element) {
		this.elements.push(element);
		return this;
	};
	AbstractDialog.prototype.getElements = function() {

		return this.elements;
	};
	AbstractDialog.prototype.initElements = function() {

		this.elements =[];
	};
	AbstractDialog.prototype.stringifyProperties = function(properties){
		var prop = [];
		for(key in properties){
			//if(key=='id'   ) properties[key] = this.id+'_'+properties[key];
			if(key=='class') properties[key] = this.class+' '+properties[key];
			prop.push( key+'="'+properties[key]+'"' );
		}
		if(!properties.class) prop.push('class="'+this.class+'"');
		return prop.join(' ');
	};
	AbstractDialog.prototype.addLink = function(properties,text) {
		this.addElement( ['<a ',this.stringifyProperties(properties),' >',text,'</a>'].join('') );
		return this;
	};
	AbstractDialog.prototype.addImage = function(properties) {
		this.addElement( ['<img ',this.stringifyProperties(properties),' ></img>'].join('') );
		return this;
	};
	AbstractDialog.prototype.addText = function(text) {
		this.addElement( ['<p>',text,'</p>'].join('') );
		return this;
	};
	AbstractDialog.prototype.addErrorBox = function(id) {
		this.addElement( ['<p class="wat-dialog-error" id="dialog_error_',id,'"></p>'].join('') );
		return this;
	};

	AbstractDialog.prototype.addCode = function(code) {
		this.addElement( ['<code class="prettyprint">',code,'</code>'].join('') );
		return this;
	};
	AbstractDialog.prototype.setButtons = function(buttons) {
		this.conf.buttons = buttons;
		return this;
	};

	AbstractDialog.prototype.clearError = function(id) {
		$(this.DOMDialog).find("#dialog_error_"+id).text('');
		return this;
	};
	AbstractDialog.prototype.showError = function(id,msg) {
		$(this.DOMDialog).find("#dialog_error_"+id).text(msg);
		return this;
	};


// ------------------------------------------------------------//
// FORM DIALOG
// Provides a form modal dialog to show to the user
//
	var FormDialog  = function(name,title){
		this.title 	= title;
		this.name 	= name;
		this.id 	= $config.prefix+'FormDialog_'+name+'_'+Date.now();
		this.class 	= this.id+'_item';
		this.initElements();
	};
	FormDialog.prototype = new AbstractDialog();
	FormDialog.prototype.super = function(f,parameters) {
		return (this.__proto__.__proto__)[f].apply(this,parameters);
	};
	FormDialog.prototype.initialize = function() {
		var html = $.parseHTML([ '<form id="',this.id,'" title="',this.title,'">',this.elements.join(' '),'</form>'].join(''));
		this.setHtml(html);
		this.setButtons(this.buttons);
		this.super('initialize');
		return this;
	};
	FormDialog.prototype.display = function() {
		this.super('display');
		// Initialize events
		if(this.onChangeFn) {
			// Enable change callback
			$('#' + this.id).on('change','*', this.onChangeFn);
		}
		// Initialize jquery-ui features
		$('.wat-dialog-selectable-list').selectable();
		$('.wat-dialog-sortable-list').sortable();
		return this;
	};
	FormDialog.prototype.hide = function() {
		if(this.onChangeFn){
			// Disable change callback
			$('#' + this.id).off('change','*',this.onChangeFn);
		}
		this.super('hide');
		return this;
	};
	FormDialog.prototype.onInputChanged = function(fn){
		this.onChangeFn = fn;
		return this;
	};
	FormDialog.prototype.getFormBody = function(){
		return $('#' + this.id);
	};

	FormDialog.prototype.addHelp = function(helpText) {
		this.addElement( ['<span class="fa fa-question-circle wat-dialog-help" title="',helpText,'"></span>'].join('') );
		return this;
	};
	FormDialog.prototype.addInput = function(properties) {
		var checked ='';
		if(properties.type == 'checkbox' && properties.value) checked = 'checked';
		this.addElement( ['<input ',this.stringifyProperties(properties),' ',checked,'/>'].join('') );
		return this;
	};

	FormDialog.prototype.addSelect = function(properties,options,selected) {
		var parsedOptions = [];
		var s='';
		for(var o in options){
			s='';
			if(o==selected) s = 'selected';
			parsedOptions.push(['<option value="',o,'" ',s,'>',options[o],'</option>'].join(''));
		}
		this.addElement( ['<select ',this.stringifyProperties(properties),'>',parsedOptions.join(''),'</select>'].join('') );
		return this;
	};
	FormDialog.prototype.addList= function(properties,listItems) {
		var parsedListItems = [];
		for(var li in listItems){
			var item = listItems[li];
			var itemProperties = item.properties || {};
			item.properties.class = (item.properties.class || "") + " wat-dialog-listitem";
			parsedListItems.push(['<li ',this.stringifyProperties(itemProperties),'>',item.text,'</li>'].join(''));
		}

		var listClass = "";
		if(properties.selectable) listClass+=" wat-dialog-selectable-list";
		if(properties.sortable) listClass+=" wat-dialog-sortable-list";
		delete properties.selectable;
		delete properties.sortable;
		properties.class = [(properties.class || ''),listClass,'wat-dialog-list'].join(' ');
		this.addElement( ['<ol ',this.stringifyProperties(properties),'>',parsedListItems.join(''),'</ol>'].join(''));
		return this;
	};

	FormDialog.prototype.addTextarea = function(properties,text) {
		this.addElement( ['<textarea ',this.stringifyProperties(properties),'>',text,'</textarea>'].join('') );
		return this;
	};
	FormDialog.prototype.addLabel = function(text,forId) {
		if(forId)
			this.addElement( ['<label for="',forId,'">',text,'</label>'].join('') );
		else
			this.addElement( ['<label>',text,'</label>'].join('') );
		return this;
	};
	FormDialog.prototype.addBreak = function() {
		this.addElement( '<br/>' );
		return this;
	};
	FormDialog.prototype.addSpace = function() {
		this.addElement( '&nbsp;' );
		return this;
	};
	FormDialog.prototype.startRowBox = function(properties) {
		properties = properties || {};
		properties.class = (properties.class || '')+" wat-dialog-box wat-dialog-box-row";
		this.addElement( '<div '+ this.stringifyProperties(properties)+'>' );
		return this;
	};
	FormDialog.prototype.startColumnBox = function(properties) {
		properties = properties || {};
		properties.class = (properties.class || '')+" wat-dialog-box wat-dialog-box-column";
		this.addElement( '<div '+ this.stringifyProperties(properties)+'>' );
		return this;
	};
	FormDialog.prototype.closeBox = function() {
		this.addElement( '</div>' );
		return this;
	};
	FormDialog.prototype.addButton = function(name,aFunction) {
		if(!this.buttons) this.buttons = {};
		var d = this;
		this.buttons[name] = function(){aFunction(d)};
		return this;
	};


	FormDialog.prototype.startList = function(settings) {
		var listClass = "";
		if(settings.selectable) listClass+=" wat-dialog-selectable-list";
		if(settings.sortable) listClass+=" wat-dialog-sortable-list";
		this.addElement( '<ol class="wat-dialog-list'+listClass+'">' );
		return this;
	};

	FormDialog.prototype.getValueByName = function(name) {
		return $(this.DOMDialog).find('[name='+name+']').first().val();
	};
	FormDialog.prototype.getValues = function() {
		var values={};
		$(this.DOMDialog).find('input,select,textarea').each(function(){
			switch ($(this).attr('type')){
				case 'checkbox':
					values[$(this).attr('name')]= $(this).is(':checked')
					break;
				case 'radio':
					if($(this).is(':checked')) values[$(this).attr('name')]=$(this).val();
					break;
				default:
					values[$(this).attr('name')]=$(this).val();
					break;
			}
		});
		return values;
	};




// ------------------------------------------------------------//
// DIALOG
// Provides a simple modal dialog to show to the user
//
	var Dialog = function (name,title){
		this.title 	= title;
		this.name 	= name;
		this.id 	= $config.prefix+'Dialog_'+name+' '+Date.now();
		this.class 	= this.id+'_item '+jquery_ui_scope;
		this.initElements();
	};
	Dialog.prototype = new AbstractDialog();
	Dialog.prototype.super = function(f,parameters) {
		return (this.__proto__.__proto__)[f].apply(this,parameters);
	};
	Dialog.prototype.initialize = function() {
		var html = $.parseHTML([ '<div id="',this.id,'" title="',this.title,'">',this.elements.join(''),'</div>'].join(''));
		this.setHtml(html);
		this.setButtons(this.buttons);
		this.super('initialize');
		return this;
	};
	Dialog.prototype.addButton = function(name,aFunction) {
		if(!this.buttons) this.buttons = {};
		var d = this;
		this.buttons[name] = function(){aFunction(d)};
		return this;
	};



// ------------------------------------------------------------//
// SPINNER
// A single spinner instance for the whole application. This shows a spinner in the middle of the window.
//
	var Spinner = function(){
		this.domElement  =  $.parseHTML('<div class="wat-ui-dialog-background"></div>');
	};
	Spinner.prototype.show = function () {
		$('body').append(this.domElement);
	};
	Spinner.prototype.hide = function () {
		$(this.domElement).detach();
	};

	var spinnerInstance = new Spinner();


// ------------------------------------------------------------//
// FACTORY
// A Factory pattern to provide instances:
//

	var Factory = function(){}
	Factory.prototype.getDialog = function(name,title){
		return new Dialog(name,title).settings(initConf);
	};
	Factory.prototype.getForm = function(name,title){
		return new FormDialog(name,title).settings(initConf);
	};
	Factory.prototype.getSpinner = function(){
		return spinnerInstance;
	};

	return new Factory();

});

