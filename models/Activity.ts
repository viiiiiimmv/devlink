import mongoose, { Document, Schema } from 'mongoose'

export interface IActivity extends Document {
  username: string
  userId?: string
  type: string
  message: string
  metadata?: Record<string, any>
  createdAt: Date
}

const ActivitySchema = new Schema<IActivity>({
  username: { type: String, required: true, index: true, trim: true },
  userId: { type: String, index: true },
  type: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  metadata: { type: Schema.Types.Mixed },
}, {
  timestamps: { createdAt: true, updatedAt: false },
})

ActivitySchema.index({ username: 1, createdAt: -1 })

export default mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema)
