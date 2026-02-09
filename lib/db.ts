import connectDB from './mongodb'
import User, { IUser, OAuthProvider } from '@/models/User'
import { isValidTemplate, isValidTheme, normalizeSectionSettings } from '@/lib/profile-customization'

// Type for user data sent to client (no Mongoose methods)
export type IUserData = {
  _id: string
  email: string
  name: string
  image?: string
  provider: OAuthProvider
  providers: OAuthProvider[]
  username: string
  createdAt: Date
  updatedAt: Date
}
import Profile, { IProfile } from '@/models/Profile'

class Database {
  private readonly defaultCustomTheme = {
    enabled: false,
    primary: '#2563eb',
    secondary: '#14b8a6',
  }

  private readonly defaultContactCta = {
    enabled: true,
    title: 'Let us work together',
    description: 'Open to freelance, full-time roles, and collaboration opportunities.',
    buttonLabel: 'Contact me',
    link: '',
    email: '',
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase()
  }

  private isOAuthProvider(provider: unknown): provider is OAuthProvider {
    return provider === 'google' || provider === 'github'
  }

  private getLinkedProviders(user: any): OAuthProvider[] {
    const providerList = Array.isArray(user?.providers) ? user.providers : []
    const normalizedProviders = providerList.filter((provider: unknown): provider is OAuthProvider => this.isOAuthProvider(provider))

    if (normalizedProviders.length > 0) {
      return Array.from(new Set(normalizedProviders))
    }

    if (this.isOAuthProvider(user?.provider)) {
      return [user.provider]
    }

    return []
  }

  private mergeLinkedProviders(user: any, incomingProvider: OAuthProvider): OAuthProvider[] {
    return Array.from(new Set([...this.getLinkedProviders(user), incomingProvider]))
  }

  private isHexColor(value: unknown): value is string {
    return typeof value === 'string' && /^#([0-9a-fA-F]{6})$/.test(value.trim())
  }

  private normalizeCustomTheme(value: unknown) {
    const source = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
    const primary = this.isHexColor(source.primary)
      ? source.primary.trim()
      : this.defaultCustomTheme.primary
    const secondary = this.isHexColor(source.secondary)
      ? source.secondary.trim()
      : this.defaultCustomTheme.secondary

    return {
      enabled: Boolean(source.enabled),
      primary,
      secondary,
    }
  }

  private normalizeContactCta(value: unknown) {
    const source = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
    const title = typeof source.title === 'string'
      ? source.title.trim().slice(0, 120)
      : this.defaultContactCta.title
    const description = typeof source.description === 'string'
      ? source.description.trim().slice(0, 240)
      : this.defaultContactCta.description
    const buttonLabel = typeof source.buttonLabel === 'string'
      ? source.buttonLabel.trim().slice(0, 40)
      : this.defaultContactCta.buttonLabel
    const link = typeof source.link === 'string' ? source.link.trim() : ''
    const email = typeof source.email === 'string' ? source.email.trim() : ''

    return {
      enabled: Object.prototype.hasOwnProperty.call(source, 'enabled')
        ? Boolean(source.enabled)
        : this.defaultContactCta.enabled,
      title: title.length > 0 ? title : this.defaultContactCta.title,
      description: description.length > 0 ? description : this.defaultContactCta.description,
      buttonLabel: buttonLabel.length > 0 ? buttonLabel : this.defaultContactCta.buttonLabel,
      link,
      email,
    }
  }

