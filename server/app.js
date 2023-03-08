const express = require('express');
const app = express();

app.use(express.static(__dirname + '/../app'));

app.get('/test',(req,res) =>{
    res.send('Hello');
})
const port = 6001
;
app.listen(port, ()=>{
    console.log("server is listening");
})