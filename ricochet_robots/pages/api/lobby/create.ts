import { Server } from 'socket.io'
import { useRouter } from "next/router";

export default function createLobby(req, res) {
    var url = require('url');
    
    // get random int between 0 and 9999
    var code = "";
    for (var i = 0; i < 4; i++) {
      code += Math.floor(Math.random() * 10);
    }


    // Get data submitted in request's body.
    res.redirect(url.format({
        pathname:"/lobby/",
        query: {
           "code": code,
         }
      }));



    res.status(200)
  }
  