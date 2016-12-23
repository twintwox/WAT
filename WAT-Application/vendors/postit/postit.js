(function($){

	// Refresh during scroll, needs refactoring :p
	var postitCollection = $();
	var scrollLock = false;
	var scrollCallback = function(){
		if(scrollLock) return;
		scrollLock = true;
		postitCollection.each(function(key,elem){
			$(elem).refreshPostit();
		});
		setTimeout(function(){
			scrollLock = false;
		},200);
	};
	$(window).on("scroll",scrollCallback);
	// End scroll refresh.

	var prefix    ='jquery-postit-';
	var wrapper   = prefix+'wrapper';
	var content   = prefix+'content';
	var actions	  = prefix+'actions';
	var checkBtn  = prefix+'check';
	var editBtn   = prefix+'edit';
	var uniqueBtn = prefix+'unique';
	var closeBtn  = prefix+'close';

	var toRgba = function(color,opacity){
		while(color.length<7)color+='0';
		return 'rgba(' + parseInt(color.slice(-6,-4),16)
	    + ',' + parseInt(color.slice(-4,-2),16)
	    + ',' + parseInt(color.slice(-2),16)
	    +','+opacity+')';
	};


	var postit = {
		template: $.parseHTML(['<div role="presentation" class="',wrapper,'">',
									'<div class="',content,'">',
									'</div>',
								'</div>'].join('')),
		actions: $.parseHTML(['<ul class="',actions,'">',
							  '</ul>',].join(''))
	};
	$.fn.addPostitButton = function(settings){
		var conf = {
			icon: '',
			classes:[],
			onClick: function(){},
		};
		$.extend(conf,settings);
		var btn = $.parseHTML(['<li class="',conf.classes.join(' '),' fa fa-lg ',conf.icon,'"></li>'].join(''));
		$(btn).on('click',conf.onClick);
		if($(this).getPostit().find('.'+actions).length==0)
			$(this).getPostit().find('.'+content).first().append($(postit.actions).clone());
		$(this).getPostit().find('.'+actions).addClass(conf.classes.join(' '));
		$(this).getPostit().find('.'+actions).append(btn);
		return this;
	};
		

	$.fn.createPostit = function(settings){
		var timeout = Date.now();
		var elem = this;
		$(elem).data('postit-timeout',timeout);
		if(typeof $(elem).getPostit() != 'undefined') $(elem).removePostit();
		var conf = {
			prop:{},
			class:[],
		};

		$.extend(conf,settings);
		var temp = $(postit.template).clone();
		var tempContent = $(temp).find('.'+content).first();
		
		if(conf.color){
			$(temp).css('background-color',toRgba(conf.color,0.25));
		}
		
		//Add properties and classes
		for(var p in conf.prop) $(temp).attr(p,conf.prop[p]);
		for(var c in conf.class) $(temp).addClass(conf.class[c]);
	
		if(conf.content){
			$(temp).attr('aria-label',conf.content+'.');
			//$(tempContent).prepend(conf.content);
		} 
		//Set offset
		var offset = $(elem).position();
		if(!offset){
			console.warn("Undefined offset for",elem,"abort postit creation.");
			return;
		}
		$(temp).data('lastOffset',offset);
		$(temp).offset({top: offset.top-2, left: offset.left-2 }).height($(elem).outerHeight()+4).width($(elem).outerWidth()+4);
		var margins = ['margin-top','margin-rigth','margin-left','margin-bottom'];
		for(var i in margins) $(temp).css(margins[i],$(elem).css(margins[i]));
	


		//Save and create postit
		$(temp).data({elementPosted:elem});	
		
		//This is a pach for concurrency, as the fn takes too much, may have been called again.
		//Still does not solve the problem but reduces the chances..
		if($(elem).data('postit-timeout') !== timeout) return elem;
		/////
		$(elem).data({postitTemplate:temp});
		$(elem).after(temp);
		if( typeof $(elem).isPostitVisible() === 'undefined'){
			$(elem).data('postitVisible',true);
		}else{
			if(!$(elem).isPostitVisible()) $(elem).hidePostit();
		}
		postitCollection = postitCollection.add(elem);
		return elem;
	};
	$.fn.removePostit = function(){
		var elem = this;
		var temp = $(elem).getPostit();
		if(temp && temp!=null){
			$(temp).remove();
			$(elem).data({postitTemplate:null});	
		}
		postitCollection = postitCollection.not(elem);
	};
	$.fn.getPostit = function(){
		return $($(this).data('postitTemplate'));
	};
	$.fn.refreshPostit = function(){
		var elem = this;
		if(!$(elem).isPostitVisible() || !$(elem).isPostitInView()) return;
		var temp = $(elem).getPostit();
		
		//Reset offset
		var offset = $(elem).offset();
		if(offset==$(temp).data('lastOffset'))return;

		$(temp).data('lastOffset',offset);
		$(temp).offset({top: offset.top-2, left: offset.left-2 }).height($(elem).outerHeight()+4).width($(elem).outerWidth()+4);
		var margins = ['margin-top','margin-rigth','margin-left','margin-bottom'];
		for(var i in margins) $(temp).css(margins[i],$(elem).css(margins[i]));
		return elem;
	};
	$.fn.isPostitVisible = function(){
		return $(this).data('postitVisible');
	};
	$.fn.isPostitContentVisible = function(){
		return $(this).data('postitContentVisible');
	};
	$.fn.togglePostit = function(){
		if($(this).isPostitVisible())
			$(this).hidePostit();
		else
			$(this).showPostit();
		
	};
	$.fn.showPostit = function(){
		$(this).data('postitVisible',true);
		$(this).getPostit().css('visibility','visible');
		$(this).getPostit().find('.'+content).css('visibility','visible');	
	};
	$.fn.hidePostit = function(){
		$(this).data('postitVisible',false);
		$(this).getPostit().css('visibility','hidden');
		$(this).getPostit().find('.'+content).css('visibility','visible');	
	};
	$.fn.showPostitContent = function(){
		$(this).data('postitContentVisible',true);
		$(this).getPostit().find('.'+content).css('visibility','visible');
	};
	$.fn.hidePostitContent = function(){
		$(this).data('postitContentVisible',false);
		$(this).getPostit().find('.'+content).css('visibility','hidden');
	};

	$.fn.isPostitInView = function () {
		var element = this;
		var pageTop = $(window).scrollTop();
		var pageBottom = pageTop + $(window).height();
		var elementTop = $(element).offset().top;
		var elementBottom = elementTop + $(element).height();
		return ((pageTop < elementTop) && (pageBottom > elementBottom));
	};
	
}(jQuery));
