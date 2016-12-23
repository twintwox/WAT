/**
 * Language values for the player plugin
 * **/

WAT.module('$playerLang',['$lang'],function($lang){

    $lang.extend('ES',{
        enable:'Habilitar',

        loading_template_msg: 'Cargando datos de accesibilidad',
        login_not_final_user_error: "Utilice una cuenta de usuario final para iniciar sesión",

        p_login_form_title: 'Establecer datos de sesión',
        p_username_label: 'Usuario',
        p_username_pl: 'Su email',
        p_password_label: 'Contraseña',
        p_login_fail_error:'Intente nuevamente',
        p_init_session_btn: 'Guardar',
        p_register_link:'Registrarse como usuario final aqui',

        // Shortcut labels:
        shortcut_name_prefix: 'Ir a',
        shortcut_name_for_region:'región',
        shortcut_name_for_main:'sección principal',
        shortcut_name_for_search:'buscador',
        shortcut_name_for_group:'Grupo',
        shortcut_name_for_title:'Título',

        navigation_dummy_text:'Ampliado ',

        // Handlers
        sound_feedback_name: 'Respuesta sonora',

        // Tools
        labels_tool_name: 'Mejorar los nombres',
        navigation_tool_name: 'Navegación asistida',
        shortcuts_tool_name:'Insertar enlaces internos',
        controls_tool_name: 'Comandos adicionales'

    });

    return $lang;
});