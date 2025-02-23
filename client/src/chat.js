import React, { useState, useEffect } from 'react'
import { getSocket } from './socket'

function Chat() {
  const [username] = useState(sessionStorage.getItem('username') || '')
  const [room, setRoom] = useState(sessionStorage.getItem('room') || '')
  const [joined, setJoined] = useState(
    sessionStorage.getItem('joined') === 'true'
  )
  const [newRoomName, setNewRoomName] = useState('')
  const [rooms, setRooms] = useState([])
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [typingUser, setTypingUser] = useState('')
  const [offset, setOffset] = useState(10)
  const [hasMore, setHasMore] = useState(true)
  const limit = 10

  const socket = getSocket()

  useEffect(() => {
    if (socket && username) {
      socket.emit('registerUser', username)
    }
  }, [socket, username])

  useEffect(() => {
    if (joined && room && socket) {
      socket.emit('joinRoom', { room, username, offset, limit })
    }
  }, [joined, room, socket, username, offset, limit])

  useEffect(() => {
    sessionStorage.setItem('room', room)
  }, [room])

  useEffect(() => {
    if (!socket) return

    socket.on('typing', (typingUsername) => {
      setTypingUser(typingUsername)
      setTimeout(() => setTypingUser(''), 3000)
    })

    return () => {
      socket.off('typing')
    }
  }, [socket])

  useEffect(() => {
    if (!socket) return

    socket.on('privateMessage', (msg) => {
      setMessages((prev) => [...prev, { ...msg, type: 'private' }])
    })

    return () => socket.off('privateMessage')
  }, [socket])

  useEffect(() => {
    if (!socket) return

    socket.on('roomsList', (data) => setRooms(data))
    socket.on('message', (msg) => setMessages((prev) => [...prev, msg]))

    socket.on('previousMessages', (data) => {
      if (!data || !Array.isArray(data.messages)) {
        return
      }

      setMessages((prev) => {
        const uniqueMessages = [
          ...new Map(
            [...prev, ...data.messages].map((msg) => [msg.timestamp, msg])
          ).values(),
        ]

        return data.prepend ? [...data.messages, ...prev] : uniqueMessages
      })

      if (data.hasMore !== undefined) {
        setHasMore(data.hasMore)
      }
    })

    return () => {
      socket.off('roomsList')
      socket.off('message')
      socket.off('previousMessages')
    }
  }, [socket, offset])

  // Create a room
  const createRoom = () => {
    if (!socket || !newRoomName.trim()) return
    socket.emit('createRoom', newRoomName.trim())
    setNewRoomName('')
  }

  // Join a room
  const joinRoom = (roomName) => {
    if (!socket) return
    setRoom(roomName)
    setJoined(true)
    socket.emit('joinRoom', { room: roomName, username, offset, limit })
  }

  // Send a message
  const sendMessage = () => {
    if (!socket || !room || !message.trim()) return
    socket.emit('message', { room, username, message })
    setMessage('')
  }

  const sendPrivateMessage = () => {
    if (!socket) return

    const recipient = prompt("Enter recipient's username:")
    if (!recipient) return

    const trimmedMessage = message.trim()
    if (trimmedMessage) {
      const msg = {
        from: username,
        to: recipient,
        message: trimmedMessage,
        room,
      }

      socket.emit('privateMessage', msg)

      setMessage('')
    }
  }

  const handleTyping = () => {
    if (!socket || !room) return
    socket.emit('typing', { room, username })
  }

  const loadOlderMessages = () => {
    if (!socket || !room) return

    socket.emit('loadMessages', {
      room,
      username,
      offset,
      limit,
    })
    setOffset((prevOffset) => prevOffset + 10)
  }

  return (
    <div>
      {!joined ? (
        <div>
          <h1>Chat Rooms</h1>
          <p>Logged in as: {username}</p>
          <div>
            <input
              type='text'
              placeholder='New Room Name'
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
            />
            <button onClick={createRoom}>Create Room</button>
          </div>
          <div>
            <h2>Available Rooms</h2>
            {rooms.length > 0 ? (
              rooms.map((roomName, index) => (
                <button key={index} onClick={() => joinRoom(roomName)}>
                  {roomName}
                </button>
              ))
            ) : (
              <p>No rooms available. Create one!</p>
            )}
          </div>
        </div>
      ) : (
        <div>
          <h1>Room: {room}</h1>
          <div id='chat-container'>
            {messages.map((msg, index) => (
              <p
                key={index}
                style={{ color: msg.type === 'private' ? 'blue' : 'black' }}
              >
                <strong>
                  {msg.username}
                  {msg.type === 'private' ? ' (Private)' : ''}:
                </strong>{' '}
                {msg.message}
              </p>
            ))}
          </div>

          {typingUser && <p>{typingUser} is typing...</p>}
          <input
            type='text'
            placeholder='Type a message...'
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              handleTyping()
            }}
          />
          <button onClick={sendMessage}>Send</button>
          <button
            onClick={loadOlderMessages}
            disabled={!hasMore}
            style={{ marginBottom: '10px' }}
          >
            {hasMore ? 'Load Older Messages' : 'No More Messages'}
          </button>

          <button onClick={sendPrivateMessage}>Send Private Message</button>
        </div>
      )}
    </div>
  )
}

export default Chat
