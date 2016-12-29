/**
 * Language values for the transcofing form
 * **/

WAT.module('$transcodingFormLang',['$lang'],function($lang){


    $lang.extend('ES',{
        // TranscodingForm strings:

        transcode_form_title:  'Etiquetar componente',
        immutable_element_msg: 'Este atributo solo puede editarse una sola vez',

        tr_pattern_flexibility: 'Indice de similitud (muy flexible -- poco flexible)',
        tr_pattern_flexibility_desc: 'Indice de flexiblidad: Define que tan flexible debe ser el patrón para identificar otros objetos como similares.',

        tr_pattern_name:		'Alias del objeto semántico',
        tr_pattern_name_desc:	'Especificar un nombre que solo será utilizado para identificar a este objeto semántico',
        tr_pattern_name_pl:		'Ej. Resultado de búsqueda',


        tr_content_type:		'Rol del objeto semántico',
        tr_content_type_desc:	'El rol especifica el propósito del objeto dentro de la página web. Seleccione aquel que más se asemeje segun su consideración. Utilizando la propiedad [role]',
        tr_content_type_pl:		'Seleccione un rol',

        content_type_region 	: 'Región general: Define un área del sitio web, es decir, una parte de la estructura del sitio web que podrá ser agregada a la tabla de contenidos',
        content_type_main		: 'Región principal: Idem Región general, pero específico para la región que comprende el contenido principal',
        content_type_search		: 'Región de búsqueda: Idem Región general, pero específico para la región que comprende el buscador del sitio',
        content_type_group 		: 'Grupo: Define una agrupación de elementos HTML como un objeto más alto nivel, es decir, relaciona un conjunto de elementos individuales como una componente del contenido del sitio.',
        content_type_article	: 'Articulo: Idem Grupo, pero a su vez asocia el contenido del grupo al contenido de los elementos padres que posean este mismo rol',
        content_type_heading 	: 'Título: Título de una agrupación',
        content_type_directory 	: 'Índice: Cuadro de contenidos del sitio',
        content_type_banner		: 'Barra superior/lateral: Posee datos generales del sitio, barras de navegación, logo, etc',
        content_type_navigation	: 'Navegación: Lista de links navegacionales',
        content_type_list		: 'Lista: lista de elementos',
        content_type_listitem	: 'Item de Lista: Elemento perteneciente a un nodo "Lista"',
        content_type_menu		: 'Menú: listado de acciones/funciones del sitio',
        content_type_menuitem	: 'Item de Menú: Opción de menú perteneciente a un nodo "Menú"',
        content_type_dialog		: 'Ventana emergente: Popups, Modals, etc.',



        tr_content_labelledby:	'Utilizar titulo interno como pronunciación del objeto',
        tr_content_labelledby_desc: 'Usar el texto del elemento interno con rol de Titulo más cercano como texto de pronunciación para este objeto (si existe uno)',

        tr_content_name: 		'Texto de pronunciación del objeto semántico',
        tr_content_name_desc: 	'Este texto será pronunciado por el lector de pantalla cuando el mismo sea seleccionado utilizando la propiedad [aria-label], mantener campo en blanco para evitar dicha función',
        tr_content_name_pl: 	'Ingrese texto de pronunciación',

        tr_content_navigate:	'Incluir objeto en la navegación',
        tr_content_navigate_desc:'Decidir si añadir el objeto al recorrido de la navegación o no. (Al excluirlo, el objeto sera inaccesible por medio del teclado)',

        tr_content_position:	'Posición del objeto en la navegación (Solo para regiones)',
        tr_content_position_desc:'Definir el orden en que los elementos de un mismo nivel serán recorridos (de menor a mayor, desempatando por la posición real). Mantener un número negativo para evitar dicha alteración',

        tr_direct_access:		'Crear enlace interno (Solo para regiones)',
        tr_direct_access_desc:	'Crear un enlace interno en la tabla de contenidos ubicada al inicio de la navegación web. Permitiendo al usuario reubicar el puntero en la posición de este objeto más facilmente',

        tr_direct_access_name:	'Nombre del enlace interno (Solo para regiones generales)',
        tr_direct_access_name_desc:'Nombre del enlace que será pronunciado por el lector de pantalla al navegar en la tabla de contenidos',
        tr_direct_access_name_pl:'Ingresar nombre del enlace',


        tr_useOnlyXpaths : 		'Reconocer al elemento solo por su ruta (mejor performance, menor precisión)',
        tr_useOnlyXpaths_desc : 'Reconocer al elemento solo por su ruta (mejor performance, menor precisión)',
        tr_useOnlyXpaths_pl : 	'Reconocer al elemento solo por su ruta (mejor performance, menor precisión)',

        tr_class_use_internal_headings: 'Utilizar titulo/s internos como información de contexto',
        tr_class_use_internal_headings_desc: 'Utilizar titulo/s internos como información de contexto',

        tr_style_visibility: 'Ocultar este contenido al usuario',
        tr_style_visibility_desc: 'Ocultar este contenido al usuario',

        tr_class_has_skipto: 'Crear enlace interno para acceso directo',
        tr_class_has_skipto_desc: 'Crear enlace interno para acceso directo',

        tr_wat_skipto_label: 'Texto del enlace',
        tr_wat_skipto_label_desc: 'Texto del enlace',
        tr_wat_skipto_label_pl: 'Ej: Ir a la sección de noticias.'

    });

    $lang.extend('EN',{
        // TranscodingForm strings:

        transcode_form_title:  'Additional accessibility information',
        immutable_element_msg: 'This attribute is immutable, you won\'t be able to edit it later',

        tr_pattern_flexibility: 'Similarity flexibility',
        tr_pattern_flexibility_desc: 'Flexibility index: Define the flexibility of the similarity algorithm. How much flexible should it be in order to consider other objects as similar or not?',

        tr_pattern_name:		'Semantic web object alias',
        tr_pattern_name_desc:	'Set an alias for this object, to be better recognized by you',
        tr_pattern_name_pl:		'e.g. "Search result"',


        tr_content_type:		'Semantic web object role',
        tr_content_type_desc:	'The role attribute is used to specify a better semantic of the web element, in other words, the type of semantic object. Please, select the one you consider a better match. This will override the [role] attribute on the HTML code.',
        tr_content_type_pl:		'Select a role',

        content_type_region 	: 'Generic region: General group. Will be added to the table of contents at the beginning of the web page.',
        content_type_main		: 'Main region: Same as Generic region, but also grouping the main content of the web page.',
        content_type_search		: 'Search region: Same as Generic region, but also defining an internal search form.',
        content_type_group 		: 'Group: General group. Won\'t be added to the table of contents.',
        content_type_article	: 'Article: Same as Group, but associates its contents with internal and parents groups the share this type of role.',
        content_type_heading 	: 'Title: Defines a title for the groups where it is placed.',
        content_type_directory 	: 'Index: A table of contents of the web site.',
        content_type_banner		: 'Banner: Group conforming part of the layout of the web page. Usually contains elements such as logo, navigation bar, etc.',
        content_type_navigation	: 'Navigation box: List of navigational links',
        content_type_list		: 'List: List of elements',
        content_type_listitem	: 'List item: Item inside a List object',
        content_type_menu		: 'Menu box: List of actions',
        content_type_menuitem	: 'Menu item: Items inside a Menu object',
        content_type_dialog		: 'Popup: Popups, Modals, etc.',



        tr_content_labelledby:	'Use internal title object for pronunciation',
        tr_content_labelledby_desc: 'Use the text of the nearest internal Title (if any) as the pronunciation text for this object.',

        tr_content_name: 		'Pronunciation text',
        tr_content_name_desc: 	'This text will be used by screen readers to be pronounced when this element is selected. Keep field in blank to avoid overriding default pronunciation.',
        tr_content_name_pl: 	'Write a pronunciation text (optional)',

        tr_content_navigate:	'Include object inside the navigation flow',
        tr_content_navigate_desc:'Whether to include or exclude the object from the navigation flow.',

        tr_content_position:	'Object position during navigation flow. (Only for regions)',
        tr_content_position_desc:'Define the order of the object during the navigation traverse. Keep a negative value to avoid overriding the default order of the object.',

        tr_direct_access:		'Create a reference link inside table of contents. (Only for regions)',
        tr_direct_access_desc:	'Create a link for this region inside the table of contents. This allows users to directly access to the region through an internal link.',

        tr_direct_access_name:	'Name of the reference link (Only for generic regions)',
        tr_direct_access_name_desc:'Name of the reference link that will be pronounced by the screen reader.',
        tr_direct_access_name_pl:'Set a name for the link'

    });

    return $lang;

});