import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { getAuthenticatedUser } from '@/lib/auth-user'
import { clampLimit, escapeRegex, getViewerConnectionState, type ViewerConnectionState } from '@/lib/network'
import Idea, {
  type IdeaCollaborationType,
  type IdeaContactPreference,
  type IdeaStatus,
} from '@/models/Idea'
import Connection from '@/models/Connection'

const IDEA_STATUSES: IdeaStatus[] = ['open', 'in_progress', 'closed']
const IDEA_COLLABORATION_TYPES: IdeaCollaborationType[] = ['any', 'cofounder', 'freelance', 'open_source', 'hackathon']
const IDEA_CONTACT_PREFERENCES: IdeaContactPreference[] = ['either', 'chat', 'profile_contact']

const IDEA_STATUS_SET = new Set<string>(IDEA_STATUSES)
const IDEA_COLLABORATION_TYPE_SET = new Set<string>(IDEA_COLLABORATION_TYPES)
const IDEA_CONTACT_PREFERENCE_SET = new Set<string>(IDEA_CONTACT_PREFERENCES)

const normalizeTag = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24)
}

const parseStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }

  if (typeof value === 'string') {
    return value.split(',')
  }

  return []
}

const normalizeTags = (value: unknown): string[] => {
  const tags = parseStringArray(value)
    .map((item) => normalizeTag(item))
    .filter(Boolean)

  return Array.from(new Set(tags)).slice(0, 8)
}

const normalizeSkills = (value: unknown): string[] => {
  const result: string[] = []
  const seen = new Set<string>()

  for (const rawSkill of parseStringArray(value)) {
    const skill = rawSkill.trim().slice(0, 32)
    if (!skill) continue

    const key = skill.toLowerCase()
    if (seen.has(key)) continue

    seen.add(key)
    result.push(skill)

    if (result.length >= 8) {
      break
    }
  }

  return result
}

type LeanIdea = {
  _id: { toString(): string }
  userId: string
  username: string
  name: string
  image?: string
  title: string
  summary: string
  details?: string
  tags?: string[]
  skills?: string[]
  collaborationType: IdeaCollaborationType
  contactPreference: IdeaContactPreference
  status: IdeaStatus
  createdAt: Date
  updatedAt: Date
}

type IdeaConnection = {
  id: string
  requesterUserId: string
  recipientUserId: string
  status: 'pending' | 'accepted' | 'declined'
}

