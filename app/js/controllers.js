  angular.module('MyApp',[])
  .controller('MyController',function($scope, $http){
    $scope.sendRequest = function() {
        $http.get('http://localhost:6001/').then(function(response) {
          $scope.myData = response.data;
        });
        console.log("send");
      };
  })