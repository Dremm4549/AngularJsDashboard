require('dotenv').config()
const axios = require('axios')

var config = {
    headers: {
      'Authorization': `bearer ${process.env.grafanaApi}`,
      'Content-Type': 'application/json'
    }
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    //console.log(req);
    if(!token) return res.sendStatus(401)

    const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
    try {
        axios.get(tokenInfoUrl)
         .then(response => {
            const tokenData = response.data
            if(tokenData["iss"] == process.env.ISS &&
                tokenData["azp"] == process.env.AZP &&
                tokenData["aud"] == process.env.AUD &&
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

module.exports = {
    authenticateToken,
    config
}