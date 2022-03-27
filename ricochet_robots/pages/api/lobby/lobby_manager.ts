import { Server } from 'socket.io'

const LobbyManager = (req, res) => {
  if (res.socket.server.io) {
    console.log('Socket is already running')
  } else {
    console.log('Socket is initializing')
    const io = new Server(res.socket.server)
    res.socket.server.io = io

    io.on('connection', socket => {
        socket.on('player-move', msg => {
            socket.broadcast.emit('update-player', msg)
        })

        socket.on('select-piece', msg => {
            socket.broadcast.emit('update-selection', msg)
        })
      })
  }
  res.end()
}

export default LobbyManager