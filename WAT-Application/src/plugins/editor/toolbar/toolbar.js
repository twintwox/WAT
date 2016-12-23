/**
 * Toolbar module:
 * This module defines a toolbar that will be displayed on the screen.
 * The toolbar is generated dynamically by calling the buildTool function.
 * **/

WAT.module('$toolbar',['JQuery','$editorConfig','$editorLang','Logger','$session','$utils'],
	function($,$config,$lang,Logger,$session,$utils){


// ------------------------------------------------------------//
// SETUP
//
	var $logger = new Logger('$toolbar');
	var $toolbar;
	var cache = {};
	var toolbarId = $utils.getFakeId('toolbar_');
	var settings = {
		colors :{
			red: 		"rgba(248,105,77,0.95)",
			green: 		"rgba(122,193,66,0.95)",
			yellow: 	"rgba(255,203,32,0.95)",
			lightBlue: 	"rgba(44,168,210,0.95)",
			blue: 		"rgba(48,88,145,0.95)"
		},
		template:{
			wrapper: ['<ul id="',toolbarId,'" class="wat_toolbar_element ',$config.appElementClass,'" tabindex="-1"></ul>'].join(''),
			item: ['<li class="wat_toolbar_element toolbar-item fa fa-lg ',$config.appElementClass,'"  tabindex="-1"></li>'].join('')
		}

	};


// ------------------------------------------------------------//
// SETUP
//
	var handlers = {
		transition: function (newState) {
			return function(){
				$toolbar.goToState(newState);
			}
		},
		goBack: function () {
			$toolbar.goBack();
		}
	};


// ------------------------------------------------------------//
// TOOL class definition.
// Defines a single action in the toolbar.
//
	/** An object representing each of the toolbar options **/
	var Tool = function (name,icon,state,transition,data,callback) {
		this.name = name;
		this.icon = icon;
		this.state = state;
		this.transition = transition;
		this.data = data;
		this.callback = callback;
	};
	Tool.prototype.getIcon = function () {
		return this.icon;
	};
	Tool.prototype.getName = function () {
		return this.name;
	};

	Tool.prototype.getState = function () {
		return this.state;
	};
	Tool.prototype.getTransition = function () {
		return this.transition;
	};
	Tool.prototype.getData = function () {
		return this.data;
	};

	Tool.prototype.getCallback = function () {
		return this.callback || function(){};
	};


// ------------------------------------------------------------//
// TOOLBAR class definition
// A class that handles a single toolbar that is injected in the DOM.
//

	var Toolbar = function (){
		this.DOMToolbar;
		this.states = {};
		this.setUpFns = {};
		this.beforeLeaveFns = {};
		this.history = [];
		this.rootState = [];
		this.selectedState = null;
		this.isBeingDisplayed = false;
	};

	Toolbar.prototype.initialize = function() {
		if(!this.selectedState || !this.states[this.selectedState]){
			// $logger.warn("State",this.selectedState,"is empty in toolbar for initialization");
			return this;
		}
		// Use cache to avoid rebuilding the same state.
		if(!cache[this.selectedState]) {
			// The initialize creates the DOM object to be appended in the DOM.
			var toolbarTemp = $.parseHTML(settings.template.wrapper);
			var items = this.states[this.selectedState];
			var colors = $.map(settings.colors, function (el) {
				return el;
			});
			var len = colors.length;
			for (var i = 0; i < items.length; i++) {
				var item = items[i];
				var temp = $(settings.template.item).clone();
				$(temp)
					.addClass(item.getIcon())
					.attr("title", item.getName())
					.css("background-color", colors[i % len])
					.on("click", item.getData(), item.getCallback());

				// Add toolbar transition if necessary
				if(item.getTransition())
					$(temp).on("click", handlers.transition(item.getTransition()));

				$(toolbarTemp).append(temp);
			}
			// Add back button
			if (this.history.length > 0){
				var temp = $(settings.template.item).clone();
				$(temp)
					.addClass('fa-arrow-left')
					.attr("title", $lang.get('go_back'))
					.css("background-color", colors[items.length % len])
					.on("click", handlers.goBack)
				$(toolbarTemp).append(temp);
			}
			cache[this.selectedState] = toolbarTemp;
		}
		if(this.isBeingDisplayed){
			this.hide();
			this.DOMToolbar = cache[this.selectedState];
			this.display();
			this.callSetUp();
		}else{
			this.DOMToolbar = cache[this.selectedState];
		}
		this.persist();
		return this;
	};

	/** Start and display the toolbar **/
	Toolbar.prototype.start = function(){
		this.display();
		this.callSetUp();
	};
	/** Stop and hide the toolbar **/
	Toolbar.prototype.stop = function(){
		this.hide();
		this.callBeforeLeave();
	};
	/** Reset to the initial state **/
	Toolbar.prototype.reset = function() {
		this.selectedState = this.rootState;
		this.history = [];
		this.clearCache();
		this.initialize();
		return this;
	};
	Toolbar.prototype.refresh = function() {
		if(!this.isBeingDisplayed) return this;
		this.hide();
		this.display();
		return this;
	};
	Toolbar.prototype.callSetUp = function(){
		// Call set up for selected state.
		if(this.setUpFns[this.selectedState]) this.setUpFns[this.selectedState]();
	};
	Toolbar.prototype.callBeforeLeave = function(){
		// Call before leave for selected state.
		$logger.log('Calling before leave',this.beforeLeaveFns[this.selectedState]);
		if(this.beforeLeaveFns[this.selectedState]) this.beforeLeaveFns[this.selectedState]();
	};
	Toolbar.prototype.display = function() {
		$logger.log('Display toolbar');
		// Add toolbar HTML to DOM.
		$("body").first().prepend(this.DOMToolbar);
		this.isBeingDisplayed = true;
		return this;
	};
	Toolbar.prototype.hide = function() {
		$logger.log('Hide toolbar');
		// Remove toolbar HTML from DOM.
		$(this.DOMToolbar).detach();
		this.isBeingDisplayed = false;
		return this;
	};
	Toolbar.prototype.getCurrentState = function() {
		return this.selectedState;
	};
	Toolbar.prototype.setRootState = function(stateName){
		this.history = [];
		this.clearCache();
		this.rootState = stateName;
		this.selectedState = this.rootState;
		$logger.log("$toolbar:",stateName,"as root state");
		this.initialize();
		return this;
	};
	Toolbar.prototype.goToState = function (stateName) {
		if(!stateName || !this.states[stateName]){
			$logger.warn(stateName,"is not a valid state");
			return;
		}
		if(this.selectedState === stateName) return;
		if(this.selectedState){
			this.history.push(this.selectedState);
			this.callBeforeLeave();
		}
		this.selectedState = stateName;
		this.initialize();
		return this;
	};
	Toolbar.prototype.goBack = function (){
		if(this.history.length === 0){
			$logger.warn("Cant go back in toolbar state, history is empty");
			return;
		}
		this.callBeforeLeave();
		this.selectedState = this.history.pop();
		this.initialize();
		$logger.log('Go back',this);
		return this;
	};

	/** Builds a new tool (action) to be shown in the corresponding state **/
	Toolbar.prototype.buildTool  = function(prop){
		var tool = new Tool(prop.name,prop.icon,prop.state,prop.transition,prop.data,prop.callback);
		if(!this.states[prop.state]) this.states[prop.state] = [];
		this.states[prop.state].push(tool);
		delete cache[prop.state];
		this.initialize();
		return this;
	};
	Toolbar.prototype.clearCache = function () {
		cache = {};
	};
	Toolbar.prototype.onStateInit = function(stateName,callback){
		this.setUpFns[stateName] = callback;
	};
	Toolbar.prototype.onStateClose = function(stateName,callback){
		this.beforeLeaveFns[stateName] = callback;
	};

	/** Stores the toolbar state on the Domain scope, in order to reload it in case on same domain navigation **/
	Toolbar.prototype.persist = function() {
		var store = {
			history: this.history,
			rootState: this.rootState,
			selectedState: this.selectedState,
		};
		$session.save('$toolbar',$session.asPersistentObject(store));
		return this;
	};
	/** Restores the toolbar state if any **/
	Toolbar.prototype.restore = function() {
		var stored = $session.get('$toolbar');
		if(!stored || Object.keys(stored).length == 0) return false;
		if(!stored.selectedState) return false;
		if(!stored.rootState) return false;
		$.extend(this,stored);
		this.initialize();
		$logger.log('Toolbar restored',stored);
		return true;
	};
	/** Destroy the toolbar stored state if any **/
	Toolbar.prototype.destroy = function() {
		$session.remove('$toolbar');
		return true;
	};


// ------------------------------------------------------------//
// Singleton
//
	$toolbar = new Toolbar();
	return $toolbar;
});

