/**
 * Patterns module.
 * This module provides static functions to handle the patterns collection:
 * Loading and saving it, importing and exporting it.
 * As well as finding all the patterns in the DOM and handling a refresh function to find the patterns only in the
 * affected area.
 * ***/

WAT.module('$patterns', ['JQuery','$config', 'Logger', '$session', 'ElementPattern','$refreshDaemon'],
    function ($,$config, Logger, $session, ElementPattern,$refreshDaemon) {

// ------------------------------------------------------------//
// SETUP
//
    var $logger = new Logger('$patterns');
    // The key used to store the collection in the session.
    var store_id = 'patterns';

// ------------------------------------------------------------//
// Public scope
//

    var service = {};

    /** Factory function used to instantiate each pattern when loading the collection **/
    var factory = function (item) {
        var elem = new ElementPattern();
        return elem.import(item);
    };

    /** Function to be executed by the session once the collection has been loaded and before being cached **/
    var after = function (patterns) {
        $.each(patterns,function(){
            var root = this.getRootAssociation();
            if( typeof root === 'string'){
                this.setRootAssociation( patterns[root] || null );
            }
        });
    };

    /** Loads the patterns from a string into the session. **/
    service.fromString = function(dataString){
        var data = JSON.parse(dataString);
        $logger.log('Patterns loaded:',data.length);
        $session.saveArray(store_id,data);
    };

    /** Returns all the pattern collection as a string to be easily stored. **/
    service.stringify = function(){
        // Return the patterns as a string
        var str = JSON.stringify($session.getArray(store_id));
        if(str === "null") return null;
        return str;
    };


    /** Returns all the pattern collection **/
    service.get = function (avoidCache) {
        return $session.getCollection(store_id, factory, after, avoidCache);
    };

    /** Save all the pattern collection **/
    service.save = function (collection) {
        if(!collection) collection = service.get();
        $session.saveCollection(store_id, collection);
    };

    /** Save a single pattern into the collection **/
    service.savePattern = function(pattern){
        var pp = service.get();
        pp[pattern.getId()] = pattern;
        service.save(pp);
    };

    /** Returns a set of all the patterns associated to the one passed as parameter **/
    service.getAssociationSet = function(pattern){
        var patterns = service.get();
        var association = {};
        association[pattern.getId()] = pattern;
        for(var pid in pattern.getAssociates()){
            if(patterns[pid]) association[pid] = patterns[pid];
        }
        var rootId = pattern.getRootAssociationId();
        if(rootId!=null && patterns[rootId]){
            association[rootId] = patterns[rootId];
        }
        return association;
    };

    /** Removes a pattern from the collection **/
    service.removePattern = function(pattern){
        var pp = service.get();
        var tobeRemoved = service.getAssociationSet(pattern);
        $.each(tobeRemoved,function(id,object){
            object.removeAllElements();
            delete pp[id];
        });
        service.save(pp);
    };

    /** Removes all the patters from the collection **/
    service.removeAllPatterns = function(){
        $.each(service.get(),function(key,pattern){
            var tobeRemoved = service.getAssociationSet(pattern);
            $.each(tobeRemoved,function(id,object){
                object.removeAllElements();
            });
        });
        $session.saveArray(store_id,[]);
    };

    /**
     *  Refresh all patterns looking for new matches (Faster than findPatternsInDOM)
     *  It only refresh in the affected targets
     *
     *  No need to stop daemon listening,
     *  since all the refresh function runs when the daemon calls (and it does it without the listening)
     * **/
    service.refresh = function(targets){
        $logger.log('Refreshing patterns');
        var defer = $.Deferred();
        var patterns = service.get() || {};
        var patternsChanged = [];
        var promises = [];
        $.each(patterns,function(key,pattern){
            var promise = pattern.refresh(targets);
                promises.push(promise);
                promise.done(function(affected){
                    if(affected) patternsChanged.push(pattern);
                });
        });
        // Wait for all the promises to end
        $.when.apply($, promises).then(function () {
            $logger.log('Patterns refresh finished',arguments);
            if(patternsChanged.length>0) service.save(patterns);
            defer.resolve(patternsChanged);
        });
        return defer.promise();
    };

    /**
     * Execute the findElementsInDOM for each pattern
     * This is expensive, it looks for all the patterns in the whole DOM. (Avoid using it frequently)
     * **/
    service.findPatternsInDOM = function(){
        var defer = $.Deferred();
        $logger.log('Finding patterns in DOM');
        // Exclude changes from the daemon
        $refreshDaemon.stopChangeListening();

        $logger.log('Searching patterns');
        var promises = [];
        var patterns = service.get() || {};
        $.each(patterns,function(key,pattern){
           promises.push(pattern.findElementsInDOM());
        });
        // Wait for all the promises to end
        $.when.apply($, promises).then(function () {
            if(Object.keys(patterns).length > 0) service.save(patterns);
            // Enable the daemon again
            $refreshDaemon.startChangeListening();
            defer.resolve();
        });
        return defer.promise();
    };


    return service;
});

