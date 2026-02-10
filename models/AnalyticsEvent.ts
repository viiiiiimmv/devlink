import mongoose, { Document, Schema } from 'mongoose'

export type AnalyticsEventType = 'view' | 'project_click'
export type ProjectClickType = 'github' | 'live'

export interface IAnalyticsEvent extends Document {
  username: string
  userId?: string
  eventType: AnalyticsEventType
  projectId?: string
  projectTitle?: string
  linkType?: ProjectClickType
  referrer?: string
  referrerDomain?: string
  path?: string
  visitorId: string
  userAgent?: string
  createdAt: Date
}

const AnalyticsEventSchema = new Schema<IAnalyticsEvent>({
  username: { type: String, required: true, index: true, trim: true },
  userId: { type: String, index: true },
  eventType: { type: String, required: true, enum: ['view', 'project_click'] },
  projectId: { type: String, trim: true },
  projectTitle: { type: String, trim: true },
  linkType: { type: String, enum: ['github', 'live'] },
  referrer: { type: String, trim: true },
  referrerDomain: { type: String, trim: true },
  path: { type: String, trim: true },
  visitorId: { type: String, required: true, index: true },
  userAgent: { type: String, trim: true },
}, {
  timestamps: { createdAt: true, updatedAt: false },
})

AnalyticsEventSchema.index({ username: 1, eventType: 1, createdAt: -1 })
AnalyticsEventSchema.index({ username: 1, createdAt: -1 })

export default mongoose.models.AnalyticsEvent || mongoose.model<IAnalyticsEvent>('AnalyticsEvent', AnalyticsEventSchema)
