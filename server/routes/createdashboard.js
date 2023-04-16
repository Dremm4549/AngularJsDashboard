const express = require('express');
const router = express.Router();

const { authenticateToken,config } = require('../middleware');
const mysql = require('mysql2');
const axios = require('axios');

const db = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'MySQLBEAMroot2023',
    database:'beam_db',
    port:3306
})

router.post("/getDashboardUID", authenticateToken, function (req, res) {
    //res.status(200).json({status: "UP"})
    //req.userSub holds the immutable globally unique ID of google users
    //Can use this to query the database and return html containing the devices
    //the user owns

    var deviceId = req.body.deviceIDN.DeviceID;
    console.log(deviceId);
    
    let qr = 'SELECT dashboardUID FROM `beam_db`.`devices` WHERE DeviceID = ' + deviceId + ';';
    
    let dashboardUID = "";
    var generatedDashboardUID = "";
    db.query(qr, (err, result) => {
        if(err){
            console.log(err, 'errs')
        }
        console.log('post sql query')

        if(result.length >= 0 && result[0].dashboardUID != null){
        //console.log(result[0].dashboardUID)
            console.log("yeet");
        //check if dashboard exists
        let dashboardURL = "http://localhost:3000/api/dashboards/uid/" + result[0].dashboardUID;
        axios.get(dashboardURL)
        .then(function(response) {
            // success - dashboard exists
            // //if the title has spaces they must be converted to dashes
            let title = response.data.dashboard.title;

            var startTimestamp = new Date();
            startTimestamp.setMonth(startTimestamp.getMonth() - 1)
            startTimestamp = startTimestamp.getTime()
            let endTimestamp = new Date().getTime();

            //performancesummarychart
            //http://localhost:3000/d-solo/4KMg0C14z/100000?orgId=1&from=1678660119000&to=1678746396000&panelId=2
            res.send({time_series: `http://localhost:3000/d-solo/${result[0].dashboardUID}/${title}?orgId=1&from=${startTimestamp}&to=${endTimestamp}&panelId=2`, 
            alertchart: `http://localhost:3000/d-solo/${result[0].dashboardUID}/${title}?orgId=1&from=${startTimestamp}&to=${endTimestamp}&panelId=4`, 
            performancesummarychart: `http://localhost:3000/d-solo/${result[0].dashboardUID}/${title}?orgId=1&from=${startTimestamp}&to=${endTimestamp}&panelId=6`,
            perfychart: `http://localhost:3000/d-solo/${result[0].dashboardUID}/${title}?orgId=1&from=${startTimestamp}&to=${endTimestamp}&panelId=8`,
            perfzchart: `http://localhost:3000/d-solo/${result[0].dashboardUID}/${title}?orgId=1&from=${startTimestamp}&to=${endTimestamp}&panelId=10`,                        
            dashboardsUID: result[0].dashboardUID});
          });
        }
        //handles dashboard not existing and creating dashboard
        else {
             console.log("dashboard does not exist, creating");
            
            const fs = require('fs');
            let newPanel = JSON.parse(fs.readFileSync('dashboardTemplate.json', 'utf8'));
            let dashboardCreation = JSON.parse(fs.readFileSync('dashboardCreationMom.json', 'utf8'));
            //console.log(dashboardCreation.dashboard.panels[0].targets[0].rawSql);

            dashboardCreation.dashboard.title = deviceId.toString();
            console.log(dashboardCreation.dashboard.title);
            dashboardCreation.dashboard.panels[0].title = "Device ID: " + deviceId;
            var rawSqlString = "SELECT Time_Stamp,X, Y, Z FROM beam_db.devicedata WHERE DeviceID = " + deviceId + " order by Time_Stamp desc LIMIT 21600;";
            dashboardCreation.dashboard.panels[0].targets[0].rawSql = rawSqlString;

            dashboardCreation.dashboard.panels[1].title = "Alerts for Device ID: " + deviceId;
            var alertQuery = `SELECT Time_Stamp, X, Y, Z FROM (SELECT Time_Stamp, X, Y, Z FROM beam_db.devicedata WHERE DeviceID = ${deviceId} AND (X >= 3 OR Y >= 0.45 OR Z > 0.1) ORDER BY Time_Stamp DESC) t ORDER BY Time_Stamp desc LIMIT 21600;`
            dashboardCreation.dashboard.panels[1].targets[0].rawSql = alertQuery;

            //Dasboard creation for piechart 'x'
            dashboardCreation.dashboard.panels[2].title = `X | Performance Summary for Device ID: ${deviceId}`
            const pieChartRawSql = `SELECT SUM(CASE WHEN x >= 0 AND x < 2.99 THEN 1 ELSE 0 END) AS healthy_count,SUM(CASE WHEN x >= 3 AND x < 4.79 THEN 1 ELSE 0 END) AS warning_count, SUM(CASE WHEN x >= 4.8 AND x <= 6 THEN 1 ELSE 0 END) AS critical_count FROM devicedata WHERE DeviceID='${deviceId}' AND Time_Stamp >= DATE_SUB(NOW(), INTERVAL 30 DAY);`
            dashboardCreation.dashboard.panels[2].targets[0].rawSql = pieChartRawSql;

            // Dashboard creation for piechart 'y' values
            dashboardCreation.dashboard.panels[3].title = `Y | Performance Summary for Device ID: ${deviceId}`
            const pieChartYRawSql = `SELECT SUM(CASE WHEN y >= 0 AND y < 0.45 THEN 1 ELSE 0 END) AS healthy_count,SUM(CASE WHEN y >= 0.45 AND y < 0.65 THEN 1 ELSE 0 END) AS warning_count, SUM(CASE WHEN y >= .65 THEN 1 ELSE 0 END) AS critical_count FROM devicedata WHERE DeviceID='${deviceId}' AND Time_Stamp >= DATE_SUB(NOW(), INTERVAL 30 DAY);`
            dashboardCreation.dashboard.panels[3].targets[0].rawSql = pieChartYRawSql;

            //Dashboard creation for piechart 'z' values
            dashboardCreation.dashboard.panels[4].title = `Z | Performance Summary for Device ID: ${deviceId}`
            const pieChartZRawSql = `SELECT SUM(CASE WHEN z >= 0 AND z < 0.1 THEN 1 ELSE 0 END) AS healthy_count, SUM(CASE WHEN z >= .1 THEN 1 ELSE 0 END) AS critical_count FROM devicedata WHERE DeviceID='${deviceId}' AND Time_Stamp >= DATE_SUB(NOW(), INTERVAL 30 DAY);`
            dashboardCreation.dashboard.panels[4].targets[0].rawSql = pieChartZRawSql;

            // do not need to provide UID as it is provided in response

            var config = {
                headers: {
                  'Authorization': 'Bearer ' + "eyJrIjoiV0xIOU1rUUI2ZDJCNUdqVlN0elFUcDN3ODFrTE5FSkgiLCJuIjoiQWRtaW5LZXkiLCJpZCI6MX0=",
                  'Content-Type': 'application/json'
                }
            }

               axios.post('http://localhost:3000/api/dashboards/db', dashboardCreation, config)
              .then(function (response) {
                console.log(response.status);
                //dashboard was created
                if (response.status == 200)  
                {
                    let qr = `UPDATE beam_db.devices SET dashboardUID = '${response.data.uid}' WHERE DeviceID = '${deviceId}'`;
                    generatedDashboardUID = response.data.uid; // should remove bad practice
                    db.query(qr, (err, result) => {
                        if(err){
                            console.log(err, 'errs')
                        }
                        var startTimestamp = new Date();
                        startTimestamp.setMonth(startTimestamp.getMonth() - 1)
                        startTimestamp = startTimestamp.getTime()
                        let endTimestamp = new Date().getTime();
                        
                        console.log('\n',`http://localhost:3000/d-solo/${generatedDashboardUID}/${dashboardCreation.dashboard.panels[0].title}?orgId=1&from=${startTimestamp}&to=${endTimestamp}&panelId=8`,'\n');

                        res.send({time_series: `http://localhost:3000/d-solo/${generatedDashboardUID}/${dashboardCreation.dashboard.panels[0].title}?orgId=1&from=${startTimestamp}&to=${endTimestamp}&panelId=2`, 
                        alertchart: `http://localhost:3000/d-solo/${generatedDashboardUID}/${dashboardCreation.dashboard.panels[0].title}?orgId=1&from=${startTimestamp}&to=${endTimestamp}&panelId=4`, 
                        performancesummarychart: `http://localhost:3000/d-solo/${generatedDashboardUID}/${dashboardCreation.dashboard.panels[0].title}?orgId=1&from=${startTimestamp}&to=${endTimestamp}&panelId=6`,
                        perfychart: `http://localhost:3000/d-solo/${generatedDashboardUID}/${dashboardCreation.dashboard.panels[0].title}?orgId=1&from=${startTimestamp}&to=${endTimestamp}&panelId=8`,
                        perfzchart: `http://localhost:3000/d-solo/${generatedDashboardUID}/${dashboardCreation.dashboard.panels[0].title}?orgId=1&from=${startTimestamp}&to=${endTimestamp}&panelId=10`,
                        dashboardsUID: generatedDashboardUID}); 
                    })
                }})       
    }})
})

module.exports = router;