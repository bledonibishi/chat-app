import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { connectSocket } from './socket'

const Login = () => {
  const [username, setUsername] = useState('')
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()
    if (username.trim()) {
      sessionStorage.setItem('username', username.trim())
      connectSocket(username.trim())

      navigate('/chat')
    }
  }

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <input
          type='text'
          placeholder='Enter your username'
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <button type='submit'>Enter chat</button>
      </form>
    </div>
  )
}

export default Login
