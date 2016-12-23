
WAT.module('$parser',['JQuery','Logger','$patterns'],function($,Logger,$patterns){

	var $logger = new Logger('$parser');
	var service = {};

	service.run = function(){
		var defer = $.Deferred();
		$logger.log('executing');
		var patterns = $patterns.get();
		for(var key in patterns){
			var pattern = patterns[key];
			var annotations = pattern.getData('annotations');
			$(pattern.getElements()).each(function(){
				var element = $(this);
				if(element.hasClass('wat-parsed-element')) return;
				//Parse element
				element.addClass('wat-parsed-element')
				element.attr('wat-pattern',pattern.id);

				for( var key in annotations ){
					if(annotations[key] === 'true' || annotations[key] === true){
						// Boolean annotations are saved as classes in order to be used for selectors
						// (Classes are faster as selectors rather than attributes)
						element.addClass(key);
					}else{
						// Use non boolean annotations for storing data as attributes
						element.attr(key,annotations[key]);
					}
				}
			});
		};
		defer.resolve();
		return defer.promise();
	};

	service.restore = function(){

	};

	return service;
});