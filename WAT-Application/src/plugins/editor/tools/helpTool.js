/**
 * HelpTool Module.
 * It creates a help dialog that belongs to the current $toolbar state.
 * **/

WAT.module('$helpTool',['JQuery','$editorConfig','$helpToolLang','$dialogs'],function($,$config,$lang,$dialogs){


// ------------------------------------------------------------//
// SETUP
//
    var service = {};
    var _private = {};

// ------------------------------------------------------------//
// PUBLIC API
//

    _private.tools = {
        session:{
            icon:'fa-user',
            title: $lang.get('session'),
            description: $lang.get('session_desc')
        },
        new_template:{
            icon:'fa-file',
            title: $lang.get('new_template'),
            description: $lang.get('new_template_desc')
        },
        edit_template:{
            icon:'fa-pencil',
            title: $lang.get('edit_template'),
            description: $lang.get('edit_template_desc')
        },
        save_template:{
            icon:'fa-cloud-upload',
            title: $lang.get('save_template'),
            description: $lang.get('save_template_desc')
        },
        download_template:{
            icon:'fa-download',
            title: $lang.get('download_template'),
            description: $lang.get('download_template_desc')
        },
        new_grouper:{
            icon:'fa-object-group',
            title: $lang.get('new_grouper'),
            description: $lang.get('new_grouper_desc')
        },
        new_group_check:{
            icon:'fa-check',
            title: $lang.get('finish'),
            description: $lang.get('new_group_check_desc')
        },
        new_group_cancel:{
            icon:'fa-arrow-left',
            title: $lang.get('go_back'),
            description: $lang.get('new_group_cancel_desc')
        },
        manage_tool:{
            icon:'fa-list',
            title: $lang.get('manage_tool'),
            description: $lang.get('manage_tool_desc')
        },
        close_project:{
            icon:'fa-arrow-left',
            title: $lang.get('go_back'),
            description: $lang.get('close_project_desc')
        }
    };

    _private.getHelpForTool = function(tool){
        if(!tool) return "";
        var htmlElement = ['<li class="wat-helpTool-item">'];
        htmlElement.push('<span class="icon fa fa-lg '+tool.icon+'" ></span>');
        htmlElement.push('<div class="wat-helpTool-description">');
        htmlElement.push('<label class="wat-helpTool-block"> '+tool.title+'</label>');
        htmlElement.push('<p class="wat-helpTool-block"> '+tool.description+'</p>');
        htmlElement.push('</div>');

        htmlElement.push('</li>');
        return htmlElement.join('');
    };

    _private.generateHelpList = function(toolNames){
        var htmlElement = ['<ul class="wat-helpTool-list">'];
        for(var i in toolNames){
            var toolName = toolNames[i];
            htmlElement.push(_private.getHelpForTool(_private.tools[toolName]));
        }
        htmlElement.push('</ul>');
        return htmlElement.join('');
    };


    service.showHelpFor = function(toolNames){
        var defer = $.Deferred();
        var dialog  = $dialogs.getForm("help_dialog",$lang.get('help'));
        dialog
            .addElement(_private.generateHelpList(toolNames))
            .onClose(function(){ defer.resolve() })
            .initialize()
            .display();
        return defer.promise();
    };

    return service;
});

