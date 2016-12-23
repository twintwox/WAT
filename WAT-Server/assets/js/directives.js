angular.module('app_directives',[])
.directive('ieImports', function() {
  return {
    templateUrl: 'templates/ie-imports.html'
  };
})
.directive('introImports', function() {
  return {
    templateUrl: 'templates/intro-imports.html'
  };
})

.directive('defaultFooter', function() {
  return {
    templateUrl: 'templates/default-footer.html'
  };
})

  .directive('allTemplates', function() {
    return {
      templateUrl: 'templates/all-templates.html'
    };
  })

  .directive('myTemplates', function() {
    return {
      templateUrl: 'templates/my-templates.html'
    };
  })

  .directive('editTemplate', function() {
    return {
      templateUrl: 'templates/edit-template.html'
    };
  })

  .directive('searchBox', function() {
    return {
      templateUrl: 'templates/search-box.html'
    };
  })
  .directive('allRequests', function() {
    return {
      templateUrl: 'templates/all-requests.html'
    };
  })
  .directive('doRequests', function() {
    return {
      templateUrl: 'templates/do-requests.html'
    };
  })

.directive('accountHeader', function() {
  return {
    templateUrl: 'templates/account-header.html',
    link: function(){
      _initLTE();
    }
  };
})
.directive('accountSidebar', function() {
  return {
    templateUrl: 'templates/account-sidebar.html',
    link: function(){
      _initLTE();
    }
  };
})
.directive('accountControl', function() {
  return {
    templateUrl: 'templates/account-control.html',
    link: function(){
      _initLTE();
    }
  };
})
;
