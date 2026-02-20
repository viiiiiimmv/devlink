import mongoose, { Document, Schema } from 'mongoose'

export type InquiryStatus = 'new' | 'replied'

export interface IInquiry extends Document {
  username: string
  userId?: string
  name: string
  email: string
  message: string
  status: InquiryStatus
  tags: string[]
  archived: boolean
  archivedAt?: Date | null
  lastQuickReplyAt?: Date | null
  ipHash?: string
  userAgent?: string
  createdAt: Date
  updatedAt: Date
}

const InquirySchema = new Schema<IInquiry>({
  username: { type: String, required: true, index: true, trim: true },
  userId: { type: String, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  message: { type: String, required: true, trim: true },
  status: { type: String, enum: ['new', 'replied'], default: 'new', index: true },
  tags: [{ type: String, trim: true, lowercase: true }],
  archived: { type: Boolean, default: false, index: true },
  archivedAt: { type: Date, default: null },
  lastQuickReplyAt: { type: Date, default: null },
  ipHash: { type: String, trim: true, index: true },
  userAgent: { type: String, trim: true },
}, {
  timestamps: true,
})

InquirySchema.index({ username: 1, status: 1, createdAt: -1 })
InquirySchema.index({ username: 1, archived: 1, createdAt: -1 })

export default mongoose.models.Inquiry || mongoose.model<IInquiry>('Inquiry', InquirySchema)
