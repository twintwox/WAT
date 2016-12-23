/**
 * Navigation Tool:
 *
 * Tools are modules loaded by the $player only after a template has been installed successfully on the client.
 * The tool must call the $player.bindTool function in order to be called, and must contain the public functions
 * start, close and refresh.
 *
 * Start will be called after the template installation.
 * Close will be called if the player is turned down.
 * Refresh will be called each time new patterns are found and after the parser run.
 *
 * In this case, the  NavigationTool will make accessible those elements that contains the class "wat-navigate" added by
 * the parser, and exclude those parsed element that don't contian it.
 *
 * For each of the navigational element, the NavigationTool will create a new NavigationItem, this will make the element
 * accessible but will remain initially collapsed (denying the focus access to its internal elements), when the user
 * focus one of the NavigationItems he can expand it (by pressing the expand key) this will make all its internal
 * elements accessible (excepts for those elements that are inside another NavigationItem of a deeper level), so the same
 * story repeats. The user can collapse ano NavigationItem by pressing the collapse key, or be sending the element focus
 * to another element outside the NavigationalItem.
 *
 * At the same time, each NavigationalItem will include a marker before its position on the HTML document. This marker
 * wil be helpful for others ScreenReaders to recognize the Navigational item.
 *
 * Finally, it will provide 4 commands (bounded to the navigation.events on the playerConfig), each of this commands
 * allows to correctly traverse the Navigational items defined.
 *
 ***/

