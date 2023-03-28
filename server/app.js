var express = require("express")
var bodyParser = require("body-parser")
const cors = require('cors')
const jwt = require('jsonwebtoken')
const axios = require('axios')
const mysql = require('mysql2')
const { json } = require("express")
var app = express()

const ISS = 'https://accounts.google.com'
const AZP = '648073497353-ev4h38c3hpk9ov6hf9vrbdb1mtk9me1d.apps.googleusercontent.com'
const AUD = '648073497353-ev4h38c3hpk9ov6hf9vrbdb1mtk9me1d.apps.googleusercontent.com'

app.use(bodyParser.json())
app.use(cors())

var distDir = __dirname + "/dist/"

app.use(express.static(distDir))

const db = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'MySQLBEAMroot2023',
    database:'beam_db',
    port:3306
})

db.connect(err => {
    if(err) {console.log(err)}
    else{console.log('database connected...')}
    
})

var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port
    console.log("App now running on port", port)
})

app.get("/api/devices", authenticateToken, function (req, res) {
    //res.status(200).json({status: "UP"})
    //req.userSub holds the immutable globally unique ID of google users
    //Can use this to query the database and return html containing the devices
    //the user owns
    var roleQuery = "SELECT usersRole FROM beam_db.userRoles WHERE ExternalID = '"+ req.userSUB +"'"
    var query = "";
    var shwingg = "";
    db.query(roleQuery, (err, result) => {
        if (err) {
            console.log(err, 'errs')
        }

        if (result.length >= 0) {            
            if (result[0].usersRole == 'admin') {
                
                query = 'SELECT beam_db.devices.DeviceID, beam_db.clients.CompanyName, beam_db.clients.ClientFullName, beam_db.clients.Email, beam_db.clients.PhoneNumber, beam_db.motors.MotorModel, beam_db.motors.MotorLocation FROM beam_db.devices INNER JOIN beam_db.clients ON beam_db.devices.ClientID = beam_db.clients.ClientID INNER JOIN beam_db.motors ON beam_db.devices.MotorID = beam_db.motors.MotorID;'
                //console.log(query);
                shwingg = "weeeeee";
            }   
            else{
                query = 'SELECT beam_db.devices.DeviceID, beam_db.clients.CompanyName, beam_db.clients.ClientFullName, beam_db.clients.Email, beam_db.clients.PhoneNumber, beam_db.motors.MotorModel, beam_db.motors.MotorLocation FROM beam_db.devices INNER JOIN beam_db.clients ON beam_db.devices.ClientID = beam_db.clients.ClientID INNER JOIN beam_db.motors ON beam_db.devices.MotorID = beam_db.motors.MotorID WHERE clients.ExternalID = '+ req.userSUB + ';'
            }
        }
            db.query(query, (err, result) => {
            if(err){
                console.log(err, 'errs')
            }

            if(result.length >= 0){
                console.log(result)
                res.send({result})
            }
        })
    })
    
     
    // db.query(query, (err, result) => {
    //     if(err){
    //         console.log(err, 'errs')
    //     }

    //     if(result.length >= 0){
    //         console.log(result)
    //         res.send({result})
    //     }
    // })
})

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    //console.log(token)
    if(!token) return res.sendStatus(401)

    const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
    try {
        axios.get(tokenInfoUrl)
         .then(response => {
            const tokenData = response.data
            if(tokenData["iss"] == ISS &&
                tokenData["azp"] == AZP &&
                tokenData["aud"] == AUD &&
                Date.now() > Number(tokenData["exp"])){
                    req.userSUB = tokenData["sub"]
                    next()
                }
            else{
                res.sendStatus(403)
            }
         })    
    } catch (error) {
        return res.sendStatus(403)
    }
}

