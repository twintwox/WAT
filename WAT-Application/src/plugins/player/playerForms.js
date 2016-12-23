/**
 * Module that encapsulates the forms showed by the player
 * **/

WAT.module('$playerForms',['$playerLang','$dialogs','$server'],function($lang,$dialogs,$server){

// ------------------------------------------------------------//
// PUBLIC API
//
    var service = {};
    /** Show user data form **/
    service.showUserDataForm = function(){
        // Show login dialog
        var defer = $.Deferred();
        var form = $dialogs.getForm('player-init-session',$lang.get('p_login_form_title'));
        form.startColumnBox()
            .addLabel($lang.get('p_username_label'))
            .addInput({name: 'user' , placeholder: $lang.get('p_username_pl') ,type: "email"})
            .closeBox();

        form.startColumnBox()
            .addLabel($lang.get('p_password_label'))
            .addInput({name: 'pass' ,type: "password"})
            .closeBox();

        form.startColumnBox()
            .addLink({href:$server.getServerUlr()+'#/register'},$lang.get('p_register_link'))
            .closeBox();

        form.startColumnBox()
            .addErrorBox(1)
            .closeBox();
        form.addButton($lang.get('p_init_session_btn'),function(f){
            var values = f.getValues();
            var userData = {};
            userData.email = values['user'];
            userData.password = values['pass'];
            if(userData.email && userData.password){
                defer.resolve(userData);
            }else{
                defer.reject('Incorrect data');
            };
            form.hide();
        });
        form.onClose(function(){
            defer.reject('No data');
        });
        form.initialize().display();
        return defer.promise();
    };


    return service;
});