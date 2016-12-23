/**
 * Language values for the help tool
 * **/

WAT.module('$helpToolLang',['$editorLang'],function($lang){

    $lang.extend('ES',{
        session_desc: 'Iniciar/Cerrar sesión.',
        new_template_desc: 'Iniciar un proyecto nuevo o existente (asociado al sitio web actual). Se mostrará el forumario de inicio de sesión si aún no se ha iniciado una.',
        edit_template_desc: 'Editar la información del proyecto actual. Esta información se guardará localmente. Utilizar "Guardar proyecto" para almacenar la información en el servidor.',
        save_template_desc: 'Guardar el proyecto en el servidor. Se sobreescribirá cualquier información anterior asociada a este proyecto.',
        download_template_desc: 'Descargar archivo txt con toda la información de este proyecto.',
        new_grouper_desc: 'Definir un nuevo objeto semántico. Al iniciar, se deberán seleccionar aquellos elementos HTML que integrán el nuevo objeto semántico (realizando un click sobre dichos elementos). Un recuadro amarillo demarcará aquel objeto que integra a todos los elementos seleccionados y el cual será utilizado para la generación del nuevo objeto semántico.',
        new_group_check_desc: 'Finalizar la creación del nuevo objeto semántico. Debe existir un recuadro amarillo indicando el elemento HTML que se utilizará como base para el nuevo objeto semántico.',
        new_group_cancel_desc: 'Cancelar la creación del objeto semántico, no se creará ninguno.',
        manage_tool_desc: 'Ver listado de todos los objetos semánticos definidos en este proyecto. Permite realizar acciones sobre cada uno de ellos.',
        close_project_desc: 'Cerrar el proyecto (recuerda guardar los cambios previo a cerrarlo). Luego se podrá iniciar nuevamente o iniciar algún otro proyecto.'
    });

    return $lang;

});