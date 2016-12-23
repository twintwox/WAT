
WAT.module('$localStorage',[],function(){

    var store = {};
    var service = {};
    service.getItem = function(key){
        var temp = store[key];
        return temp;
    };
    service.setItem = function(key,val){
        store[key] = val;
    };
    service.clear = function(){
        store = {};
    };
    service.remove = function(key){
        delete store[key];
    };

    return service;
});