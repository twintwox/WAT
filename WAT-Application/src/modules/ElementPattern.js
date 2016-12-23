/**
 * In this module we implement the ElementPattern, a class that implements our Similarity algorithm.
 * We can use this class to get a Similarity coefficient of 2 elements, and decide whether they are the same or not
 * based on the joinThreshold ( this represents how much flexible we are to recognise 2 patterns as the same or no)
 *
 * At the same time, this class provides ways to find the pattern in the DOM, and some optimizations to make this task
 * as faster as possible (very big DOMs and extensive patterns can be very inefficient if we are not careful).
 * ***/

WAT.module('ElementPattern',['JQuery','$config','$utils','$assert','Logger','XpathBuilder'],
	function($,$config,$utils,$assert,Logger,XpathBuilder){

// ------------------------------------------------------------//
// SETUP
//
	// Set the logger
	var $logger = new Logger('ElementPattern');

	// Xpath instance
	// Set the 'appElementClass' to exclude the application's elements in generated XPaths
	var $xpath = new XpathBuilder(function(element){
		var ignore = false;
		ignore = ignore || $(element).is($config.appElementClass);
		ignore = ignore || !$(element).is(':visible');
		return ignore;
	});

	// Configuration namespace:
	$config.patterns = {};

	// A class to be added to all the elements that match a pattern.
	$config.patterns.class = 'wat-pattern';

	// Minimum similarity threshold to join two patterns by default (each pattern could set a custom value)
	$config.patterns.joinThreshold = 0.60;

	// The maximum and minimum number of parents that the pattern should look:
	$config.patterns.maxParentDistanceLookup = 5;
	$config.patterns.minParentDistanceLookup = 2;

	// The maximum deepness of child to look for during the pattern generation
	$config.patterns.maxChildDeepnessLookup = 20;

	// The gap of extra relevance assigned between each level (never less than 1).
	$config.patterns.relevanceGap = 1;
	$config.patterns.reinforcement = 0.35; // Recommended keeping it between 0 and 1.

	$config.patterns.selectorsAmmount = 30;

	$config.patterns.maxDocumentHeight = 50;

	$config.patterns.exludeAttrs = {
		class:true,
		href:true
	};

// ------------------------------------------------------------//
// PRIVATE SCOPE:
// Here we define some private static functions that are helpers for the patterns handling.
//
	var _private = {
		/** The parser provides functions to get the values of the rules created by the generator **/
		parser: {
			parseRuleLevel:function(rule){
				try{
					return parseInt(rule.substring(0,rule.indexOf('@')));
				} catch(err){
					$logger.error(err);
				};
				return 0;
			},
			parseRuleType:function(rule){
				try{
					return rule.substring(rule.indexOf('@')+1,rule.indexOf('#'));
				} catch(err){
					$logger.error(err);
				};
				return 'attr';
			},
			parseRuleValue:function(rule){
				try{
					return rule.substring(rule.indexOf('#')+1,rule.length);
				} catch(err){
					$logger.error(err);
				};
				return '';
			}
		},
		/** The generator provides functions to create the attributes MAP of a Pattern **/
		generator:{
			/** Relevance ecuation **/
			computeRelevance: function(height,deepness){
				return height * $config.patterns.relevanceGap;
			},
			/**
			 * Maps a single node element into the map
			 * The each attribute associated to the deepness of the element create a
			 * new "rule" for the Pattern (input in the map)
			 * **/
			mapElement: function(map,element,deepness,relevance){
				var tagName = element.tagName;
				$assert.ok(typeof tagName === 'string','Element tagName should be a string');
				var prefix = deepness+'@';

				// Map the tagname:
				map[prefix+'tagName#'+tagName] = relevance;

				// Map the classes: (excluding those that are from our app ('wat-')).
				var classes = $utils.splitClasses(element.className);
				for(var clazz in classes){
					$assert.ok(typeof clazz === 'string','Class name should be a string');
					map[prefix+'class#'+clazz] = relevance;
				}
				// Map other attributes:
				var attrs = element.attributes;
				for(var i=0; i<attrs.length; i++){
					var name = attrs[i].name;
					$assert.ok(typeof name === 'string','Attribute name should be a string');
					if(name === 'class' || $utils.excludeThisName(name)) continue;
					map[prefix+'attr#'+name] = relevance;
				}
			},
			/** Traverse the root node and its children, mapping each one into the map. **/
			populateMapWithElement: function(map,rootElement){

				var findMax = function(max,current){
					return Math.max(max,current.height);
				};

				var settings = {maxDeep: $config.patterns.maxChildDeepnessLookup};

				// The population is done using a postorder traversal.
				$utils.doPostorder(rootElement,settings,function(element,deepness,childAnswers){
					// Get element height:
					var height = childAnswers.reduce(findMax,0) + 1;
					// Compute relevance from height:
					var relevance = _private.generator.computeRelevance(height,deepness);
					// Populate map with element:
					_private.generator.mapElement(map,element,deepness,relevance);
					// Store the element height:
					$(element).data('wat-element-height',height);
					return {height:height};
				});
			},
			/** Traverse the parents of the root element, mapping each one into the map.
			 * 	(IT IS NOT BEING USED ANYMORE, FOR NOW)
			 * **/
			populateMapWithParents: function(map,rootElement){
				var rootHeight = $(rootElement).data('wat-element-height');
				$assert.ok(typeof rootHeight === 'number',"RootHeight should be a number");
				if(!rootHeight) return;

				// Compute max parent lookup distance, based on the rootElement complexity.
				// Inversely proportional to the root height.
				var maxDistance = Math.max(
					$config.patterns.maxParentDistanceLookup - rootHeight,
					$config.patterns.minParentDistanceLookup
				);
				var distance  = 1;
				var parent = rootElement.parentNode;
				while(parent != null && parent.tagName){ // Checks if it is a valid parent,
					// Break if exceed the limit:
					if(distance >= maxDistance) break;
					var relevance = _private.generator.computeRelevance(1,distance);
					// Map the current parent:
					_private.generator.mapElement(map,parent,-1*distance,relevance);
					// Next:
					distance++;
					parent = parent.parentNode;
				}
			},
		},

		/**
		 * Maps the properties from the element as well as the properties of its parents and children.
		 * @param element
		 * @returns A map containing all the "rules" of the pattern created from the element.
		 */
		getMapForElement: function(element){
			// This map represents a PATTERN, which will be used for similarity recognition.
			var map = {};
			_private.generator.populateMapWithElement(map,element);
			_private.generator.populateMapWithParents(map,element);
			return map;
		}
	};


// ------------------------------------------------------------//
// ElementPattern
// A Class that represents a new Pattern based on the initial element received.
// Provides plenty of methods to help to find other elements that "match" the patterns.
//

	var ElementPattern = function(element){
		this.new 		= true;
		this.id			= $utils.getFakeId('pattern-');
		this.addClasses	= [this.id,$config.patterns.class].join(" "); // Classes to be added to the elements that match
		this.map 		= {};	// Map of attributes of this pattern.
		this.elements 	= []; 	// Elements that match this pattern

		// Patterns association:
		this.rootAssociation = null; // ID/Object of the pattern that this one is associated to,(it is stored as an ID, but the object should be loaded after.
		this.associates = {}; 	// Map of patterns ids that are associated to this pattern.

		this.paths   	= {}; 	// Map of xpath strings where could be this pattern found.
		this.data 		= {}; 	// Storage of extra data that is associated to this pattern.
		this.originalOnly = false; // Whether the pattern should only match the initial element, or look for similar elements.
		if(element){
			// Initialize:
			this.mainElement = element;
			this.mainXPath	 = $xpath.getPath(element);
			// Optimization:
			// 		Initialize data that helps to figure it out if an element should be consider as a potential match or not.
			// 		Helps to discard fast a not equal element.
			this.initialTag	  = this.mainElement.tagName;
			this.initialClass = $utils.splitClasses(this.mainElement.className);

			// Initialize the maps:
			this.map = _private.getMapForElement(this.mainElement);
			// Add path of main element
			this.addMatch(this.mainElement);
		}
	};

// ------------------------------------------------------------//
// GETTERS AND SETTERS
//
	ElementPattern.prototype.getId = function(){
		return this.id;
	};
	ElementPattern.prototype.isNew = function(){
		return this.new;
	};

	/** Get the similarity threshold: Returns the stored value or the defualt if any **/
	ElementPattern.prototype.getSimilarityThreshold = function(){
		var similarityThreshold = this.getData('similarity-threshold') || $config.patterns.joinThreshold;
		if(similarityThreshold > 0.99) this.keepOriginalOnly();
		return similarityThreshold;
	};

	/** Mark this patterns as not new (it should be new only before the first map population traverse) **/
	ElementPattern.prototype.setNotNew = function(){
		this.new = false;
	};
	ElementPattern.prototype.getClasses = function(){
		return this.addClasses;
	};
	ElementPattern.prototype.getMainElement = function(){
		if(!this.mainElement && this.mainXPath){
			this.mainElement  = $xpath.getElement(this.mainXPath);
			if(this.mainElement) this.addMatch(this.mainElement);
			else $logger.log("Couldn't find original element");
		}
		return this.mainElement;
	};
	ElementPattern.prototype.isKeepingOriginalOnly = function(){
		return this.originalOnly;
	};
	/** Keep original only: make the pattern to match only with the initial element used to its creation **/
	ElementPattern.prototype.keepOriginalOnly = function(){
		this.originalOnly = true;
		var mainElement = this.getMainElement();

		if(!mainElement) return false; // Cant be done, original not found.
		if(this.elements.length === 1 && this.elements[0] === mainElement) return true; // It has been already done.

		// Keep original only:
		for(var i=0; i<this.elements.length; i++){
			this.rejectElement(this.elements[i]);
		}
		// Reset unnecessary data, no longer needed.
		this.map 		= {};
		this.paths   	= {};
		this.removeAllElements();
		// Re-add the original element
		this.addMatch(this.mainElement);
		return true;
	};
	ElementPattern.prototype.getMap = function() {
		return this.map;
	};
	ElementPattern.prototype.getElements = function() {
		return this.elements;
	};
	ElementPattern.prototype.getPaths = function() {
		return this.paths;
	};

	/**
	 *  Returns the data object (where other custom values are stored)
	 *  But make sure, to return the data object of the ROOT pattern
	 *  (When 2 or more patterns are associeted, one of them is selected as the ROOT, so the others will
	 *  inherit all its data).
	 * **/
	ElementPattern.prototype.getDataObject = function() {
		if(this.getRootAssociation()!= null && typeof this.getRootAssociation() === 'object')
			 return this.getRootAssociation().getDataObject();
		else return this.data;
	};
	ElementPattern.prototype.getData = function(key) {
		return this.getDataObject()[key];
	};
	ElementPattern.prototype.setData = function(key,value) {
		this.getDataObject()[key] = value;
		return this;
	};
	ElementPattern.prototype.clearData = function() {
		this.data = {};
		return this;
	};
	ElementPattern.prototype.removeData = function(key) {
		delete this.getDataObject()[key];
		return this;
	};

	/**
	 * Compute the sum of relevances of the MAP, if a keys params is received then compute only the sum of relevance
	 * of those keys
	 * **/
	ElementPattern.prototype.getTotalRelevance = function(keys){
		if(keys){
			//Count the total relevance only of the subset of keys
			var subtotal = 0;
			for(var i=0;i<keys.length;i++){
				subtotal+= this.map[keys[i]]? this.map[keys[i]] : 0;
			}
			return subtotal;
		}else {
			if (!this.totalRelevance) {
				this.totalRelevance = 0;
				for (var prop in this.map) {
					this.totalRelevance += this.map[prop];
				}
			}
			return this.totalRelevance;
		}
	};

// ------------------------------------------------------------//
// IMPORT && EXPORT
//
	/** Import data from a plain object **/
	ElementPattern.prototype.import = function(plainPattern){
		this.setNotNew();
		this.id 		  = plainPattern.id;
		this.mainXPath	  = plainPattern.mainXPath || null;
		this.map 		  = plainPattern.map || {};
		this.rootAssociation  = plainPattern.rootAssociation || null;
		this.associates	  = plainPattern.associates || {};
		this.paths  	  = plainPattern.paths || {};
		this.data	 	  = plainPattern.data || {};
		this.initialTag   = plainPattern.initialTag || null;
		this.originalOnly = plainPattern.originalOnly || false;
		this.initialClass = {};
		if(plainPattern.initialClass){
			for(var i=0;i<plainPattern.initialClass.length;i++)
				this.initialClass[plainPattern.initialClass[i]] = true;
		}
		return this;
	};
	/** Export the data of the object to a plain object (to avoid cicles of the prototype) **/
	ElementPattern.prototype.export = function(){
		return {
			id: 		  this.id,
			mainXPath:	  this.mainXPath,
			map: 		  this.map,
			rootAssociation: this.getRootAssociationId(),
			associates:	  this.associates,
			paths: 		  this.paths,
			data: 		  this.data,
			initialTag:   this.initialTag || null,
			initialClass: Object.keys(this.initialClass) || [],
			originalOnly: this.originalOnly || false
		}
	};
	/** Export to JSON string **/
	ElementPattern.prototype.asJSON = function() {
		return JSON.stringify(this.export());
	};
	/** Import from JSON string **/
	ElementPattern.prototype.fromJSON = function(jsonPattern) {
		this.import(JSON.parse(jsonPattern));
		return this;
	};


// ------------------------------------------------------------//
// HANDLING ASSOCIATES
// When 2 patterns are associated, one is set as parent of the other. The child then will get all its related data
// from its ROOT parent, but the child pattern will remain using its original MAP to match new elements.
// The association us useful only for the object data (the rest of the pattern is the same).
// This associations are made using the "union/find" technique.
//

	/**
	 * Set a pattern as the root association.
	 * This function only should be called:
	 * 1- To load the object, when the root association is still a string id.
	 * 2- By the associate function, to set a rootAssociation to another root pattern.
	 * **/
	ElementPattern.prototype.setRootAssociation = function(aPattern){
		if(aPattern == this) return;
		if(this.rootAssociation == null)
			// Assign a root to another root:
			this.rootAssociation = aPattern;
		else{
			if(typeof this.rootAssociation === 'string'){
				$assert.ok(this.rootAssociation == aPattern.getId(),'When loading the root object, it should match it ID');
				// Load the root association with is object:
				this.rootAssociation = aPattern;
			}else{
				$logger.error('Only the getRootAssociation should be updating the parent object with a new one');
			}
		}
	};

	/**
	 * The rootAssociation variable is stored as a string representing the ID of the root object.
	 * But when loading the patterns, the manager should replace the ID for the original object.
	 * This method returns the RootAssociation ID, by checking whether the variable still contains the String ID or
	 * it has be loaded by the object, in that case will call the getId function.
	 * **/
	ElementPattern.prototype.getRootAssociationId = function(){
		if(this.rootAssociation === null) return null;
		if(typeof this.rootAssociation === 'string') return this.rootAssociation;
		return this.rootAssociation.getId();
	};
	/**
	 * UNION/FIND optimization:
	 * While getting the root association object, all the intermediate values will
	 * update their root association object (read UNION/FIND for more info).
	 * **/
	ElementPattern.prototype.getRootAssociation = function(){
		var root = this.rootAssociation;
		if(typeof root === 'string') return root;
		while(root && root.getRootAssociation()){
			var newRoot = root.getRootAssociation();
			// Update its parent with the grandparent root:
			this.rootAssociation = newRoot;
			root = newRoot;
		}
		return root;
	};
	/**
	 * Associate 2 patterns. The patterns pass as parameter will be set as child of this one.
	 * (We are not using the other union/find optimization, for simplicity).
	 * **/
	ElementPattern.prototype.associate = function(aPattern){
		var rootA = this.getRootAssociation() || this; 		  // Get the root of this pattern.
		var rootB = aPattern.getRootAssociation() || aPattern;// Get the root of the other pattern.
		$assert.ok(rootA != null,"It should not be null");
		$assert.ok(rootB != null,"It should not be null");
		$assert.ok(typeof rootA === 'object',"It should be an object");
		$assert.ok(typeof rootB === 'object',"It should be an object");

		rootB.setRootAssociation(rootA);
		rootA.associates[rootB.getId()] = true;
		for(var key in rootB.getAssociates()){
			rootA.associates[key] = true;
		}
		rootB.clearAssociates();
		rootB.clearData();
	};
	/** Returns all the associated children **/
	ElementPattern.prototype.getAssociates = function(){
		return this.associates;
	};
	/** Clear the associated children (it should be called only by the associate function **/
	ElementPattern.prototype.clearAssociates = function(){
		this.associates = {};
	};

// ------------------------------------------------------------//
// ADDING NEW ELEMENTS INTO THE PATTERN
//
	/**
	 * Add the xpath of the element to the paths collection,
	 * so then the pattern can look on similar xpath to find other matches
	 * **/
	ElementPattern.prototype.addLookupPathFrom = function(element){
		// Adds the XPath of the element to the lookup collection:
		var wildcardPath = $xpath.getWildcardPath(element);
		this.paths[wildcardPath] = true;
	};

	/**
	 * Add a new match to the pattern (it only should be called once it is sure the element matched the pattern).
	 * (user should not call this by himself, use addElement instead).
	 * **/
	ElementPattern.prototype.addMatch = function(element){
		if(!element) return;

		// Add it to the element collection:
		this.elements.push(element);

		// Link element to the pattern:
		$(element).data(this.getId(),true);
		$(element).data("element-pattern",this.getId());

		// Add its path for futures lookups:
		this.addLookupPathFrom(element);
	};

	/**
	 * Mark an element as rejected, so then would be faster to decide whether it matches or not.
	 * **/
	ElementPattern.prototype.rejectElement = function(element){
		// Marks the element as rejected for this pattern, to discard it faster next time.
		$(element).data(this.getId(),false);
	};

	/**
	 * Compares an element with the pattern and adds
	 * it only if it pass the similarity threshold.
	 * **/
	ElementPattern.prototype.addElement = function(element){
		// Check that the pattern is not keeping original only (single element pattern)
		if(this.isKeepingOriginalOnly()) return;

		if($(element).data(this.getId()) === true){
			// Already added, return.
			return true;
		}
		if(this.isPotentialMatch(element)){
			this.join( new ElementPattern(element) );
		}
		return $(element).data(this.getId());
	};

	/** Unbinds an element from the pattern **/
	ElementPattern.prototype.removeElement = function(element){
		$(element).removeData(this.getId());
		$(element).removeData("element-pattern");
		var index = this.elements.indexOf(element);
		if (index > -1) {
			this.elements.splice(index, 1);
		}
	};
	/** Unbinds all the elements from the pattern **/
	ElementPattern.prototype.removeAllElements = function(){
		var patternId = this.getId();
		$.each(this.elements,function(){
			$(this).removeData(patternId);
			$(this).removeData("element-pattern");
		});
		this.elements = [];
	};

	/**
	 * Decide whether the element could be a match or not.
	 * This is used as a fast pre-process before creating a whole new map for the element and compute similarity
	 * (which is more expensive)
	 * **/
	ElementPattern.prototype.isPotentialMatch = function(element){
		// A fast pre-process to check whether we should try to compare the element against this pattern, or discard it.

		// Check storedValue
		var storedValue = $(element).data(this.getId());
		if(typeof storedValue === 'boolean' && !storedValue) return false;

		// Check tagName
		if(element.tagName === this.initialTag) return true;

		/*
		if(Object.keys(this.initialClass).length === 0 ) return true; // No classes to compare.
		var classes = Object.keys($utils.splitClasses(element.className));
		for(var i=0;i<classes.length;i++){
			// Check if has at least 1 of the initial classes:
			if(this.initialClass[classes[i]]) return true;
		}
		*/
		this.rejectElement(element);
		return false;
	};

	/**
	 * Join two patterns (its maps and elements),
	 * only if both are over the similarity threshold.
	 * **/
	ElementPattern.prototype.join = function(aPattern){
		if(!aPattern) return false;

		var similarity = this.compareTo(aPattern);
		var joinThreshold  = this.getSimilarityThreshold();
		var join = (joinThreshold <= similarity);

		/** Update the pattern's MAP **/
		var map1 =	this.getMap();
		var map2 =  aPattern.getMap();
		for (var key in map1){
			// Optimization: Pattern reinforcement.
			// When joining maps, if both maps contains same element, make it more relevant to the pattern by adding both.
			// So the pattern grows in those aspects in commons while leaves other attributes behind.
			// On the other hand, if the patterns are not join, so reduce the reinforcement of the map1 on those
			// shared keys (since this keys do not belongs only to this pattern)
			var reinforcement = $config.patterns.reinforcement;
			if(join)
				// Positive reinforcement
				map1[key] = map2[key]?( map1[key] + ( map2[key] * reinforcement )): map1[key];
			else {
				// Negative reinforcement
				map1[key] = map2[key] ? ( map1[key] - ( map2[key] * reinforcement )) : map1[key];
				map1[key] = Math.max(0,map1[key]); // Never negative.
			}
		}
		if(join){
			/** Add new map values **/
			for (var key in map2){
				if(!map1[key]) map1[key] = map2[key];
			}
			/** Add new elements **/
			var newElements = aPattern.getElements();
			for (var i=0; i<newElements.length; i++){
				this.addMatch(newElements[i]);
			}
			// Mark it as not new any more.
			this.setNotNew();
		}

		/** Recompute relevance **/
		delete this.totalRelevance;
		this.getTotalRelevance();
		return join;
	};

	/**
	 * Compare function
	 * Using the Jaccard's similarity index.
	 * **/
	ElementPattern.prototype.compareTo = function(aPattern){
		// Compares to ElementPatterns, returning a similarity value -> similarity = (A ∩ B)/(A ∪ B)
		if(this.isKeepingOriginalOnly() || aPattern.isKeepingOriginalOnly()) return 0;
		var map1 = this.getMap();
		var map2 = aPattern.getMap();
		var intersection = 0;
		for( var prop in map1 ){
			if(!map2[prop]) continue; // Jump next iteration.
			intersection+= map1[prop]+map2[prop];
		}
		var union = this.getTotalRelevance() + aPattern.getTotalRelevance();
		return intersection / union;
	};

// ------------------------------------------------------------//
// LOOKING FOR ELEMENTS TO JOIN
//

	/**
	 * Use a minHeap to get the K most relevance CLASS keys in the map.
	 * Then use the key to generate Jquery selectors associated to the level where it should be found in the pattern.
	 * **/
	ElementPattern.prototype.getTheMostPromisingClassSelectors = function(){
		// Create an array of the map.
		var mapArray = $.map(this.map, function (value, key) {return {key: key, value: value};});
		// Keep only the class type keys
		var classKeyArray = mapArray.filter(function(item){
								return _private.parser.parseRuleType(item.key) == 'class';
							});

		// Use a minHeap to keep the K first elements
		var k = $config.patterns.selectorsAmmount;
		var minHeap = new $utils.Heap(classKeyArray.slice(0, k), function (a, b) {
			return a.value < b.value
		});

		// Now, for each element left, add it to the minHeap and pop the minimum, in order to keep the K bigger elements.
		for (; k < classKeyArray.length; k++) {
			minHeap.add(classKeyArray[k]);
			minHeap.pop();
		}
		// Create a selectors set, for each level.
		var selectors = {};
		while (!minHeap.isEmpty()) {
			var item = minHeap.pop();
			var keyType = _private.parser.parseRuleType(item.key);
			$assert.ok(keyType=='class','It should be of type class');
			var level = _private.parser.parseRuleLevel(item.key);
			var classValue = _private.parser.parseRuleValue(item.key);
			// Store the selector by level:
			if(!selectors[level]) selectors[level] = [];
			if(classValue.replace(/\s*/g,'').length > 0 )
				selectors[level].push("."+classValue);
			else{
				$logger.warn("Received an empty class value from key:",item.key);
			}
		}
		return selectors;
	};

	/**
	 * Look fast for new elements for the pattern by using the class selectors  strategy
	 * **/
	ElementPattern.prototype.findElementsWithClassSelectorsStrategy = function(context){
		var defer = $.Deferred();
		var selectorsByLevel = this.getTheMostPromisingClassSelectors();
		for(var level  in selectorsByLevel){			// For each level
			var selectors = selectorsByLevel[level];
			for( var i = 0; i < selectors.length; i++){ // For selector
				var sel = selectors[i];
				this.findElementsWithSelector(sel,level);
			}
		}
		defer.resolve(); // Make it async in the future.
		return defer.promise();
	};
	ElementPattern.prototype.findElementsWithSelector = function(selector,level){
		var pattern = this;
		$(selector).each(function(){
			var target = this;
			// Go to the level 0
			while(level>0){
				target = $(target).parent();
				level -- ;
			}
			pattern.addElement(target);
		});
	};

	/**
	 * Look fast for new elements for the pattern by using the stored paths strategy (xpahts)
	 * **/
	ElementPattern.prototype.findElementsWithXpathStrategy = function(paths){
		var defer = $.Deferred();
		var pattern  = this;
		paths = paths || pattern.getPaths();
		for(var path in paths){
			// For each path, get elements that match the wildcard
			try {
				$( $xpath.fromWildcardPath(path) )
					.each(function(){
						pattern.addElement(this);
					});
			} catch(err) { $logger.error(err); }
		};
		defer.resolve(); // Make it async in the future.
		return defer.promise();
	};

	/**
	 * Look VERY SLOW for new elements for the pattern by using the DOM BFS strategy
	 * **/
	ElementPattern.prototype.findElementsWithBFSStrategy = function(context){
		var defer = $.Deferred();
		var pattern = this;
		context = context || $('body')[0];
		$utils.doAsyncBFS(context,{maxDeep: $config.patterns.maxDocumentHeight },function(element){
			// Traverse the tree context as a BFS looking for matches:
			pattern.addElement(element);
		}).done(function(){
			defer.resolve();
		});
		return defer.promise();
	};

	/**
	 * Look for elements in the entire DOM, by using all the strategies.
	 * **/
	ElementPattern.prototype.findElementsInDOM = function(){
		var defer = $.Deferred();
		if(this.isKeepingOriginalOnly()){
			this.keepOriginalOnly();
			defer.resolve();
		}else{
			var promises = [];
			promises.push(this.findElementsWithClassSelectorsStrategy());
			promises.push(this.findElementsWithXpathStrategy());
			promises.push(this.findElementsWithBFSStrategy());
			$.when.apply($, promises).then(function () {
				defer.resolve();
			});
		}
		return defer.promise();
	};

	ElementPattern.prototype.findElementsInContext = function(context){
		var defer = $.Deferred();
		var pattern = this;

		//First check if not keeping original only:
		if(pattern.isKeepingOriginalOnly()){
			pattern.keepOriginalOnly();
			defer.resolve();
		}else{
			var async = $utils.asAsync(function(){
				// Look the patterns using xpath:
				var contextPath = $xpath.getWildcardPath(context);
				for(var path in pattern.getPaths()){
					// Check if the path is inside this context:
					if(path.substring(0,contextPath.length) === contextPath){
						// This could have some false positive since now we are using wildcards, but doesn't returns false negatives.
						try {
							// Now try to get elements from wildcard and add them to the pattern:
							var targetElements = $xpath.fromWildcardPath(path);
							$(targetElements).each(function(){ pattern.addElement(this); });
						} catch(err) { $logger.error(err); }
					}
				}

				$utils.doAsyncBFS(context,{maxDeep: 50 },function(element){
					// Traverse the tree context as a BFS looking for matches:
					pattern.addElement(element);
				}).done(function(){
					defer.resolve();
				});

			});
			// Run the async function:
			async();
		}
		return defer.promise();
	};
	ElementPattern.prototype.refresh = function(targets){
		var defer = $.Deferred();
		var promises = [];
		promises.push(this.findElementsWithClassSelectorsStrategy());
		promises.push(this.findElementsWithXpathStrategy());
		$.when.apply($, promises).then(function () {
			defer.resolve(true);
		});

		/*if	(this.isKeepingOriginalOnly())
			defer.resolve(this.keepOriginalOnly());
		else{
			var hashSet = {};
			var promises = [];
			for(var i in targets){
				var targetPath =  $xpath.getWildcardPath(targets[i]);
				// Check the target is not duplicated:
				if(hashSet[targetPath]) continue;
				hashSet[targetPath] = true;
				// Check the target is contained by this pattern
				for(var path in this.getPaths()){
					if(path.substring(0,targetPath.length) === targetPath){
						promises.push(this.findPatternInContext(targets[i]));
						break;
						//affectedPaths[path] = true;
					}
				}
			}
			if(promises.length > 0) {
				// Wait for all the promises to end
				$.when.apply($, promises).then(function () {
					defer.resolve(true);
				});
			}else{
				// The pattern hasn't been affected by the targets
				defer.resolve(false);
			}
		}*/
		return defer.promise();
	};

	return ElementPattern;
});


