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
    let qr = 'SELECT beam_db.devices.DeviceID, beam_db.clients.CompanyName, beam_db.clients.ClientFullName, beam_db.clients.Email, beam_db.clients.PhoneNumber, beam_db.motors.MotorModel, beam_db.motors.MotorLocation FROM beam_db.devices INNER JOIN beam_db.clients ON beam_db.devices.ClientID = beam_db.clients.ClientID INNER JOIN beam_db.motors ON beam_db.devices.MotorID = beam_db.motors.MotorID WHERE clients.ExternalID = '+ req.userSUB + ';'
    db.query(qr, (err, result) => {
        if(err){
            console.log(err, 'errs')
        }

        if(result.length >= 0){
            console.log(result)
            res.send({result})
        }
    })
})

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    console.log(token)
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
    console.log('pre sql query')

    var deviceId = req.body.deviceIDN.DeviceID;
    console.log(deviceId);
    
    let qr = 'SELECT dashboardUID FROM `beam_db`.`devices` WHERE DeviceID = ' + deviceId + ';';


    let dashboardUID = "";
    db.query(qr, (err, result) => {
        if(err){
            console.log(err, 'errs')
        }
        console.log('post sql query')

        if(result.length >= 0){
            console.log(result[0].dashboardUID)
        }
        if(result.length >= 0){
        //check if dashboard exists
        let dashboardURL = "http://localhost:3000/api/dashboards/uid/" + result[0].dashboardUID;
        axios.get(dashboardURL)
        .then(function(response) {
            // success - dashboard exists
            // //if the title has spaces they must be converted to dashes
            console.log(response.data.dashboard.title);
            let title = response.data.dashboard.title;
            let startTimestamp = "1678199374000";
            let endTimestamp = "1678285645000";
            //http://localhost:3000/d-solo/4KMg0C14z/100000?orgId=1&from=1678660119000&to=1678746396000&panelId=2
            res.send(`http://localhost:3000/d-solo/${result[0].dashboardUID}/${title}?orgId=1&from=${startTimestamp}&to=${endTimestamp}&panelId=2`);
        //function that handles dashboard not existing and creating dashboard
          //}, //function(response) {
            //console.log("dashboard does not exist, creating");
            //$http.post('/api/dashboards/db', JSON.stringify(data)).then(function (response) {
            //if (response.data)
            //success - dashboard should be created
            //console.log("data sent to grafana");
            //}, function (response) {
            //error - dashboard could not be created
            // 400 (invalid data)
            // 401 (authorization error)
            // 403 (access denied)
            // 412 (unable to create - precondition)
            //console.log(`could not create dashboard: error code was ${response.status}`);
            //});
          });
        }
    })
})

function updateDashboard()
{
    //https://grafana.com/docs/grafana/latest/developers/http_api/dashboard/#create--update-dashboard
    //get UID from mySQL database

    //frontend
    
    //update iframe with correct URL

    //http://localhost:3000/d-solo/4KMg0C14z/test-dashboard?orgId=1&from=1678199374000&to=1678285645000&panelId=2
    //http://localhost:3000/d-solo/${dashboardID}/${title}?orgId=1&from=${unixTimestamp}&to=${unixTimestamp}&panelId=1 //panelID might be different //need to decide what timeframe to show by default - last 24hrs?

    //check if dashboard exists with that UID
    let dashboardURL = "/api/dashboards/uid/:" + dashboardID;


 


    
    
    //if it doesn't, create it
}