app.post("/api/getDashboardUID", authenticateToken, function (req, res) {
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
            console.log(response.data.dashboard.title);
            let title = response.data.dashboard.title;
            // let startTimestamp = "1678199374000";
            // let endTimestamp = "1678285645000";
            var startTimestamp = new Date();
            startTimestamp.setMonth(startTimestamp.getMonth() - 1)
            startTimestamp = startTimestamp.getTime()
            let endTimestamp = new Date().getTime();

            //performancesummarychart
            //http://localhost:3000/d-solo/4KMg0C14z/100000?orgId=1&from=1678660119000&to=1678746396000&panelId=2
            res.send({time_series: `http://localhost:3000/d-solo/${result[0].dashboardUID}/${title}?orgId=1&from=${startTimestamp}&to=${endTimestamp}&panelId=2`, 
            alertchart: `http://localhost:3000/d-solo/${result[0].dashboardUID}/${title}?orgId=1&from=${startTimestamp}&to=${endTimestamp}&panelId=4`, 
            performancesummarychart: `http://localhost:3000/d-solo/${result[0].dashboardUID}/${title}?orgId=1&from=${startTimestamp}&to=${endTimestamp}&panelId=6`,
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
            var rawSqlString = "SELECT X, Time_Stamp, Y, Z FROM beam_db.devicedata WHERE DeviceID = " + deviceId + " order by Time_Stamp desc LIMIT 21600;";
            dashboardCreation.dashboard.panels[0].targets[0].rawSql = rawSqlString;
            dashboardCreation.dashboard.panels[1].targets[0].rawSql = rawSqlString;
            console.log(dashboardCreation.dashboard.panels[1].targets[0].rawSql);

            dashboardCreation.dashboard.panels[2].title = `Performance Summary for Device ID: ${deviceId}`
            const pieChartRawSql = `SELECT SUM(CASE WHEN x >= 0 AND x < 2.99 THEN 1 ELSE 0 END) AS healthy_count,SUM(CASE WHEN x >= 3 AND x < 4.79 THEN 1 ELSE 0 END) AS warning_count, SUM(CASE WHEN x >= 4.8 AND x <= 6 THEN 1 ELSE 0 END) AS critical_count FROM devicedata WHERE DeviceID='${deviceId}' AND Time_Stamp >= DATE_SUB(NOW(), INTERVAL 30 DAY);`
            dashboardCreation.dashboard.panels[2].targets[0].rawSql = pieChartRawSql;

            //  newPanel.panels[0].targets[0].rawSql = "SELECT X, Time_Stamp, Y, Z FROM beam_db.devicedata WHERE DeviceID = " + deviceId + " AND Time_Stamp >= NOW() - INTERVAL 1 DAY order by Time_Stamp desc;";
            //  newPanel.panels[0].title = "Device ID: " + deviceId;
            //  newPanel.title = deviceId;

        //     // do not need to provide UID as it is provided in response

            // dashboardCreation.dashboard.title = "Device ID: " + deviceId;
            // dashboardCreation.message = "created dashboard for Device ID: " + deviceId;

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
                        
                        res.send({time_series: `http://localhost:3000/d-solo/${generatedDashboardUID}/${dashboardCreation.dashboard.panels[0].title}?orgId=1&from=${startTimestamp}&to=${endTimestamp}&panelId=2`, 
                        alertchart: `http://localhost:3000/d-solo/${generatedDashboardUID}/${dashboardCreation.dashboard.panels[0].title}?orgId=1&from=${startTimestamp}&to=${endTimestamp}&panelId=4`, 
                        performancesummarychart: `http://localhost:3000/d-solo/${generatedDashboardUID}/${dashboardCreation.dashboard.panels[0].title}?orgId=1&from=${startTimestamp}&to=${endTimestamp}&panelId=6`,
                        dashboardsUID: generatedDashboardUID}); 
                        // if(result.length >= 0){
                        //     console.log(result)
                        //     res.send({result})
                        // }
                    })
                }})       
    }})
})

