import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import connectDB from '@/lib/mongodb'
import Inquiry from '@/models/Inquiry'
import User from '@/models/User'
import { logActivity } from '@/lib/activity'
import { sendSmtpMail } from '@/lib/smtp'

type RouteParams = {
  params: Promise<{
    id: string
  }>
}

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

const getFirstName = (value: string): string => {
  const trimmed = value.trim()
  if (!trimmed) return 'there'
  return trimmed.split(/\s+/)[0] || 'there'
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const buildQuickReplyBody = (template: string, customMessage: string): string => {
  if (template === 'details') {
    return 'Thanks for reaching out. Could you share your preferred timeline, budget range, and a few project requirements so I can provide an accurate response?'
  }
  if (template === 'availability') {
    return 'Thanks for your message. I am currently reviewing new opportunities and will get back to you shortly with availability details.'
  }
  if (template === 'custom') {
    return customMessage
  }
  return 'Thanks for reaching out. I have received your message and will reply with next steps shortly.'
}

export async function POST(request: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    const session = await getServerSession(authOptions)
    const username = await getUsernameFromSession(session)
    if (!username) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid inquiry ID' }, { status: 400 })
    }

    const body = await request.json().catch(() => null)
    const template = typeof body?.template === 'string' ? body.template.trim().toLowerCase() : 'thanks'
    const customMessage = typeof body?.customMessage === 'string' ? body.customMessage.trim() : ''
    const markArchived = body?.markArchived === true

    if (!['thanks', 'details', 'availability', 'custom'].includes(template)) {
      return NextResponse.json({ error: 'Invalid quick reply template' }, { status: 400 })
    }

    if (template === 'custom' && customMessage.length < 8) {
      return NextResponse.json({ error: 'Custom quick reply must be at least 8 characters.' }, { status: 400 })
    }

    await connectDB()

    const inquiry = await Inquiry.findOne({ _id: id, username })
    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
    }

    const owner = await User.findById(inquiry.userId)
      .select('name email')
      .lean() as { name?: string; email?: string } | null

    const recipientName = getFirstName(inquiry.name || 'there')
    const ownerName = owner?.name?.trim() || username
    const quickReplyBody = buildQuickReplyBody(template, customMessage)
    const subject = `Re: your message to ${ownerName}`
    const plainText = `Hi ${recipientName},\n\n${quickReplyBody}\n\nBest,\n${ownerName}`
    const html = `
      <p>Hi ${escapeHtml(recipientName)},</p>
      <p>${escapeHtml(quickReplyBody)}</p>
      <p>Best,<br />${escapeHtml(ownerName)}</p>
    `

    const mailResult = await sendSmtpMail({
      to: inquiry.email,
      subject,
      text: plainText,
      html,
      replyTo: owner?.email,
      headers: {
        'X-DevLink-Event': 'inquiry_quick_reply',
      },
    })

    if (!mailResult.ok) {
      if (mailResult.skipped) {
        return NextResponse.json({ error: 'SMTP is not configured for quick replies.' }, { status: 503 })
      }
      return NextResponse.json({ error: 'Failed to send quick reply email.' }, { status: 502 })
    }

    inquiry.status = 'replied'
    inquiry.lastQuickReplyAt = new Date()
    if (markArchived) {
      inquiry.archived = true
      inquiry.archivedAt = new Date()
    }
    await inquiry.save()

    await logActivity({
      username,
      type: 'inquiry_reply',
      message: `Sent quick reply (${template}) to ${inquiry.name}`,
      metadata: {
        inquiryId: id,
        template,
      },
    })

    return NextResponse.json({
      success: true,
      inquiry: inquiry.toObject(),
    })
  } catch (error) {
    console.error('Inquiry quick reply error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
