/**
 * Manage Tool module.
 *
 * This module is used by the Toolbar to create a dialog that handles all the defined pattern in the project.
 * This form allows to see a list with all the patterns defined in the current project in order to edit, display, hide or
 * delete any of them.
 * **/

WAT.module('$manageTool',['JQuery','$editorConfig','$editorLang','Logger','$patterns','$dialogs','$patternsEditor'],
    function($,$config,$lang,Logger,$patterns,$dialogs,$patternsEditor){


// ------------------------------------------------------------//
// SETUP
//
    var $logger = new Logger('$manageTool');

// ------------------------------------------------------------//
// Private scope
//
    var _private = {
        /** Creates an icon that is bind to one of the callbacks, to be added in the form dialog **/
        getActionButton: function(description,icon,callback){
            return ['<i title="',description,'" wat-action="',callback,'" class="fa fa-lg fa-',icon,' wat-action"></i>'].join('');
        },

        /** Gert the selected patterns from the form dialog **/
        getSelectedPatterns: function(form,listId){
            var listItems = form.getFormBody().find('#'+listId+' li.ui-selected');
            var selected = [];
            $(listItems).each(function () {
                var patternID = $(this).attr('pattern-id');
                selected.push($patterns.get()[patternID]);
            });
            return selected;
        },
        /** Refresh the form dialog **/
        refresh:function(){
            $manageTool.close();
            $manageTool.start();
        },
        /** Check wheter the postit is being visible for an specific pattern or not **/
        postitVisible:function(pattern){
            var count = 0;
            $.each(pattern.getElements(),function(){
                if($(this).isPostitVisible()) count++;
            });
            return count;
        }
    };

    /** Event handlers **/
    var _callbacks = {
        /** When a action is triggered from an listitem icon **/
        actionTriggered: function(e){
            var action = $(e.target).attr('wat-action');
            if(action && _callbacks[action]){
                var patternId = $(e.target).parents('.wat-pattern-listitem').first().attr("pattern-id");
                if(!patternId) return;
                _callbacks[action]($patterns.get()[patternId],true);
            }
        },
        /** When the merge button is triggered **/
        join: function(patterns){
            if(patterns.length < 2){
                alert($lang.get('join_patterns_selection_msg'));
                return;
            }
            if(!confirm($lang.get('q_confirm_join'))) return;
            var root = patterns[0];
            for(var i = 1; i<patterns.length;i++){
                root.associate(patterns[i]);
                $patternsEditor.removeHighlights(patterns[i]);
            }
            $patterns.save();
            $patternsEditor.highlight();
            _private.refresh();
            console.log('join',patterns);
        },
        /** Show an specific pattern postit **/
        show: function(pattern,single){
            console.log('show',pattern);
            $.each(pattern.getElements(),function(){
                $(this).showPostit();
                $(this).showPostitContent();
                $(this).refreshPostit();
            });
            _private.refresh();
        },
        /** Hide an specific pattern postit **/
        hide: function(pattern,single){
            console.log('hide',pattern);
            $.each(pattern.getElements(),function(){
                $(this).hidePostit();
                $(this).hidePostitContent();
            });
            _private.refresh();
        },
        /** Display the edition form, for an specific pattern **/
        edit: function(pattern,single){
            $manageTool.close();
            $patternsEditor.showEditionForm(pattern);
        },
        /** Delete a pattern **/
        delete: function(pattern,single){
            if(!single || confirm($lang.get('q_delete_pattern'))) {
                $patternsEditor.removeHighlights(pattern);
                $patterns.removePattern(pattern);
                _private.refresh();
            }
        }
    };



// ------------------------------------------------------------//
// ManageTool class.
// This class handles the creation of a single form dialog, that shows the list of patterns and actions.
//
    var ManageTool = function(){};
    ManageTool.prototype.attachListeners = function() {
        $('body').on('mouseup','.wat-action',_callbacks.actionTriggered);
        return this;
    };
    ManageTool.prototype.detachListeners = function() {
        $('body').off('mouseup','.wat-action',_callbacks.actionTriggered);
        return this;
    };

    /** Creates and Shows the list patterns form **/
    ManageTool.prototype.displayForm = function(){
        this.currentForm = $dialogs.getForm('patternsView','Objetos definidos');
        var form = this.currentForm;
        var listId = 'wat-patterns-list';
        var listItems = [];
        // Add each pattern to the list:
        $.each($patterns.get(),function(){
            var pattern = this;
            var annotations = pattern.getData('annotations') || {};
            var item = {};

            // Create list item:
            item.properties = {
                'pattern-id': pattern.getId(),
                'class': 'wat-pattern-listitem'
            };
            var elementCount = pattern.getElements().length;
            var elementVisible = _private.postitVisible(pattern);
            var text = ['<span class="wat-pattern-name">',
                                    (annotations['wat-pattern-name'] || pattern.getId()),' [',elementCount,']',
                                    '<span wat-color="',pattern.getData('color') || '','" class="wat-color-box"></span>',
                        '</span>'];
            // Add item actions:
            text.push('<span class="wat-pattern-actions">');
                if(elementVisible < elementCount) text.push(_private.getActionButton($lang.get('show'),'eye-slash','show'));
                if(elementVisible > 0) text.push(_private.getActionButton($lang.get('hide'),'eye','hide'));
                text.push(_private.getActionButton($lang.get('edit'),'pencil','edit'));
                text.push(_private.getActionButton($lang.get('delete'),'times','delete'));
            text.push('</span>');

            // Add item to list:
            item.text = text.join(' ');
            listItems.push(item);
        });
        // Add list to form:
        if(listItems.length > 0) {
            form.startColumnBox({class:'wat-pattern-list-box'});
            form.addList({selectable: true, id: listId}, listItems);
            form.closeBox();
        }else{
            form.startColumnBox();
            form.addText($lang.get('no_patterns_defined'));
            form.closeBox();
        }

        // Add buttons to form:

        // Apply will return a callback function for an action
        var apply = function(action){
            return function(){
                if(!_callbacks[action]) return;
                var selection = _private.getSelectedPatterns(form,listId);
                if(selection.length == 0) selection = $patterns.get();
                $.each(selection,function(){
                    _callbacks[action](this);
                });
                _private.refresh();
            }
        };

            // Create join button
        form.addButton($lang.get('join'),function(){ _callbacks['join'](_private.getSelectedPatterns(form,listId))})
            // Create show button
            .addButton($lang.get('show'),apply('show'))
            // Create hide button
            .addButton($lang.get('hide'),apply('hide'))
            // Create delete button
            .addButton($lang.get('delete'), function(){
                if(confirm($lang.get('q_delete_patterns'))) apply('delete')();
            })
            .onClose(function(){$manageTool.close()})
            .initialize()
            .display();
        // Initialize color boxes:
        form.getFormBody().find('.wat-color-box').each(function(){
            var color = $(this).attr('wat-color');
            $(this).css('background-color',color);
        });
    };

    /** Start the manage tool, displaying the form **/
    ManageTool.prototype.start = function() {
        this.enabled = true;
        this.attachListeners();
        this.displayForm();
        return this;
    };

    /** Closes the manage tool, hiding the form **/
    ManageTool.prototype.close = function() {
        this.enabled = false;
        this.detachListeners();
        this.currentForm.hide();
        return this;
    };

    /** Return Singleton instance **/
    var $manageTool = new ManageTool();
    return $manageTool;
});

