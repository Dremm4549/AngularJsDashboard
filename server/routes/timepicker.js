const express = require('express');
const router = express.Router();

const { authenticateToken,config } = require('../middleware');
const mysql = require('mysql2');
const axios = require('axios');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_User,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port:process.env.DBPORT
})

router.post("/updatePanelDates", authenticateToken, function (req, res){
    let dashboardURL = "http://localhost:3000/api/dashboards/uid/" + req.body.dashboardUID;
    axios.get(dashboardURL)
        .then(function(response) {
            
            var dashboardUpdateJSON = null
            if(req.body.startTime != null && req.body.endTime != null){
                var mysqlFormatStartTime = new Date(req.body.startTime).toISOString().slice(0, 19).replace('T', ' ')
                var mysqlFormatEndTime = new Date(req.body.endTime).toISOString().slice(0, 19).replace('T', ' ')
                var rawSQLString = "SELECT Time_Stamp, X, Y, Z FROM beam_db.devicedata WHERE DeviceID = " + req.body.deviceID + " AND Time_Stamp >= '"+ mysqlFormatStartTime +"' AND Time_Stamp <= '"+ mysqlFormatEndTime +"' order by Time_Stamp desc LIMIT 21600;"

                const pieChartRawSql = `SELECT SUM(CASE WHEN x >= 0 AND x < 2.99 THEN 1 ELSE 0 END) AS healthy_count,SUM(CASE WHEN x >= 3 AND x < 4.79 THEN 1 ELSE 0 END) AS warning_count, SUM(CASE WHEN x >= 4.8 AND x <= 6 THEN 1 ELSE 0 END) AS critical_count FROM devicedata WHERE DeviceID='${req.body.deviceID}' AND Time_Stamp >= '${mysqlFormatStartTime}' AND Time_Stamp <= '${mysqlFormatEndTime}';`
                const pieChartRawYSql = `SELECT SUM(CASE WHEN y >= 0 AND y < 0.45 THEN 1 ELSE 0 END) AS healthy_count,SUM(CASE WHEN y >= 0.45 AND y < 0.65 THEN 1 ELSE 0 END) AS warning_count, SUM(CASE WHEN y >= .65 THEN 1 ELSE 0 END) AS critical_count FROM devicedata WHERE DeviceID='${req.body.deviceID}' AND Time_Stamp >= '${mysqlFormatStartTime}' AND Time_Stamp <= '${mysqlFormatEndTime}';`
                const pieChartRawZSql = `SELECT SUM(CASE WHEN z >= 0 AND z < 0.1 THEN 1 ELSE 0 END) AS healthy_count, SUM(CASE WHEN z >= .1 THEN 1 ELSE 0 END) AS critical_count FROM devicedata WHERE DeviceID='${req.body.deviceID}' AND Time_Stamp >= '${mysqlFormatStartTime}' AND Time_Stamp <= '${mysqlFormatEndTime}';`
                
                response.data.dashboard.panels[0].targets[0].rawSql = rawSQLString;
                response.data.dashboard.panels[1].targets[0].rawSql = rawSQLString;

                response.data.dashboard.panels[2].targets[0].rawSql = pieChartRawSql;
                response.data.dashboard.panels[3].targets[0].rawSql = pieChartRawYSql;
                response.data.dashboard.panels[4].targets[0].rawSql = pieChartRawZSql;
                dashboardUpdateJSON = response.data;
                
                axios.post('http://localhost:3000/api/dashboards/db', dashboardUpdateJSON, config)
                     .then(function(response) {
                        updateDeviceStartEndTimeToDB(req.body.dashboardUID,mysqlFormatStartTime,mysqlFormatEndTime);                        
                     })
                     .catch(function(error) {
                        console.log('error', error)
                     })
                res.send({
                            time_series: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[0].title}?orgId=1&from=${req.body.startTime}&to=${req.body.endTime}&panelId=2`,
                            alertchart: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[1].title}?orgId=1&from=${req.body.startTime}&to=${req.body.endTime}&panelId=4`,
                            performancesummarychart: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[2].title}?orgId=1&from=${req.body.startTime}&to=${req.body.endTime}&panelId=6`,
                            perfychart: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[3].title}?orgId=1&from=${req.body.startTime}&to=${req.body.endTime}&panelId=8`,
                            perfzchart: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[4].title}?orgId=1&from=${req.body.startTime}&to=${req.body.endTime}&panelId=10`
                        })
                return;
            }
            else if (req.body.startTime == null && req.body.endTime == null){
                var mysqlCurrentDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ')
                var rawSQLString = "SELECT Time_Stamp, X, Y, Z FROM beam_db.devicedata WHERE DeviceID = " + req.body.deviceID + " AND Time_Stamp <= '"+ mysqlCurrentDateTime +"' order by Time_Stamp desc LIMIT 21600;"
                
                const pieChartRawSql = `SELECT SUM(CASE WHEN x >= 0 AND x < 2.99 THEN 1 ELSE 0 END) AS healthy_count,SUM(CASE WHEN x >= 3 AND x < 4.79 THEN 1 ELSE 0 END) AS warning_count, SUM(CASE WHEN x >= 4.8 AND x <= 6 THEN 1 ELSE 0 END) AS critical_count FROM devicedata WHERE DeviceID='${req.body.deviceID}' AND Time_Stamp >= DATE_SUB(NOW(), INTERVAL 1 MONTH);`
                const pieChartRawYSql = `SELECT SUM(CASE WHEN y >= 0 AND y < 0.45 THEN 1 ELSE 0 END) AS healthy_count,SUM(CASE WHEN y >= 0.45 AND y < 0.65 THEN 1 ELSE 0 END) AS warning_count, SUM(CASE WHEN y >= .65 THEN 1 ELSE 0 END) AS critical_count FROM devicedata WHERE DeviceID='${req.body.deviceID}' AND Time_Stamp >= DATE_SUB(NOW(), INTERVAL 1 MONTH);`
                const pieChartRawZSql = `SELECT SUM(CASE WHEN z >= 0 AND z < 0.1 THEN 1 ELSE 0 END) AS healthy_count, SUM(CASE WHEN z >= .1 THEN 1 ELSE 0 END) AS critical_count FROM devicedata WHERE DeviceID='${req.body.deviceID}'  AND Time_Stamp >= DATE_SUB(NOW(), INTERVAL 1 MONTH);`

                response.data.dashboard.panels[0].targets[0].rawSql = rawSQLString
                response.data.dashboard.panels[1].targets[0].rawSql = rawSQLString
                
                response.data.dashboard.panels[2].targets[0].rawSql = pieChartRawSql;
                response.data.dashboard.panels[3].targets[0].rawSql = pieChartRawYSql;
                response.data.dashboard.panels[4].targets[0].rawSql = pieChartRawZSql;

                dashboardUpdateJSON = response.data
                axios.post('http://localhost:3000/api/dashboards/db', dashboardUpdateJSON, config)
                     .then(function(response) {
                        console.log(response.status)
                        updateDeviceStartEndTimeToDB(req.body.dashboardUID,null,null);   
                     })
                     .catch(function(error) {
                        console.log('error')
                     })
                var calculatedStartTime = new Date()
                calculatedStartTime.setMonth(calculatedStartTime.getMonth() - 1)
                res.send({
                            time_series: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[0].title}?orgId=1&from${calculatedStartTime.getTime()}&to=${new Date().getTime()}&panelId=2`,
                            alertchart: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[1].title}?orgId=1&from=${calculatedStartTime.getTime()}&to=${new Date().getTime()}&panelId=4`,
                            performancesummarychart: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[2].title}?orgId=1&from=${calculatedStartTime.getTime()}&to=${new Date().getTime()}&panelId=6`,
                            perfychart: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[3].title}?orgId=1&from=${calculatedStartTime.getTime()}&to=${new Date().getTime()}&panelId=8`,
                            perfzchart: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[4].title}?orgId=1&from=${calculatedStartTime.getTime()}&to=${new Date().getTime()}&panelId=10`
                        })
                return;
            }
            else if (req.body.startTime == null) {
                var mysqlFormatEndTime = new Date(req.body.endTime).toISOString().slice(0, 19).replace('T', ' ')
                var rawSQLString = "SELECT Time_Stamp, X, Y, Z FROM beam_db.devicedata WHERE DeviceID = " + req.body.deviceID + " AND Time_Stamp <= '"+ mysqlFormatEndTime +"' order by Time_Stamp desc LIMIT 21600;"
               
                // calculates start time
                var calculatedRawStartTime = new Date(req.body.endTime)
                calculatedRawStartTime.setMonth(calculatedRawStartTime.getMonth() - 1)  
                
                var mysqlFormatStartTime = new Date(calculatedRawStartTime.getTime()).toISOString().slice(0, 19).replace('T', ' ')

                const pieChartRawSql = `SELECT SUM(CASE WHEN x >= 0 AND x < 2.99 THEN 1 ELSE 0 END) AS healthy_count,SUM(CASE WHEN x >= 3 AND x < 4.79 THEN 1 ELSE 0 END) AS warning_count, SUM(CASE WHEN x >= 4.8 AND x <= 6 THEN 1 ELSE 0 END) AS critical_count FROM devicedata WHERE DeviceID='${req.body.deviceID}' AND Time_Stamp <= '${mysqlFormatEndTime}' AND Time_stamp >= '${mysqlFormatStartTime}';`
                const pieChartRawYSql = `SELECT SUM(CASE WHEN y >= 0 AND y < 0.45 THEN 1 ELSE 0 END) AS healthy_count,SUM(CASE WHEN y >= 0.45 AND y < 0.65 THEN 1 ELSE 0 END) AS warning_count, SUM(CASE WHEN y >= .65 THEN 1 ELSE 0 END) AS critical_count FROM devicedata WHERE DeviceID='${req.body.deviceID}' AND Time_Stamp <= '${mysqlFormatEndTime}' AND Time_stamp >= '${mysqlFormatStartTime}';`
                const pieChartRawZSql = `SELECT SUM(CASE WHEN z >= 0 AND z < 0.1 THEN 1 ELSE 0 END) AS healthy_count, SUM(CASE WHEN z >= .1 THEN 1 ELSE 0 END) AS critical_count FROM devicedata WHERE DeviceID='${req.body.deviceID}' AND Time_Stamp <= '${mysqlFormatEndTime}' AND Time_stamp >= '${mysqlFormatStartTime}';`

                console.log('start time: ',mysqlFormatStartTime);
                response.data.dashboard.panels[0].targets[0].rawSql = rawSQLString;
                response.data.dashboard.panels[1].targets[0].rawSql = rawSQLString;

                response.data.dashboard.panels[2].targets[0].rawSql = pieChartRawSql;
                response.data.dashboard.panels[3].targets[0].rawSql = pieChartRawYSql;
                response.data.dashboard.panels[4].targets[0].rawSql = pieChartRawZSql;

                dashboardUpdateJSON = response.data;
                axios.post('http://localhost:3000/api/dashboards/db', dashboardUpdateJSON, config)
                     .then(function(response) {
                        console.log(response.status)
                     })
                     .catch(function(error) {
                        console.log('error')
                     })
                     var calculatedStartTime = new Date(req.body.endTime)
                     calculatedStartTime.setMonth(calculatedStartTime.getMonth() - 1)  
                     
                     updateDeviceStartEndTimeToDB(req.body.dashboardUID,mysqlFormatStartTime,mysqlFormatEndTime)
                     
                res.send({
                            time_series: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[0].title}?orgId=1&from=${calculatedStartTime.getTime()}&to=${req.body.endTime}&panelId=2`,
                            alertchart: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[1].title}?orgId=1&from=${calculatedStartTime.getTime()}&to=${req.body.endTime}&panelId=4`,
                            performancesummarychart: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[2].title}?orgId=1&from=${calculatedStartTime.getTime()}&to=${req.body.endTime}&panelId=6`,
                            perfychart: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[3].title}?orgId=1&from=${calculatedStartTime.getTime()}&to=${req.body.endTime}&panelId=8`,
                            perfzchart: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[4].title}?orgId=1&from=${calculatedStartTime.getTime()}&to=${req.body.endTime}&panelId=10`
                        })
                return;
            }
            else if (req.body.endTime == null) {
                var mysqlFormatStartTime = new Date(req.body.startTime).toISOString().slice(0, 19).replace('T', ' ')
                var rawSQLString = "SELECT Time_Stamp, X, Y, Z FROM beam_db.devicedata WHERE DeviceID = " + req.body.deviceID + " AND Time_Stamp >= '"+ mysqlFormatStartTime +"' order by Time_Stamp asc LIMIT 21600;"

                // calculates start time
                var calculatedRawEndTime = new Date(req.body.startTime)
                calculatedRawEndTime.setMonth(calculatedRawEndTime.getMonth() + 1)  
                
                var mysqlFormatEndTime = new Date(calculatedRawEndTime.getTime()).toISOString().slice(0, 19).replace('T', ' ')
                
                const pieChartRawSql = `SELECT SUM(CASE WHEN x >= 0 AND x < 2.99 THEN 1 ELSE 0 END) AS healthy_count,SUM(CASE WHEN x >= 3 AND x < 4.79 THEN 1 ELSE 0 END) AS warning_count, SUM(CASE WHEN x >= 4.8 AND x <= 6 THEN 1 ELSE 0 END) AS critical_count FROM devicedata WHERE DeviceID='${req.body.deviceID}' AND Time_Stamp <= '${mysqlFormatEndTime}' AND Time_stamp >= '${mysqlFormatStartTime}';`
                const pieChartRawYSql = `SELECT SUM(CASE WHEN y >= 0 AND y < 0.45 THEN 1 ELSE 0 END) AS healthy_count,SUM(CASE WHEN y >= 0.45 AND y < 0.65 THEN 1 ELSE 0 END) AS warning_count, SUM(CASE WHEN y >= .65 THEN 1 ELSE 0 END) AS critical_count FROM devicedata WHERE DeviceID='${req.body.deviceID}' AND Time_Stamp <= '${mysqlFormatEndTime}' AND Time_stamp >= '${mysqlFormatStartTime}';`
                const pieChartRawZSql = `SELECT SUM(CASE WHEN z >= 0 AND z < 0.1 THEN 1 ELSE 0 END) AS healthy_count, SUM(CASE WHEN z >= .1 THEN 1 ELSE 0 END) AS critical_count FROM devicedata WHERE DeviceID='${req.body.deviceID}' AND Time_Stamp <= '${mysqlFormatEndTime}' AND Time_stamp >= '${mysqlFormatStartTime}';`

                response.data.dashboard.panels[0].targets[0].rawSql = rawSQLString;
                response.data.dashboard.panels[1].targets[0].rawSql = rawSQLString;

                response.data.dashboard.panels[2].targets[0].rawSql = pieChartRawSql;
                response.data.dashboard.panels[3].targets[0].rawSql = pieChartRawYSql;
                response.data.dashboard.panels[4].targets[0].rawSql = pieChartRawZSql;


                dashboardUpdateJSON = response.data;
                axios.post('http://localhost:3000/api/dashboards/db', dashboardUpdateJSON, config)
                     .then(function(response) {
                        console.log(response.status)
                     })
                     .catch(function(error) {
                        console.log('error')
                     })
                
                     var calculatedEndTime = new Date(req.body.startTime)
                     calculatedEndTime.setMonth(calculatedEndTime.getMonth() + 1)
                     calculatedEndTime = new Date(calculatedEndTime).getTime()
                     updateDeviceStartEndTimeToDB(req.body.dashboardUID,mysqlFormatStartTime,mysqlFormatEndTime)
                res.send({
                            time_series: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[0].title}?orgId=1&from=${req.body.startTime}&to=${calculatedEndTime}&panelId=2`,
                            alertchart: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[1].title}?orgId=1&from=${req.body.startTime}&to=${calculatedEndTime}&panelId=4`,
                            performancesummarychart: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[2].title}?orgId=1&from=${req.body.startTime}&to=${calculatedEndTime}&panelId=6`,
                            perfychart: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[3].title}?orgId=1&from=${req.body.startTime}&to=${calculatedEndTime}&panelId=8`,
                            perfzchart: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[4].title}?orgId=1&from=${req.body.startTime}&to=${calculatedEndTime}&panelId=10`
                        })
                return;
            }
            
        })
})

function updateDeviceStartEndTimeToDB(dashBoardUID,startTime,endTime){
    var updateQr
    if(startTime == null && endTime == null){
        updateQr = `update beam_db.devices SET dashboardStartTime = null, dashboardEndTime = null where dashboardUID = '${dashBoardUID}'`
    }
    else{
        updateQr = `update beam_db.devices SET dashboardStartTime = '${startTime}', dashboardEndTime = '${endTime}' where dashboardUID = '${dashBoardUID}'`
    }
     
    db.query(updateQr, (err, result) => {
        if(err){
            console.log(err, 'errs')
        }
    })
}   


module.exports = router;