  private serializeUser(user: any): IUserData {
    const providers = this.getLinkedProviders(user)
    const primaryProvider = this.isOAuthProvider(user?.provider)
      ? user.provider
      : (providers[0] ?? 'google')

    return {
      _id: user._id?.toString(),
      email: user.email,
      name: user.name,
      image: user.image,
      provider: primaryProvider,
      providers,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  }

  private serializeProfile(profile: any): IProfile {
    const customTheme = this.normalizeCustomTheme(profile.customTheme)
    const contactCta = this.normalizeContactCta(profile.contactCta)

    return {
      ...profile,
      _id: profile._id.toString(),
      isPublished: profile.isPublished !== false,
      customTheme,
      contactCta,
      sectionSettings: normalizeSectionSettings(profile.sectionSettings),
      projects: profile.projects?.map((project: any) => ({ ...project, _id: undefined })) || [],
      experiences: profile.experiences?.map((experience: any) => ({ ...experience, _id: undefined })) || [],
      certifications: profile.certifications?.map((certification: any) => ({ ...certification, _id: undefined })) || [],
      researches: profile.researches?.map((research: any) => ({ ...research, _id: undefined })) || [],
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    }
  }

  async findUser(email: string): Promise<IUserData | null> {
    try {
      await connectDB()
      const normalizedEmail = this.normalizeEmail(email)
      const user = await User.findOne({ email: normalizedEmail }).lean()
      if (!user) return null
      return this.serializeUser(user)
    } catch (error) {
      console.error('Error finding user:', error)
      return null
    }
  }

  async createUser(userData: {
    email: string
    name: string
    image?: string
    provider: OAuthProvider
    providers?: OAuthProvider[]
    username?: string
  }): Promise<IUserData | null> {
    try {
      await connectDB()
      const normalizedEmail = this.normalizeEmail(userData.email)
      const providers = Array.from(new Set([...(userData.providers ?? []), userData.provider]))
      const user = new User({
        ...userData,
        email: normalizedEmail,
        providers,
      })
      const savedUser = await user.save()
      return this.serializeUser(savedUser.toObject())
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: number }).code === 11000) {
        return this.findUser(userData.email)
      }
      console.error('Error creating user:', error)
      return null
    }
  }

  async upsertOAuthUser(userData: {
    email: string
    name?: string | null
    image?: string | null
    provider: OAuthProvider
  }): Promise<IUserData | null> {
    try {
      await connectDB()
      const normalizedEmail = this.normalizeEmail(userData.email)
      const trimmedName = typeof userData.name === 'string' ? userData.name.trim() : ''
      const trimmedImage = typeof userData.image === 'string' ? userData.image.trim() : ''
      const existingUser = await User.findOne({ email: normalizedEmail })
        .select('provider providers')
        .lean()
      const mergedProviders = this.mergeLinkedProviders(existingUser, userData.provider)

      const setOnInsert: Record<string, unknown> = {
        email: normalizedEmail,
        name: trimmedName || normalizedEmail.split('@')[0],
      }

      if (trimmedImage) {
        setOnInsert.image = trimmedImage
      }

      const setUpdates: Record<string, unknown> = {
        provider: userData.provider,
        providers: mergedProviders,
        updatedAt: new Date(),
      }

      if (trimmedName) {
        setUpdates.name = trimmedName
      }

      if (trimmedImage) {
        setUpdates.image = trimmedImage
      }

      const user = await User.findOneAndUpdate(
        { email: normalizedEmail },
        {
          $setOnInsert: setOnInsert,
          $set: setUpdates,
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      ).lean()

      return user ? this.serializeUser(user) : null
    } catch (error) {
      console.error('Error upserting OAuth user:', error)
      return null
    }
  }

  async updateUser(email: string, updates: Partial<IUser>): Promise<IUserData | null> {
    try {
      await connectDB()
      const normalizedEmail = this.normalizeEmail(email)
      const normalizedUpdates: Partial<IUser> = { ...updates }

      if (typeof normalizedUpdates.email === 'string') {
        normalizedUpdates.email = this.normalizeEmail(normalizedUpdates.email)
      }

      const user = await User.findOneAndUpdate(
        { email: normalizedEmail },
        { ...normalizedUpdates, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).lean()
      if (!user) return null
      return this.serializeUser(user)
    } catch (error) {
      console.error('Error updating user:', error)
      return null
    }
  }

  async updateUsername(email: string, newUsername: string): Promise<boolean> {
    try {
      await connectDB()
      const normalizedEmail = this.normalizeEmail(email)
      
      // Check if new username is available
      if (!(await this.isUsernameAvailable(newUsername))) {
        return false
      }

      // Get current user to find old username
      const currentUser = await User.findOne({ email: normalizedEmail }).lean()
      if (!currentUser) {
        return false
      }

      // Ensure currentUser is an object and has username
      const oldUsername = (typeof currentUser === 'object' && currentUser !== null && 'username' in currentUser)
        ? (currentUser as { username?: string }).username
        : undefined

      // Update user with new username
      await User.findOneAndUpdate(
        { email: normalizedEmail },
        { username: newUsername, updatedAt: new Date() }
      )

      // Update profile with new username
      if (oldUsername) {
        await Profile.findOneAndUpdate(
          { username: oldUsername },
          { username: newUsername, updatedAt: new Date() }
        )
      }

      return true
    } catch (error) {
      console.error('Error updating username:', error)
      return false
    }
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      await connectDB()
      const existingUser = await User.findOne({ username }).lean()
      const existingProfile = await Profile.findOne({ username }).lean()
      return !existingUser && !existingProfile
    } catch (error) {
      console.error('Error checking username availability:', error)
      return false
    }
  }

  async findProfile(username: string): Promise<IProfile | null> {
    try {
      await connectDB()
      const profile = await Profile.findOne({ username }).lean()
      return profile ? this.serializeProfile(profile) : null
    } catch (error) {
      console.error('Error finding profile:', error)
      return null
    }
  }

  async findProfileByUserId(userId: string): Promise<IProfile | null> {
    try {
      await connectDB()
      const profile = await Profile.findOne({ userId }).lean()
      return profile ? this.serializeProfile(profile) : null
    } catch (error) {
      console.error('Error finding profile by user ID:', error)
      return null
    }
  }

  async createProfile(profileData: Partial<IProfile>): Promise<IProfile | null> {
    try {
      await connectDB()
      const savedProfile = await Profile.create(profileData)
      return this.serializeProfile(savedProfile.toObject())
    } catch (error) {
      console.error('Error creating profile:', error)
      return null
    }
  }

  async updateProfile(username: string, updates: Partial<IProfile>): Promise<IProfile | null> {
    try {
      await connectDB()
      const normalizedUpdates: Partial<IProfile> = { ...updates }

      if (normalizedUpdates.theme) {
        if (!isValidTheme(normalizedUpdates.theme)) {
          console.error('Invalid theme:', updates.theme)
          return null
        }
      }
      if (normalizedUpdates.template) {
        if (!isValidTemplate(normalizedUpdates.template)) {
          console.error('Invalid template:', updates.template)
          return null
        }
      }
      if (Object.prototype.hasOwnProperty.call(normalizedUpdates, 'sectionSettings')) {
        normalizedUpdates.sectionSettings = normalizeSectionSettings(normalizedUpdates.sectionSettings)
      }
      if (Object.prototype.hasOwnProperty.call(normalizedUpdates, 'customTheme')) {
        normalizedUpdates.customTheme = this.normalizeCustomTheme(normalizedUpdates.customTheme)
      }
      if (Object.prototype.hasOwnProperty.call(normalizedUpdates, 'contactCta')) {
        normalizedUpdates.contactCta = this.normalizeContactCta(normalizedUpdates.contactCta)
      }
      const profile = await Profile.findOneAndUpdate(
        { username },
        { ...normalizedUpdates, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).lean()
      return profile ? this.serializeProfile(profile) : null
    } catch (error) {
      console.error('Error updating profile:', error)
      return null
    }
  }

  async deleteProfile(username: string): Promise<boolean> {
    try {
      await connectDB()
      const result = await Profile.deleteOne({ username })
      return result.deletedCount > 0
    } catch (error) {
      console.error('Error deleting profile:', error)
      return false
    }
  }

  async deleteUser(email: string): Promise<boolean> {
    try {
      await connectDB()
      const normalizedEmail = this.normalizeEmail(email)
      const result = await User.deleteOne({ email: normalizedEmail })
      return result.deletedCount > 0
    } catch (error) {
      console.error('Error deleting user:', error)
      return false
    }
  }

  async deleteUserAndProfile(email: string): Promise<boolean> {
    try {
      await connectDB()
      const normalizedEmail = this.normalizeEmail(email)
      
      // First find the user to get their username
      const user = await User.findOne({ email: normalizedEmail }).lean() as IUser | null
      if (!user) {
        console.error('User not found for deletion:', email)
        return false
      }

      // Find the profile to get photo information
      let profile = null
      if (user.username) {
        profile = await Profile.findOne({ username: user.username }).lean()
      }

      // Delete the profile first
      if (user.username) {
        await Profile.deleteOne({ username: user.username })
      }

      // Clean up profile photo from Cloudinary if it exists
      if (profile?.profilePhoto?.publicId) {
        try {
          // We'll need to make a request to delete the photo
          // This will be handled by the API route
          console.log('Profile photo cleanup needed for:', profile.profilePhoto.publicId)
        } catch (error) {
          console.error('Error cleaning up profile photo:', error)
          // Don't fail the deletion if photo cleanup fails
        }
      }

      // Then delete the user
      const result = await User.deleteOne({ email: normalizedEmail })
      return result.deletedCount > 0
    } catch (error) {
      console.error('Error deleting user and profile:', error)
      return false
    }
  }

  async getAllProfiles(limit: number = 10, skip: number = 0): Promise<IProfile[]> {
    try {
      await connectDB()
      const profiles = await Profile.find({ isPublished: true })
        .select('username name bio skills theme profileImage')
        .limit(limit)
        .skip(skip)
        .lean()
      return profiles.map(profile => this.serializeProfile(profile))
    } catch (error) {
      console.error('Error getting all profiles:', error)
      return []
    }
  }

  async searchProfiles(query: string, limit: number = 10): Promise<IProfile[]> {
    try {
      await connectDB()
      const profiles = await Profile.find({
        isPublished: true,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { bio: { $regex: query, $options: 'i' } },
          { skills: { $in: [new RegExp(query, 'i')] } },
          { username: { $regex: query, $options: 'i' } }
        ]
      })
        .select('username name bio skills theme profileImage')
        .limit(limit)
        .lean()
      return profiles.map(profile => this.serializeProfile(profile))
    } catch (error) {
      console.error('Error searching profiles:', error)
      return []
    }
  }
}

export const db = new Database()
