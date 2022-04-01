import { Server } from 'socket.io'
import { useRouter } from "next/router";

export default function joinLobby(req, res) {
    var url = require('url');

    // Get data submitted in request's body.
    res.redirect(url.format({
        pathname:"/lobby/",
        query: {
           "code": req.body.code,
           "username": req.body.username
         }
      }));



    res.status(200)
  }
  