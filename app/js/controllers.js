  angular.module('MyApp',[])
  .controller('MyController',function($scope, $http, $sce){
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
      var device = $scope.devices[index];
      console.log(device.DeviceID);
      var config = {
        headers: {
          'Authorization': 'Bearer ' + sessionStorage.getItem("credentials"),
          'Content-Type': 'application/json'

        }
      }
      var deviceData = {deviceIDN: device}


    $http.post('http://localhost:8080/api/getDashboardUID', deviceData,config)
          .then(function(response) {
            console.log("ashely :)");
            console.log(response);
            $scope.trustSrc = function(src) {
              return $sce.trustAsResourceUrl(src);
            }
            
            $scope.grafanaiframeURL = response.data;
    });
     
    }
  })