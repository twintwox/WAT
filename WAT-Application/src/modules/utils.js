/**
 * Module that provides a library for Common functionality as data structures or algorithms.
 * **/
WAT.module('$utils',['JQuery','$config','$lang'],function($,$config,$lang){

	var library = {};

	/** Queue implementation: **/
	var Queue = function(){ this.q = [];};
	Queue.prototype.add 		= function(elem){ this.q.push(elem);};
	Queue.prototype.isEmpty 	= function(){ return this.q.length == 0; };
	Queue.prototype.peek 	= function(){return this.q[0];};
	Queue.prototype.poll 	= function() {
		var elem = this.q[0];
		this.q.shift();
		return elem;
	};
	library.Queue = Queue;

	/** Stack implementation: **/
	var Stack = function(){this.st = [];};
	Stack.prototype.push		= function(el){this.st.push(el);};
	Stack.prototype.isEmpty 	= function(){ return this.st.length == 0; };
	Stack.prototype.pop 		= function(){return this.st.pop();};
	Stack.prototype.peek 	= function(){return this.st[this.st.length-1];};
	library.Stack = Stack;


	/** Heap implementation: **/
	var Heap = function(arr,compare){
		this.heap = [null];
		if(arr){
			this.heap = arr.slice();
			this.heap.unshift(null);
		}
		this.compare = compare || function(a,b){return a<b};
		this.heapify();
	};
	Heap.prototype.heapify = function() {
		for(var i = 1; i<= this.last(); i++){
			this.bubbleUp(i);
		}
	};
	Heap.prototype.swap = function(a,b) {
		var temp = this.heap[a];
		this.heap[a] = this.heap[b];
		this.heap[b] = temp;
	};
	Heap.prototype.getBestChildren = function(index) {
		var left = index*2;
		var right = index*2+1;
		if(left >= this.heap.length) return null;
		if(right>= this.heap.length) return left;
		if(this.compare(this.heap[left],this.heap[right])) return left;
		return right;
	};
	Heap.prototype.getParent = function(index) {
		if(index==1) return null;
		return Math.floor(index/2);
	};

	Heap.prototype.bubbleUp = function(idx) {
		var parent = this.getParent(idx);
		while(idx > 1 && this.compare(this.heap[idx],this.heap[parent])){
			this.swap(idx,parent);
			idx = parent;
			parent = this.getParent(idx);
		}
	};
	Heap.prototype.bubbleDown = function(idx) {
		var bestChild = this.getBestChildren(idx);
		while(bestChild){
			if(this.compare(this.heap[bestChild],this.heap[idx])){
				this.swap(bestChild,idx);
				idx = bestChild;
				bestChild = this.getBestChildren(idx);
			}else{
				break;
			}
		}
	};
	Heap.prototype.size = function() {
		return this.heap.length-1;
	};
	Heap.prototype.last = function() {
		return this.heap.length-1;
	};
	Heap.prototype.add = function(elem) {
		this.heap.push(elem);
		this.bubbleUp(this.last());
		return this;
	};
	Heap.prototype.pop = function() {
		var head = this.heap[1];
		this.swap(1,this.last());
		this.heap.pop();
		this.bubbleDown(1);
		return head;
	};
	Heap.prototype.peek = function() {
		return this.heap[1];
	};
	Heap.prototype.isEmpty = function() {
		return this.heap.length == 1;
	};

	library.Heap = Heap;


	/** Random color string generator **/
	library.generateRandomColor = function() {
		return "#"+((1<<24)*Math.random()|0).toString(16);
	};

	/**  Test whether a string belongs to one of our application namespace **/
	library.excludeThisName = function(str){
		return $config.excludeClassRegex.test(str.toLowerCase());
	};

	/**
	 *  Splits the string of classes of a DOM element, returning a map.
	 * 	Also avoid including any class starting with the prefix 'wat-'
	 **/
	library.splitClasses = function(classes){
		var c = {};
		if(classes){
			if(typeof classes === 'string') classes = classes.split(/\s+/);
			if($.isArray(classes)){
				$(classes)
					.filter(function(idx){
						if (classes[idx].replace(/\s*/g,'').length == 0) return false;
						return ! library.excludeThisName(classes[idx]);
					})
					.each(function(){  c[this]=true; });
			}
		}
		return c;
	};

	/** Computes the height of the tree (of a DOM element). **/
	library.getElementHeight = function(element){
		var cacheField = $config.prefix + 'height';
		if($(element).data(cacheField))return $(element).data(cacheField);
		var max=0;
		var queue = new Queue();
		queue.add({elem:element,h:0});
		while(!queue.isEmpty()){
			var curr = queue.poll();
			max=Math.max(max,curr.h);
			$(curr.elem).children().each(function(){
				queue.add({elem:this,h:curr.h+1});
			});
		}
		$(element).data(cacheField,max);
		return max;
	};

	/** Transforms an array of objects into a map (object), using getId() as key if possible **/
	library.arrayToObject = function(array){
		return array.reduce(function(store,item,idx){
			if(item.getId) store[item.getId()] = item;
			else store[idx] = item;
			return store;
		},{});
	};

	/** Transforms an object values into an array: **/
	library.objectToArray = function(obj){
		return Object.keys(obj).reduce(function(store,item){
			store.push(obj[item]);
			return store;
		},[]);
	};


	/** Traverse a DOM element using Breath first search technique.
	 *
	 * @param rootElement The starting DOM element;
	 * @param settings Object that could contain:
	 * 			=> "maxDeep", a number representing the maximum deep level used as a breakpoint to avoid traversing the whole tree.
	 *			=> "initialData" an	object to be piped as "data" parameter for when visiting the root node.
	 * @param step is a function that receives three parameters:
	 *  		=> "element" the current element being visited in the step.
	 * 			=> "deepness" the current element distance from the root
	 *  		=> "data": an object that is piped through the element children from their parents
	 */
	library.doBFS = function(rootElement,settings,step){
		var q = new library.Queue();
		q.add({
			element:rootElement,
			deepness:0,
			data: settings.initialData || {}
		});
		while(!q.isEmpty()){
			var current = q.poll();
			if(settings.maxDeep && current.deepness > settings.maxDeep) break;

			// Visit current node:
			var childData = step(current.element,current.deepness,current.data) || {};

			// Add children nodes:
			var children = current.element.children;
			for (var i = 0; i < children.length; i++) {
				q.add({
					element:  children[i],
					deepness: current.deepness+1,
					data:	  childData
				});
			}
		}
	};

	/** Traverse a DOM element using Breath first search technique,
	 * but by executing each step as asynchronous functions.
	 *
	 * @param rootElement The starting DOM element;
	 * @param settings Object that could contain:
	 * 			=> "maxDeep", a number representing the maximum deep level used as a breakpoint to avoid traversing the whole tree.
	 *			=> "initialData" an	object to be piped as "data" parameter for when visiting the root node.
	 * @param step is a function that receives three parameters:
	 *  		=> "element" the current element being visited in the step.
	 * 			=> "deepness" the current element distance from the root
	 *  		=> "data": an object that is piped through the element children from their parents
	 */
	library.doAsyncBFS = function(root,settings,step){
		var defer = $.Deferred();
		var asyncStep = library.asAsync(step);
		settings.deepness = settings.deepness || 0;
		settings.initialData = settings.initialData || {};
		if(settings.maxDeep && settings.deepness > settings.maxDeep){
			// Break because of maxDeep reached
			defer.resolve();
			return defer.promise();
		}
		// Do step:
		asyncStep(root,settings.deepness,settings.initialData).done(function(childData){
			// Add children nodes:
			var childSettings = {};
			$.extend(childSettings,settings);
			childSettings.initialData = childData;
			childSettings.deepness = childSettings.deepness+1;

			var promises = [];
			var children = $(root).children();
			for (var i = 0; i < children.length; i++) {
				promises.push(library.doAsyncBFS(children[i],childSettings,step));
			}
			// Wait for all the promises to end
			$.when.apply($, promises).then(function () {
				defer.resolve();
			});
		});
		return defer.promise();
	};


	/** Do an iterative postorder traversal.
	 *
	 * @param rootElement: the initial element for the traversal
	 * @param settings: object that could contain:
	 * 			=> maxDeep: a number representing the maximum deep level used as a breakpoint to avoid traversing the whole tree.
	 * @param step: a function that received three parameters:
	 *	 		=> "element" the element being visited
	 *			=> "deepness" a number representing the distance of the element from the root.
	 *			=> "responses" an array of the node children responses.
	 * @returns {*}
	 */
	library.doPostorder = function(rootElement,settings,step){

		var stack = new library.Stack();
		stack.push({element:rootElement, deepness:0, childrenVisited:false});

		var responses = {};
		while(!stack.isEmpty()){

			var current = stack.peek();
			if(typeof settings.maxDeep !='undefined' && current.deepness > settings.maxDeep){
				stack.pop();
				continue;
			}
			if(current.childrenVisited || $(current.element).children().length === 0){
				// Pop current
				stack.pop();

				// Visit node
				var res = step(current.element,current.deepness,responses[current.deepness+1]||[]) || {};
				// Clear the responses of its children, to be reused by other children at the same level.
				delete responses[current.deepness+1]

				// Save response to send it to its parent.
				if(!responses[current.deepness]) responses[current.deepness] = [];
				responses[current.deepness].push(res);

			}else{
				current.childrenVisited = true;

				// Visit children
				var children = $(current.element).children();
				for (var i = 0; i < children.length; i++) {
					stack.push({
						element:  children[i],
						deepness: current.deepness + 1,
						childrenVisited:false
					});
				}
			}
		}
		return responses[0]?responses[0][0]:null;
	};

	/** Converts a regular function into a asynchronous one, returning a promise **/
	library.asAsync = function(fn){
		return function(){
			var params = arguments;
			var defer = $.Deferred();
			setTimeout(function(){
				defer.resolve(fn.apply(null,params));
			},0);
			return defer.promise();
		};
	};

	/** Generates an unique Id **/
	library.getFakeId = function(prefix){
		prefix = prefix || '';
		return $config.prefix+prefix+Date.now()+'-'+(Math.round(Math.random()*1000));
	};

	/** Get the speech text for an element **/
	library.getSpeechTextForElement = function(element){

		// Get the text for role:
		var text = $lang.get('shortcut_name_for_'+$(element).attr('role'));
		if(text === 'UNDEFINED') text = $(element).text();

		// If it is a heading, replace for the inner text:
		if(
			$(element).attr('role')==='heading' ||
			(!$(element).attr('role') && $(element).is('h1,h2,h3,h4,h5,h6'))
		) text = $lang.get('shortcut_name_for_title')+', '+$(element).text();

		// If it has a label, replace for it
		if($(element).attr('aria-label')) text = $(element).attr('aria-label');

		// If it has a labelledby, replace for it
		if($(element).attr('aria-labelledby')) text = $('#'+$(element).attr('aria-labelledby')).text();

		return text;
	};

	/** Memorize an attribute value before setting a new one **/
	library.memo = function(elem,attrName){
		var memoKey = 'wat-initial-'+attrName;
		if(!$(elem).data(memoKey)) $(elem).data(memoKey, $(elem).attr(attrName) || 'none');
		var storedValue = $(elem).data(memoKey);
		return storedValue != 'none'? storedValue : null;
	};

	/** Trigger an custom event on the window **/
	library.trigger = function(name,data){
		var newEvent = $.Event( name );
		newEvent.params = data;
		//console.log(newEvent);
		$(window).trigger(newEvent);
	};

	return library;
});