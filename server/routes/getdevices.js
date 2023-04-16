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

router.get("/devices", authenticateToken, function (req, res) {
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
                console.log(query);
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
    
})



module.exports = router;