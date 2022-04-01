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
        
        socket.on('join-room', data => {
          socket.join(data.room_id);
          io.in(data.room_id).emit('update-room', {username: data.username});
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