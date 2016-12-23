/**
 * WAT Test Objects
 *
 * Objects and functions that are used for testing wat.test
 * ***/

var ModuleExecution = function (id) {
    this.id = id;
    this.executed = false;
};
ModuleExecution.prototype.isExecuted = function (){
    return this.executed;
};
ModuleExecution.prototype.getId = function (){
    return this.id;
};
var getExecuteFn = function (module){
    return function () {
        module.executed = true;
        return {};
    }
};
