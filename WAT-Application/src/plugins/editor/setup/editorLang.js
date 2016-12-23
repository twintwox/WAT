/**
 * Language values for the editor plugin
 * **/

WAT.module('$editorLang',['$lang'],function($lang){

    $lang.extend('ES',{

        enable:'Habilitar',
        go_back: 'Volver',
        help: 'Ayuda',
        save: 'Guardar',
        join: 'Unir',
        show: 'Mostrar',
        hide: 'Ocultar',
        delete: 'Eliminar',
        edit: 'Editar',
        loading_template_msg: 'Cargando datos del proyecto',

        cancel: 'Cancelar',
        loading: 'Cargando',
        clear_data: 'Eliminar datos',
        tutorial: "Tutorial",

        // Manage Tool && Patterns Editor
        q_delete_pattern:'¿Desea eliminar este objeto semántico?',
        q_delete_patterns:'¿Desea eliminar todos estos objetos semánticos?',
        q_confirm_join: '¿Seguro que desea unir estos objectos? Esta acción no podrá deshacerse.',
        join_patterns_selection_msg: 'Debe seleccionar al menos 2 objetos para unir.',
        no_patterns_defined: 'No hay ningún objeto semántico definido',

        // Grouper tool
        creating_new_pattern:"Creando nuevo objeto semántico",
        no_group_selected_error: "Error: No se seleccionó ningun elemento",

        //Project manager:
        login_form_title:'Iniciar sesión',
        logout_form_title:'Cerrar sesión',
        login_fail_not_volunteer_error: 'Por favor, utilice una cuenta de usuario voluntario',
        logout_session_msg:'Actualmente posee una sesión iniciada con:',
        username_label: 'Usuario',
        username_pl: 'Su email',
        password_label: 'Contraseña',
        login_fail_error:'Intente nuevamente',
        init_session_btn: 'Iniciar sesión',
        logout_session_btn:'Cerrar sesión',
        templates_form_title: 'Mis proyectos',
        create_new_template: 'Crear nuevo proyecto',
        template_form_head_text: 'Seleccione una de sus plantillas para seguir trabajando o genere una nueva (los cambios solo serán guardados si utiliza la acción "Compartir"):',
        template_form_select_btn:'Seleccionar',
        register_link:'Registrese como voluntario aqui',
        edit_form_title: 'Información del proyecto',
        template_lang_label:'Idioma',
        template_alias_label:'Nombre',
        template_alias_pl:'Ej: Google',
        template_domain_label:'Dominio',
        template_description_label:'Descripción',
        template_data_label:'Datos',
        template_data_pl:'Aun no hay datos',
        save_template_title:'Guardar proyecto',
        save_template_body:'Esta acción sobreescribirá cualquier proyecto anterior existente.',
        loading_dialog_text: 'Espere un momento',
        disabled_template_reason: 'El dominio no concuerda con el sitio actual',
        loading_error_msg: 'Ocurrio un error, intente nuevamente.',
        loading_save_text: 'Guardando proyecto',
        save_fail_msg: 'Ocurrio un error al guardar, intente nuevamente',

        // Toolbar options:
        session: 'Sesión',
        new_template:'Abrir proyecto',
        edit_template: 'Editar proyecto',
        save_template: 'Guardar proyecto',
        download_template: 'Descargar proyecto',
        export_template:'Exportar',
        new_grouper:'Definir nuevo objeto semántico',
        manage_tool:'Gestionar objetos semánticos',
        help_tool:'Ayuda',
        finish:'Finalizar'

    });

    $lang.extend('EN',{

        enable:'Enable',
        go_back: 'Go back',
        help: 'Help',
        save: 'Save',
        join: 'Join',
        show: 'Show',
        hide: 'Hide',
        delete: 'Delete',
        edit: 'Edit',
        loading_template_msg: 'Loading project',

        cancel: 'Cancel',
        loading: 'Loading',
        clear_data: 'Clear data',
        tutorial: "Tutorial",

        // Manage Tool && Patterns Editor
        q_delete_pattern:'Do you want to delete this semantic web object?',
        q_delete_patterns:'Do you want to delete all the semantic web objects?',
        q_confirm_join: 'Are you sure you want to join this objects? This action can not be undone.',
        join_patterns_selection_msg: 'Sorry, you must select at least 2 objects to join.',
        no_patterns_defined: 'There is no semantic object defined.',

        // Grouper tool
        creating_new_pattern:"Creating new semantic web object",
        no_group_selected_error: "Error: No element selected",

        //Project manager:
        login_form_title:'Login',
        logout_form_title:'Logout',
        login_fail_not_volunteer_error: 'Plase, use a volunteer user account.',
        logout_session_msg:'You are login with:',
        username_label: 'User',
        username_pl: 'Email',
        password_label: 'Password',
        login_fail_error:'Please, try again',
        init_session_btn: 'Login',
        logout_session_btn:'Logout',
        templates_form_title: 'My projects',
        create_new_template: 'Create new project',
        template_form_head_text: 'Select a project to continue working with, or create a new one (Change are only saved if you use the "Share" action):',
        template_form_select_btn:'Select',
        register_link:'Registar as volunteer here',
        edit_form_title: 'Project information',
        template_lang_label:'Language',
        template_alias_label:'Name',
        template_alias_pl:'E.g.: Google',
        template_domain_label:'Domain (url)',
        template_description_label:'Description',
        template_data_label:'Data',
        template_data_pl:'There is no data yet.',
        save_template_title:'Save project',
        save_template_body:'This action will override any previous information about this project.',
        loading_dialog_text: 'Please, wait a moment.',
        disabled_template_reason: 'Domain doesn\'t match the current website.',
        loading_error_msg: 'Sorry, an error has been produced. Try again.',
        loading_save_text: 'Saving project',
        save_fail_msg: 'Sorry, an error has been produced while saving. Try again',

        // Toolbar options:
        session: 'Session',
        new_template:'Open project',
        edit_template: 'Edit project information',
        save_template: 'Save project',
        download_template: 'Download project',
        export_template:'Export project',
        new_grouper:'Define new semantic web object',
        manage_tool:'Manage defined semantic web objects',
        help_tool:'Help',
        finish:'Finish'

    });


    return $lang;
});