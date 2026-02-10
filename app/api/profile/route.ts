import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { v2 as cloudinary } from 'cloudinary'
import { revalidatePath } from 'next/cache'
import { isValidUsername, normalizeUsernameInput, USERNAME_VALIDATION_MESSAGE } from '@/lib/username'
import { logActivity } from '@/lib/activity'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    let username: string | undefined = undefined;
    if (session && session.user) {
      if ('username' in session.user && typeof session.user.username === 'string') {
        username = session.user.username;
      } else if ('email' in session.user && typeof session.user.email === 'string') {
        const dbUser = await db.findUser(session.user.email);
        if (dbUser?.username) username = dbUser.username;
      }
    }
    if (!username) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const profile = await db.findProfile(username)
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Add cache control headers to prevent stale data
    const response = NextResponse.json(profile)
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    let username: string | undefined = undefined;
    if (session && session.user) {
      if ('username' in session.user && typeof session.user.username === 'string') {
        username = session.user.username;
      } else if ('email' in session.user && typeof session.user.email === 'string') {
        const dbUser = await db.findUser(session.user.email);
        if (dbUser?.username) username = dbUser.username;
      }
    }
    if (!username) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const updates = await request.json()
    const updatedProfile = await db.updateProfile(username, updates)
    
    if (!updatedProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const fieldLabels: string[] = []
    if (Object.prototype.hasOwnProperty.call(updates, 'name')) fieldLabels.push('name')
    if (Object.prototype.hasOwnProperty.call(updates, 'bio')) fieldLabels.push('bio')
    if (Object.prototype.hasOwnProperty.call(updates, 'skills')) fieldLabels.push('skills')
    if (Object.prototype.hasOwnProperty.call(updates, 'socialLinks')) fieldLabels.push('social links')
    if (Object.prototype.hasOwnProperty.call(updates, 'theme')) fieldLabels.push('theme')
    if (Object.prototype.hasOwnProperty.call(updates, 'template')) fieldLabels.push('template')
    if (Object.prototype.hasOwnProperty.call(updates, 'sectionSettings')) fieldLabels.push('sections')
    if (Object.prototype.hasOwnProperty.call(updates, 'contactCta')) fieldLabels.push('contact card')
    if (Object.prototype.hasOwnProperty.call(updates, 'customTheme')) fieldLabels.push('custom colors')

    const message = fieldLabels.length > 0
      ? `Updated ${fieldLabels.slice(0, 3).join(', ')}${fieldLabels.length > 3 ? ' and more' : ''}`
      : 'Updated profile'

    await logActivity({
      username: updatedProfile.username,
      userId: updatedProfile.userId,
      type: 'profile_update',
      message,
    })

    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // First, get the profile to check for photos that need cleanup
    let username: string | undefined = undefined;
    if (session && session.user) {
      if ('username' in session.user && typeof session.user.username === 'string') {
        username = session.user.username;
      } else if ('email' in session.user && typeof session.user.email === 'string') {
        const dbUser = await db.findUser(session.user.email);
        if (dbUser?.username) username = dbUser.username;
      }
    }
    if (!username) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const profile = await db.findProfile(username)
    
    // Clean up profile photo from Cloudinary if it exists
    if (profile?.profilePhoto?.publicId) {
      try {
        await cloudinary.uploader.destroy(profile.profilePhoto.publicId)
        console.log('Profile photo cleaned up:', profile.profilePhoto.publicId)
      } catch (error) {
        console.error('Error cleaning up profile photo:', error)
        // Don't fail the deletion if photo cleanup fails
      }
    }

    // Delete both user and profile
    const success = await db.deleteUserAndProfile(session.user.email)
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Profile deleted successfully' })
  } catch (error) {
    console.error('Profile deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    let username: string | undefined = undefined;
    if (session && session.user) {
      if ('username' in session.user && typeof session.user.username === 'string') {
        username = session.user.username;
      } else if ('email' in session.user && typeof session.user.email === 'string') {
        const dbUser = await db.findUser(session.user.email);
        if (dbUser?.username) username = dbUser.username;
      }
    }
    if (!username) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const newUsername = normalizeUsernameInput(body?.username)

    if (!newUsername) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    if (!isValidUsername(newUsername)) {
      return NextResponse.json({ 
        error: USERNAME_VALIDATION_MESSAGE,
      }, { status: 400 })
    }

    if (newUsername === username) {
      return NextResponse.json({
        success: true,
        username: newUsername,
        message: 'Username updated successfully',
      })
    }

    // Check if username is available
    if (!(await db.isUsernameAvailable(newUsername))) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 400 })
    }

    // Update username
    let email: string | undefined = undefined;
    if (session && session.user && typeof session.user.email === 'string') {
      email = session.user.email;
    }
    if (!email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const success = await db.updateUsername(email, newUsername)

    if (!success) {
      return NextResponse.json({ error: 'Failed to update username' }, { status: 500 })
    }

    // Revalidate the old and new profile paths
    // Use fallback logic for old username
    let oldUsername: string | undefined = undefined;
    if (session && session.user && 'username' in session.user && typeof session.user.username === 'string') {
      oldUsername = session.user.username;
    } else if (email) {
      // Try to fetch from DB if not present
      const dbUser = await db.findUser(email);
      if (dbUser?.username) oldUsername = dbUser.username;
    }
    if (oldUsername) {
      revalidatePath(`/${oldUsername}`);
    }
    revalidatePath(`/${newUsername}`);

    await logActivity({
      username: newUsername,
      type: 'username_update',
      message: 'Updated portfolio username',
    })

    return NextResponse.json({ 
      success: true, 
      username: newUsername,
      message: 'Username updated successfully'
    })
  } catch (error) {
    console.error('Username update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
