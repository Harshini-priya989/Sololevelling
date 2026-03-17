import app from './app.js'
import { connectDB } from './config/db.js'
import { env } from './config/env.js'

const startServer = async () => {
  try {
    await connectDB(env.mongoUri)
    app.listen(env.port, () => {
      console.log(`Backend running on port ${env.port}`)
    })
  } catch (error) {
    console.error('Failed to start backend', error)
    process.exit(1)
  }
}

startServer()
