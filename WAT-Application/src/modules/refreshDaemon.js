/**
 *
 * RefreshDaemon it is a module that watch for DOM changes and executes all the bounded tasks.
 * It manages the task execution lapse, by setting a minimum and maximum time lapse to guarantee that the tasks
 * are gonna to be executed in lapses between the min and max lapse set.
 *
 * The frequency cycle is used to check whether the tasks have to be executed or not.
 *
 * Be care of the tasks added to this daemon taking in care the min and max lapse
 * (if the tasks take too long, by the time they finish a new cycle could be triggered,
 * executing them again and again and that would collapse the whole app).
 *
 *
 * "---Preventing the Daemon:---"
 *
 * => Element classes can be added to ignore the DOM mutations triggered by those elements that match any those the classes.
 * (To avoid mutation from elements of our own application).
 *
 * => If a full DOM modification needs to be done, you may consider using the $refreshDaemon.stopChangeListening() to prevent
 * the triggering, and after your job is done start it again by using the $refreshDaemon.startChangeListening().
 *
 * **/

WAT.module('$refreshDaemon',['JQuery','$config','Logger','XpathBuilder','$utils'],function($,$config,Logger,XpathBuilder,$utils){

	var $logger = new Logger('$refreshDaemon');
	var $xpath  = new XpathBuilder();
	var excludedTagNames = { "BODY":true, "HEAD": true, "SCRIPT": true };

	// Set config namespace:
	$config.refreshDaemon = {};
	$config.refreshDaemon.frequency = 750; 	// Frequency of each cycle
	$config.refreshDaemon.minLapse  = 1500;		// Prevent execution at least every minLapse ms.
	$config.refreshDaemon.maxLapse  = 20000;	// Force execution every maxLapse ms.


	var _private = {};

	var Daemon = function(){
		this.tasks = [];
		this.targets = [];
		this.barrier = 0;
	};

	Daemon.prototype.initialize = function() {
		var self = this;
		this.classes 	= [];	 // Ignored target classes.
		this.class 		= "";
		this.targets	= {};	 // Change targets during cycle.
		this.locked 	= false;  // Lock to avoid multiple executions.

		this.timeoutCallback = function(){
			$logger.log('Timeout');
			self.changeCallback({target:$('body')[0],avoidFilter:true});
		};

		this.changeCallback = function(event){
			if(self.tasks.length == 0) return;
			if(!event || !event.target || $(event.target).is(self.class))return;
			if(!event.avoidFilter && excludedTagNames[event.target.tagName]) return;
			//Check that element is not inside an excluded element:
			var aux = event.target;
			while(aux.parentNode){
				if($(aux.parentNode).is(self.class)) return;
				aux = aux.parentNode;
			}

			var key = $xpath.getPath(event.target);
			if(self.targets[key]) return;
			//$logger.log("New target",event.target);
			self.targets[key] = event.target;
		};
		this.callback = function() {

			if(self.tasks.length == 0)return;	// No tasks to run.
			if(Object.keys(self.targets).length == 0)return; // No DOM changes.
			if(self.locked)return;
			self.locked=true;	// Lock

    		self.stopChangeListening();

    		self.execute($utils.objectToArray(self.targets)).done(function(){
				self.targets={};// Reset DOM changes.
				self.startChangeListening();

				if(self.t) clearTimeout(self.t);
				self.t = setTimeout(function(){self.locked=false;},$config.refreshDaemon.minLapse);
			});
		};
		return this;
	};

	/** Reset all tasks **/
	Daemon.prototype.reset = function() {
		$logger.info("Restarting daemon");
		this.stopChangeListening();
		this.tasks = [];
		this.initialize();
		this.start();
		return this;
	};

	/** Start daemon **/
	Daemon.prototype.start = function() {
		$logger.info("Daemon started");
		this.barrier = 0;
		this.startChangeListening();
		this.i = setInterval(this.callback,$config.refreshDaemon.frequency);
		this.ii= setInterval(this.timeoutCallback,$config.refreshDaemon.maxLapse);
	};

	/** Stop daemon **/
	Daemon.prototype.stop = function() {
		$logger.info("Daemon stopped");
		this.barrier = 0;
		this.stopChangeListening();
		clearInterval(this.i);
	};

	/** Start listening changes **/
	Daemon.prototype.startChangeListening = function() {
		this.barrier ++;
		if(this.barrier == 1)
			$(document).on('DOMSubtreeModified',this.changeCallback);
		return this.barrier > 0;
	};

	/** Stop listening changes **/
	Daemon.prototype.stopChangeListening = function() {
		this.barrier --;
		if(this.barrier == 0)
			$(document).off('DOMSubtreeModified',this.changeCallback);
		return this.barrier < 1;
	};

	/** Add a new task to be executed in each cycle **/
	Daemon.prototype.addTask = function(fn) {
		this.tasks.push(fn);
		$logger.info("New Task ["+this.tasks.length+"] added to daemon.");
	};

	/** Remove a task added before **/
	Daemon.prototype.removeTask = function(fn) {
 		$logger.log("Daemon task removed called.");
		var index = this.tasks.indexOf(fn);
		if (index > -1){
			$logger.log("Task removed from daemon.");
			this.tasks.splice(index, 1);
		}
	};

	/** Add a new class to ignore the matched elements **/
	Daemon.prototype.ignoreClassMutation = function(c) {
		if(typeof c!== 'string')return;
		this.classes.push(c);
		this.class = buildClass(this.classes);
		$logger.log("Refresh daemon now ignoring \"",c,"\"");
	};

	/** Remove an ignored class **/
	Daemon.prototype.removeFromIgnoreClass = function(c) {
		this.classes = $(this.classes).filter(function(){
			return c.indexOf(this) == -1;
		}).toArray();
		this.class = buildClass(this.classes);
		$logger.log("Refresh daemon not ignoring \"",c,"\" any more");
	};

	/** Execute all the tasks, sending the targets array (those elements that were mutated) **/
	Daemon.prototype.execute = function(targets) {
		var defer = $.Deferred();

		$logger.log("Executing tasks...",targets);
		var start = new Date().getTime();
		var promises = [];
		for(var i in this.tasks){
			promises.push(this.tasks[i](targets));
		}
		$.when.apply($, promises).then(function(){
			var end = new Date().getTime();
			var time = end - start;
			$logger.log("Tasks finished, time:",time);
			defer.resolve();
		});

		return defer.promise();
	};

	var buildClass = function(arr){
		if(arr.length==0)return "";
		return '.'+arr.join(',.');
	};

	/** Singleton **/
	var daemon = (new Daemon()).initialize();
	daemon.start();
	return daemon;
});
