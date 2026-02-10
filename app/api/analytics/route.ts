import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import crypto from 'crypto'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import connectDB from '@/lib/mongodb'
import AnalyticsEvent, { type AnalyticsEventType, type ProjectClickType } from '@/models/AnalyticsEvent'

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

const getIpAddress = (request: NextRequest): string => {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown'
  }
  return request.headers.get('x-real-ip') || 'unknown'
}

const hashVisitor = (ip: string, userAgent: string): string => {
  const salt = process.env.ANALYTICS_SALT || 'devlink-analytics'
  return crypto.createHash('sha256').update(`${ip}|${userAgent}|${salt}`).digest('hex')
}

const parseReferrerDomain = (referrer: string): string => {
  if (!referrer) return ''
  try {
    const url = new URL(referrer)
    return url.hostname.replace(/^www\./i, '')
  } catch {
    return ''
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json().catch(() => null)
    const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : ''
    const eventType = typeof body?.eventType === 'string' ? body.eventType.trim() as AnalyticsEventType : undefined

    if (!username || !eventType || !['view', 'project_click'].includes(eventType)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const profile = await db.findProfile(username)
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const userAgent = request.headers.get('user-agent') || ''
    const ip = getIpAddress(request)
    const visitorId = hashVisitor(ip, userAgent)
    const referrer = typeof body?.referrer === 'string' ? body.referrer.trim() : ''
    const path = typeof body?.path === 'string' ? body.path.trim() : ''
    const referrerDomain = parseReferrerDomain(referrer)

    const projectId = typeof body?.projectId === 'string' ? body.projectId.trim() : ''
    const projectTitle = typeof body?.projectTitle === 'string' ? body.projectTitle.trim() : ''
    const linkType = typeof body?.linkType === 'string' ? body.linkType.trim() as ProjectClickType : undefined

    await connectDB()
    await AnalyticsEvent.create({
      username: profile.username,
      userId: profile.userId,
      eventType,
      projectId: projectId || undefined,
      projectTitle: projectTitle || undefined,
      linkType,
      referrer: referrer || undefined,
      referrerDomain: referrerDomain || undefined,
      path: path || undefined,
      visitorId,
      userAgent,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics track error:', error)
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
    const daysParam = Number(searchParams.get('days') || 30)
    const days = Number.isFinite(daysParam) && daysParam > 0 ? Math.min(daysParam, 365) : 30
    const rangeEnd = new Date()
    const rangeStart = new Date(rangeEnd.getTime() - days * 24 * 60 * 60 * 1000)

    await connectDB()
    const viewMatch = { username, eventType: 'view' as const, createdAt: { $gte: rangeStart } }
    const clickMatch = { username, eventType: 'project_click' as const, createdAt: { $gte: rangeStart } }

    const [views, uniqueVisitors, topReferrers, topProjects] = await Promise.all([
      AnalyticsEvent.countDocuments(viewMatch),
      AnalyticsEvent.distinct('visitorId', viewMatch).then((ids) => ids.length),
      AnalyticsEvent.aggregate([
        { $match: { ...viewMatch, referrerDomain: { $ne: '' } } },
        { $group: { _id: '$referrerDomain', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      AnalyticsEvent.aggregate([
        { $match: { ...clickMatch, projectId: { $ne: '' } } },
        { $group: { _id: '$projectId', count: { $sum: 1 }, title: { $last: '$projectTitle' } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ])

    return NextResponse.json({
      rangeStart: rangeStart.toISOString(),
      rangeEnd: rangeEnd.toISOString(),
      views,
      uniqueVisitors,
      topReferrers: topReferrers.map((item: { _id: string; count: number }) => ({
        referrer: item._id || 'direct',
        count: item.count,
      })),
      topProjects: topProjects.map((item: { _id: string; count: number; title?: string }) => ({
        projectId: item._id,
        title: item.title || 'Untitled project',
        count: item.count,
      })),
    })
  } catch (error) {
    console.error('Analytics summary error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
