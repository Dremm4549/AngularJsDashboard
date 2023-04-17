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

const { authenticateToken,config } = require('./middleware');
const ApiRoute = require('./routes/api');
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