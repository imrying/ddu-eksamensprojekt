const express = require('express'); //Import the express dependency
const app = express();              //Instantiate an express app, the main work horse of this server
const port = 5000;                  //Save the port number where your server will be listening

app.use(express.static(__dirname + "/public/"));


app.listen(port, () => {            //server starts listening for any attempts from a client to connect at port: {port}
    console.log(`Now listening on port ${port}`); 
});


app.route('/login').get(function(req, res) { 
    return res.sendFile(path.join(__dirname, '/public/login.html')); 
});
