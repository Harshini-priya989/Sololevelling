import serverless from 'serverless-http'
import appModule from '../../backend/src/app.js'
import { connectDB } from '../../backend/src/config/db.js'
import { env } from '../../backend/src/config/env.js'

const app = appModule?.default || appModule
const serverlessHandler = serverless(app)

export const handler = async (event, context) => {
  await connectDB(env.mongoUri)
  return serverlessHandler(event, context)
}
