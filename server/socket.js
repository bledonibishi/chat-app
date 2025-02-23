const { Server } = require('socket.io')

class SocketService {
  constructor(server, redisClient) {
    this.io = new Server(server, { cors: { origin: '*' } })
    this.redisClient = redisClient
    this.users = new Map()
    this.rooms = new Set()
    this.subscribedRooms = new Set()
    this.initializeSubscriber()
    this.initializeSocket()
  }

  async initializeSubscriber() {
    this.subscriber = this.redisClient.duplicate()
    await this.subscriber.connect().catch(console.error)
  }

  initializeSocket() {
    this.io.on('connection', (socket) => {
      this.handleUserRegistration(socket)
      this.handleRoomCreation(socket)
      this.handleJoinRoom(socket)
      this.handleMessaging(socket)
      this.handleTyping(socket)
      this.handleDisconnect(socket)
    })
  }

  handleUserRegistration(socket) {
    socket.on('registerUser', (username) => {
      if (!username?.trim()) return

      this.users.set(socket.id, username)
      socket.emit('roomsList', Array.from(this.rooms))
    })
  }

  handleRoomCreation(socket) {
    socket.on('createRoom', (room) => {
      if (!room?.trim()) return
      if (!this.users.has(socket.id)) {
        socket.emit('error', {
          message: 'You must be logged in to create a room.',
        })
        return
      }

      if (!this.rooms.has(room)) {
        this.rooms.add(room)
        this.io.emit('roomsList', Array.from(this.rooms))
      }
    })
  }

  handleJoinRoom(socket) {
    socket.on('joinRoom', async ({ room, username, limit = 10 }) => {
      room = room.trim()
      if (!room) return

      if (!this.users.has(socket.id)) {
        socket.emit('error', {
          message: 'You must be logged in to join a room.',
        })
        return
      }

      this.rooms.add(room)
      this.io.emit('roomsList', Array.from(this.rooms))
      socket.join(room)

      if (!this.subscribedRooms.has(room)) {
        this.subscribedRooms.add(room)
        this.subscriber.subscribe(`channel:${room}`, (message) => {
          try {
            const parsedMessage = JSON.parse(message)
            this.io.to(room).emit('message', parsedMessage)
          } catch (error) {
            console.error('Error parsing published message:', error)
          }
        })
      }

      const storedMessages =
        (await this.redisClient.lRange(`messages:${room}`, 0, limit - 1)) || []
      const sortedMessages = storedMessages
        .map(JSON.parse)
        .filter(
          (msg) =>
            msg.type === 'public' ||
            msg.to === username ||
            msg.from === username
        )
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

      socket.emit('previousMessages', {
        messages: sortedMessages,
        prepend: false,
      })
    })
  }

  handleMessaging(socket) {
    socket.on('message', async ({ room, username, message }) => {
      if (!room || !username || !message.trim()) return

      if (!this.users.has(socket.id)) {
        socket.emit('error', {
          message: 'You must be logged in to send messages.',
        })
        return
      }

      const msg = {
        username,
        message,
        type: 'public',
        timestamp: new Date().toISOString(),
      }

      await this.redisClient.lPush(`messages:${room}`, JSON.stringify(msg))
      await this.redisClient.lTrim(`messages:${room}`, 0, 49)
      await this.redisClient.publish(`channel:${room}`, JSON.stringify(msg))
    })

    socket.on('privateMessage', async ({ from, to, message, room }) => {
      if (!room) {
        socket.emit('error', {
          message: 'Room is required for private messages.',
        })
        return
      }

      const msg = {
        from,
        to,
        message,
        type: 'private',
        timestamp: new Date().toISOString(),
      }

      await this.redisClient.lPush(`messages:${room}`, JSON.stringify(msg))
      await this.redisClient.lTrim(`messages:${room}`, 0, 49)

      const recipientSockets = [...this.users.entries()]
        .filter(([_, username]) => username === to)
        .map(([socketId]) => socketId)

      const senderSockets = [...this.users.entries()]
        .filter(([_, username]) => username === from)
        .map(([socketId]) => socketId)

      ;[...recipientSockets, ...senderSockets].forEach((socketId) => {
        this.io.to(socketId).emit('message', msg)
      })
    })
  }

  handleTyping(socket) {
    socket.on('typing', ({ room, username }) => {
      if (!room || !username) return
      if (!this.users.has(socket.id)) return

      socket.to(room).emit('typing', username)
    })
  }

  handleDisconnect(socket) {
    socket.on('disconnect', () => {
      this.users.delete(socket.id)
    })
  }
}

module.exports = (server, redisClient) => new SocketService(server, redisClient)
