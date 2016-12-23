/**
 * Module to define some pattern edition functions for the Editor plugin.
 * These are only used inside the Editor plugin.
 * **/

WAT.module('$patternsEditor',['JQuery','$editorConfig','$editorLang','Logger','$refreshDaemon','$utils','$patterns','TranscodingForm'],
    function($,$config,$lang,Logger,$refreshDaemon,$utils,$patterns,TranscodingForm){


// ------------------------------------------------------------//
// SETUP
//
    var $logger = new Logger('$patternsEditor');
    var _private = {};
    var service = {};


// ------------------------------------------------------------//
// Public API
//


    /**
     * Displays the "Edition form" linked to the pattern.
     * All the transcoding data is stored in this form.
     **/
    service.showEditionForm = function (pattern) {
        var defer = $.Deferred();
        var saved = false;
        var form = (new TranscodingForm(pattern.getMainElement(),pattern.getData('annotations'),pattern.isNew()))
            .onSave(function(annotations) {
                // If new, store the similarity threshold
                if (pattern.isNew()) {
                    var threshold = parseInt(annotations['wat-similarity-threshold']) / 100.0;
                    if(threshold > 0.99) pattern.keepOriginalOnly();
                    pattern.setData('similarity-threshold',threshold);
                }
                // This pattern is not new any more:
                pattern.setNotNew();
                // Save pattern data:
                pattern.setData('annotations',annotations);
                $logger.log('New pattern annotations:',pattern.getData('annotations'));
                // Save pattern:
                $patterns.savePattern(pattern);
                saved = true;
                defer.resolve();
            })
            .onClose(function(){
                if(!saved) defer.reject();
            })
            .createForm(pattern.id);
        form.display();
        return defer.promise();
    };

    /**
     * Highlight all the patterns with a coloured box over them.
     * (By using the postit plugin)
     * **/
    service.highlight = function (patterns,forceHighligh) {
        // Shows a colored box over each pattern.
        $logger.log('Highlighting patterns');
        patterns = patterns || $utils.objectToArray($patterns.get());
        for (var i = 0; i < patterns.length; i++){
            _private.createPostits(patterns[i],forceHighligh);
        }
    };

    /** Disable the highlight done by the highlight function **/
    service.stopHighlight = function () {
        var patterns = $patterns.get();
        var keys = Object.keys(patterns);
        for (var i = 0; i < keys.length; i++) {
            $(patterns[keys[i]].getElements()).each(function () {
                $(this).data("postit-enabled", false);
                $(this).removePostit("remove");
            });
        }
    };

    /** Remove all the highlights from the elements pattern **/
    service.removeHighlights = function (pattern) {
        var tobeRemoved = $patterns.getAssociationSet(pattern);
        $.each(tobeRemoved,function(id,aPattern){
            $.each(aPattern.getElements(),function(){
                $(this).removeData("postit-enabled");
                $(this).removePostit("remove");
            });
        });
    };

    /** Remove all the highlights from the elements pattern **/
    service.removeAllHighlights = function () {
        var pp = $patterns.get();
        $.each(pp,function(key,pattern){
            var tobeRemoved = $patterns.getAssociationSet(pattern);
            $.each(tobeRemoved,function(id,aPattern){
                $.each(aPattern.getElements(),function(){
                    $(this).removeData("postit-enabled");
                    $(this).removePostit("remove");
                });
            });
        });
    };


// ------------------------------------------------------------//
// Private functions
//
    /** Use the "postit" jquery plugin to hightlight the pattern **/
    _private.createPostits = function (pattern,forceHighligh) {

        if(!$.fn.createPostit){
            $logger.warn("Needs JQuery postit plugins to run this function.");
            return;
        }
        // Creates a colored box with buttons at the top for each element
        $refreshDaemon.stopChangeListening();
        var elements = pattern.getElements();
        var boxClass = pattern.getClasses().split(" ");
        boxClass.push($config.appElementClass);
        boxClass.push($config.patternTagClass);
        if(!pattern.getData('color')) pattern.setData('color',$utils.generateRandomColor());
        var settings = {color: pattern.getData('color'), class: boxClass};

        if (pattern.isNew()) {
            $(pattern.mainElement).createPostit(settings)
                .addPostitButton({classes:[$config.appElementClass], icon: 'fa-eye',   onClick: _private.getVisibilityFn(pattern.mainElement)})
                .addPostitButton({classes:[$config.appElementClass], icon: 'fa-pencil',onClick: _private.getEditionFn(pattern)})
                .addPostitButton({classes:[$config.appElementClass], icon: 'fa-close', onClick: _private.getCloseFn(pattern)});

            $(elements).not(pattern.mainElement).each(function () {
                $(this).createPostit(settings)
                    .addPostitButton({classes:[$config.appElementClass], icon: 'fa-eye',            onClick: _private.getVisibilityFn(this)})
                    .addPostitButton({classes:[$config.appElementClass], icon: 'fa-check-circle-o', onClick: _private.getIncludeFn(pattern)})
                    .addPostitButton({classes:[$config.appElementClass], icon: 'fa-times-circle-o', onClick: _private.getUniqueFn(pattern)});
            });
        } else {
            $(elements).filter(function(){
                return forceHighligh || !$(this).data("postit-enabled");
            }).each(function () {
                $(this).data("postit-enabled",true);
                $(this).createPostit(settings)
                    .addPostitButton({classes:[$config.appElementClass], icon: 'fa-eye',    onClick: _private.getVisibilityFn(this)})
                    .addPostitButton({classes:[$config.appElementClass], icon: 'fa-pencil', onClick: _private.getEditionFn(pattern)})
                    .addPostitButton({classes:[$config.appElementClass], icon: 'fa-close',  onClick: _private.getCloseFn(pattern)});
            });
        }
        $refreshDaemon.startChangeListening();
    };

    // ------------------------------------------------------------//
    // Generators:
    // These functions will create the callback for each function in the postit
    //
        _private.getVisibilityFn = function (elem) {
            // Turns on and off the postit
            return function () {
                $(elem).hidePostit();
                $(elem).hidePostitContent();
            }
        };
        _private.getIncludeFn = function (pattern) {
            // Accepts all the identified elements as part of the pattern
            return function () {
                $(pattern.getElements()).each(function () {
                    $(this).removePostit("remove")
                });
                pattern.setNotNew();
                _private.createPostits(pattern.getElements(), pattern);
                $patterns.savePattern(pattern);
            }
        };
        _private.getUniqueFn = function (pattern) {
            // Rejects the identified elements and only stores the main element
            return function () {
                $(pattern.getElements()).each(function () {
                    $(this).removePostit("remove")
                });
                pattern.keepOriginalOnly();
                _private.createPostits(pattern.getElements(), pattern);
                $patterns.savePattern(pattern);
            }
        };
        _private.getEditionFn = function (pattern) {
            // Opens the edition form
            return function () {
                service.showEditionForm(pattern);
            }
        };
        _private.getCloseFn = function (pattern) {
            // Removes the pattern.
            return function () {
                if (confirm($lang.get('q_delete_pattern'))) {
                    service.removeHighlights(pattern);
                    $patterns.removePattern(pattern);
                }
            }
        };
    //
    // End of generators
    // ------------------------------------------------------------//

    return service;
});