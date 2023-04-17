/*
* FILE              :    getdevices.js
* PROJECT           :    CAPSTONE
* PROGRAMMER        :    Michael Dremo & Ethan Richards & Ashley Ingle & Briana Burton
* FIRST VERSION     :    2023-02-05
* DESCRIPTION       :    This file contains the route for handling requests to 
                         get iot devices which are recording data associated with a user to be able
                         to view their historic data.
*
*/

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

router.get("/devices", authenticateToken, function (req, res) {
    //res.status(200).json({status: "UP"})
    //req.userSub holds the immutable globally unique ID of google users
    //Can use this to query the database and return html containing the devices the user owns
    var roleQuery = "SELECT usersRole FROM beam_db.userRoles WHERE ExternalID = '"+ req.userSUB +"'"
    var query = "";
 
    db.query(roleQuery, (err, result) => {
        if (err) {
            console.log(err, 'errs')
        }

        if (result.length >= 0) {            
            if (result[0].usersRole == 'admin') {               
                // admin will be able query all devices from the devices table
                query = 'SELECT beam_db.devices.DeviceID, beam_db.clients.CompanyName, beam_db.clients.ClientFullName, beam_db.clients.Email, beam_db.clients.PhoneNumber, beam_db.motors.MotorModel, beam_db.motors.MotorLocation FROM beam_db.devices INNER JOIN beam_db.clients ON beam_db.devices.ClientID = beam_db.clients.ClientID INNER JOIN beam_db.motors ON beam_db.devices.MotorID = beam_db.motors.MotorID;'             
            }   
            else{
                // if they are not an admin they are likely a client and will only be able to 
                //see queried device data related to their user id within the device table
                query = 'SELECT beam_db.devices.DeviceID, beam_db.clients.CompanyName, beam_db.clients.ClientFullName, beam_db.clients.Email, beam_db.clients.PhoneNumber, beam_db.motors.MotorModel, beam_db.motors.MotorLocation FROM beam_db.devices INNER JOIN beam_db.clients ON beam_db.devices.ClientID = beam_db.clients.ClientID INNER JOIN beam_db.motors ON beam_db.devices.MotorID = beam_db.motors.MotorID WHERE clients.ExternalID = '+ req.userSUB + ';'
            }
        }
            db.query(query, (err, result) => {
            if(err){
                console.log(err, 'errs')
            }

            if(result.length >= 0){
                //console.log(result)
                res.send({result})
            }
        })
})
    
})

module.exports = router;