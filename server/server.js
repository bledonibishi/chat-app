require('dotenv').config()
const express = require('express')
const http = require('http')
const redis = require('redis')
const cors = require('cors')
const initializeSocket = require('./socket')

const app = express()
const server = http.createServer(app)

const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${
    process.env.REDIS_PORT || 6379
  }`,
})

async function connectRedis() {
  try {
    await redisClient.connect()
    console.log('✅ Connected to Redis')
  } catch (err) {
    console.error('❌ Redis connection error:', err)
    process.exit(1)
  }
}

connectRedis()

app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 5000

initializeSocket(server, redisClient)

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))
