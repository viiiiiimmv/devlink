import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import connectDB from '@/lib/mongodb'
import Inquiry from '@/models/Inquiry'
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

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json().catch(() => null)
    const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : ''
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const message = typeof body?.message === 'string' ? body.message.trim() : ''

    if (!username || !name || !email || !message) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    if (message.length < 10) {
      return NextResponse.json({ error: 'Message is too short.' }, { status: 400 })
    }

    const profile = await db.findProfile(username)
    if (!profile || profile.isPublished === false) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
    }

    await connectDB()
    const inquiry = await Inquiry.create({
      username: profile.username,
      userId: profile.userId,
      name,
      email,
      message,
      status: 'new',
    })

    await logActivity({
      username: profile.username,
      userId: profile.userId,
      type: 'inquiry',
      message: `New inquiry from ${name}`,
      metadata: { inquiryId: inquiry._id?.toString?.() ?? undefined },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Inquiry create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const session = await getServerSession(authOptions)
    const username = await getUsernameFromSession(session)
    if (!username) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limitParam = Number(searchParams.get('limit') || 8)
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 25) : 8

    const query: Record<string, any> = { username }
    if (status === 'new' || status === 'replied') {
      query.status = status
    }

    await connectDB()
    const inquiries = await Inquiry.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    return NextResponse.json({ inquiries })
  } catch (error) {
    console.error('Inquiry fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
