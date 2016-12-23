/**
 *  Transcoding Form Module.
 *  This module is the setUp of the transcodig form dialog that will be displayed each time a new pattern is created.
 *
 *  Each item inside $config.transcodingData represents a field on the transcodification form.
 *  After the user creates a DOM pattern, this form is presented to be filled.
 * 	Then the information will be associated to the pattern and stored.
 * 	A parser will use this information to modificate all the DOM elements that match the associated pattern
 * 	with the information stored based on this form.
 *
 * The values for each of this items are:
 *
 *  * label: The text to show as label in the form for the input.
 *  * description: A text that will be displayed to help to understand the field.
 * 	* name: The HTML attribute that will be overwritten during parsing process.
 *  * type: Type of input [text,number,email,select,checkbox,textarea,etc].
 *  * options: If input type == select, options contains an object with the key -> values for each select option.
 *  * placeholder: For input fields (text,textarea,etc) the placeholder to show.
 *	* defaultValue: Define the default value, if there was not set any before.
 *  * enableWhen: An object to decide when the field should be displayed on the form. It countains the name of another
 *  		defined item and an array of acceptable values. If any of those values are set, the filed will be displayed.
 *  * properties: An object with any other generic html attributes to add in the form input (eg: disabled, min, max, etc).
 *  * immutable: Define whether the field can't be edited once it has been set before.
 **/



