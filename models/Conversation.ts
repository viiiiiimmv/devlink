import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IConversationParticipant {
  userId: string
  username: string
  name: string
  image?: string
}

export interface IConversation extends Document {
  _id: Types.ObjectId
  isDirect: boolean
  pairKey: string
  participantIds: string[]
  participants: IConversationParticipant[]
  lastMessageText?: string
  lastMessageAt?: Date
  lastMessageSenderId?: string
  createdAt: Date
  updatedAt: Date
}

const ConversationParticipantSchema = new Schema<IConversationParticipant>({
  userId: {
    type: String,
    required: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
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
}, { _id: false })

const ConversationSchema = new Schema<IConversation>({
  isDirect: {
    type: Boolean,
    default: true,
  },
  pairKey: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  participantIds: [{
    type: String,
    required: true,
    trim: true,
  }],
  participants: {
    type: [ConversationParticipantSchema],
    validate: {
      validator: (value: IConversationParticipant[]) => Array.isArray(value) && value.length >= 2,
      message: 'A conversation requires at least two participants',
    },
  },
  lastMessageText: {
    type: String,
    trim: true,
    maxlength: 2000,
  },
  lastMessageAt: {
    type: Date,
  },
  lastMessageSenderId: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
})

ConversationSchema.index({ participantIds: 1, lastMessageAt: -1 })
ConversationSchema.index({ updatedAt: -1 })

export default mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema)
