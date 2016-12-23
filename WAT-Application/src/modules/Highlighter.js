/**
 * A class that provides a way to highligh a DOM element.
 * Each instance of this class will append 4 borders inside the DOM with a specific color (usually bright colors)
 * by using the refresh function those borders will be placed on the top of each border of the element to provide the sense
 * of highligh.
 *
 * We can define some extra style properties in the Highlighter.css
 * **/

WAT.module('Highlighter',['JQuery','$config','Logger'],function($,$config,Logger){


// ------------------------------------------------------------//
// SETUP
//
	var $logger = new Logger('Highlighter');

	// The html container template of the 4 borders:
	var elementClass = [$config.appElementClass,$config.resetCssClass,'highlighter-selector-element'].join(' ');
	var H_TEMPLATE = '<div class="'+elementClass+'"  tabindex="-1"></div>';
//


// ------------------------------------------------------------//
// Highlighter
// Each instance will manage a different group of border that will act as highlighters.
// Received an unique id, and a color [optional].

	var  Highlighter = function (id,color){
		$logger.log('New highlighter created',id);
		this.element;
		this.name 	= id;
		this.left 	= id+'-left';
		this.top 	= id+'-top';
		this.right 	= id+'-right';
		this.bottom = id+'-bottom';
		this.class  = id+'-class';
		this.color = color? color : 'rgba(240, 211, 9, 1)';
	};

	Highlighter.prototype.initialize = function() {
		var template = $.parseHTML(H_TEMPLATE);
		$(template).addClass(this.class);

		var aux = $(template).clone();
		$(aux).attr('id',this.left).addClass(this.class);
		//$(aux).css('-webkit-box-shadow','-8px 0px 7px -1px '+this.color);
		//$(aux).css('box-shadow','-8px 0px 7px -1px '+this.color);
		$("body").append(aux);

		aux = $(template).clone();
		$(aux).attr("id",this.top).addClass(this.class);;
		//$(aux).css('-webkit-box-shadow','0px -8px 7px -1px '+this.color);
		//$(aux).css('box-shadow','0px -8px 7px -1px '+this.color);
		$("body").append(aux);

		aux = $(template).clone();
		$(aux).attr("id",this.right).addClass(this.class);;
		//$(aux).css('-webkit-box-shadow','8px 0px 7px -1px '+this.color);
		//$(aux).css('box-shadow','8px 0px 7px -1px '+this.color);
		$("body").append(aux);

		aux = $(template).clone();
		$(aux).attr("id",this.bottom).addClass(this.class);;
		//$(aux).css('-webkit-box-shadow',' 0px 8px 7px -1px  '+this.color);
		//$(aux).css('box-shadow',' 0px 8px 7px -1px  '+this.color);
		$("body").append(aux);
		$('.'+this.class).css('background-color',this.color);
		$('.'+this.class).css('opacity','0.8');

		return this;
	};

	/** Show the highlighter **/
	Highlighter.prototype.display = function() {
		$('.'+this.class).css("display","inline");
		return  this;
	};
	/** Hide the highlighter **/
	Highlighter.prototype.hide = function() {
		$('.'+this.class).css("display","none");
		return this;
	};
	/** Move the highlighter to a new element **/
	Highlighter.prototype.refresh = function(element) {
		this.element = element;
		var borderSize = 4;
		var top = $(element).offset().top;
		var left = $(element).offset().left;
		var height= $(element).height();
		var width= $(element).width();

		$('#'+this.left).offset({top: top-borderSize, left: left-borderSize });
		$('#'+this.left).height(height+borderSize*2);
		$('#'+this.left).width(borderSize);

		$('#'+this.top).offset({top: top-borderSize , left: left - borderSize});
		$('#'+this.top).width(width+borderSize*2);
		$('#'+this.top).height(borderSize);

		$('#'+this.right).offset({top: top-borderSize , left: left+width });
		$('#'+this.right).height(height+borderSize*2);
		$('#'+this.right).width(borderSize);

		$('#'+this.bottom).offset({top: top+height,left: left-borderSize});
		$('#'+this.bottom).width(width+borderSize*2);
		$('#'+this.bottom).height(borderSize);
		return this;
	};
	/** Get the element that is being highlighted **/
	Highlighter.prototype.getElement = function() {

		return $(this.element).first();
	};

	return Highlighter;
});