import { Schema, model, models, type Model, type Types } from 'mongoose'

export interface UserDoc {
  _id: Types.ObjectId
  email: string
  name: string
  org?: string
  role: string
  timezone: string
  /** scrypt digest — never selected by default. */
  passwordHash: string
  /** Bumped on password change / "sign out everywhere" to invalidate live access tokens. */
  tokenVersion: number
  avatar?: {
    data: Buffer
    contentType: string
    /** Short random string appended to the avatar URL so browsers refetch after an update. */
    version: string
    updatedAt: Date
  }
  /**
   * Always-selected mirror of `avatar.version`. `avatar` is select:false (it
   * holds the image bytes), so this is what lets us build the avatar URL
   * without ever loading the blob.
   */
  avatarVersion?: string | null
  plan: 'free' | 'pro' | 'enterprise'
  status: 'active' | 'suspended'
  failedLoginAttempts: number
  lockedUntil?: Date | null
  lastLoginAt?: Date | null
  passwordChangedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

/** Shape safe to send to the browser. */
export interface PublicUser {
  id: string
  email: string
  name: string
  org: string | null
  role: string
  timezone: string
  plan: UserDoc['plan']
  avatarUrl: string | null
  createdAt: string
  lastLoginAt: string | null
}

const userSchema = new Schema<UserDoc>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    org: { type: String, trim: true, maxlength: 120 },
    role: { type: String, default: 'Security engineer', trim: true, maxlength: 80 },
    timezone: { type: String, default: 'UTC', trim: true, maxlength: 64 },

    // select:false — a stray `User.find()` must never leak hashes into a response.
    passwordHash: { type: String, required: true, select: false },
    tokenVersion: { type: Number, default: 0 },

    avatar: {
      type: {
        data: { type: Buffer, required: true },
        contentType: { type: String, required: true },
        version: { type: String, required: true },
        updatedAt: { type: Date, required: true },
      },
      // Avatars are a few hundred KB; never pull them on an ordinary user read.
      select: false,
      default: undefined,
      _id: false,
    },

    avatarVersion: { type: String, default: null },

    plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },

    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },
  },
  { timestamps: true },
)

export function toPublicUser(u: UserDoc): PublicUser {
  return {
    id: u._id.toString(),
    email: u.email,
    name: u.name,
    org: u.org || null,
    role: u.role,
    timezone: u.timezone,
    plan: u.plan,
    avatarUrl: u.avatarVersion ? `/api/account/avatar/${u._id.toString()}?v=${u.avatarVersion}` : null,
    createdAt: u.createdAt.toISOString(),
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
  }
}

export const User: Model<UserDoc> =
  (models.User as Model<UserDoc>) ?? model<UserDoc>('User', userSchema)