WAT.module('TranscodingForm',['JQuery','$editorConfig','$transcodingFormLang','Logger','$dialogs','ElementPattern'],
	function($,$config,$lang,Logger,$dialogs,ElementPattern){


// ------------------------------------------------------------//
// SETUP
// Logger && Transcoding form structure:
//
	var $logger = new Logger('TranscodingForm');
	$config.transcodingData = [
		{
			// INPUT: Set the similarity threshold
			label: $lang.get('tr_pattern_flexibility'),
			description: $lang.get('tr_pattern_flexibility_desc'),
			name:'wat-similarity-threshold',
			type:'range',
			properties: {min:10,max:100},
			defaultValue:  ($config.patterns.joinThreshold * 100),
			immutable: true
		},
		{
			// INPUT: Optional pattern name
			label: $lang.get('tr_pattern_name'),
			description: $lang.get('tr_pattern_name_desc'),
			name:'wat-pattern-name',
			type:'text',
			placeholder: $lang.get('tr_pattern_name_pl'),
		},
		{
			// INPUT: Content type
			label: $lang.get('tr_content_type'),
			description: $lang.get('tr_content_type_desc'),
			name:'role',
			type:'select',
			placeholder: $lang.get('tr_content_type_pl'),
			options:{
				region 		: $lang.get('content_type_region'),
				main		: $lang.get('content_type_main'),
				search		: $lang.get('content_type_search'),
				group 		: $lang.get('content_type_group'),
				article		: $lang.get('content_type_article'),
				heading 	: $lang.get('content_type_heading'),
				directory 	: $lang.get('content_type_directory'),
				banner		: $lang.get('content_type_banner'),
				navigation	: $lang.get('content_type_navigation'),
				list		: $lang.get('content_type_list'),
				listitem	: $lang.get('content_type_listitem'),
				menu		: $lang.get('content_type_menu'),
				menuitem	: $lang.get('content_type_menuitem'),
				dialog		: $lang.get('content_type_dialog')
			}
		},
		{
			// OPTION: Create direct access to this content
			label: $lang.get('tr_content_labelledby'),
			description: $lang.get('tr_content_labelledby_desc'),
			name:'wat-labelledby',
			type:'checkbox',
			enableWhen: {
				'role':['region','main','search','group','article','directory',
					'banner','navigation','list','listitem','menu','menuitem','dialog']
			},
			defaultValue: false
		},
		{
			// INPUT: Content tag (Name)
			label: $lang.get('tr_content_name'),
			description: $lang.get('tr_content_name_desc'),
			name:'aria-label',
			type:'text',
			placeholder: $lang.get('tr_content_name_pl'),
			enableWhen: {
				'wat-labelledby': [false],
				'role':['region','main','search','group','article','directory',
					'banner','navigation','list','listitem','menu','menuitem','dialog']
			},
		},
		{
			// OPTION: Include this object to navigation
			label: $lang.get('tr_content_navigate'),
			description: $lang.get('tr_content_navigate_desc'),
			name:'wat-navigate',
			type:'checkbox',
			defaultValue: true
		},
		{
			// INPUT: Content navigation position
			label: $lang.get('tr_content_position'),
			description: $lang.get('tr_content_position_desc'),
			name:'wat-navigate-position',
			type:'number',
			defaultValue: "-1",
			enableWhen: {
				'wat-navigate':[true],
				'role':['region','main','search']
			}
		},
		{
			// OPTION: Create direct access to this content
			label: $lang.get('tr_direct_access'),
			description: $lang.get('tr_direct_access_desc'),
			name:'wat-direct-access',
			type:'checkbox',
			enableWhen: {
				'wat-navigate':[true],
				'role':['region','main','search']
			},
			defaultValue: true
		},
		{
			// OPTION: Set name of the direct access to this content
			label: $lang.get('tr_direct_access_name'),
			description: $lang.get('tr_direct_access_name_desc'),
			name:'wat-direct-access-name',
			type:'text',
			placeholder: $lang.get('tr_direct_access_name_pl'),
			enableWhen: {
				'wat-direct-access':[true],
				'wat-navigate':[true],
				'role':['region']
			}
		}
	];


// ------------------------------------------------------------//
// TranscodingForm class
// Creates and handles the transcoding form dialog, generated from the $config.transcodingData object.
//

	/** Initialize a new transcoding form, with the rootElement of the pattern **/
	var TranscodingForm = function(element,initValues,isNew){
		// Receive the root element and the initialValues stored.
		// In order to initialize the form values if possible.
		this.formValues = {};
		// Clone transcodingData:
		this.transcodingData = JSON.parse(JSON.stringify($config.transcodingData));
		var self = this;
		$(this.transcodingData).each(function () {
			// For each field defined in the transcoding data:

			// Check if element already has the value set:
			if (element && typeof $(element).attr(this.name) != 'undefined')
				self.formValues[this.name] = $(element).attr(this.name);
			// Else Set the defautl value:
			else if(typeof this.defaultValue != 'undefined')
				self.formValues[this.name] = this.defaultValue;

			// Check if it is immutable:
			if(!isNew && this.immutable){
				this.properties = this.properties || {};
				this.properties.disabled = true;
				this.properties.title = $lang.get('immutable_element_msg');
			}
		});

		// Override the initial values taken from the element, with the saved ones (if any).
		$.extend(this.formValues,initValues);
	};

	/** Set on save callback **/
	TranscodingForm.prototype.onSave = function(fn) {
		// Set the function to be executed when the form is saved:
		this.onSaveFn = fn;
		return this;
	};

	/** Set on close callback **/
	TranscodingForm.prototype.onClose = function(fn) {
		// Set the function to be executed when the form is saved:
		this.onCloseFn = fn;
		return this;
	};

	/** Get the form values **/
	TranscodingForm.prototype.getValues = function() {
		// Return the form values
		var self   = this;
		var values = {};
		$(this.transcodingData).each(function(){
		// Add value
			if(typeof self.formValues[this.name] !== 'undefined'){
				values[this.name]= self.formValues[this.name];
			}
		});
		return values;
	};
	TranscodingForm.prototype.setValues = function(values) {
		$.extend(this.formValues,values);
		return this;
	};

	/** Returns whether the form field is enabled or not, depending on the dependsOn parameter **/
	TranscodingForm.prototype.isFieldEnabled = function(aField,formValues) {
		// Check whether the field depends on other field:
		if(!aField.enableWhen) return true;

		// Check whether the field should be enabled or not:
		var enabled = true;
		for(var dependenceField in aField.enableWhen){
			var dependenceFieldValues = aField.enableWhen[dependenceField];
			enabled = enabled && (dependenceFieldValues.indexOf(formValues[dependenceField]) > -1);
		};
		return enabled;
	};

	/** Initialize the form dialog, generated from the transcodingData object **/
	TranscodingForm.prototype.createForm = function(id){
		// Generate the transcoding form:

		var self = this;
		var count = 0;
		var form = $dialogs.getForm("tags-"+id,$lang.get('transcode_form_title'));
		$logger.log("Initial form values", this.formValues);
		$(this.transcodingData).each(function(){
			// Add a new input depending on the type:
			switch(this.type){
				case 'select':
					form.startColumnBox();
					form.startRowBox();
						form.addLabel(this.label);
						form.addHelp(this.description);
					form.closeBox();
					var properties = this.properties || {};
					$.extend(properties,{name: this.name ,placeholder: this.placeholder });
					form.addSelect(properties, this.options , self.formValues[this.name]||'');
					form.closeBox();
				break;

				case 'checkbox':
					form.startColumnBox();
					form.startRowBox();
						var id = 'wat_check_'+(count++);
						var properties = this.properties || {};
						$.extend(properties,{id:id,name: this.name,type:"checkbox",value: (self.formValues[this.name] || false) });
						form.addInput(properties);
						form.addLabel(this.label,id);
						form.addHelp(this.description);
					form.closeBox();
					form.closeBox();
				break;

				case 'textarea':
					form.startColumnBox();
					form.startRowBox();
						form.addLabel(this.label);
						form.addHelp(this.description);
					form.closeBox();
					var properties = this.properties || {};
					$.extend(properties,{name: this.name});
					form.addTextarea(properties,self.formValues[this.name]||'');
					form.closeBox();
		 		break;

				default:
					form.startColumnBox();
					form.startRowBox();
						form.addLabel(this.label);
						form.addHelp(this.description);
					form.closeBox();
					var properties = this.properties || {};
					$.extend(properties,{name: this.name , placeholder: this.placeholder ,type: this.type ,value: (self.formValues[this.name]||'') });
					form.addInput(properties);
					form.closeBox();
			}
		});


		// Manage each change during form filling
		var $transcodingForm = this;
		var checkVisibleFormFields = function() {
			// When a field of the form change, display and hide those inputs that depends on other values:
			var currentFormValues = form.getValues();
			for(var i in $transcodingForm.transcodingData){
				var field = $transcodingForm.transcodingData[i];
				var target = form.getFormBody().find('[name='+field.name+']').first().parents('.wat-dialog-box').first();

				if($transcodingForm.isFieldEnabled(field,currentFormValues))  target.show();
				else target.hide();
			}
		};
		var beforeSave = function(form){
			// Before save:
			var dirtyValues = form.getValues();

			// Clean the form values:
			//// Delete those values that are disabled
			$($transcodingForm.transcodingData).each(function(){
				if(!$transcodingForm.isFieldEnabled(this,dirtyValues)) delete dirtyValues[this.name];
			});
			// Finish values cleaning.

			// Save the clean values:
			self.formValues = dirtyValues;
			$logger.log("Saving form values", self.formValues);

			// Call the on save function defined.
			if(!self.onSaveFn) $logger.error("There is no save function defined in TranscodingForm");
			self.onSaveFn(self.getValues());
			$logger.log("Final form values", self.getValues());
			form.hide();
		};

		// Add SAVE button:
		form.addButton($lang.get('save'),beforeSave)
			.onInputChanged(checkVisibleFormFields)
			.onClose(self.onCloseFn)
			.initialize();

			checkVisibleFormFields();
		// Return the form :)
	 	return form;
	};

	/** Return the class to create new instances **/
	return TranscodingForm;

});