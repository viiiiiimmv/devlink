import mongoose, { Document, Schema, Types } from 'mongoose'

export type IdeaStatus = 'open' | 'in_progress' | 'closed'
export type IdeaCollaborationType = 'any' | 'cofounder' | 'freelance' | 'open_source' | 'hackathon'
export type IdeaContactPreference = 'either' | 'chat' | 'profile_contact'

export interface IIdea extends Document {
  _id: Types.ObjectId
  userId: string
  username: string
  name: string
  image?: string
  title: string
  summary: string
  details?: string
  tags: string[]
  skills: string[]
  collaborationType: IdeaCollaborationType
  contactPreference: IdeaContactPreference
  status: IdeaStatus
  createdAt: Date
  updatedAt: Date
}

const IdeaSchema = new Schema<IIdea>({
  userId: {
    type: String,
    required: true,
    index: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true,
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
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 140,
  },
  summary: {
    type: String,
    required: true,
    trim: true,
    maxlength: 320,
  },
  details: {
    type: String,
    trim: true,
    maxlength: 12000,
    default: '',
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  skills: [{
    type: String,
    trim: true,
  }],
  collaborationType: {
    type: String,
    enum: ['any', 'cofounder', 'freelance', 'open_source', 'hackathon'],
    default: 'any',
    required: true,
  },
  contactPreference: {
    type: String,
    enum: ['either', 'chat', 'profile_contact'],
    default: 'either',
    required: true,
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'closed'],
    default: 'open',
    required: true,
    index: true,
  },
}, {
  timestamps: true,
})

IdeaSchema.index({ status: 1, updatedAt: -1 })
IdeaSchema.index({ userId: 1, updatedAt: -1 })
IdeaSchema.index({ tags: 1 })
IdeaSchema.index({ skills: 1 })
IdeaSchema.index({
  title: 'text',
  summary: 'text',
  details: 'text',
  tags: 'text',
  skills: 'text',
  username: 'text',
  name: 'text',
})

export default mongoose.models.Idea || mongoose.model<IIdea>('Idea', IdeaSchema)
