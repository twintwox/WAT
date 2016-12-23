angular.module('app_server',['app_models','ngSails'])
.factory('Server', ['$timeout','$http','$q','Models','$rootScope','$location','$sails', function($timeout,$http,$q,Models,$rootScope,$location,$sails) {
        // Public methods are stored here:
        var service = {};

        // Define the model name here, and the code below will auto-generate the CRUD methods for each one:
        var models = ['User','Template','Request','Domain'];

        // Private methods are stored here:
        var _private = {};

        // Generic error handler, to avoid duplicates:
        var errorHandler = function(defer,msg){
            return function(err){
                $rootScope.loggedUser = null;
                $location.path('/login');
                console.error("Request error:",msg,err);
                //defer.reject(err);
            }
        };

        // Create headers for request:
        _private.getHeaders = function(){
            var headers = {};
            if($rootScope.loggedUser && $rootScope.loggedUser.token){
              headers['Authorization'] = 'Bearer ' + $rootScope.loggedUser.token;
            }
            return headers;
        };

        // Do request:
        _private.request = function(url,method,data){
            var headers = _private.getHeaders();
            return $http({url: '/'+url, headers:headers, data:data||{}, method:method||'GET'})
        };

        // Do request with cross site request forgery token:
        _private.csrfRequest = function(url,method,data){
            if(!url)return;
            var method = method || 'GET';
            var data  = data || {};
            var defer = $q.defer();
            var headers = _private.getHeaders();
            //Get CSRF Token
            $http({url: '/csrfToken', headers:headers, method:'GET'})
              .success(function(res){
                data['_csrf'] = res['_csrf'];

                _private.request(url,method,data)
                  .success(function(res){defer.resolve(res);})
                  .error(function(err){defer.reject(err);})
              })
              .error(function(err){
                //CSRF token may be disabled, try request:
                _private.request(url,method,data)
                  .success(function(res){defer.resolve(res);})
                  .error(function(err){defer.reject(err);})
                //defer.reject(err);
              });
            return defer.promise;
        };

        service.get =  function(url){
            //console.log('GET',url);
            return _private.csrfRequest(url);
        };
        service.post =  function(url,data){
          return _private.csrfRequest(url,'POST',data);
        };
        service.delete =  function(url){
          return _private.csrfRequest(url,'DELETE');
        };
        service.update =  function(url,data){
          return _private.csrfRequest(url,'PUT',data);
        };

        service.getSession = function(){
          return service.get('auth');
        };
        service.login = function(user){
          return service.post('auth',user);
        };
        service.logout = function(){
          return _private.request('auth/logout','GET',{});
        };

        // Instant promises:
        _private.instantAction = function (value) {
          var defer = $q.defer();
          defer.reject(value);
          return defer.promise;
        }
        _private.instantError = function (value) {
          var defer = $q.defer();
          defer.reject(value);
          return defer.promise;
        }
        _private.validate = function (Name,data) {
          if(!Models['check'+Name]) return {success:true};
          return Models['check'+Name](data);
        }


    // Create CRUD methods for variable Name:
        var generateCrud = function (Name) {
          // New instance
          service['create'+Name] = function(data){
            var report = _private.validate(Name,data);
            if(!report.success)
              return _private.instantError(report);
            return service.post(Name,data);
          };
          // Update existing instance
          service['update'+Name] = function(data){
            if(!data || !data.id)
              return _private.instantError('Data ID needed for update model ' + Name);
            var report = _private.validate(Name,data);
            if(!report.success)
              return _private.instantError(report);
            return service.update(Name+'/'+data.id,data);
          };
          // Read all instances
          service['read'+Name+'s'] = function(params){
            var p = params? Name+'?'+params : Name;
            return service.get(p);
          };
          // Read instance
          service['read'+Name] = function(id){
            if(id) return service.get(Name+'/'+id);
            else console.error("Id needed");
          };
          // Delete instance
          service['delete'+Name] = function(id){
            if(id) return service.delete(Name+'/'+id);
            else console.error("Id needed");
          };
          // Add instance to collection
          service['bind'+Name+'With'] = function(id,collectionName,itemId){
            if(id && collectionName && itemId)
              return service.post([Name,id,collectionName,itemId].join('/'));
            else console.error("Params needed");
          }
          // Remove instance from collection
          service['unbind'+Name+'Of'] = function(id,collectionName,itemId){
            if(id && collectionName && itemId)
              return service.delete([Name,id,collectionName,itemId].join('/'));
            else console.error("Params needed");
          }
          // Collection contains
          service['containsInside'+Name+'Collection'] = function(id,collectionName,itemId){
            if(id && collectionName && itemId)
              return service.get([Name,id,collectionName,itemId].join('/'));
            else console.error("Params needed");
          }
          // Populate
          service['populate'+Name+'With'] = function(id,objectName){
            if(id && objectName)
              return service.get([Name,id,objectName].join('/'));
            else console.error("Params needed");
          }
        };

        // Generate all CRUD for models
        for(var i=0;i<models.length;i++){
          generateCrud(models[i],'check');
        }


        /** Socket IO autogenerated code **/

        // Subscribe model to start listening:
        _private.subscribe = function(model){
          var defer = $q.defer();
          $sails.request({
            method: 'get',
            url: '/'+model.toLowerCase(),
            params: {},
            headers: _private.getHeaders()
          }, function(res, jwres) {
            if(!res.err) defer.resolve();
            else defer.reject();
          });
          return defer.promise;
        };

        _private.listenHandlers = {};
        _private.startListening = function(Model,$scope){
          _private.subscribe(Model.toLowerCase());
          _private.listenHandlers[Model] = $sails.on(Model.toLowerCase(),$scope['on'+Model+'Change']);
        }
        _private.stopListening = function(Model){
          $sails.off(Model.toLowerCase(), _private.listenHandlers[Model]);
        }

        service.startListeningModels = function($scope){
          for(var i=0;i<models.length;i++){
            if(models[i]==='User')continue;
            _private.startListening(models[i],$scope);
          }
        }
        service.stopListeningModels = function(){
          for(var i=0;i<models.length;i++){
            _private.stopListening(models[i]);
          }
        }

        return service;
}]);
