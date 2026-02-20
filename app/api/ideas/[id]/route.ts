import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import { getAuthenticatedUser } from '@/lib/auth-user'
import Idea, {
  type IdeaCollaborationType,
  type IdeaContactPreference,
  type IdeaStatus,
} from '@/models/Idea'

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

const serializeIdea = (idea: {
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
}) => {
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
      userId: idea.userId,
      username: idea.username,
      name: idea.name,
      image: typeof idea.image === 'string' && idea.image.trim().length > 0 ? idea.image : undefined,
    },
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const params = await context.params
    const ideaId = typeof params?.id === 'string' ? params.id : ''

    if (!ideaId || !mongoose.Types.ObjectId.isValid(ideaId)) {
      return NextResponse.json({ error: 'Invalid idea ID' }, { status: 400 })
    }

    const body = await request.json().catch(() => null)
    const updates: Record<string, unknown> = {}

    if (Object.prototype.hasOwnProperty.call(body ?? {}, 'title')) {
      const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 140) : ''
      if (title.length < 6) {
        return NextResponse.json({ error: 'Title should be at least 6 characters.' }, { status: 400 })
      }
      updates.title = title
    }

    if (Object.prototype.hasOwnProperty.call(body ?? {}, 'summary')) {
      const summary = typeof body?.summary === 'string' ? body.summary.trim().slice(0, 320) : ''
      if (summary.length < 12) {
        return NextResponse.json({ error: 'Summary should be at least 12 characters.' }, { status: 400 })
      }
      updates.summary = summary
    }

    if (Object.prototype.hasOwnProperty.call(body ?? {}, 'details')) {
      const details = typeof body?.details === 'string' ? body.details.trim().slice(0, 12000) : ''
      updates.details = details
    }

    if (Object.prototype.hasOwnProperty.call(body ?? {}, 'tags')) {
      updates.tags = normalizeTags(body?.tags)
    }

    if (Object.prototype.hasOwnProperty.call(body ?? {}, 'skills')) {
      updates.skills = normalizeSkills(body?.skills)
    }

    if (Object.prototype.hasOwnProperty.call(body ?? {}, 'status')) {
      const status = typeof body?.status === 'string' ? body.status : ''
      if (!IDEA_STATUS_SET.has(status)) {
        return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
      }
      updates.status = status
    }

    if (Object.prototype.hasOwnProperty.call(body ?? {}, 'collaborationType')) {
      const collaborationType = typeof body?.collaborationType === 'string' ? body.collaborationType : ''
      if (!IDEA_COLLABORATION_TYPE_SET.has(collaborationType)) {
        return NextResponse.json({ error: 'Invalid collaboration type.' }, { status: 400 })
      }
      updates.collaborationType = collaborationType
    }

    if (Object.prototype.hasOwnProperty.call(body ?? {}, 'contactPreference')) {
      const contactPreference = typeof body?.contactPreference === 'string' ? body.contactPreference : ''
      if (!IDEA_CONTACT_PREFERENCE_SET.has(contactPreference)) {
        return NextResponse.json({ error: 'Invalid contact preference.' }, { status: 400 })
      }
      updates.contactPreference = contactPreference
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided.' }, { status: 400 })
    }

    await connectDB()

    const existingIdea = await Idea.findById(ideaId)
      .select('_id userId')
      .lean() as { _id: { toString(): string }; userId: string } | null

    if (!existingIdea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 })
    }

    if (existingIdea.userId !== authUser.userId) {
      return NextResponse.json({ error: 'You can only edit your own ideas' }, { status: 403 })
    }

    const updatedIdea = await Idea.findByIdAndUpdate(
      ideaId,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean() as {
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
    } | null

    if (!updatedIdea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 })
    }

    return NextResponse.json({
      idea: serializeIdea(updatedIdea),
    })
  } catch (error) {
    console.error('Idea update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const params = await context.params
    const ideaId = typeof params?.id === 'string' ? params.id : ''

    if (!ideaId || !mongoose.Types.ObjectId.isValid(ideaId)) {
      return NextResponse.json({ error: 'Invalid idea ID' }, { status: 400 })
    }

    await connectDB()

    const existingIdea = await Idea.findById(ideaId)
      .select('_id userId')
      .lean() as { _id: { toString(): string }; userId: string } | null

    if (!existingIdea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 })
    }

    if (existingIdea.userId !== authUser.userId) {
      return NextResponse.json({ error: 'You can only delete your own ideas' }, { status: 403 })
    }

    await Idea.deleteOne({ _id: ideaId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Idea delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
