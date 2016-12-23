/**
 * Assert implementation.
 * ***/

WAT.module('$assert',[],function(){
	var service = {};
	service.ok = function (bool,msg){
		if(bool) return;
		console.error(msg);
		throw new Error(msg);
	};
	service.notOk = function (bool,msg){
		if(!bool) return;
		console.error(msg);
		throw new Error(msg);
	};
	return service;
});

