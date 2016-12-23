/**
 * Return localStorage as a module.
 * In this way, it can be injected as well as the other modules.
 * ***/

WAT.module('$localStorage',[],function(){
	return localStorage;
});



