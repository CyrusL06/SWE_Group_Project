/* global process */
import { MongoClient } from 'mongodb'
import { initializeMongoSchema } from './mongodbSchema.js'

const uri = process.env.MONGODB_URI
const databaseName = process.env.MONGODB_DATABASE || 'bike_rental'

if (!uri) {
  console.error('MONGODB_URI is required. Example: MONGODB_URI=mongodb://127.0.0.1:27017 npm run db:init')
  process.exit(1)
}

const client = new MongoClient(uri)

try {
  await client.connect()
  const db = client.db(databaseName)
  await initializeMongoSchema(db)
  console.log(`MongoDB schema initialized for database: ${databaseName}`)
  console.log('Collections: customers, bikeTypes, bikes, reservations, rentals, agreements, staff')
} finally {
  await client.close()
}
