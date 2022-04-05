import { Server } from 'socket.io'

// var rooms = [];

interface Room {
  room_id: string,
  usernames: string[]
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
            rooms.push({
              room_id: data.room_id,
              usernames: [data.username]
            }

            )
            io.in(data.room_id).emit('update-room', {room: rooms[rooms.length-1], username: data.username});
          // else push the user to the room
          } else {
            // check if username is already in room
            if (rooms[index].usernames.includes(data.username)) {
              io.in(data.room_id).emit('update-room', {room: rooms[index], username: data.username});
            } else {
              rooms[index].usernames.push(data.username)
              io.in(data.room_id).emit('update-room', {room: rooms[index], username: data.username});
            }
            
          }          
          console.log(rooms[index]);
          
        })

        socket.on('act-move-piece', movement_data => {
          socket.broadcast.emit('react-move-piece', movement_data);
        })

        socket.on('act-select-piece', piece_data => {
          socket.broadcast.emit('react-select-piece', piece_data);
        })
      })
  }
  res.end()
}

export default LobbyManager