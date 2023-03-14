// Define a new module called 'MyApp'
angular.module('MyApp', [])
.config(['$sceDelegateProvider', function($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist([
      'self',
      'http://grafana.com/**'
    ]);
  }]);

//       // Define a new module called 'MyApp'
// angular.module('MyApp', ['ngSanitize']).config(function($sceDelegateProvider) {  
//     $sceDelegateProvider.resourceUrlWhitelist([
//         // Allow same origin resource loads.
//         'self',
//         // Allow loading from our assets domain. **.
//         'http://ergast.com/**'
//       ])});