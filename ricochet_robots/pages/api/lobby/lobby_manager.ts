import { Server } from 'socket.io'



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
        
        socket.on('join-room', room_id => {
          socket.join(room_id);
          io.in(room_id).emit('update-room');
        })

        socket.on('select-piece', msg => {
            socket.broadcast.emit('update-selection', msg) // add to room
        })
      })
  }
  res.end()
}

export default LobbyManager