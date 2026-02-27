import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI || ''

// Reuse the client connection across hot-reloads in development
declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined
}

let client: MongoClient

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClient) {
    global._mongoClient = new MongoClient(uri)
  }
  client = global._mongoClient
} else {
  client = new MongoClient(uri)
}

export async function getDb(dbName = 'Users') {
  await client.connect()
  return client.db(dbName)
}
