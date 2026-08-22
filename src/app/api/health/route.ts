import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDb } from '@/lib/db/mongoose'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/health — liveness plus a real database round-trip.
 * Point uptime monitoring at this; a 503 means Mongo is unreachable.
 */
export async function GET(): Promise<NextResponse> {
  const startedAt = Date.now()
  try {
    await connectDb()
    await mongoose.connection.db?.admin().ping()
    return NextResponse.json(
      { ok: true, data: { status: 'healthy', db: 'up', latencyMs: Date.now() - startedAt } },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    console.error('[health] database unreachable:', err)
    return NextResponse.json(
      { ok: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'Database unreachable.' } },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
