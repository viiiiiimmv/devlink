import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import connectDB from '@/lib/mongodb'
import Activity from '@/models/Activity'

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

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const session = await getServerSession(authOptions)
    const username = await getUsernameFromSession(session)
    if (!username) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limitParam = Number(searchParams.get('limit') || 10)
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 25) : 10

    await connectDB()
    const activities = await Activity.find({ username })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    return NextResponse.json({ activities })
  } catch (error) {
    console.error('Activity fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
