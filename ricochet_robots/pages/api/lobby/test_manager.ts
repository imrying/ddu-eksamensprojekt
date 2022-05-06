import { Server } from 'socket.io'

interface User {
  username: string,
  host: boolean,
  score: number,
}

interface Room {
  room_id: string,
  //socket: number,
  users: User[]
}

var rooms = Array<Room>();


const ioHandler = (req, res) => {
  if (!res.socket.server.io) {
    console.log('*First use, starting socket.io')

    const io = new Server(res.socket.server)

    io.on('connection', socket => {
      console.log('a user connected with socket id:', socket.id)
      
      socket.on('disconnect', () =>
      {
        console.log("a user disconnected", socket.id);
      });

      socket.on('join-room', data => {
        // check if room exists
        var room_exists = false;

        for (var i = 0; i < rooms.length; i++) {
          if (rooms[i].room_id == data.room_id) {
            room_exists = true;
            var index: number = i;
            break;
          }
        }
        // if room doesent exist create new room
        if (!room_exists) {
          let user_host: User = { username: data.username, host: true, score: 0 }
          rooms.push({
            room_id: data.room_id,
            //socket: socket,
            users: [user_host]
          }

          )
          socket.broadcast.emit('update-room', {room: rooms[rooms.length-1], user: user_host});
        // else push the user to the room
        } else {
          // check if username is already in room

          let usernames = [];
          for (let i = 0; i < rooms[index].users.length; i++) {
              usernames.push(rooms[index].users[i].username);
          }


          if (usernames.includes(data.username)) { 
            socket.broadcast.emit('update-room', {room: rooms[index]});
          } else {
            let user: User = { username: data.username, host: false, score: 0 };
            rooms[index].users.push(user)
            socket.broadcast.emit('update-room', {room: rooms[index], user: user});
          }
        }          
      });

    });

    res.socket.server.io = io
  } else {
    console.log('socket.io already running')
  }
  res.end()
}

export const config = {
  api: {
    bodyParser: false
  }
}

export default ioHandler