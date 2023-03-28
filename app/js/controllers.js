  angular.module('MyApp',[])
  .controller('MyController',function($scope, $http, $sce){
    $scope.reload = function(){
      location.reload()
    }
    $scope.toggleHideLogInButtonState = function(){
      $scope.hideLogInButton = sessionStorage.getItem("credentials") == null ? false : true
    }

    $scope.displayValue = function(index) {
      $scope.currentdevice = $scope.devices[index];
      var config = {
        headers: {
          'Authorization': 'Bearer ' + sessionStorage.getItem("credentials"),
          'Content-Type': 'application/json'

        }
      }
      var deviceData = {deviceIDN: $scope.currentdevice}

    $http.post('http://localhost:8080/api/getDashboardUID', deviceData,config)
          .then(function(response) {
            console.log(response);
            $scope.trustSrc = function(src) {
              return $sce.trustAsResourceUrl(src);
            }
            const time_series = response.data.time_series
            const alerts = response.data.alertchart;
            const performance_chart = response.data.performancesummarychart
        

            $scope.grafanaiframeAlertURL = alerts;
            $scope.grafanaiframeURL = time_series;
            $scope.grafanaiframePerformanceURL = performance_chart;
            $scope.dashboardUID = response.data.dashboardsUID;
            $scope.showTimePickers = true;
    });
     
    }

    $scope.init = function() {
      $scope.hideLogInButton = sessionStorage.getItem("credentials") == null ? false : true
      $scope.profileImg = sessionStorage.getItem("profileImageSrc")
      console.log(sessionStorage.getItem("profileImageSrc"))
      if(sessionStorage.getItem("credentials") != null ){
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
      
    }

    $scope.updateTimeSeriesPanelDates = function() {
      var startDate = document.getElementById("timeseriesStartDate").value
      var endDate = document.getElementById("timeseriesEndDate").value
      
      var startDateTime = new Date(startDate);
      var endDateTime = new Date(endDate);

      if(startDateTime == 'Invalid Date' && endDateTime == 'Invalid Date'){
        //Get all values for since device went online
        startDateTime = null
        endDateTime = null
      }
      else if(startDateTime >= endDateTime){
        //Should display an error message
        //Let user know start date time must be < end date time
        return;
      }
      else if (startDateTime == 'Invalid Date') {
        startDateTime = null
      }
      else if (endDateTime == 'Invalid Date') {
        endDateTime = null
      }

      var config = {
        headers: {
          'Authorization': 'Bearer ' + sessionStorage.getItem("credentials"),
          'Content-Type': 'application/json'

        }
      }
      
      var startTimeJSONVal = startDateTime == null ? null : startDateTime.getTime()
      var endTimeJSONVal = endDateTime == null ? null : endDateTime.getTime()

      var postBody = {
                        dashboardUID: $scope.dashboardUID,
                        deviceID: $scope.currentdevice.DeviceID,
                        startTime: startTimeJSONVal,
                        endTime: endTimeJSONVal
                     }

      $http.post('http://localhost:8080/api/updatePanelDates', postBody,config)
           .then(function(response) {
              if(response.status != 200){
                console.log("Bad response:", response.status)
              }
              console.log(response);
              $scope.trustSrc = function(src) {
                return $sce.trustAsResourceUrl(src);
              }
              
              const time_series = response.data.time_series
              const alertchart = response.data.alertchart
              const performance_chart = response.data.performancesummarychart

              $scope.grafanaiframeURL = time_series;
              $scope.grafanaiframeAlertURL = alertchart;
              $scope.grafanaiframePerformanceURL = performance_chart;
           })
           .catch(function(error){
            console.log(error)
           })
           
    }
  })