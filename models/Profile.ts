import mongoose, { Document, Schema, Types } from 'mongoose'
import {
  DEFAULT_SECTION_SETTINGS,
  DEFAULT_PROFILE_TEMPLATE,
  DEFAULT_PROFILE_THEME,
  VALID_SECTION_IDS,
  VALID_TEMPLATE_IDS,
  VALID_THEME_IDS,
} from '@/lib/profile-customization'

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

export interface IResearch {
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

export interface IProfileSectionSetting {
  id: string
  visible: boolean
}

export interface ICustomTheme {
  enabled: boolean
  primary: string
  secondary: string
}

export interface IContactCta {
  enabled: boolean
  title: string
  description: string
  buttonLabel: string
  link?: string
  email?: string
}

export interface IProfile extends Document {
  _id: Types.ObjectId
  userId: string
  username: string
  name: string
  bio: string
  skills: string[]
  profileImage?: string
  profilePhoto?: IProfilePhoto
  socialLinks: ISocialLinks
  theme: string
  template: string
  isPublished: boolean
  customTheme: ICustomTheme
  contactCta: IContactCta
  sectionSettings: IProfileSectionSetting[]
  projects: IProject[]
  experiences: IExperience[]
  certifications: ICertification[]
  researches: IResearch[]
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

const ResearchSchema = new Schema({
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

const SectionSettingSchema = new Schema({
  id: {
    type: String,
    enum: VALID_SECTION_IDS,
    required: true,
  },
  visible: {
    type: Boolean,
    default: true,
  },
}, { _id: false })

const CustomThemeSchema = new Schema({
  enabled: {
    type: Boolean,
    default: false,
  },
  primary: {
    type: String,
    trim: true,
    match: /^#([0-9a-fA-F]{6})$/,
    default: '#2563eb',
  },
  secondary: {
    type: String,
    trim: true,
    match: /^#([0-9a-fA-F]{6})$/,
    default: '#14b8a6',
  },
}, { _id: false })

const ContactCtaSchema = new Schema({
  enabled: {
    type: Boolean,
    default: true,
  },
  title: {
    type: String,
    trim: true,
    default: 'Let us work together',
    maxlength: 120,
  },
  description: {
    type: String,
    trim: true,
    default: 'Open to freelance, full-time roles, and collaboration opportunities.',
    maxlength: 240,
  },
  buttonLabel: {
    type: String,
    trim: true,
    default: 'Contact me',
    maxlength: 40,
  },
  link: {
    type: String,
    trim: true,
    default: '',
  },
  email: {
    type: String,
    trim: true,
    default: '',
  },
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
    default: DEFAULT_PROFILE_THEME,
    enum: VALID_THEME_IDS,
  },
  template: {
    type: String,
    default: DEFAULT_PROFILE_TEMPLATE,
    enum: VALID_TEMPLATE_IDS,
  },
  isPublished: {
    type: Boolean,
    default: true,
  },
  customTheme: {
    type: CustomThemeSchema,
    default: () => ({
      enabled: false,
      primary: '#2563eb',
      secondary: '#14b8a6',
    }),
  },
  contactCta: {
    type: ContactCtaSchema,
    default: () => ({
      enabled: true,
      title: 'Let us work together',
      description: 'Open to freelance, full-time roles, and collaboration opportunities.',
      buttonLabel: 'Contact me',
      link: '',
      email: '',
    }),
  },
  sectionSettings: {
    type: [SectionSettingSchema],
    default: DEFAULT_SECTION_SETTINGS,
  },
  projects: [ProjectSchema],
  experiences: [ExperienceSchema],
  certifications: [CertificationSchema],
  researches: [ResearchSchema],
}, {
  timestamps: true,
})

// Indexes for better performance
ProfileSchema.index({ userId: 1 })
ProfileSchema.index({ username: 1 })
ProfileSchema.index({ isPublished: 1 })

// Clear the model cache to ensure schema changes are picked up
if (mongoose.models.Profile) {
  delete mongoose.models.Profile
}

export default mongoose.model<IProfile>('Profile', ProfileSchema)
