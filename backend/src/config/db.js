import mongoose from 'mongoose'

let connectionPromise = null

export const connectDB = async (mongoUri) => {
  if (mongoose.connection.readyState === 1) return mongoose.connection
  if (connectionPromise) return connectionPromise

  mongoose.set('strictQuery', true)
  connectionPromise = mongoose.connect(mongoUri)
  await connectionPromise
  return mongoose.connection
}
