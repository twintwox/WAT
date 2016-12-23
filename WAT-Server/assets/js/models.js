angular.module('app_models',[])
.factory('Models', ['Lang',function(Lang) {
        service = {};

        // Define the models and properties that are going to be checked.
        // name:{
        //    property: [bool | fn(value)]
        // }
        // If property == bool: whether it is required or not (default to false).
        // If property == function: must contains a validation function that receives the value
        // and returns true when it is correct and an error string when it fails.
        models = {
            user:{
                //type:true
            },
            template:{
                domain:true,
                //type:true,
                data: function (value) {
                  if(value.length > 10) return true;
                  return "Debe tener mas de 10 caracteres";
                }
            }
        }

        // This auto-generates the CHECK function for each model from its name and properties:
        var createCheck = function (Name,props) {
            // Create check for individual objects
            service['check'+Name] = function(obj){
                var report = {};
                report.success = true;
                report.fails = {};
                // Check that contains all required fields:
                for(var p in props){
                    switch (typeof props[p]){
                      case 'boolean':
                            if(props[p] && typeof obj[p] === 'undefined' || obj[p].length == 0){
                              report.success = false;
                              report.fails[p] = Lang.getString("is_required");
                            }
                            break;
                      case 'function':
                            var result = props[p](obj[p]);
                            if(result != true){
                              report.success = false;
                              report.fails[p] = result;
                            }
                            break;
                    }
                }
                return report;
            }

            // Create check for collection of objects
            service['checkCollection'+Name+'s'] = function(arr){
                //Check each object in collection
                for(var i=0; i<arr.length;i++){
                    if(!service['check'+Name]){
                      console.error('Failed checking collection ',Name+'s');
                      return false;
                    }
                }
                return true;
            }
        }

        //Generate check fns
        for(var name in models){
            var Name = name.charAt(0).toUpperCase() + name.slice(1);
            createCheck(Name,models[name]);
        }
        return service;
}]);
