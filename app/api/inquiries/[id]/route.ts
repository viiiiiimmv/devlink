import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import mongoose from 'mongoose'
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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const session = await getServerSession(authOptions)
    const username = await getUsernameFromSession(session)
    if (!username) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const params = await context.params
    const inquiryId = typeof params?.id === 'string' ? params.id : ''
    if (!inquiryId || !mongoose.Types.ObjectId.isValid(inquiryId)) {
      return NextResponse.json({ error: 'Invalid inquiry ID' }, { status: 400 })
    }

    const body = await request.json().catch(() => null)
    const status = typeof body?.status === 'string' ? body.status.trim() : ''
    if (!['new', 'replied'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    await connectDB()
    const inquiry = await Inquiry.findOneAndUpdate(
      { _id: inquiryId, username },
      { status },
      { new: true }
    ).lean()

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
    }

    await logActivity({
      username,
      type: 'inquiry_update',
      message: status === 'replied' ? 'Marked inquiry as replied' : 'Reopened inquiry',
      metadata: { inquiryId },
    })

    return NextResponse.json({ inquiry })
  } catch (error) {
    console.error('Inquiry update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
