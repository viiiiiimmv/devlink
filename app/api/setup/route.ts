import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { username } = await request.json()

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    // Validate username format
    if (!/^[a-z][a-z0-9]*[a-z][a-z0-9]*$|^[a-z][a-z0-9]*$/.test(username)) {
      return NextResponse.json({ 
        error: 'Username must start with a letter, contain at least one letter, and only use lowercase letters and numbers' 
      }, { status: 400 })
    }

    // Check availability
    if (!(await db.isUsernameAvailable(username))) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 400 })
    }

    // Update user with username
    const updatedUser = await db.updateUser(session.user.email, { username })
    
    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    // Check if profile already exists
    const existingProfile = await db.findProfile(username)
    if (!existingProfile) {
      // Create initial profile
      const profile = {
        userId: updatedUser._id,
        username,
        name: updatedUser.name,
        bio: '',
        skills: [],
        socialLinks: {},
        theme: 'modern',
        projects: [],
        experiences: [],
        certifications: [],
        blogs: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const createdProfile = await db.createProfile(profile)
      if (!createdProfile) {
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
      }
      console.log('Profile created successfully for user:', username)
    } else {
      console.log('Profile already exists for user:', username)
    }

    // Return the updated user data so the client can update the session
    return NextResponse.json({ 
      success: true, 
      username,
      user: updatedUser,
      message: 'Profile setup completed successfully'
    })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}