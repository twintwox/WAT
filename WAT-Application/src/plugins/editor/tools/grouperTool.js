/**
 *  GROUPER TOOL module.
 *  This module manages the toolbar logic for grouping a set of HTML elements and then creating an ElementPatterns
 *  from it.
 *
 * */
WAT.module('$grouperTool',['JQuery','$editorConfig','$editorLang','Logger','$patterns','$patternsEditor','ElementPattern','Highlighter','LoadingMsg'],
    function($,$config,$lang,Logger,$patterns,$patternsEditor,ElementPattern,Highlighter,LoadingMsg){


// ------------------------------------------------------------//
// SETUP
//
    var $logger = new Logger('$grouperTool');
    $config.grouperTool = {
        targetElementClass: $config.prefix+'possibleTargetElement',
        targetSelectedClass: $config.prefix+'selectedTarget',
        elementPatternClass:  $config.prefix+'elementPattern'
    };



// ------------------------------------------------------------//
// Grouper class
//
    var $grouperTool;
    var GrouperTool = function () {};

    GrouperTool.prototype.initialize = function(){
        this.groupHighlighter   = new Highlighter('group'+ (new Date().getTime()));
        this.elementHighlighter = new Highlighter('elementHover','rgba(0, 185, 233, .75)');
        this.groupHighlighter.initialize();
        this.elementHighlighter.initialize();
        this.group = null;
    };

    /** On start grouping **/
    GrouperTool.prototype.start = function() {
        $logger.log("GrouperTool start");
        this.initialize();
        this.initDOMElements();
        this.groupHighlighter.display();
        this.elementHighlighter.display();
        this.attachListeners();
        return this;
    };

    /** After finish grouping **/
    GrouperTool.prototype.close = function() {
        $logger.log("GrouperTool close");
        this.closeDOMElements();
        if(this.elementHighlighter) this.elementHighlighter.hide();
        if(this.groupHighlighter) this.groupHighlighter.hide();
        this.detachListeners();
        return this;
    };

    /** Prepare DOM for grouping **/
    GrouperTool.prototype.initDOMElements = function() {
        $("body").css("cursor","pointer");

        //Add class to target elements
        var $selectors = this.getSelectors();
        $selectors.each(function(){
            if($(this).children().length>1) $(this).addClass($config.grouperTool.targetElementClass);
        });
    };

    /** Restore DOM after grouping **/
    GrouperTool.prototype.closeDOMElements = function() {
        $("body").css("cursor","auto");
        //Remove class to target elements
        var $selectors = this.getSelectors();
        $selectors.each(function(){
            if($(this).children().length>1) $(this).removeClass($config.grouperTool.targetElementClass);
        });
    };

    GrouperTool.prototype.getName = function() {

        return "GrouperTool";
    };

    /** Listeners **/
    GrouperTool.prototype.attachListeners = function() {
        var $selector = this.getSelectors();
        $("*").on('mousedown',GrouperToolHandlers.groupElements);
        $("*").on("mousedown",GrouperToolHandlers.preventDefault);
        $("*").on("mouseup",GrouperToolHandlers.preventDefault);
        $("*").on("click",GrouperToolHandlers.preventDefault);
        $selector.on('mouseenter',GrouperToolHandlers.elementHighlight);
        $selector.on('mouseout',GrouperToolHandlers.searchParentForHighlight);
    };
    GrouperTool.prototype.detachListeners = function() {
        var $selector = this.getSelectors();
        $selector.off('mouseenter',GrouperToolHandlers.elementHighlight);
        $selector.off('mouseout',GrouperToolHandlers.searchParentForHighlight);
        $("*").off('mousedown',GrouperToolHandlers.groupElements);
        $("*").off("mousedown",GrouperToolHandlers.preventDefault);
        $("*").off("click",GrouperToolHandlers.preventDefault);
        $("*").off("mouseup",GrouperToolHandlers.preventDefault);
    };

    /** Get HTML target selectors (elements that can be grouped) **/
    GrouperTool.prototype.getSelectors = function(){
        //var tags =['a','address','area','article','caption','code','details','dialog','dir','div','em','footer','form','frame','frameset','h1','h2','h3','h4','h5','h6','head','header','hr','i','iframe','label','menu','menuitem','nav','p','pre','button','section','table','tbody','td','th','tr','ul','ol'];
        //return $(tags.join(',')).not('.'+$config.appElementClass);
        return $('*').not('.'+$config.appElementClass);
    };

    /** Get the highlighter instance that is being used for the element mouse over **/
    GrouperTool.prototype.getElementHighlighter = function() {

        return this.elementHighlighter;
    };

    /** Get the highlighter instance that is being used for the group selection **/
    GrouperTool.prototype.getGroupHighlighter = function() {

        return this.groupHighlighter;
    };

    GrouperTool.prototype.getGroup = function() {

        return this.group;
    };
    GrouperTool.prototype.setGroup = function(newGroup) {

        this.group = newGroup;
    };

    /** Finish the grouping process, creating and returning a new pattern from the group element **/
    GrouperTool.prototype.check = function() {
        var defer = $.Deferred();
        var pattern;
        var grouper = this;

        pattern = grouper.createPattern();
        $patternsEditor.showEditionForm(pattern).done(function(){
            $logger.log("Finishing pattern creation");
            var msg = new LoadingMsg(); // Do an async task
            msg.initialize($lang.get('creating_new_pattern'));
            msg.show();
            pattern.findElementsInDOM().done(function(){
                $patternsEditor.highlight([pattern],true);
                $patterns.savePattern(pattern);
                msg.hide();
            });
            defer.resolve(pattern.getId());
        }).fail(function(){
            $logger.log("Pattern creation aborted");
            pattern.removeAllElements();
        });

        return defer.promise();
    };
    GrouperTool.prototype.createPattern = function() {
        var element = this.getGroupHighlighter().getElement();
        if(!element[0]){
            alert($lang.get('no_group_selected_error'));
            console.error("Grouper element NULL");
            return;
        }
        $logger.log('Creating pattern for',element[0]);
        var pattern = new ElementPattern(element[0]);
        return pattern;
    };



// ------------------------------------------------------------//
// Private Handlers
//

    var GrouperToolHandlers = {
        /** Prevent the event for those element that don't belongs to our application **/
        preventDefault: function(event){
            if(!$(event.target).is('.'+$config.appElementClass)){
                event.stopPropagation();
                event.preventDefault();
            }
        },
        /** Refresh the mouse over highlighter  **/
        elementHighlight : function(event){
            event.stopPropagation();
            $grouperTool.getElementHighlighter().refresh(this);
        },
        /** Refresh the mouse over highlighter with the parent of the target  **/
        searchParentForHighlight : function(event) {
            event.stopPropagation();

            function	pointInsideElement(x,y,element){
                var offset = $(element).offset();
                var w = $(element).width();
                var h = $(element).height();
                return (offset.left<= x && x<= offset.left + w && offset.top <= y && y<= offset.top + h);
            }

            if(!pointInsideElement(event.pageX,event.pageY,this)){
                var selected = $(this).parent();
                while(!$(selected).hasClass($config.grouperTool.targetElementClass) && $(selected)[0].tagName != "HTML"){
                    selected = $(selected).parent();
                }
                $grouperTool.getElementHighlighter().refresh(selected);
            }
        },
        /** Refresh the group highlighter with the lowest common ancestor (LCA) of the target and the previous group  **/
        groupElements : function(event) {
            event.stopPropagation();
            var target = event.target;
            var filter = $grouperTool.getSelectors();
            if(!$(target).is(filter)) return;

            var group = $grouperTool.getGroup();
            var selected = target;
            while($(selected).parent().children().length<2) selected=$(selected).parent();

            $(selected).addClass($config.grouperTool.targetSelectedClass);

            //Group elements
            if(group == selected) return;
            if(group != null && $(group).has(selected).length > 0) return;
            if(group == null || $(selected).has(group).length > 0)
                group = selected;
            else
                group = $(group).parents().has(selected).first();

            $grouperTool.getGroupHighlighter().refresh(group);
            //$(group).standout();
            $grouperTool.setGroup(group);
        }
    };


// ------------------------------------------------------------//
// Return a Singleton instance:
//
    $grouperTool = new GrouperTool();
    return $grouperTool;

});

