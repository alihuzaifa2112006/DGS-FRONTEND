import { Schema, model, models, type Model, type Types } from 'mongoose'

export type AuditAction =
  | 'user.signup'
  | 'user.login'
  | 'user.login_failed'
  | 'user.login_locked'
  | 'user.logout'
  | 'user.logout_all'
  | 'token.refresh'
  | 'token.reuse_detected'
  | 'password.change'
  | 'password.reset_requested'
  | 'password.reset_completed'
  | 'profile.update'
  | 'avatar.update'
  | 'avatar.delete'
  | 'session.revoke'

/** Security trail. Kept 90 days, then swept by the TTL index. */
export interface AuditLogDoc {
  _id: Types.ObjectId
  userId?: Types.ObjectId | null
  email?: string
  action: AuditAction
  ip?: string
  userAgent?: string
  meta?: Record<string, unknown>
  createdAt: Date
}

const auditLogSchema = new Schema<AuditLogDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    email: { type: String, lowercase: true, trim: true },
    action: { type: String, required: true, index: true },
    ip: { type: String, maxlength: 64 },
    userAgent: { type: String, maxlength: 400 },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 })

export const AuditLog: Model<AuditLogDoc> =
  (models.AuditLog as Model<AuditLogDoc>) ?? model<AuditLogDoc>('AuditLog', auditLogSchema)
