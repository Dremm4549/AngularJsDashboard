  angular.module('MyApp',[])
  .controller('MyController',function($scope, $http){
    $scope.sendRequest = function() {
        var config = {
          headers: {
            'Authorization': 'Bearer ' + sessionStorage.getItem("credentials")
          }
        }
        $http.get('http://localhost:8080/api/devices', config).then(function(response) {
          $scope.devices = response.data.result;
          console.log(response.data.result);
        });
    
        
        }

    $scope.displayValue = function(index) {
      var device = $scope.devices[index]
      console.log(device.DeviceID)
    }
    
    
  })