WAT.module('$navigationTool',['JQuery','$playerConfig','Logger','$playerLang','$utils','Highlighter','$player','$refreshDaemon'],
	function($,$config,Logger,$lang,$utils,Highlighter,$player,$refreshDaemon){

// ------------------------------------------------------------//
// SETUP:
//
		var $logger = new Logger('$navigationTool');
		$config.player.navigation = {
			//Define the selector to find the navigational items:
			itemClass: 'wat-navigate',
			items: '.wat-navigate',
			exclude:'.wat-parsed-element:not(.wat-navigate)'
		};

		// The root element where navigation begins:
		var ROOT_ELEMENT = $('body')[0];

// ------------------------------------------------------------//
// NAVIGATION:
// It is used as a singleton to manage the flow of the navigation
// Also implements the PUBLIC API REQUIRED BY THE PLAYER
//

	var Navigation = function(){};

	/** On start **/
	Navigation.prototype.start = function () {
		if(this.started) return;
		this.started = true;
		// Set root role as application:
		$utils.memo(ROOT_ELEMENT,'role');
		$(ROOT_ELEMENT).attr('role','application');

		this.resetNavigation();
		this.hideNonNavigationalItems();
		Handlers.attachListeners();
		NavigationMarks.attachListener();
		$refreshDaemon.ignoreClassMutation('wat-navigate');
	};
	/** On close **/
	Navigation.prototype.close = function () {
		if(!this.started) return;
		this.started = false;
		// Restore root role
		$(ROOT_ELEMENT).attr('role',$utils.memo(ROOT_ELEMENT,'role'));

		this.showNonNavigationalItems();
		Handlers.detachListeners();
		NavigationMarks.detachListener();
		$refreshDaemon.removeFromIgnoreClass('wat-navigate');
	};
	/** Show those non navigational items that were hidden before **/
	Navigation.prototype.showNonNavigationalItems = function () {
		$($config.player.navigation.exclude).each(function(){
			var previousValue = $(this).data('wat-initial-aria-hidden');
			if(previousValue && previousValue!='none'){
				  $(this).attr('aria-hidden',previousValue);
			}else $(this).removeAttr('aria-hidden');
			$(this).removeClass('wat-navigation-excluded');
		});
	};
	/** Hide non navigational items, to avoid screen readers to read them **/
	Navigation.prototype.hideNonNavigationalItems = function () {
		$($config.player.navigation.exclude).not('.wat-navigation-excluded').each(function(){
			if(!$(this).data('wat-initial-aria-hidden'))
				$(this).data('wat-initial-aria-hidden',$(this).attr('aria-hidden')||'none');
			$(this).attr('aria-hidden',true);
			$(this).hide();
			$(this).addClass('wat-navigation-excluded');
		});
	};
	/**
	 * On refresh: Just will look for new elements to hide, since the navigational items are recognized on the fly.
	 * **/
	Navigation.prototype.refresh = function (data) {
		//$logger.log("Refresh",data);
		this.hideNonNavigationalItems();
	};

	/** Get the top Navigational element (the body) **/
	Navigation.prototype.getRootContext = function() {
		if (!this.rootContext) {
			this.rootContext = new NavigationItem(ROOT_ELEMENT);
			$($('body')[0]).data('wat-navigation-item',this.rootContext);
		}
		return this.rootContext;
	};
	/** Return whether the element is a navigational item **/
	Navigation.prototype.isNavigationItem = function (element) {
		return $(element).is($config.player.navigation.items);
	};
	/** Get the nearest navigational item parent **/
	Navigation.prototype.getNearestNavigationalParent = function (element) {
		return $(element).parents($config.player.navigation.items).first()[0] || $('body')[0];
	};
	/** Reset the navigation, starting on the first child of the root context  **/
	Navigation.prototype.resetNavigation = function() {
		if(this.getRootContext().hasChildren()){
			this.getRootContext().expand();
			this.setCurrentSelectedItem(this.getRootContext().firstChild());
		}else{
			$logger.error('No element to select');
		}
	};
	/** Get the current navigational item being selected **/
	Navigation.prototype.getCurrentSelectedItem = function() {
		// The current selected item
		return this.selectedItem;
	};
	/** Set the current navigational item (the first child in case of the root context) **/
	Navigation.prototype.setCurrentSelectedItem = function(item) {
		if(item === this.getRootContext()) item = this.getRootContext().firstChild();
		if(this.setCurrentSelectedItemWithoutFocus(item)) item.requestFocus();
	};
	/** Set the current navigational item avoiding the request focus event **/
	Navigation.prototype.setCurrentSelectedItemWithoutFocus = function(item) {
		// Idem setCurrentSelectedItem but avoiding setting the focus.
		if(item === this.getRootContext()) item = this.getRootContext().firstChild();
		if(!item || item === this.selectedItem) return false;

		// Collapse all items that are not in the new item path:
		var aux = this.selectedItem;
		while(aux && !$.contains(aux.getElement(),item.getElement())){
			if( aux.getElement() == item.getElement() ) break;
			if(aux.isExpanded())aux.collapse();
			aux = aux.getParent();
		}
		// Expand all collapsed items that are in the new item path:
		$(item.getParents()).each(function(){
			if(!this.isExpanded()) this.expand();
		});

		// The current expanded item
		this.selectedItem = item;
		if(item.isExpanded()) item.collapse();
		item.requestScroll();
		return true;
	};
	/** Function to be called by externals focus events **/
	Navigation.prototype.moveTo = function(element,focus) {
		var item;
		if(this.isNavigationItem(element)){
			item = this.getOrCreateNavigationItemFor(element);
		}else{
			var parent = this.getNearestNavigationalParent(element);
			item = this.getOrCreateNavigationItemFor(parent);
		}
		if(!item) return;
		this.setCurrentSelectedItem(item);
		item = this.getCurrentSelectedItem();
		if(focus) {
			item.requestFocus();
			if (!item.isExpanded()) item.expand();
		}
	};
	/** Find the next navigational element or null **/
	Navigation.prototype.next = function() {
		if( this.getCurrentSelectedItem().isExpanded() ){
			if(this.getCurrentSelectedItem().hasChildren()){
				this.setCurrentSelectedItem(this.getCurrentSelectedItem().firstChild());
			}else{
				$(this.getCurrentSelectedItem().getElement()).children().first().focus();
			}
		}else{
			if( this.getCurrentSelectedItem().hasNext() ){
				this.setCurrentSelectedItem(this.getCurrentSelectedItem().next());
			}else if (this.getCurrentSelectedItem().getParent().hasNext()){
				// Going to the parent next
				this.setCurrentSelectedItem(this.getCurrentSelectedItem().getParent().next());
			}
		}
	};
	/** Find the previous navigational element or null  **/
	Navigation.prototype.previous = function() {
		if( this.getCurrentSelectedItem().hasPrevious() ){
			this.setCurrentSelectedItem(this.getCurrentSelectedItem().previous());
		}
	};
	/** Find the first inner navigational item or null **/
	Navigation.prototype.forward = function() {
		if(!this.getCurrentSelectedItem().isExpanded()) this.getCurrentSelectedItem().expand();
		else this.next();
	};

	/** Find the nearest navigational item parent or root context **/
	Navigation.prototype.backward = function() {
		if(this.getCurrentSelectedItem().isExpanded()){
			this.getCurrentSelectedItem().collapse();
			this.getCurrentSelectedItem().requestFocus();
		} else {
			var parent = this.getCurrentSelectedItem().getParent();
			if (parent === this.getRootContext()) {
				if (this.getCurrentSelectedItem().isExpanded()) {
					$logger.log("Collapsing backward pressed", this.getCurrentSelectedItem().getElement());
					this.getCurrentSelectedItem().collapse();
				}
				Handlers.topReached(this.getRootContext().getElement());
			} else {
				this.setCurrentSelectedItem(parent);
			}
		}
	};

	/** Get the NavigationItem instance of an element **/
	Navigation.prototype.getOrCreateNavigationItemFor = function(element){
		if ( $(element).length == 0) return null;
		if ( ! $(element).data('wat-navigation-item') )
			   $(element).data('wat-navigation-item', new NavigationItem(element));
		return $(element).data('wat-navigation-item');
	};

	/** Singleton **/
	var $navigationTool = new Navigation();



// ------------------------------------------------------------//
// NAVIGATION MARKS:
// Creates an element to use as marker for the navigational item.
// When the navigational item is collapsed, all its children are inaccessible excepts for its corresponding marker,
// in order to the screen reader to have an element to select
//
		/**
		 * Navigation mark generator, this will create a marker to be added before the navigationItem.
		 * This helps screen readers commands to identify the elmement as navigable.
		 * **/
		var NavigationMarks = {
			class:'wat-navigation-mark',
			match: function(element){
				//Whether the element is or not a navigational mark
				return $(element).is('.'+this.class);
			},
			onMarkFocused: function(e){
				$navigationTool.moveTo(e.target,false);
			},
			attachListener: function () {
				$('body').on('focusin','.'+this.class,this.onMarkFocused);
			},
			detachListener: function () {
				$('body').off('focusin','.'+this.class,this.onMarkFocused);
			},
			createMark: function(reference){
				var speechText = $utils.getSpeechTextForElement(reference);
				var marker = $.parseHTML('<span class="wat-navigation-hidden-text" role="presentation" tabindex="-1"><span>'+speechText+'</span></span>');
				$(marker).addClass(this.class);
				var referenceId = $(reference).attr('id') || $utils.getFakeId("wat-navigation-id-");
				$(reference).attr('id',referenceId);
				$(marker).attr('wat-reference','#'+referenceId);
				return marker;
			}
		};

// ------------------------------------------------------------//
// NAVIGATION DUMMIES:
// Creates an empty navigation item so it can be used as a first child, in order
// to always be able to select the first child
//
		/** A dummy element is added as the first child of NavigationItems
		 * in order to have always an element to focus when expanding **/
		var DummyItem = {
			class:'wat-navigation-dummy',
			newDummy: function(){
				var dummy = $.parseHTML('<div>'+$lang.get('navigation_dummy_text')+'</div>');
				$(dummy).addClass(this.class);
				//$(dummy).addClass($config.player.navigation.itemClass);
				return dummy;
			},
			removeDummiesFrom: function(element){
				$(element).find('.'+this.class).detach();
			}
		};

// ------------------------------------------------------------//
// NAVIGATION ITEM:
// Handles one navigation item.
// It is created for each element that match the item selector defined in the setup.
//

	/** NavigationItem class, that helps to control those navigational items **/
	var NavigationItem = function(element){
		this.root = element;
		this.initialize();
	};
	/** Return the core element that the NavigationItem is representing **/
	NavigationItem.prototype.getElement = function() {
		return $(this.root)[0];
	};
	NavigationItem.prototype.collapseElement = function() {
		$(this.getElement()).attr('aria-expanded','false');
	};
	NavigationItem.prototype.expandElement = function() {
		$(this.getElement()).attr('aria-expanded','true');
	};
	NavigationItem.prototype.initialize = function() {
		// Initialize item:
		this.childrenEnabled = true; // Set it to 'true' in order to disableChildren to execute.
		this.disableChildren();
		this.collapseElement();
	};
	/** Whether the navigation item is accessible or not **/
	NavigationItem.prototype.isEnabled = function(){
		return typeof $(this.getElement()).attr('aria-hidden') === 'undefined';
	};
	/** Whether the navigation item's children are accessible or not **/
	NavigationItem.prototype.isExpanded = function(){
		return $(this.getElement()).attr('aria-expanded') == 'true';
	};


	//---------- Handling navigation marker ------------//
	/** The navigational marker should be showed while the NavigationItem is enabled but not expanded **/
	NavigationItem.prototype.showNavigationalMarker = function() {
		this.hideNavigationalMarker();
		this.marker = NavigationMarks.createMark(this.getElement()) ;
		$(this.getElement()).prepend(this.marker);
	};
	NavigationItem.prototype.hideNavigationalMarker = function() {
		if(this.marker) $(this.marker).detach();
		this.marker = null;
	};

	//---------- Handling dummy item ------------//
	/** The dummy item should be showed while the NavigationItem is enabled and expanded **/
	NavigationItem.prototype.showDummyItem = function() {
		this.hideDummyItem();
		this.dummy = DummyItem.newDummy() ;
		$(this.getElement()).prepend(this.dummy);
	};
	NavigationItem.prototype.hideDummyItem= function() {
		if(this.dummy) $(this.dummy).detach();
		this.dummy = null;
	};

	//---------- Changing its state ------------//
		//------ On enable --------------//
		/** When enabled, the navigationItem shows its marker, but remains initially collapsed **/
		NavigationItem.prototype.enable = function(){
			if(this.isEnabled()) return;
			// Store the original values of the root element, just in case.
			$utils.memo(this.getElement(),'aria-hidden');
			$utils.memo(this.getElement(),'tabindex');

			$refreshDaemon.stopChangeListening();
			// Enable the item
			this.showNavigationalMarker();
			$(this.getElement()).removeAttr('aria-hidden');
			$(this.getElement()).attr('tabindex',0);
			$refreshDaemon.startChangeListening();
		};

		//------ On disable -------------//
		/** When disabled, the navigationItem hides its marker and collapse if necessary **/
		NavigationItem.prototype.disable = function(){
			if(!this.isEnabled()) return;
			// Collapse if necessary
			if(this.isExpanded()) this.collapse();

			// Store the original values of the root element, just in case.
			$utils.memo(this.getElement(),'aria-hidden');
			$utils.memo(this.getElement(),'tabindex');

			$refreshDaemon.stopChangeListening();
			// Disable the item
			this.hideNavigationalMarker();
			$(this.getElement()).attr('aria-hidden','true');
			$(this.getElement()).attr('tabindex',-1);
		$refreshDaemon.startChangeListening();
		};

		//------ On expand --------------//
		/** When expand, the navigationItem enable all its children **/
		NavigationItem.prototype.expand = function(){
			// If no children return:
			if($(this.getElement()).children().length == 0 ) return;

			if(this.isEnabled) this.hideNavigationalMarker();

			// Expand the item:
			this.expandElement();
			this.showDummyItem();
			this.enableChildren();
			Handlers.expandedOn(this.getElement());
		};
			//------ Enabling children ------------//
			/** Traverse the root element enabling the children **/
			NavigationItem.prototype.enableChildren = function() {
				if (this.childrenEnabled) return;
					this.childrenEnabled = true;
				$refreshDaemon.stopChangeListening();
				var nextLevelItems = this.getNextLevelNavigationItems();
				// Enable the next level navigational items:
				nextLevelItems.each(function(){
					var item = $navigationTool.getOrCreateNavigationItemFor(this);
					item.enable();
				});
				// Restore values of non navigational items:
				this.findInnerNodes('*').not(nextLevelItems).each(function(){
					// Restore original values:
					var restore = ['tabindex','aria-hidden'];
					for(var key in restore){
						var attr = restore[key];
						var val = $utils.memo(this,attr);
						if (val) $(this).attr(attr,val);
						else $(this).removeAttr(attr);
					}
				});
				$refreshDaemon.startChangeListening();
			};

		//------ On collapse ------------//
		/** When expand, the navigationItem disable all its children, keeping only the navigational marker **/
		NavigationItem.prototype.collapse = function(){
			// Collapse the item:
			this.collapseElement();
			this.hideDummyItem();
			this.disableChildren();
			this.showNavigationalMarker();
			Handlers.collapsedOn(this.getElement());
		};
			//------ Disabling children ------------//
			/** Traverse the root element disabling ALL the children **/
			NavigationItem.prototype.disableChildren = function() {
				if (!this.childrenEnabled) return;
					 this.childrenEnabled = false;
				$refreshDaemon.stopChangeListening();
				var nextLevelItems = this.getNextLevelNavigationItems();
				// Disable the next level navigational items:
				nextLevelItems.each(function(){
					var item = $navigationTool.getOrCreateNavigationItemFor(this);
					item.disable();
				});
				// Disable non navigational items:
				this.findInnerNodes('*').not(nextLevelItems).each(function(){
					// If it is a navigation mark, do not disable it
					if(NavigationMarks.match(this)) return;

					// Store previous values
					$utils.memo(this,'tabindex');
					$utils.memo(this,'aria-hidden');

					// Make the element inaccessible
					$(this).attr('aria-hidden','true');
					$(this).attr('tabindex',-1);
				});
				$refreshDaemon.startChangeListening();
			};


		//------------------ Navigation ------------------//
		//-- Access to navigational parents --//
		/** Returns the nearest navigational parent  **/
		NavigationItem.prototype.getParent = function(){
			var parentElement = $navigationTool.getNearestNavigationalParent(this.getElement()) || $('body')[0];
			return $navigationTool.getOrCreateNavigationItemFor(parentElement);
		};
		/** Returns all the navigational parents **/
		NavigationItem.prototype.getParents = function(){
			var pp = $(this.getElement()).parents($config.player.navigation.items);
			return $.map(pp,function(item){
				return $navigationTool.getOrCreateNavigationItemFor(item);
			});
		};

		//-- Access to navigational children --//
		/** Returns whether it contains navigational children **/
		NavigationItem.prototype.hasChildren = function(){
			return $(this.getNextLevelNavigationItems()).length > 0;
		};
		/** Returns the first navigational children **/
		NavigationItem.prototype.firstChild = function(){
			return $navigationTool.getOrCreateNavigationItemFor(this.getNextLevelNavigationItems().first());
		};
		/** Returns the next level navigational children **/
		NavigationItem.prototype.getNextLevelNavigationItems = function(){
			var context = this.getElement();
			return $(context).find($config.player.navigation.items)
				.filter(function(){
					var parent = $navigationTool.getNearestNavigationalParent(this);
					return $(parent).length == 0 || parent === context;
				});
		};

		//-- Access to navigational siblings --//
		/** Find the index of the root element inside a collection **/
		NavigationItem.prototype.indexIn = function(collection){
			for (var i=0; i< $(collection).length; i++){
				if($(collection)[i] == $(this.root)[0] ) return i;
			}
			return -1;
		};
		/** Returns whether it has a next navigational sibling **/
		NavigationItem.prototype.hasNext = function(){
			return this.next() != null;
		};
		/** Returns the next navigational sibling **/
		NavigationItem.prototype.next = function(){
			var siblings = this.getParent().getNextLevelNavigationItems();
			var idx = this.indexIn(siblings);
			if(idx == -1 || idx+1 == $(siblings).length) return null;
			else return $navigationTool.getOrCreateNavigationItemFor($(siblings)[idx+1]);
		};
		/** Returns whether it has a previous navigational sibling **/
		NavigationItem.prototype.hasPrevious = function(){
			return this.previous() != null;
		};
		/** Returns the previous navigational sibling **/
		NavigationItem.prototype.previous = function(){
			var siblings = this.getParent().getNextLevelNavigationItems();
			var idx = this.indexIn(siblings);
			if(idx < 1 ) return this.getParent();
			else return $navigationTool.getOrCreateNavigationItemFor($(siblings)[idx-1]);
		};
		/** Access to the elements where its nearest NavigationalItem parent is equals to this one **/
		NavigationItem.prototype.findInnerNodes = function(selector){
			var context = this.getElement();
			return $(context).find(selector).filter(function(){
				return $navigationTool.getNearestNavigationalParent(this) == context;
			});
		};
		/** Request focus and scroll to this navigation item **/
		NavigationItem.prototype.requestFocus = function () {
			$(this.getElement()).attr('tabindex','0');
			$(this.getElement()).focus();
			Handlers.focusOn(this.getElement());
		};
		NavigationItem.prototype.requestScroll = function () {
			//$('html, body').animate({scrollTop: $(this.getElement()).offset().top - 100}, 100);
		};


// ------------------------------------------------------------//
// HANDLERS:
// Manage the events.
//

	var Handlers = {
		attachListeners:function(){
			//$('body').on("focusin",Handlers.focusMoved);
			$(window).on($config.player.events.navigation.backward,Handlers.onBackward);
			$(window).on($config.player.events.navigation.forward,Handlers.onForward);
			$(window).on($config.player.events.navigation.next,Handlers.onNext);
			$(window).on($config.player.events.navigation.previous,Handlers.onPrevious);
		},
		detachListeners:function(){
			//$('body').off("focusin",Handlers.focusMoved);
			$(window).off($config.player.events.navigation.backward,Handlers.onBackward);
			$(window).off($config.player.events.navigation.forward,Handlers.onForward);
			$(window).off($config.player.events.navigation.next,Handlers.onNext);
			$(window).off($config.player.events.navigation.previous,Handlers.onPrevious);
		},
		focusOn:function(element){
			//$logger.log('Focus on',element);
			//$player.trigger($config.player.events.navigation.focus,{target:element});
		},
		focusMoved:function(e){
			//$logger.log('Moved to', e.target,e);
			//$navigationTool.onFocusMoved(e.target);
		},
		expandedOn:function(element){
			//$logger.log('Expanded',element);
			$utils.trigger($config.player.events.navigation.expand,{target:element});
		},
		collapsedOn:function(element){
			//$logger.log('Collapsed',element);
			$utils.trigger($config.player.events.navigation.collapse,{target:element});
		},
		topReached:function(element){
			//$logger.log('Limit reached',element);
			$utils.trigger($config.player.events.navigation.limitReached);
		},
		onPrevious:function(e){
			e.stopPropagation();
			$navigationTool.previous();
		},
		onNext:function(e){
			e.stopPropagation();
			$navigationTool.next();
		},
		onForward:function(e){
			e.stopPropagation();
			$navigationTool.forward();
		},
		onBackward:function(e){
			e.stopPropagation();
			$navigationTool.backward();
		},
	};


// ------------------------------------------------------------//
// Bind NavigationTool singleton to the Player && Return the singleton.
//
	$player.bindTool('$navigationTool',$lang.get('navigation_tool_name'),$navigationTool);
	return $navigationTool;

});
