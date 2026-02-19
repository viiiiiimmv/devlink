import mongoose, { Document, Schema, Types } from 'mongoose'

export type ConnectionStatus = 'pending' | 'accepted' | 'declined'

export interface IConnection extends Document {
  _id: Types.ObjectId
  pairKey: string
  requesterUserId: string
  requesterUsername: string
  requesterName: string
  requesterImage?: string
  recipientUserId: string
  recipientUsername: string
  recipientName: string
  recipientImage?: string
  status: ConnectionStatus
  respondedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const ConnectionSchema = new Schema<IConnection>({
  pairKey: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  requesterUserId: {
    type: String,
    required: true,
    trim: true,
  },
  requesterUsername: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  requesterName: {
    type: String,
    required: true,
    trim: true,
  },
  requesterImage: {
    type: String,
    trim: true,
  },
  recipientUserId: {
    type: String,
    required: true,
    trim: true,
  },
  recipientUsername: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  recipientName: {
    type: String,
    required: true,
    trim: true,
  },
  recipientImage: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending',
    required: true,
  },
  respondedAt: {
    type: Date,
  },
}, {
  timestamps: true,
})

ConnectionSchema.index({ requesterUserId: 1, status: 1, updatedAt: -1 })
ConnectionSchema.index({ recipientUserId: 1, status: 1, updatedAt: -1 })
ConnectionSchema.index({ requesterUsername: 1 })
ConnectionSchema.index({ recipientUsername: 1 })

export default mongoose.models.Connection || mongoose.model<IConnection>('Connection', ConnectionSchema)
