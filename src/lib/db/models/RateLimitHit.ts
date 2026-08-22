import { Schema, model, models, type Model } from 'mongoose'

/**
 * Sliding-window rate-limit counter, shared across serverless instances.
 * `hits` holds the newest request timestamps (capped by $slice on write,
 * so the array never grows unbounded).
 */
export interface RateLimitHitDoc {
  _id: string // the rate-limit key
  hits: number[]
  expiresAt: Date
}

const rateLimitHitSchema = new Schema<RateLimitHitDoc>(
  {
    _id: { type: String, required: true },
    hits: { type: [Number], default: [] },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false },
)

rateLimitHitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const RateLimitHit: Model<RateLimitHitDoc> =
  (models.RateLimitHit as Model<RateLimitHitDoc>) ??
  model<RateLimitHitDoc>('RateLimitHit', rateLimitHitSchema)
