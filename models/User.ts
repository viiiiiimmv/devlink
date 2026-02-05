import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IUser extends Document {
  _id: Types.ObjectId
  email: string
  name: string
  image?: string
  provider: string
  username: string
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
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
  username: {
    type: String,
    sparse: true,
    lowercase: true,
    trim: true,
    match: /^[a-z][a-z0-9]*[a-z][a-z0-9]*$|^[a-z][a-z0-9]*$/,
    validate: {
      validator: function(v: string) {
        // Must start with a letter
        if (!/^[a-z]/.test(v)) return false
        // Must contain at least one letter
        if (!/[a-z]/.test(v)) return false
        // Only lowercase letters and numbers allowed
        if (!/^[a-z0-9]+$/.test(v)) return false
        return true
      },
      message: 'Username must start with a letter, contain at least one letter, and only use lowercase letters and numbers'
    }
  },
}, {
  timestamps: true,
})

// Indexes for better performance
UserSchema.index({ email: 1 })
// Note: username index is automatically created by sparse: true

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
