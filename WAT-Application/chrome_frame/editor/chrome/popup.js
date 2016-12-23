(function(){
    var interfaceName = "WAT_EDITOR_INTERFACE";
    var interfaceValues = interfaceName+'_VALUES';
    var _private = {};

    _private.getInterface = function(){
        var defer = $.Deferred();
        chrome.storage.sync.get(interfaceName,function(res){
            res = res || {};
            defer.resolve(res[interfaceName] || {});
        });
        return defer.promise();
    };
    _private.getInterfaceValues = function(){
        var defer = $.Deferred();
        chrome.storage.sync.get(interfaceValues,function(res){
            res = res || {};
            defer.resolve(res[interfaceValues] || {});
        });
        return defer.promise();
    };
    _private.updateInterfaceValues = function(key,value){
        if(!_private.interfaceValues){
            console.warn("Interface values empty, setting it to empty");
            _private.interfaceValues = {};
        }
        _private.interfaceValues[key] = value;
        // Store the interface values:
        var defer = $.Deferred();
        var store = {};
        store[interfaceValues] = _private.interfaceValues;
        chrome.storage.sync.set(store,function(){
            defer.resolve();
        });
        return defer.promise();
    };

    _private.sendAction = function(subject,key,value){
        // Inform to content
        var self = this;
        function doRequest(tabs){
            chrome.tabs.sendMessage(tabs[0].id,{from: 'popup', subject: subject, key: key, value:value });
        }
        chrome.tabs.query({ active: true, currentWindow: true}, doRequest);
        // Store value
        _private.updateInterfaceValues(key,value);
    }

    _private.createEntryButton = function(properties){
        var element = $('#templates .menu-entry').clone();
        $(element).append(properties.desc);
        $(element).data('prop',properties);
        $('#entries').append(element);
    };

    _private.createToggleButton = function(properties,value){
        value = typeof value !== 'undefined'? value : properties.default;
        var element = $('#templates .menu-toggle').clone();
        $(element).append(properties.desc);
        $(element).data('prop',properties);
        $('#entries').append(element);
        $(element).find('.check').first().prop('checked',value);
    };

    $("body").on("click",".menu-entry",function(){
        var prop = $(this).data('prop');
        if(prop && prop.key){
            _private.sendAction('entry',prop.key);
        }
    });

    $("body").on("click",".menu-toggle",function(){
        var prop = $(this).data('prop');
        var check = $(this).find('.check').first();
        var newVal = !$(check).is(':checked');
        $(check).prop('checked',newVal);
        if(prop && prop.key){
            _private.sendAction('toggle',prop.key,newVal);
        }
    });

    window.addEventListener('DOMContentLoaded', function() {
        _private.getInterface().done(function(interfaceItems){
            _private.getInterfaceValues().done(function(interfaceValues){
                _private.interfaceItems = interfaceItems;
                _private.interfaceValues = interfaceValues;
                console.log(interfaceItems,interfaceValues);
                for(var p in interfaceItems){
                    var prop = interfaceItems[p];
                    switch (prop.type){
                        case 'entry':
                            _private.createEntryButton(prop);
                            break;
                        case 'toggle':
                            _private.createToggleButton(prop,interfaceValues[prop.key]);
                            break;
                    }
                }
            });
        });
    });

})();
