import { Server } from 'socket.io'

// var rooms = [];

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

const LobbyManager = (req, res) => {

  if (res.socket.server.io) {
    console.log('Socket is already running')
  } else {
    console.log('Socket is initializing')
    const io = new Server(res.socket.server)
    res.socket.server.io = io
    
    io.on('connection', socket => {
      console.log("a user connected with socket id: ", socket.id);
      
      socket.on('disconnect', () => {
        console.log('a user disconnected: ', socket.id);
      });

        socket.on('update-room', data => {

          socket.broadcast.to(data.room_id).emit('update-room')
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
            let user_host: User = { username: data.username, host: true, score: 0 }
            rooms.push({
              room_id: data.room_id,
              //socket: socket,
              users: [user_host]
            }

            )
            io.in(data.room_id).emit('update-room', {room: rooms[rooms.length-1]});
          // else push the user to the room
          } else {
            // check if username is already in room

            let usernames = [];
            for (let i = 0; i < rooms[index].users.length; i++) {
                usernames.push(rooms[index].users[i].username);
            }


            if (usernames.includes(data.username)) { 
              io.in(data.room_id).emit('update-room', {room: rooms[index]});
            } else {
              let user: User = { username: data.username, host: false, score: 0 };
              rooms[index].users.push(user)
              io.in(data.room_id).emit('update-room', {room: rooms[index], user: user});
            }
          }          

          
        })

        socket.on('act-remove-user', data => {
          
          for (var i = 0; i < rooms.length; i++) {
            if (rooms[i].room_id == data.room_id) {

              // remove username from data.username from room
              for (var j = 0; j < rooms[i].users.length; j++) {
                if (rooms[i].users[j].username == data.username) {
                  rooms[i].users.splice(j, 1);
                  io.in(data.room_id).emit('react-remove-self', {username: data.username});
                  io.in(data.room_id).emit('update-room', {room: rooms[i]})
                  break;
                }
              }
            }
          }
        });


        socket.on('act-start-game', data => {
          io.in(data.room_id).emit('react-start-game', {room_id: data.room_id});
        })

        socket.on('act-client-info', data => {
          for (let i = 0; i < rooms.length; i++) {
            if (rooms[i].room_id == data.room_id) {
              socket.join(data.room_id);
              io.in(data.room_id).emit('react-client-info', rooms[i]);
              
              break;
            }
          }
        })

        socket.on('CS-test', () => {
          console.log("CS_TEST");
        })

        //Game Mechanism
        socket.on('act-move-piece', data => {
          socket.broadcast.to(data.room_id).emit('react-move-piece', data);
        })

        socket.on('act-select-piece', data => {
          socket.broadcast.to(data.room_id).emit('react-select-piece', data);
        })

        socket.on('act-new-target', data => {
          console.log("act new target");
          socket.broadcast.to(data.room_id).emit('react-new-target', data);

        })

        socket.on('act-new-bid', data => {
          socket.broadcast.to(data.room_id).emit('react-new-bid', data);
        })

        socket.on('act-give-point', data => {
          socket.broadcast.to(data.room_id).emit('react-give-point', data);
        })

        socket.on('act-test', data => {
          console.log("ACT TEST SERVER SIDE", data);
          socket.broadcast.to(data.room_id).emit('react-test', data);
          //socket.broadcast.emit('react-test', data);
        })

        socket.on('act-give-move-privilege', data => {
          socket.broadcast.to(data.room_id).emit('react-give-move-privilege', data.current_bidder);
        })

        socket.on('act-gamestate', data => {
          socket.broadcast.to(data.room_id).emit('react-gamestate', data.SHOWING_SOL);
        })

      })
  }
  res.end()
}

export default LobbyManager