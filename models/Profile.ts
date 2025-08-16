import mongoose, { Document, Schema } from 'mongoose'

export interface IProject {
  id: string
  title: string
  description: string
  technologies: string[]
  githubUrl?: string
  liveUrl?: string
  image?: string
  featured: boolean
}

export interface IExperience {
  id: string
  company: string
  position: string
  startDate: string
  endDate?: string | null
  isCurrentlyWorking: boolean
  description: string
  technologies: string[]
  linkedinPostUrl?: string
}

export interface ICertification {
  id: string
  name: string
  issuer: string
  date: string
  credentialId?: string
  credentialUrl?: string
}

export interface IBlog {
  id: string
  title: string
  description: string
  url: string
  publishedAt: string
}

export interface ISocialLinks {
  github?: string
  linkedin?: string
  twitter?: string
  website?: string
}

export interface IProfilePhoto {
  url?: string
  publicId?: string
}

export interface IProfile extends Document {
  _id: string
  userId: string
  username: string
  name: string
  bio: string
  skills: string[]
  profileImage?: string
  profilePhoto?: IProfilePhoto
  socialLinks: ISocialLinks
  theme: string
  projects: IProject[]
  experiences: IExperience[]
  certifications: ICertification[]
  blogs: IBlog[]
  createdAt: Date
  updatedAt: Date
}

const ProjectSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  technologies: [{ type: String, trim: true }],
  githubUrl: { type: String, trim: true },
  liveUrl: { type: String, trim: true },
  image: { type: String, trim: true },
  featured: { type: Boolean, default: false },
})

const ExperienceSchema = new Schema({
  id: { type: String, required: true },
  company: { type: String, required: true, trim: true },
  position: { type: String, required: true, trim: true },
  startDate: { type: String, required: true, trim: true },
  endDate: { type: String, trim: true },
  isCurrentlyWorking: { type: Boolean, default: false },
  description: { type: String, required: true, trim: true },
  technologies: [{ type: String, trim: true }],
  linkedinPostUrl: { type: String, trim: true },
})

const CertificationSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  issuer: { type: String, required: true, trim: true },
  date: { type: String, required: true, trim: true },
  credentialId: { type: String, trim: true },
  credentialUrl: { type: String, trim: true },
})

const BlogSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true },
  publishedAt: { type: String, required: true },
})

const SocialLinksSchema = new Schema({
  github: { type: String, trim: true },
  linkedin: { type: String, trim: true },
  twitter: { type: String, trim: true },
  website: { type: String, trim: true },
}, { _id: false })

const ProfileSchema = new Schema<IProfile>({
  userId: {
    type: String,
    required: true,
    ref: 'User',
  },
  username: {
    type: String,
    required: true,
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
  name: {
    type: String,
    required: true,
    trim: true,
  },
  bio: {
    type: String,
    default: '',
    trim: true,
    maxlength: 500,
  },
  skills: [{
    type: String,
    trim: true,
  }],
  profileImage: {
    type: String,
    trim: true,
  },
  profilePhoto: {
    url: { type: String, trim: true },
    publicId: { type: String, trim: true },
  },
  socialLinks: {
    type: SocialLinksSchema,
    default: {},
  },
  theme: {
    type: String,
    default: 'modern',
    enum: ['modern', 'dark', 'gradient', 'minimal', 'ocean', 'sunset', 'forest', 'midnight', 'coral', 'steel', 'aurora', 'fire', 'lavender', 'sapphire', 'amber'],
  },
  projects: [ProjectSchema],
  experiences: [ExperienceSchema],
  certifications: [CertificationSchema],
  blogs: [BlogSchema],
}, {
  timestamps: true,
})

// Indexes for better performance
ProfileSchema.index({ userId: 1 })
ProfileSchema.index({ username: 1 })

// Clear the model cache to ensure schema changes are picked up
if (mongoose.models.Profile) {
  delete mongoose.models.Profile
}

export default mongoose.model<IProfile>('Profile', ProfileSchema)