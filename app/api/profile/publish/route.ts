import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { buildPublishSnapshot } from '@/lib/publish'
import { logActivity } from '@/lib/activity'

const getUsernameFromSession = async (session: any): Promise<string | undefined> => {
  if (session && session.user) {
    if ('username' in session.user && typeof session.user.username === 'string') {
      return session.user.username
    }
    if ('email' in session.user && typeof session.user.email === 'string') {
      const dbUser = await db.findUser(session.user.email)
      if (dbUser?.username) return dbUser.username
    }
  }
  return undefined
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const session = await getServerSession(authOptions)
    const username = await getUsernameFromSession(session)
    if (!username) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const isPublished = Boolean(body?.isPublished)

    const profile = await db.findProfile(username)
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (isPublished) {
      const snapshot = buildPublishSnapshot(profile)
      const updatedProfile = await db.updateProfile(username, {
        isPublished: true,
        lastPublishedAt: new Date(),
        lastPublishedSnapshot: snapshot,
      })
      if (!updatedProfile) {
        return NextResponse.json({ error: 'Failed to publish profile' }, { status: 500 })
      }

      await logActivity({
        username,
        userId: profile.userId,
        type: 'publish',
        message: 'Published your portfolio',
      })

      return NextResponse.json({ profile: updatedProfile })
    }

    const updatedProfile = await db.updateProfile(username, { isPublished: false })
    if (!updatedProfile) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    await logActivity({
      username,
      userId: profile.userId,
      type: 'unpublish',
      message: 'Unpublished your portfolio',
    })

    return NextResponse.json({ profile: updatedProfile })
  } catch (error) {
    console.error('Publish toggle error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
