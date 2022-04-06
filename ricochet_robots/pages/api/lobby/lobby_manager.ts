import { Server } from 'socket.io'

// var rooms = [];

interface User {
  username: string,
  host: boolean,
}

interface Room {
  room_id: string,
  //socket: number,
  users: User[]
}

var rooms = Array<Room>();

const LobbyManager = (req, res) => {

  if (res.socket.server.io) {
    console.log('Socket is already running')
  } else {
    console.log('Socket is initializing')
    const io = new Server(res.socket.server)
    res.socket.server.io = io
    
    io.on('connection', socket => {

        // socket.on('disconnect', function(){
        //   // Remove user from users array and update
        //   // var i = allClients.indexOf(socket);
        //   // allClients.splice(i, 1);
        //   for (let i; i < rooms.length; i++) 
        //   {
        //     if (rooms[i].socket == socket) 
        //     {
        //       // Remove object containing current socket
        //       rooms.splice(i,1);
        //     }
        //   }
        // });

        socket.on('update-room', data => {
          socket.broadcast.to(data[0]).emit('update-room')
        })
        
        socket.on('join-room', data => {
          socket.join(data.room_id);

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
            let user_host: User = { username: data.username, host: true }
            rooms.push({
              room_id: data.room_id,
              //socket: socket,
              users: [user_host]
            }

            )
            io.in(data.room_id).emit('update-room', {room: rooms[rooms.length-1], user: user_host});
          // else push the user to the room
          } else {
            // check if username is already in room

            let usernames = [];
            for (let i = 0; i < rooms[index].users.length; i++) {
                usernames.push(rooms[index].users[i].username);
            }
            console.log(usernames)

            if (usernames.includes(data.username)) { 
              io.in(data.room_id).emit('update-room', {room: rooms[index]});
            } else {
              let user: User = { username: data.username, host: false };
              rooms[index].users.push(user)
              io.in(data.room_id).emit('update-room', {room: rooms[index], user: user});
            }
          }          
          console.log(rooms[index]);
          
        })

        socket.on('act-start-game', data => {
          io.in(data.room_id).emit('react-start-game', {room_id: data.room_id});
        })

        socket.on('get-client-info', data => {
          for (let i = 0; i < rooms.length; i++) {
            if (rooms[i].room_id == data.room_id) {
              socket.join(data.room_id);
              socket.emit('send-client-info', rooms[i]);
              break;
            }
          }
        })

        //Game Mechanism
        socket.on('act-move-piece', movement_data => {
          socket.broadcast.emit('react-move-piece', movement_data);
        })

        socket.on('act-select-piece', piece_data => {
          socket.broadcast.emit('react-select-piece', piece_data);
        })

        socket.on('act-new-target ', target_data => {
          socket.broadcast.emit('react-new-target', target_data);
        })
      })
  }
  res.end()
}

export default LobbyManager