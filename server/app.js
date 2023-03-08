var express = require("express")
var bodyParser = require("body-parser")
const cors = require('cors')
const jwt = require('jsonwebtoken')
const axios = require('axios')
const mysql = require('mysql2')
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

app.get("/api/status", authenticateToken, function (req, res) {
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