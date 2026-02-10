import mongoose, { Document, Schema, Types } from 'mongoose'

export type OAuthProvider = 'google' | 'github'

export interface IUser extends Document {
  _id: Types.ObjectId
  email: string
  name: string
  image?: string
  provider: OAuthProvider
  providers: OAuthProvider[]
  username: string
  onboardingCompleted?: boolean
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    trim: true,
  },
  provider: {
    type: String,
    required: true,
    enum: ['google', 'github'],
  },
  providers: [{
    type: String,
    enum: ['google', 'github'],
  }],
  username: {
    type: String,
    sparse: true,
    lowercase: true,
    trim: true,
    match: /^[a-z][a-z0-9]*$/,
    validate: {
      validator: function(v: string) {
        // Must start with a letter
        if (!/^[a-z]/.test(v)) return false
        // Only lowercase letters and numbers allowed
        if (!/^[a-z0-9]+$/.test(v)) return false
        return true
      },
      message: 'Username must start with a letter and only use lowercase letters and numbers'
    }
  },
  onboardingCompleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
})

UserSchema.pre('validate', function (next) {
  const providers = Array.isArray(this.providers) ? Array.from(new Set(this.providers)) : []

  if (this.provider && !providers.includes(this.provider)) {
    providers.push(this.provider)
  }

  if (!this.provider && providers.length > 0) {
    this.provider = providers[0]
  }

  this.providers = providers
  next()
})

// Note: `email` unique index is defined on the field itself.
// Note: username index is automatically created by sparse: true.

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
