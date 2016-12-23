angular.module('app_lang',[])
.factory('Lang', [function() {
    var default_lang = 'ES';
    var LANG = {};
    LANG['GLOBAL'] = {
      ES:'Español',
      EN:'English',
    };
    LANG['ES'] = {
      app_name:'Web accesibility <b>Transcoder</b>',
      final_user_title:'Configuración de WAT',
      final_user_subtitle:'Panel de administración para usuarios finales',
      volunteer_user_title:'Gestión de plantillas',
      volunteer_user_subtitle:'Panel de administración de plantillas',
      register:'Registrarse',
      register_msg:'Crear una cuenta',
      login_msg:'Iniciar sesión',
      logout_msg:'Cerrar sesión',
      volunteer_user: "Usuario voluntario",
      login_again:'Por favor, vuelva a iniciar sesión',
      home:'Inicio',
      unknown_login_error:'Lo sentimos, se produjo un error al iniciar sesión',
      go_to_register:'Registrarse',
      edit:'Editar',
      name: 'Nombre',
      email:'Email',
      password:'Contraseña',
      confirm_password:'Confirmar contraseña',
      select_user_type:'Seleccione el tipo de usuario',
      remember_me: "Recordarme",
      forgot_password:'No recuerdo la contraseña',
      sign_in:'Iniciar',
      cancel:'Cancelar',

      domain:'Dominio de la plantilla',
      alias:'Alias',
      author:'Autor',
      template_description:'Descripción de la plantilla',
      template_data:'Pegue los datos de la plantilla aqui',
      templates:'Plantillas',
      all_templates:'Todas las plantillas',
      no_templates_available:'No hay plantillas disponibles',
      my_templates:'Mis plantillas',
      select_template:'Seleccione una plantilla',
      select:'Seleccionar',
      select_template_lang:'Seleccione el idioma de la plantilla',
      select_user_lang:'Seleccione su idioma',
      create_template:'Crear nueva plantilla',
      update_template:'Actualizar plantilla',
      delete_template:'Eliminar plantilla',
      or_upload_the_file:'O suba el archivo de la plantilla',

      requests:'Solicitudes',
      resolve_request:'Resolver',
      request_new_template:'Solicitar una nueva plantilla',
      related_templates:'Ver plantillas relacionadas',
      templates_after_request:'Ver nuevas plantillas',
      mark_as_solved:'Finalizar solicitud',

      FINAL_USER:'Usuario final',
      VOLUNTEER_USER:'Usuario voluntario',

      pending_requests:'Sitios solicitados en',
      my_pending_requests:'Mis sitios solicitados',
      no_pending_request:'No hay solicitudes pendientes para este idioma',
      take_request:'Resolver solicitud',

      data:'Datos',

      is_required: 'es obligatorio'
    }


    var service = {};
    service.setDefaultLanguage = function(name){
      if(LANG[name]) {
        default_lang = name;
        console.log("Default language set to", name);
        return true;
      }else {
        console.warn("Could not set language to", name, ": Undefined language");
        return false;
      }
    };
    service.getString = function(name){
      if(typeof LANG[default_lang][name] === 'undefined'){
        if(typeof LANG['GLOBAL'][name] === 'undefined'){
          console.warn("String ",name,' is undefined for language ',default_lang);
          return "{{ UNDEFINED STRING }}";
        }
          return LANG['GLOBAL'][name];
      }
      return LANG[default_lang][name];
    };

    return service;

}]);
