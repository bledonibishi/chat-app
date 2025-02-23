const redis = require('redis')

const redisClient = redis.createClient()

const clearRedis = async () => {
  await redisClient.connect()
  console.log('✅ Connected to Redis')

  // Clear all Redis data
  await redisClient.flushAll()
  console.log('✅ Redis data cleared!')

  await redisClient.disconnect()
  process.exit()
}

clearRedis()
