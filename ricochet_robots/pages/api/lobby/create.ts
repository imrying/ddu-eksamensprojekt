import { Server } from 'socket.io'
import { useRouter } from "next/router";

export default function createLobby(req, res) {
    var url = require('url');
    
    // get random int between 0 and 9999
    var code = Math.floor(Math.random() * 10000);


    // Get data submitted in request's body.
    res.redirect(url.format({
        pathname:"/lobby/",
        query: {
           "code": code,
           "username": req.body.username
         }
      }));



    res.status(200)
  }
  