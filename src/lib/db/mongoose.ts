import mongoose from 'mongoose'
import { env } from '@/lib/env'

/* ------------------------------------------------------------------
   Serverless-safe Mongoose connection.

   Every lambda invocation re-imports the module graph, so a naive
   `mongoose.connect()` would open a new pool per request and exhaust
   Atlas connection limits. We stash the connection promise on
   globalThis, which survives module re-evaluation inside a warm
   container.
   ------------------------------------------------------------------ */

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

const globalForMongoose = globalThis as unknown as { _dgsMongoose?: MongooseCache }

const cache: MongooseCache = globalForMongoose._dgsMongoose ?? { conn: null, promise: null }
globalForMongoose._dgsMongoose = cache

mongoose.set('strictQuery', true)

export async function connectDb(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(env.MONGODB_URI, {
        dbName: env.MONGODB_DB,
        // Keep the pool small — serverless spawns many containers.
        maxPoolSize: 10,
        minPoolSize: 0,
        // Fail fast instead of hanging the request for 30s.
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 20000,
        family: 4,
      })
      .catch((err) => {
        // Clear the cached promise so the next request can retry a
        // transient failure instead of re-awaiting a rejected promise.
        cache.promise = null
        throw err
      })
  }

  cache.conn = await cache.promise
  return cache.conn
}

export { mongoose }
