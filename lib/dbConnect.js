import mongoose from 'mongoose'
import dotenv from 'dotenv'
import dns from 'dns'

dotenv.config()

// Some local/ISP DNS resolvers refuse SRV queries (needed for mongodb+srv://)
// even though they handle normal A-record lookups fine. Point Node at a
// public resolver so the Atlas SRV + TXT lookups succeed everywhere.
dns.setServers(['8.8.8.8', '1.1.1.1'])

const MONGO_URI = process.env.MONGO_URI

if (!MONGO_URI) {
  throw new Error('MONGO_URI is not defined in environment variables')
}

// Cached across invocations to avoid exhausting connections in serverless.
let cached = global._mongoose
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null }
}

export default async function dbConnect() {
  // readyState 0 = disconnected. A previously-good connection can still drop
  // (idle timeout, network blip) — reset the cache so we reconnect instead
  // of handing back a dead connection that will fail every query.
  if (cached.conn && mongoose.connection.readyState === 0) {
    cached.conn = null
    cached.promise = null
  }

  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGO_URI, { bufferCommands: false })
      .catch((err) => {
        // Don't let a failed attempt permanently poison the cache — clear it
        // so the next request retries a fresh connection instead of reusing
        // this rejected promise forever.
        cached.promise = null
        throw err
      })
  }

  try {
    cached.conn = await cached.promise
  } catch (err) {
    cached.promise = null
    throw err
  }

  return cached.conn
}