const serializeIdea = (
  idea: LeanIdea,
  authUserId: string | null,
  connectionByPeerId: Map<string, IdeaConnection>
) => {
  const ownerUserId = typeof idea.userId === 'string' ? idea.userId : ''
  const isOwner = Boolean(authUserId && ownerUserId === authUserId)

  let connectionState: ViewerConnectionState = 'none'
  let connectionId: string | undefined

  if (isOwner) {
    connectionState = 'self'
  } else if (authUserId) {
    const connection = connectionByPeerId.get(ownerUserId) ?? null
    connectionState = getViewerConnectionState(connection, authUserId)
    connectionId = connection?.id || undefined
  }

  return {
    id: idea._id?.toString() || '',
    title: idea.title,
    summary: idea.summary,
    details: typeof idea.details === 'string' ? idea.details : '',
    tags: Array.isArray(idea.tags) ? idea.tags : [],
    skills: Array.isArray(idea.skills) ? idea.skills : [],
    collaborationType: idea.collaborationType,
    contactPreference: idea.contactPreference,
    status: idea.status,
    createdAt: idea.createdAt,
    updatedAt: idea.updatedAt,
    owner: {
      userId: ownerUserId,
      username: idea.username,
      name: idea.name,
      image: typeof idea.image === 'string' && idea.image.trim().length > 0 ? idea.image : undefined,
    },
    viewer: {
      isAuthenticated: Boolean(authUserId),
      isOwner,
      connectionState,
      connectionId,
      canSpark: Boolean(authUserId) && !isOwner && connectionState === 'none',
      canChat: connectionState === 'connected',
      canContact: !isOwner && typeof idea.username === 'string' && idea.username.length > 0,
    },
  }
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser()
    await connectDB()

    const { searchParams } = new URL(request.url)
    const query = (searchParams.get('q') || '').trim().slice(0, 120)
    const statusParam = (searchParams.get('status') || '').trim().toLowerCase()
    const tagParam = normalizeTag(searchParams.get('tag') || '')
    const mineParam = searchParams.get('mine') === 'true'
    const limit = clampLimit(Number(searchParams.get('limit') || 16), 1, 40)
    const skip = Math.max(0, Math.floor(Number(searchParams.get('skip') || 0) || 0))

    const filter: Record<string, unknown> = {}

    if (IDEA_STATUS_SET.has(statusParam)) {
      filter.status = statusParam
    } else if (statusParam !== 'all') {
      filter.status = { $in: ['open', 'in_progress'] }
    }

    if (tagParam) {
      filter.tags = tagParam
    }

    if (mineParam) {
      if (!authUser) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
      }
      filter.userId = authUser.userId
    }

    if (query.length >= 2) {
      const queryRegex = new RegExp(escapeRegex(query), 'i')
      filter.$or = [
        { title: { $regex: queryRegex } },
        { summary: { $regex: queryRegex } },
        { details: { $regex: queryRegex } },
        { tags: { $in: [queryRegex] } },
        { skills: { $in: [queryRegex] } },
        { username: { $regex: queryRegex } },
        { name: { $regex: queryRegex } },
      ]
    }

    const [ideaRows, total] = await Promise.all([
      Idea.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Idea.countDocuments(filter),
    ])
    const ideas = ideaRows as unknown as LeanIdea[]

    const authUserId = authUser?.userId ?? null
    const connectionByPeerId = new Map<string, IdeaConnection>()

    if (authUserId) {
      const ownerIds = Array.from(new Set(
        ideas
          .map((idea) => (typeof idea.userId === 'string' ? idea.userId : ''))
          .filter((ownerId) => ownerId && ownerId !== authUserId)
      ))

      if (ownerIds.length > 0) {
        const existingConnectionRows = await Connection.find({
          status: { $in: ['pending', 'accepted'] },
          $or: [
            {
              requesterUserId: authUserId,
              recipientUserId: { $in: ownerIds },
            },
            {
              recipientUserId: authUserId,
              requesterUserId: { $in: ownerIds },
            },
          ],
        })
          .select('_id requesterUserId recipientUserId status')
          .lean()
        const existingConnections = existingConnectionRows as unknown as Array<{
          _id: { toString(): string }
          requesterUserId: string
          recipientUserId: string
          status: 'pending' | 'accepted' | 'declined'
        }>

        for (const connection of existingConnections) {
          const peerUserId = connection.requesterUserId === authUserId
            ? connection.recipientUserId
            : connection.requesterUserId

          connectionByPeerId.set(peerUserId, {
            id: connection._id?.toString() || '',
            requesterUserId: connection.requesterUserId,
            recipientUserId: connection.recipientUserId,
            status: connection.status,
          })
        }
      }
    }

    return NextResponse.json({
      ideas: ideas.map((idea) => serializeIdea(idea, authUserId, connectionByPeerId)),
      total,
      limit,
      skip,
      hasMore: skip + ideas.length < total,
    })
  } catch (error) {
    console.error('Idea list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)

    const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 140) : ''
    const summary = typeof body?.summary === 'string' ? body.summary.trim().slice(0, 320) : ''
    const details = typeof body?.details === 'string' ? body.details.trim().slice(0, 12000) : ''
    const tags = normalizeTags(body?.tags)
    const skills = normalizeSkills(body?.skills)

    const collaborationType = typeof body?.collaborationType === 'string' && IDEA_COLLABORATION_TYPE_SET.has(body.collaborationType)
      ? body.collaborationType as IdeaCollaborationType
      : 'any'

    const contactPreference = typeof body?.contactPreference === 'string' && IDEA_CONTACT_PREFERENCE_SET.has(body.contactPreference)
      ? body.contactPreference as IdeaContactPreference
      : 'either'

    const status = typeof body?.status === 'string' && IDEA_STATUS_SET.has(body.status)
      ? body.status as IdeaStatus
      : 'open'

    if (title.length < 6) {
      return NextResponse.json({ error: 'Title should be at least 6 characters.' }, { status: 400 })
    }

    if (summary.length < 12) {
      return NextResponse.json({ error: 'Summary should be at least 12 characters.' }, { status: 400 })
    }

    await connectDB()

    const idea = await Idea.create({
      userId: authUser.userId,
      username: authUser.username,
      name: authUser.name,
      image: authUser.image,
      title,
      summary,
      details,
      tags,
      skills,
      collaborationType,
      contactPreference,
      status,
    })

    return NextResponse.json({
      idea: serializeIdea(idea.toObject() as LeanIdea, authUser.userId, new Map()),
    }, { status: 201 })
  } catch (error) {
    console.error('Idea create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