app.post("/api/updatePanelDates", authenticateToken, function (req, res){
    console.log(req.body.deviceID)
    console.log(req.body.startTime)
    console.log(req.body.endTime)

    let dashboardURL = "http://localhost:3000/api/dashboards/uid/" + req.body.dashboardUID;
    axios.get(dashboardURL)
        .then(function(response) {
            
            var config = {
                headers: {
                  'Authorization': 'Bearer ' + "eyJrIjoiV0xIOU1rUUI2ZDJCNUdqVlN0elFUcDN3ODFrTE5FSkgiLCJuIjoiQWRtaW5LZXkiLCJpZCI6MX0=",
                  'Content-Type': 'application/json'
                }
            }
            var dashboardUpdateJSON = null
            if(req.body.startTime != null && req.body.endTime != null){
                var mysqlFormatStartTime = new Date(req.body.startTime).toISOString().slice(0, 19).replace('T', ' ')
                var mysqlFormatEndTime = new Date(req.body.endTime).toISOString().slice(0, 19).replace('T', ' ')
                var rawSQLString = "SELECT Time_Stamp, X, Y, Z FROM beam_db.devicedata WHERE DeviceID = " + req.body.deviceID + " AND Time_Stamp >= '"+ mysqlFormatStartTime +"' AND Time_Stamp <= '"+ mysqlFormatEndTime +"' order by Time_Stamp desc LIMIT 21600;"
                const pieChartRawSql = `SELECT SUM(CASE WHEN x >= 0 AND x < 2.99 THEN 1 ELSE 0 END) AS healthy_count,SUM(CASE WHEN x >= 3 AND x < 4.79 THEN 1 ELSE 0 END) AS warning_count, SUM(CASE WHEN x >= 4.8 AND x <= 6 THEN 1 ELSE 0 END) AS critical_count FROM devicedata WHERE DeviceID='${req.body.deviceID}' AND Time_Stamp >= '${mysqlFormatStartTime}' AND Time_Stamp <= '${mysqlFormatEndTime}';`
                
                response.data.dashboard.panels[0].targets[0].rawSql = rawSQLString;
                response.data.dashboard.panels[1].targets[0].rawSql = rawSQLString;
                response.data.dashboard.panels[2].targets[0].rawSql = pieChartRawSql;
                dashboardUpdateJSON = response.data;
                
                axios.post('http://localhost:3000/api/dashboards/db', dashboardUpdateJSON, config)
                     .then(function(response) {
                        console.log(response.status)
                     })
                res.send({
                            time_series: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[0].title}?orgId=1&from=${req.body.startTime}&to=${req.body.endTime}&panelId=2`,
                            alertchart: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[1].title}?orgId=1&from=${req.body.startTime}&to=${req.body.endTime}&panelId=4`,
                            performancesummarychart: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[2].title}?orgId=1&from=${req.body.startTime}&to=${req.body.endTime}&panelId=6`
                        })
                return;
            }
            else if (req.body.startTime == null && req.body.endTime == null){
                var mysqlCurrentDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ')
                var rawSQLString = "SELECT Time_Stamp, X, Y, Z FROM beam_db.devicedata WHERE DeviceID = " + req.body.deviceID + " AND Time_Stamp <= '"+ mysqlCurrentDateTime +"' order by Time_Stamp desc LIMIT 21600;"
                const pieChartRawSql = `SELECT SUM(CASE WHEN x >= 0 AND x < 2.99 THEN 1 ELSE 0 END) AS healthy_count,SUM(CASE WHEN x >= 3 AND x < 4.79 THEN 1 ELSE 0 END) AS warning_count, SUM(CASE WHEN x >= 4.8 AND x <= 6 THEN 1 ELSE 0 END) AS critical_count FROM devicedata WHERE DeviceID='${req.body.deviceID}' AND Time_Stamp >= DATE_SUB(NOW(), INTERVAL 1 MONTH);`
                response.data.dashboard.panels[0].targets[0].rawSql = rawSQLString
                response.data.dashboard.panels[1].targets[0].rawSql = rawSQLString
                response.data.dashboard.panels[2].targets[0].rawSql = pieChartRawSql;
                dashboardUpdateJSON = response.data
                axios.post('http://localhost:3000/api/dashboards/db', dashboardUpdateJSON, config)
                     .then(function(response) {
                        console.log(response.status)
                     })
                var calculatedStartTime = new Date()
                calculatedStartTime.setMonth(calculatedStartTime.getMonth() - 1)
                res.send({
                            time_series: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[0].title}?orgId=1&from${calculatedStartTime.getTime()}&to=${new Date().getTime()}&panelId=2`,
                            alertchart: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[1].title}?orgId=1&from=${calculatedStartTime.getTime()}&to=${new Date().getTime()}&panelId=4`,
                            performancesummarychart: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[2].title}?orgId=1&from=${calculatedStartTime.getTime()}&to=${new Date().getTime()}&panelId=6`
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
                console.log('start time: ',mysqlFormatStartTime);
                response.data.dashboard.panels[0].targets[0].rawSql = rawSQLString;
                response.data.dashboard.panels[1].targets[0].rawSql = rawSQLString;
                response.data.dashboard.panels[2].targets[0].rawSql = pieChartRawSql;

                dashboardUpdateJSON = response.data;
                axios.post('http://localhost:3000/api/dashboards/db', dashboardUpdateJSON, config)
                     .then(function(response) {
                        console.log(response.status)
                     })
                     var calculatedStartTime = new Date(req.body.endTime)
                     calculatedStartTime.setMonth(calculatedStartTime.getMonth() - 1)       
                     
                res.send({
                            time_series: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[0].title}?orgId=1&from=${calculatedStartTime.getTime()}&to=${req.body.endTime}&panelId=2`,
                            alertchart: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[1].title}?orgId=1&from=${calculatedStartTime.getTime()}&to=${req.body.endTime}&panelId=4`,
                            performancesummarychart: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[2].title}?orgId=1&from=${calculatedStartTime.getTime()}&to=${req.body.endTime}&panelId=6`
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
                console.log('Zip zoop pudding pop', mysqlFormatEndTime);
                const pieChartRawSql = `SELECT SUM(CASE WHEN x >= 0 AND x < 2.99 THEN 1 ELSE 0 END) AS healthy_count,SUM(CASE WHEN x >= 3 AND x < 4.79 THEN 1 ELSE 0 END) AS warning_count, SUM(CASE WHEN x >= 4.8 AND x <= 6 THEN 1 ELSE 0 END) AS critical_count FROM devicedata WHERE DeviceID='${req.body.deviceID}' AND Time_Stamp <= '${mysqlFormatEndTime}' AND Time_stamp >= '${mysqlFormatStartTime}';`

                response.data.dashboard.panels[0].targets[0].rawSql = rawSQLString;
                response.data.dashboard.panels[1].targets[0].rawSql = rawSQLString;
                response.data.dashboard.panels[2].targets[0].rawSql = pieChartRawSql;

                dashboardUpdateJSON = response.data
                axios.post('http://localhost:3000/api/dashboards/db', dashboardUpdateJSON, config)
                     .then(function(response) {
                        console.log(response.status)
                     })
                
                     var calculatedEndTime = new Date(req.body.startTime)
                     console.log(calculatedEndTime)
                     calculatedEndTime.setMonth(calculatedEndTime.getMonth() + 1)
                     console.log(calculatedEndTime)
                     calculatedEndTime = new Date(calculatedEndTime).getTime()
                     console.log(calculatedEndTime)
                res.send({
                            time_series: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[0].title}?orgId=1&from=${req.body.startTime}&to=${calculatedEndTime}&panelId=2`,
                            alertchart: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[1].title}?orgId=1&from=${req.body.startTime}&to=${calculatedEndTime}&panelId=4`,
                            performancesummarychart: `http://localhost:3000/d-solo/${req.body.dashboardUID}/${response.data.dashboard.panels[2].title}?orgId=1&from=${req.body.startTime}&to=${calculatedEndTime}&panelId=6`
                        })
                return;
            }
            
        })
})