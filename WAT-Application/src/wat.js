/** WAT framework:
 *
 * Wat es una aplicación modular. Cada modulo se genera por medio de la funcion WAT.module,
 * la misma integra el ID del modulo, un vector de dependecias (ids de otros modulos)
 * y una función callback que será ejecutada inyectando las dependencias solicitadas como parametros.
 *
 * ***/

var WAT = (function($){


// ------------------------------------------------------------//
// SETUP
//
    var _private = {};

    /** Public API **/
    var app = {};
    /** Make collections available **/
        app.modules = {};
        app.unloadedModules = {};

// ------------------------------------------------------------//
// Private scope
//

    /** Log if there is still unloaded modules **/
    _private.logUnloadedModules = function(){
        var unloaded = Object.keys(app.unloadedModules);
        if(app.lastCheck === unloaded.length) return;
        app.lastCheck = unloaded.length;
        if(unloaded.length > 0){
            console.warn("Some modules are still waiting to be loaded",app.unloadedModules);
        }
    };
    setInterval(_private.logUnloadedModules,5000);



    /** Get unresolved dependencies **/
    _private.check_unresolved_dependencies = function(id,dep){
        var unresolved_deps = {};
        for(var i in dep){
            if(dep[i] == "JQuery") continue;
            if (!app.modules[dep[i]]) unresolved_deps[dep[i]] = true;
        }
        return unresolved_deps;
    };

    /** Get dependency modules from string array **/
    _private.get_dependencies = function (dep){
        var dependencies = [];
        for (var i in dep){
            var dependency = dep[i];
            switch (dependency) {
                case "JQuery":
                    dependencies.push($);
                    break;
                default:
                    dependencies.push(app.modules[dependency]);
                    break;
            }
        }
        return dependencies;
    };

    /** Add new dependency and execute those modules which dependencies are resolved **/
    _private.resolve_dependecy = function (dep_id){
        for(var mid in app.unloadedModules){
            var module = app.unloadedModules[mid];
            if (!module.unresolved[dep_id]) continue;
            delete module.unresolved[dep_id];
            if (Object.keys(module.unresolved).length > 0) continue;
            _private.execute_module(mid,module.deps,module.callback);
            delete app.unloadedModules[mid];
        }
    };

    /** Initializes a new module **/
    _private.execute_module = function(id,dependencies,callback){
        var dependency_injection = _private.get_dependencies(dependencies);
        app.modules[id] = callback.apply(this,dependency_injection);

        // Resolve dependencies:
        _private.resolve_dependecy(id);
    };


// ------------------------------------------------------------//
// Public API
//

    /** Define a new module **/
    app.module = function(id,dependencies,callback){
        if(app.modules[id] || app.unloadedModules[id]) throw 'Module id '+id+' already exist.';

        var unresolved_deps = _private.check_unresolved_dependencies(id,dependencies);
        if (Object.keys(unresolved_deps).length == 0) {
            // Module's dependencies are resolved, execute the module:
            _private.execute_module(id,dependencies,callback);
        } else {
            // Module's dependencies are not resolved, wait for them:
            app.unloadedModules[id]= {
                deps:dependencies,
                unresolved:unresolved_deps,
                callback: callback
            };
        }
    };

    /** Define a loaded module **/
    app.getModule = function (id){
        return app.modules[id];
    };


    /** Return public API **/
    return app;

})(jQuery);