const { response } = require('express');
const express = require('express');
const app = express();

var cors = require('cors');
app.use(cors())
const port = 6002;

// app.use(express.static(__dirname + '/../app'));

app.get('/test',(req,res) =>{
    console.log("test");
    res.send("hello");
});

app.get('/',(req,res) =>{
    console.log("test");
    res.send("hello");
});

app.listen(port, ()=> console.log(`Listening on port ${port}`));