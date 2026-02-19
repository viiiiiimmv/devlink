import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IMessage extends Document {
  _id: Types.ObjectId
  conversationId: string
  senderId: string
  senderUsername: string
  senderName: string
  senderImage?: string
  body: string
  readBy: string[]
  createdAt: Date
  updatedAt: Date
}

const MessageSchema = new Schema<IMessage>({
  conversationId: {
    type: String,
    required: true,
    trim: true,
  },
  senderId: {
    type: String,
    required: true,
    trim: true,
  },
  senderUsername: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  senderName: {
    type: String,
    required: true,
    trim: true,
  },
  senderImage: {
    type: String,
    trim: true,
  },
  body: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  },
  readBy: [{
    type: String,
    trim: true,
  }],
}, {
  timestamps: true,
})

MessageSchema.index({ conversationId: 1, createdAt: -1 })
MessageSchema.index({ senderId: 1, createdAt: -1 })

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema)
