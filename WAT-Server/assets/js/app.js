(function(){
  var app = angular.module('app',['ngSails','ngRoute','app_controllers','app_directives','app_server']);

  app.config(['$routeProvider','$sailsProvider',
    function($routeProvider) {

      $routeProvider.
        when('/home', {
          templateUrl: 'views/home-view.html',
          controller: 'HomeCtrl'
        }).
        when('/templates', {
          templateUrl: 'views/template-view.html',
          controller: 'HomeCtrl'
        }).
        when('/templates/:templateId', {
          templateUrl: 'views/template-view.html',
          controller: 'HomeCtrl'
        }).
        when('/login', {
          templateUrl: 'views/login-view.html',
          controller: 'LoginCtrl'
        }).
        when('/register', {
          templateUrl: 'views/register-view.html',
          controller: 'LoginCtrl'
        }).
        otherwise({
          redirectTo: '/home'
        });
    }
  ])
    .run( function($rootScope, $location,Server) {
      // register listener to watch route changes

      $rootScope.goTo = function (path) {
        $location.path(path);
      }

      $rootScope.setUser = function(user){
        $rootScope.loggedUser.user = user;
        if($rootScope.loggedUser.user==null)return;
        $rootScope.loggedUser.user.volunteer = $rootScope.loggedUser.user.userType === 'VOLUNTEER_USER';
        $rootScope.loggedUser.user.final =$rootScope.loggedUser.user.userType === 'FINAL_USER';
      }
      Server.getSession().then(
        function(data){
          if(data && data.user){
            $rootScope.loggedUser = data;
            $rootScope.setUser(data.user);
            $location.path("/home");
          }
        },
        function(err){
            console.error(err);
        }
      );

      $rootScope.logout = function(){
        Server.stopListeningModels();
        delete $rootScope.loggedUser;
        setTimeout(function(){
          Server.logout().then(
            function(success){
              $location.path("/login");
              console.log('Logout success',success);
            },
            function(err){
              console.error('Logout error',err);
            }
          );

        },0);
      };

      $rootScope.$on("$routeChangeStart", function (event, next, current) {
        if ($rootScope.loggedUser == null) {
          if (next.templateUrl != "views/login-view.html" && next.templateUrl != "views/register-view.html") {
           $location.path("/login");
          }
        }else{
          if (next.templateUrl == "views/login-view.html") $location.path("/home");
          if (next.templateUrl == "views/register-view.html") $location.path("/home");
        }
      });

    });

})();
