import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import crypto from 'crypto'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import connectDB from '@/lib/mongodb'
import Inquiry from '@/models/Inquiry'
import User from '@/models/User'
import { logActivity } from '@/lib/activity'
import { sendInquiryReceivedEmail } from '@/lib/transactional-email'
import { verifyInquiryCaptcha } from '@/lib/inquiry-captcha'

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
const RATE_LIMIT_IP_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_IP_MAX = 3
const RATE_LIMIT_EMAIL_WINDOW_MS = 24 * 60 * 60 * 1000
const RATE_LIMIT_EMAIL_MAX = 5

const normalizeTag = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24)

const getIpAddress = (request: NextRequest): string => {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown'
  }
  return request.headers.get('x-real-ip') || 'unknown'
}

const hashInquirySource = (ip: string, username: string): string => {
  const salt =
    process.env.INQUIRY_RATE_LIMIT_SALT ||
    process.env.ANALYTICS_SALT ||
    'devlink-inquiry-rate-limit'
  return crypto.createHash('sha256').update(`${ip}|${username}|${salt}`).digest('hex')
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json().catch(() => null)
    const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : ''
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const message = typeof body?.message === 'string' ? body.message.trim() : ''
    const captchaToken = typeof body?.captchaToken === 'string' ? body.captchaToken.trim() : ''
    const captchaAnswer = typeof body?.captchaAnswer === 'string' ? body.captchaAnswer.trim() : ''
    const website = typeof body?.website === 'string' ? body.website.trim() : ''

    // Honeypot field: if bots fill it, pretend success and silently drop.
    if (website.length > 0) {
      return NextResponse.json({ success: true })
    }

    if (!username || !name || !email || !message || !captchaToken || !captchaAnswer) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    if (message.length < 10) {
      return NextResponse.json({ error: 'Message is too short.' }, { status: 400 })
    }

    if (!verifyInquiryCaptcha(captchaToken, captchaAnswer)) {
      return NextResponse.json({ error: 'Captcha verification failed.' }, { status: 400 })
    }

    const profile = await db.findProfile(username)
    if (!profile || profile.isPublished === false) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
    }

    await connectDB()
    const ipAddress = getIpAddress(request)
    const ipHash = hashInquirySource(ipAddress, profile.username)
    const userAgent = request.headers.get('user-agent') || ''
    const now = Date.now()

    const [ipWindowCount, emailWindowCount] = await Promise.all([
      Inquiry.countDocuments({
        username: profile.username,
        ipHash,
        createdAt: { $gte: new Date(now - RATE_LIMIT_IP_WINDOW_MS) },
      }),
      Inquiry.countDocuments({
        username: profile.username,
        email,
        createdAt: { $gte: new Date(now - RATE_LIMIT_EMAIL_WINDOW_MS) },
      }),
    ])

    if (ipWindowCount >= RATE_LIMIT_IP_MAX) {
      return NextResponse.json({
        error: 'Too many messages sent recently. Please try again in a few minutes.',
      }, { status: 429 })
    }

    if (emailWindowCount >= RATE_LIMIT_EMAIL_MAX) {
      return NextResponse.json({
        error: 'You have reached the daily message limit for this profile. Please try again tomorrow.',
      }, { status: 429 })
    }

    const inquiry = await Inquiry.create({
      username: profile.username,
      userId: profile.userId,
      name,
      email,
      message,
      status: 'new',
      tags: [],
      archived: false,
      ipHash,
      userAgent: userAgent.slice(0, 300),
    })

    await logActivity({
      username: profile.username,
      userId: profile.userId,
      type: 'inquiry',
      message: `New inquiry from ${name}`,
      metadata: { inquiryId: inquiry._id?.toString?.() ?? undefined },
    })

    const profileOwner = await User.findById(profile.userId)
      .select('email name username')
      .lean() as {
      email?: string
      name?: string
      username?: string
    } | null

    void sendInquiryReceivedEmail({
      toEmail: profileOwner?.email,
      toName: profileOwner?.name || profile.name || profile.username,
      senderName: name,
      senderEmail: email,
      message,
      username: profile.username,
    }).catch((error) => {
      console.error('Inquiry email dispatch failed:', error)
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
    const archivedParam = searchParams.get('archived')
    const tag = normalizeTag(searchParams.get('tag') || '')
    const limitParam = Number(searchParams.get('limit') || 8)
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 25) : 8

    const query: Record<string, any> = { username }
    if (status === 'new' || status === 'replied') {
      query.status = status
    }
    if (archivedParam === 'true') {
      query.archived = true
    } else if (archivedParam !== 'all') {
      query.archived = false
    }
    if (tag) {
      query.tags = tag
    }

    await connectDB()
    const [inquiries, summaryRows] = await Promise.all([
      Inquiry.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      Inquiry.aggregate([
        { $match: { username } },
        {
          $group: {
            _id: {
              status: '$status',
              archived: '$archived',
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ])

    const summary = {
      total: 0,
      new: 0,
      replied: 0,
      archived: 0,
      unarchived: 0,
    }
    for (const row of summaryRows) {
      const count = Number(row?.count || 0)
      if (!Number.isFinite(count) || count <= 0) continue

      summary.total += count
      if (row?._id?.archived) {
        summary.archived += count
      } else {
        summary.unarchived += count
      }
      if (row?._id?.status === 'new') summary.new += count
      if (row?._id?.status === 'replied') summary.replied += count
    }

    return NextResponse.json({ inquiries, summary })
  } catch (error) {
    console.error('Inquiry fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
