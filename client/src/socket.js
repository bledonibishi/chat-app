import { io } from 'socket.io-client'

let socket = null

export const connectSocket = (username) => {
  if (!socket && username) {
    socket = io('http://localhost:5000', {
      auth: { username },
    })

    socket.emit('registerUser', username)

    socket.on('disconnect', () => {
      socket = null
    })
  }
}

export const getSocket = () => {
  const username = sessionStorage.getItem('username')
  if (!socket && username) {
    connectSocket(username)
  }
  return socket
}

export default socket
