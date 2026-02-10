import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import type { OAuthProvider } from '@/models/User'
import { DEFAULT_PROFILE_TEMPLATE, DEFAULT_PROFILE_THEME, DEFAULT_SECTION_SETTINGS } from '@/lib/profile-customization'
import { isValidUsername, normalizeUsernameInput, USERNAME_VALIDATION_MESSAGE } from '@/lib/username'

const normalizeEmail = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : ''

const toOAuthProvider = (value: unknown): OAuthProvider | undefined =>
  value === 'google' || value === 'github' ? value : undefined

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionEmail = normalizeEmail(session?.user?.email)

    if (!sessionEmail) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const username = normalizeUsernameInput(body?.username)
    const requestedName = typeof body?.name === 'string' ? body.name.trim() : ''

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    if (!isValidUsername(username)) {
      return NextResponse.json({
        error: USERNAME_VALIDATION_MESSAGE,
      }, { status: 400 })
    }

    let currentUser = await db.findUser(sessionEmail)
    if (!currentUser) {
      const fallbackProvider = toOAuthProvider(session?.user?.provider) ?? 'google'
      currentUser = await db.upsertOAuthUser({
        email: sessionEmail,
        name: session?.user?.name,
        image: session?.user?.image,
        provider: fallbackProvider,
      })

      if (!currentUser) {
        currentUser = await db.findUser(sessionEmail)
      }

      if (!currentUser) {
        return NextResponse.json({
          error: 'Unable to initialize your account. Please sign out and sign in again.',
        }, { status: 500 })
      }
    }

    if (requestedName && requestedName !== currentUser.name) {
      const updatedUser = await db.updateUser(sessionEmail, { name: requestedName })
      if (updatedUser) {
        currentUser = updatedUser
      }
    }

    const profileName = requestedName || currentUser.name || session?.user?.name || ''

    if (!profileName) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    }

    const alreadyOwnsUsername = currentUser.username === username

    if (!alreadyOwnsUsername) {
      if (!(await db.isUsernameAvailable(username))) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 409 })
      }

      const updatedUser = await db.updateUser(sessionEmail, { username })

      if (!updatedUser) {
        const refreshedUser = await db.findUser(sessionEmail)
        if (!refreshedUser || refreshedUser.username !== username) {
          return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 })
        }
        currentUser = refreshedUser
      } else {
        currentUser = updatedUser
      }
    }

    const existingProfile = await db.findProfile(username)

    if (existingProfile && existingProfile.userId !== currentUser._id) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 409 })
    }

    if (!existingProfile) {
      const profile = {
        userId: currentUser._id,
        username,
        name: profileName,
        bio: '',
        skills: [],
        socialLinks: {},
        theme: DEFAULT_PROFILE_THEME,
        template: DEFAULT_PROFILE_TEMPLATE,
        sectionSettings: DEFAULT_SECTION_SETTINGS,
        projects: [],
        experiences: [],
        certifications: [],
        researches: [],
        testimonials: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const createdProfile = await db.createProfile(profile)
      if (!createdProfile) {
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      username,
      user: currentUser,
      message: 'Profile setup completed successfully',
    })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
