const express = require('express');
const router = express.Router();

//  const {authenticateToken} = require('../app')
const { authenticateToken,config } = require('../middleware')
const axios = require('axios')


router.get("/", (req,res) =>{
    res.status(200).json({Message:"ok"});
    console.log(authenticateToken);
})


router.post("/cock", authenticateToken, function (req, res){

})


module.exports = router;