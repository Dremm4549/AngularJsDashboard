/*
* FILE           :app.js
* PROJECT        :    CAPSTONE
* PROGRAMMER     :    Michael Dremo & Ethan Richards & Ashley Ingle & Briana Burton
* FIRST VERSION  :    2023-02-05
* DESCRIPTION    :    This file contains the code for the express 
                        server to begin listening as well as the code for connecting 
                        the express server to various routes in the project

*/

var express = require("express")
var bodyParser = require("body-parser")
const cors = require('cors')
const mysql = require('mysql2')
var app = express()

app.use(bodyParser.json())
app.use(cors())

const timePickerRoute = require('./routes/timepicker');
const gatherDevicesRoute = require('./routes/getdevices');
const dashboardCreationRoute = require('./routes/createdashboard');
var distDir = __dirname + "/dist/"

app.use(express.static(distDir))

app.use("/api",timePickerRoute);
app.use("/api",gatherDevicesRoute);
app.use("/api",dashboardCreationRoute);

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_User,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port:process.env.DBPORT
})

db.connect(err => {
    if(err) {console.log(err)}
    else{console.log('database connected...')}
})

var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port
    console.log("App now running on port", process.env.port)
})

module.exports = {
    app
};