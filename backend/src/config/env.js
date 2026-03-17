import dotenv from 'dotenv'

dotenv.config()

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI
const jwtSecret = process.env.JWT_SECRET

if (!mongoUri) throw new Error('Missing required environment variable: MONGODB_URI or MONGO_URI')
if (!jwtSecret) throw new Error('Missing required environment variable: JWT_SECRET')

const rawClientUrls = process.env.CLIENT_URLS || process.env.CLIENT_URL || 'http://localhost:5173'
const clientUrls = rawClientUrls.split(',').map((item) => item.trim()).filter(Boolean)

export const env = {
  port: Number(process.env.PORT || 5000),
  mongoUri,
  jwtSecret,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: clientUrls[0],
  clientUrls,
}
