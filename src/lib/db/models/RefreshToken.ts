import { Schema, model, models, type Model, type Types } from 'mongoose'

/**
 * One document per signed-in device. The raw token never touches the
 * database — we store an HMAC of it, so a database leak cannot be
 * replayed as a login.
 *
 * `family` links every token produced by one login. Rotation replaces a
 * token with its successor; if an already-rotated token is presented
 * again that means it was stolen, and we revoke the whole family.
 */
export interface RefreshTokenDoc {
  _id: Types.ObjectId
  userId: Types.ObjectId
  tokenHash: string
  family: string
  expiresAt: Date
  revokedAt?: Date | null
  revokedReason?: string | null
  replacedByHash?: string | null
  userAgent?: string
  ip?: string
  lastUsedAt: Date
  createdAt: Date
  updatedAt: Date
}

const refreshTokenSchema = new Schema<RefreshTokenDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    family: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    revokedReason: { type: String, default: null },
    replacedByHash: { type: String, default: null },
    userAgent: { type: String, maxlength: 400 },
    ip: { type: String, maxlength: 64 },
    lastUsedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
)

// Mongo sweeps expired sessions for us — no cron needed.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const RefreshToken: Model<RefreshTokenDoc> =
  (models.RefreshToken as Model<RefreshTokenDoc>) ??
  model<RefreshTokenDoc>('RefreshToken', refreshTokenSchema)
