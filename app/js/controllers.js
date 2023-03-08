  angular.module('MyApp',[])
  .controller('MyController',function($scope, $http){
    $scope.sendRequest = function() {
        $http.get('http://localhost:6002/').then(function(response) {
          $scope.myData = response.data;
          console.log(response.data);
        });
        
      };
  })