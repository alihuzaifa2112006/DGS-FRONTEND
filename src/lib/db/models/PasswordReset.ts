import { Schema, model, models, type Model, type Types } from 'mongoose'

/** Single-use password-reset link. Hashed at rest, like refresh tokens. */
export interface PasswordResetDoc {
  _id: Types.ObjectId
  userId: Types.ObjectId
  tokenHash: string
  expiresAt: Date
  usedAt?: Date | null
  ip?: string
  createdAt: Date
}

const passwordResetSchema = new Schema<PasswordResetDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
    ip: { type: String, maxlength: 64 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const PasswordReset: Model<PasswordResetDoc> =
  (models.PasswordReset as Model<PasswordResetDoc>) ??
  model<PasswordResetDoc>('PasswordReset', passwordResetSchema)
