angular.module('app_controllers',['app_server','app_lang'])

  .controller('LoginCtrl', ['$scope','$rootScope','Lang','Server','$location',
    function($scope,$rootScope,Lang,Server,$location) {
      $scope.lang = Lang;
      $scope.languages = ['ES','EN'];
      $scope.user = {lang:$scope.languages[0]};

      $scope.typeUserOptions = [
        {
          value:"FINAL_USER",
          label:Lang.getString("FINAL_USER")
        },
        {
          value:"VOLUNTEER_USER",
          label:Lang.getString("VOLUNTEER_USER")
        }
      ];
      $scope.selectedUserType=$scope.typeUserOptions[0];



      $scope.login = function () {
        Server.login($scope.user).then(
          function (data){
            $rootScope.loggedUser = data;
            $rootScope.setUser(data.user)
            $location.path("/home");
          },
          function (err){
            if(err && err.err) $scope.loginMsg = err.err;
            else $scope.loginMsg = Lang.getString('unknown_login_error');
        });
      };
      $scope.logout = function(){
        console.log("Logout called");
        $scope.$root.logout();
        $scope.$destroy();
      }
      $scope.register = function(){
        $scope.user.userType=$scope.selectedUserType.value;
        Server.createUser($scope.user).then(
          function (success){
            console.log(success);
            $scope.login();
          },
          function (err){
            console.error(err);
            $scope.registerMsg = err.err;
          });
      };

      $scope.goTo = function(path){
        $location.path(path);
      }

    }
  ])
  .controller('HomeCtrl', ['$scope','$rootScope','$interval','$routeParams','Lang','$timeout','$location','Server',
    function($scope,$rootScope,$interval,$routeParams,Lang,$timeout,$location,Server) {

      $scope.getUser = function(){
        if(!$rootScope.loggedUser) return {};
        return $rootScope.loggedUser.user;
      }

      $scope.lang = Lang;
      $scope.templates = [];
      $scope.myTemplates = [];
      $scope.template = null;
      $scope.errorMsg = null;
      $scope.request  = {};
      $scope.requestLang = $scope.getUser().lang;
      $scope.myRequests  = [];
      $scope.selectedTemplate = null;
      $scope.searchText="";
      $scope.requests = [];
      $scope.languages = ['ES','EN'];
      $scope.domains = {};

      console.log($scope.getUser());

      /** ERROR HANDLER ***/
      var errorHandler = function (err) {
        console.error(err);
        if(err && err.err === "Invalid Token!" && $rootScope.loggedUser!=null){
          try {
            $rootScope.logout();
            $rootScope.logoutMsg = Lang.getString('login_again');
          }catch(err){};
          $location.path('/login');
        }
      }

      var assert = function(bool,msg){
        if(!bool) throw new Error(msg);
      }

      /** UPDATE COLLECTIONS ***/

      function indexOf(arr,obj){
        var find = arr.filter(function(el){
          return el.id == obj.id;
        });
        assert(find.length <= 1,"indexOf should return 1 element");
        if(find.length == 0) return -1;
        assert(find[0].id == obj.id,"indexOf should find element with same ID");
        return arr.indexOf(find[0]);
      }

      function addOrUpdateCollection(collection,element,addIfNotFound){
        var idx = indexOf(collection,element);
        if(idx > -1) collection[idx] = element;
        else if(addIfNotFound) collection.push(element);
      }

      /** SOCKET IO***/
          $scope.onUserChange = function(message){
             // console.log('User change',message);
             // $scope.readUser();
          };
          $scope.onTemplateChange = function(message){
            console.log('Template change',message);
            Server.readTemplate(message.id).then(function(s){

              addOrUpdateCollection($scope.templates,s,true);
              var isOwner =  s.author == $scope.getUser().id;
              addOrUpdateCollection($scope.myTemplates,s,isOwner);

            },errorHandler);
          };
          $scope.onRequestChange = function (message) {
            console.log('Request change',message);
            Server.readRequest(message.id).then(function(s){
              addOrUpdateCollection($scope.requests,s,true);

            },errorHandler);
          };

      /** LISTENING MODELS ***/

          Server.startListeningModels($scope);
          // Stop watching for updates
          $scope.$on('$destroy', function() {
            console.log('Called destroy');
            Server.stopListeningModels();
          });

      /** USER READ **/
          $scope.readUser = function(){
             // Server.readUser($scope.user.id).then($scope.setUser,errorHandler);
          };

      /** TEMPLATES CRUD **/

          $scope.createTemplate = function(){
            assert($scope.getUser().volunteer,"Only volunteer users can create templates");

            if($scope.template==null) $scope.selectNewTemplate();
            $scope.template.author = $scope.getUser();
            $scope.template.date = new Date();
            Server.createTemplate($scope.template).then(
              function(success){
                console.log(success);
                $scope.template = null;
              },
              function(err){
                errorHandler(err);
                $scope.errorMsg = err;
              }
            );
          };
          $scope.readTemplates = function(){
            Server.post('Template/findKeywords',{keywords:$scope.searchText.split(' ')}).then(
              function (success){
                $scope.templates = success;
                console.log(success,$scope.templates);
              },errorHandler
            );
          };
          $scope.readTemplates();

          $scope.readMyTemplates = function(){
            Server.readTemplates('sort=domain DESC&where={"author":"'+$scope.getUser().id+'"}').then(
              function (success){
                $scope.myTemplates = success;
                $scope.selectedTemplate = 0;
                // Check if a template is selected by parameter for edition:
                if($routeParams.templateId){
                  var lookId = $routeParams.templateId;
                  $scope.template = $scope.myTemplates.filter(function(t){return t.id+''===lookId})[0];
                }
                console.log($scope.myTemplates);
              },errorHandler
            );
          };
          $scope.readMyTemplates();

          $scope.updateTemplate = function () {
            if(!$scope.template || !$scope.template.id)return;
            delete $scope.template.author;
            $scope.template.date = new Date();
            Server.updateTemplate($scope.template).then(
              function(success){
                console.log(success);
                $scope.template = null;
              },
              function(err){
                errorHandler(err);
                $scope.errorMsg = err;
              }
            );
          };

          $scope.deleteTemplate = function(){
            if(!$scope.template || !$scope.template.id)return;
            Server.deleteTemplate($scope.template.id).then(
              function(){
                $scope.template = null;
              },errorHandler
            );
          };

      /** OTHER TEMPLATE OPERATIONS  **/
          $scope.editTemplate = function (t) {
              $scope.template = t;
             // $location.path("/templates/"+ t.id);
          }
          $scope.copyTemplate = function(t){
              $scope.template = {
                copyright: (t.copyright?t.copyright+"/@/":"")+ t.author.email,
                lang: t.lang,
                domain: t.domain,
                alias: t.alias,
                description: t.description,
                data: t.data
              }
          }
          $scope.selectTemplate = function(){
            console.log($scope.selectedTemplate);
            $scope.template = $scope.myTemplates[$scope.selectedTemplate];
          }
          $scope.selectNewTemplate = function () {
            $scope.template = {lang:$scope.languages[0],domain:{}};
          }
          $scope.cancelEdit = function(){
            $scope.template = null;
          }

          $scope.installTemplate = function(template){
              //Remove those installed at the same domain:
              var installed =  $scope.getUser().installedTemplates || [];
              var sameDomain = installed.filter(
                function(t){ return t.domain === template.domain}
              );
              for(var t in sameDomain) $scope.uninstallTemplate(sameDomain[t])
              //Install new template:
              Server.bindUserWith($scope.getUser().id,'installedTemplates',template.id).then(
                function (user)  {
                  $scope.getUser().installedTemplates = user.installedTemplates;
                },errorHandler);
          };

          $scope.uninstallTemplate = function(template){
              Server.unbindUserOf($scope.getUser().id,'installedTemplates',template.id).then(
                function (user)  {
                  $scope.getUser().installedTemplates = user.installedTemplates;
                },errorHandler);
          };

          // Whether the user is related with the item in a specific collection:

          function isRelatedWithItem(collection,id){
            if(!$scope.getUser()[collection]) return false;
            return $scope.getUser()[collection]
                .filter(function(item){return item.id === id;})
                .length > 0;
          }

          $scope.isInstalled = function(id) {
            return isRelatedWithItem('installedTemplates',id);
          };
          $scope.isRatedUp = function (id) {
            return isRelatedWithItem('thumbUp',id);
          };
          $scope.isRatedDown = function (id) {
            return isRelatedWithItem('thumbDown',id);
          };

          // Populate collections:
          Server.populateUserWith($scope.getUser().id,'installedTemplates').then(function(s){
            $scope.getUser().installedTemplates = s;
          },errorHandler);
          Server.populateUserWith($scope.getUser().id,'thumbUp').then(function(s){
            $scope.getUser().thumbUp = s;
          },errorHandler);
          Server.populateUserWith($scope.getUser().id,'thumbDown').then(function(s){
            $scope.getUser().thumbDown = s;
          },errorHandler);


      $scope.rate = function (template,positive) {
            console.log(template.id);
            var addTo = positive?'thumbUp':'thumbDown';
            var removeFrom = !positive?'thumbUp':'thumbDown';

            Server.bindUserWith($scope.getUser().id,addTo,template.id).then(
              function (user)  {
                // Update collection
                $scope.getUser()[addTo] = user[addTo];
              },errorHandler);

            Server.unbindUserOf($scope.getUser().id,removeFrom,template.id).then(
              function (user)  {
                // Update collection
                $scope.getUser()[removeFrom] = user[removeFrom];
              }
              ,errorHandler);

          }

      /** REQUEST CRUD **/
        $scope.createRequest = function(){
          assert($scope.getUser().final,"Only final users can create requests");

          $scope.request.initiator = $scope.getUser();
          $scope.request.date = new Date();
          $scope.request.lang = $scope.request.initiator.lang;

          // Find domain for request:
          Server.readDomains('where={"url":"'+$scope.request.domain.url+'", "lang":"'+$scope.request.lang+'"}').then(
            function(domains){
              assert(domains.length<=1,"Should not exist two equals domains and lang");
              $scope.request.domain = domains.length == 1? domains[0] : {url:$scope.request.domain.url,lang:$scope.request.lang};
              //Once finded or created the domian, create request:

              Server.createRequest($scope.request).then(
                function(success){
                  console.log(success);
                  $scope.request = {};
                  $scope.refreshRequests();
                  $scope.errorMsg = null;
                },
                function(err){
                  errorHandler(err);
                  $scope.errorMsg = err;
                }
              );
            },errorHandler);
        };
        $scope.deleteRequest = function(req){
          assert($scope.getUser().final,"Only final users can delete their requests");

          // Validate request
          if(!req || !req.id || $scope.myRequests.indexOf(req) == -1 ) return;

          Server.deleteRequest(req.id).then(
            function(){
              $scope.readMyRequests();
            },errorHandler
          );
        }
        $scope.readRequests = function(selectedLang){
            var queryLang = selectedLang? selectedLang : $scope.requestLang;
            Server.readRequests('sort=domain DESC&where={"lang":"'+queryLang+'","solved":false}').then(
              function(success){
                $scope.requests = success;
                $rootScope.requestLength = $scope.requests.length;
              },
              errorHandler
            );
        };
        $scope.readMyRequests = function(){
          Server.readRequests('sort=domain DESC&where={"initiator":"'+$scope.getUser().id+'","solved":false}').then(
            function(success){
              console.log(success);
              $scope.myRequests = success;
            },
            errorHandler
          );
        };

        $scope.refreshRequests = function () {
          if($scope.getUser().volunteer)
            $scope.readRequests();
          else
            $scope.readMyRequests();
        };
        $scope.refreshRequests();


        $scope.resolveRequest = function (request) {
          assert($scope.getUser().volunteer,"Only volunteer user can resolve requets");
          $scope.template = {lang:request.lang,relatedRequest:[request],domain:request.domain,alias:request.description};
        }

        $scope.finishRequest = function (request) {
          var update = {id:request.id,solved:true};
          Server.updateRequest(update).then(function(){ $scope.refreshRequests(); },errorHandler);
        };

        $scope.seeRequestTemplates = function (request) {
          assert($scope.getUser().final,"Only final user can see associated templates");


        }

        /** DISPLAY VIEW CONTROLLER ***/

        $rootScope.showRequests = true;
        $scope.toggleRequests = function () {
          $rootScope.showRequests = !$rootScope.showRequests;
        }

        $rootScope.showAllTemplates = true;
        $scope.toggleAllTemplates = function () {
          $rootScope.showAllTemplates = !$rootScope.showAllTemplates;
        }


    }
  ])
;
