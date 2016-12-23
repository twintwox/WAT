/**
 * Provide an interface for the Chrome explorer extension.
 *
 * This module will communicate with the plugin popup that is available in the Chrome toolbar.
 * The entries defined in this interface are going to be visible in that popup.
 *
 * ***/

WAT.module('ChromeInterface',['JQuery','Logger','$config'],function($,Logger,$config){
	var $logger = new Logger('ChromeInterface');


// ------------------------------------------------------------//
// CHROME INTERFACE:
// A new chrome interface should be instantiated by each plugin.
//
//
	var ChromeInterface = function () {
		this.interface = [];
		this.mapInterface = {};
		/* Listen for state changes */
		var self = this;
		chrome.runtime.onMessage.addListener(function(msg, sender, response) {
			$logger.log("Chrome message received",msg.from,msg.key);
			if(msg.from   !== 'popup') return;
			if(msg.subject ==='entry')  self.mapInterface[msg.key].callback();
			if(msg.subject ==='toggle') self.mapInterface[msg.key].callback(msg.value);
		});
	};

	/**
	 * AddEntry will add a button to the popup that will trigger the callback once pressed
	 * @param key: An unique ID for the entry
	 * @param description: The button text to show
	 * @param callback: The action to be executed once the button has been pressed.
	 */
	ChromeInterface.prototype.addEntry = function (key,description,callback) {
		if(this.mapInterface[key]) this.remove(key);
		var entry = {
			type:'entry',
			key:key,
			desc:description,
			callback:callback
		};
		this.interface.push(entry);
		this.mapInterface[key] = entry;
	};

	/**
	 * AddToggle will add a checkbox to the popup that will trigger the callback
	 * passing a boolean as parameter to reflect the checkbox state.
	 * @param key: An unique ID for the entry
	 * @param description: The checkbox text to show
	 * @param deff: the initial checkbox value (if it has not been changed before)
	 * @param callback: A function that received a boolean parameter and executes the corresponding action
	 */
	ChromeInterface.prototype.addToggle = function (key,description,deff,callback) {
		if(this.mapInterface[key]) this.remove(key);
		var toggle = {
			type:'toggle',
			key:key,
			desc:description,
			default:deff,
			callback:callback
		};
		this.interface.push(toggle);
		this.mapInterface[key] = toggle;
	};

	ChromeInterface.prototype.remove = function (key) {
		var index = -1;
		for(var i = 0; i< this.interface.length;i++){
			if(this.interface[i].key !== key) continue;
			index = i;
			break;
		}
		if(index >= 0) this.interface.splice(index,1);
		delete this.mapInterface[key];
	};

	/**
	 * This must be called once all the entries have been defined in order to "rebuild" the popup.
	 * */
	ChromeInterface.prototype.initialize = function () {
		var defer = $.Deferred();
		if(!$config.chromeInterfaceStorage){
			$log.error('No interface storage name defined');
			defer.reject();
		}else{
			var store = {};
			store[$config.chromeInterfaceStorage] = this.interface;
			/* Set interface directly on the Chrome.storage so the popup can read*/
			chrome.storage.sync.set(store,function(){
				/* Get the stored values */
				var valuesStoreName = $config.chromeInterfaceStorage+"_VALUES";
				chrome.storage.sync.get(valuesStoreName,function(values){
					values = values[valuesStoreName] || {};
					defer.resolve(values);
				});
			});
		}
		return defer.promise();
	};
	return ChromeInterface;
});


