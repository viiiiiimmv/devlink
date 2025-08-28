import connectDB from './mongodb'
import User, { IUser } from '@/models/User'

// Type for user data sent to client (no Mongoose methods)
export type IUserData = {
  _id: string
  email: string
  name: string
  image?: string
  provider: string
  username: string
  createdAt: Date
  updatedAt: Date
}
import Profile, { IProfile } from '@/models/Profile'

class Database {
  private serializeUser(user: any): IUserData {
    return {
      _id: user._id?.toString(),
      email: user.email,
      name: user.name,
      image: user.image,
      provider: user.provider,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  }

  private serializeProfile(profile: any): IProfile {
    return {
      ...profile,
      _id: profile._id.toString(),
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
      const user = await User.findOne({ email }).lean()
      if (!user) return null
      return this.serializeUser(user)
    } catch (error) {
      console.error('Error finding user:', error)
      return null
    }
  }

  async createUser(userData: { email: string; name: string; image?: string; provider: string; username?: string }): Promise<IUserData | null> {
    try {
      await connectDB()
      const user = new User(userData)
      const savedUser = await user.save()
      return this.serializeUser(savedUser.toObject())
    } catch (error) {
      console.error('Error creating user:', error)
      return null
    }
  }

  async updateUser(email: string, updates: Partial<IUser>): Promise<IUserData | null> {
    try {
      await connectDB()
      const user = await User.findOneAndUpdate(
        { email },
        { ...updates, updatedAt: new Date() },
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
      
      // Check if new username is available
      if (!(await this.isUsernameAvailable(newUsername))) {
        return false
      }

      // Get current user to find old username
      const currentUser = await User.findOne({ email }).lean()
      if (!currentUser) {
        return false
      }

      // Ensure currentUser is an object and has username
      const oldUsername = (typeof currentUser === 'object' && currentUser !== null && 'username' in currentUser)
        ? (currentUser as { username?: string }).username
        : undefined

      // Update user with new username
      await User.findOneAndUpdate(
        { email },
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
      if (updates.theme) {
        const validThemes = ['modern', 'dark', 'gradient', 'minimal', 'ocean', 'sunset', 'forest', 'midnight', 'coral', 'steel', 'aurora', 'fire', 'lavender', 'sapphire', 'amber']
        if (!validThemes.includes(updates.theme)) {
          console.error('Invalid theme:', updates.theme)
          return null
        }
      }
      const profile = await Profile.findOneAndUpdate(
        { username },
        { ...updates, updatedAt: new Date() },
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
      const result = await User.deleteOne({ email })
      return result.deletedCount > 0
    } catch (error) {
      console.error('Error deleting user:', error)
      return false
    }
  }

  async deleteUserAndProfile(email: string): Promise<boolean> {
    try {
      await connectDB()
      
      // First find the user to get their username
      const user = await User.findOne({ email }).lean() as IUser | null
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
      const result = await User.deleteOne({ email })
      return result.deletedCount > 0
    } catch (error) {
      console.error('Error deleting user and profile:', error)
      return false
    }
  }

  async getAllProfiles(limit: number = 10, skip: number = 0): Promise<IProfile[]> {
    try {
      await connectDB()
      const profiles = await Profile.find({})
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
