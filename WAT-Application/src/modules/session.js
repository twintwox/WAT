/**
 *  Module session
 *  Manages all the stored information of the application.
 *  This allows 2 level of storage:
 *  	- Domain storage (setting the persistent parameter in false), it uses de $localStorage to store the data.
 *  	And it will be available only in pages of the same domain. Use this for large data, specially the data related
 *  	to the domain.
 *
 *  	- Global storage (setting the persistent parameter in true), it uses the $persistentStorage to store the data.
 *  	And it will be available in any domain (while the Chrome explorer is logged with the same user). Use this for short
 *  	data that it is not related to the domain
 *
 * **/

WAT.module('$session',['JQuery','$config','Logger','$utils','$localStorage','$persistentStorage'],
	function($,$config,Logger,$utils,$localStorage,$persistentStorage){

	var $logger = new Logger('$session');

	var Session = function(){
		if(!$localStorage) throw new Error('Session module cant be created: No storage.');
		$logger.info('Session initiated');
		this.cache = {};
	};

	/** An application prefix used in all the keys stored **/
	Session.prototype.getPrefix = function() {
		return $config.prefix;
	};
	Session.prototype.enabled = function() {
		return typeof  $localStorage !== 'undefined';
	};
	Session.prototype.disabled = function() {
		return !this.enabled();
	};

	/** Store a single object **/
	Session.prototype.save = function(key,object,persistent) {
		if (this.disabled()) return false;
		if (!object.asJSON) {
			$logger.error("Session's save must receive an Object that implements asJSON function");
			return false;
		}
		var value = object.asJSON();
		if (!value) {
			$logger.error("asJSON function returned an undefined value");
			return false;
		}
		if(persistent) $persistentStorage.setItem(this.getPrefix()+key , value);
		else $localStorage.setItem(this.getPrefix()+key , value);
		delete this.cache[key];
		return true;
	};
	/** Get a single object **/
	Session.prototype.get = function(key) {
		try{
			if(this.disabled()) return null;
			// Look in local storage
			var value = $localStorage.getItem(this.getPrefix()+key);
			// Look in persistent storage
			if(!value || value === '')
				value = $persistentStorage.getItem(this.getPrefix()+key);

			if(!value || value === '') return null;
			return value && JSON.parse(value);
		}catch(err){
			return null;
		}
	};

	/** Convert a regular object into a "persistentObject", that contains a function called "asJSON". **/
	Session.prototype.asPersistentObject = function (obj) {
		obj.asJSON = function() {
			var json = {};
			for(var i in this) {
				if(typeof this[i] !== "function"){
					json[i]=this[i];
				}
			}
			return JSON.stringify(json);
		};
		return obj;
	};

	/** Store an array of objects **/
	Session.prototype.saveArray = function(key,array,persistent) {
		var jsonArr = [];
		for(var i in array){
			var obj = array[i];
			if(!obj.asJSON) obj = this.asPersistentObject(obj);
			jsonArr.push(obj.asJSON());
		}
		if(persistent) $persistentStorage.setItem(this.getPrefix()+key , jsonArr);
		else $localStorage.setItem(this.getPrefix()+key , jsonArr);
		delete this.cache[key];
		return true;
	};

	/** Get an array of objects **/
	Session.prototype.getArray = function(key) {
		try {
			if (this.disabled()) return null;
			// Look in local storage
			var value = $localStorage.getItem(this.getPrefix() + key);
			// Look in persistent storage
			if(!value || value === '')
				value = $persistentStorage.getItem(this.getPrefix() + key);

			if(!value || value === '') return null;
			value = value && JSON.parse('[' + value + ']');
			if (!value) return [];
			if (!$.isArray(value)) value = [value];
			return value;
		} catch(err){
			return null;
		}
	};

	/** Clear all the session **/
	Session.prototype.remove = function(key) {
		if(!this.enabled()) return false;
		//$localStorage.removeItem seems not to be working..
		var val = this.get(key) || this.getArray(key);
		if(val === null) return false;
		$localStorage.setItem(this.getPrefix()+key,'');
		return true;
	};

	/** Clear all the session **/
	Session.prototype.deleteAll = function(){
		$localStorage.clear();
		$persistentStorage.clear();
		return this;
	};

	/**
	 * Collection methods offer a interface for handling heavier objects, adding a cache and mapping each collection
	 * instance through a factory method.
	 * Collection items must implement getId() method.
	 * **/

	/** Get a collection of objects **/
	Session.prototype.getCollection = function(collectionId,factory,afterLoad,avoidCache) {
		if(!avoidCache && this.cache[collectionId]) return this.cache[collectionId];

		var collection = this.getArray(collectionId) || [];
		var mapping = $.map(collection,function(item){
			return factory(item);
		});
		this.cache[collectionId] = $utils.arrayToObject(mapping);
		if(typeof afterLoad === 'function') afterLoad(this.cache[collectionId]);
		return this.cache[collectionId];
	};
	/** Store a collection of objects **/
	Session.prototype.saveCollection = function(collectionId,collection) {
		var array = $utils.objectToArray(collection);
		this.saveArray(collectionId,array);
		this.cache[collectionId] = collection;
	};

	return new Session();

});

