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

const normalizeTag = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24)

const normalizeTags = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []

  const unique = new Set<string>()
  for (const entry of value) {
    if (typeof entry !== 'string') continue
    const normalized = normalizeTag(entry)
    if (!normalized) continue
    unique.add(normalized)
    if (unique.size >= 8) break
  }
  return Array.from(unique)
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
    const incomingStatus = typeof body?.status === 'string' ? body.status.trim() : undefined
    const hasStatusUpdate = typeof incomingStatus === 'string'
    if (hasStatusUpdate && !['new', 'replied'].includes(incomingStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const hasArchivedUpdate = Object.prototype.hasOwnProperty.call(body ?? {}, 'archived')
    const incomingArchived = body?.archived
    if (hasArchivedUpdate && typeof incomingArchived !== 'boolean') {
      return NextResponse.json({ error: 'Invalid archived state' }, { status: 400 })
    }

    const hasTagsUpdate = Object.prototype.hasOwnProperty.call(body ?? {}, 'tags')
    const normalizedTags = hasTagsUpdate ? normalizeTags(body?.tags) : undefined

    const addTagRaw = typeof body?.addTag === 'string' ? body.addTag : ''
    const addTag = normalizeTag(addTagRaw)
    if (addTagRaw && !addTag) {
      return NextResponse.json({ error: 'Invalid tag format' }, { status: 400 })
    }

    const removeTagRaw = typeof body?.removeTag === 'string' ? body.removeTag : ''
    const removeTag = normalizeTag(removeTagRaw)
    if (removeTagRaw && !removeTag) {
      return NextResponse.json({ error: 'Invalid tag format' }, { status: 400 })
    }

    if (!hasStatusUpdate && !hasArchivedUpdate && !hasTagsUpdate && !addTag && !removeTag) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 })
    }

    await connectDB()
    const inquiry = await Inquiry.findOne({ _id: inquiryId, username })

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
    }

    let didUpdate = false
    const activityNotes: string[] = []

    if (hasStatusUpdate && inquiry.status !== incomingStatus) {
      inquiry.status = incomingStatus as 'new' | 'replied'
      didUpdate = true
      activityNotes.push(incomingStatus === 'replied' ? 'marked as replied' : 'reopened')
    }

    if (hasArchivedUpdate && inquiry.archived !== incomingArchived) {
      inquiry.archived = incomingArchived
      inquiry.archivedAt = incomingArchived ? new Date() : null
      didUpdate = true
      activityNotes.push(incomingArchived ? 'archived' : 'unarchived')
    }

    if (hasTagsUpdate) {
      inquiry.tags = normalizedTags || []
      didUpdate = true
      activityNotes.push('updated tags')
    }

    if (addTag) {
      const currentTags = Array.isArray(inquiry.tags) ? inquiry.tags : []
      if (!currentTags.includes(addTag)) {
        if (currentTags.length >= 8) {
          return NextResponse.json({ error: 'Maximum 8 tags allowed per inquiry' }, { status: 400 })
        }
        inquiry.tags = [...currentTags, addTag]
        didUpdate = true
        activityNotes.push(`added tag "${addTag}"`)
      }
    }

    if (removeTag) {
      const currentTags = Array.isArray(inquiry.tags) ? inquiry.tags : []
      if (currentTags.includes(removeTag)) {
        inquiry.tags = currentTags.filter((tag: string) => tag !== removeTag)
        didUpdate = true
        activityNotes.push(`removed tag "${removeTag}"`)
      }
    }

    if (didUpdate) {
      await inquiry.save()
    }

    await logActivity({
      username,
      type: 'inquiry_update',
      message: activityNotes.length > 0
        ? `Updated inquiry: ${activityNotes.join(', ')}`
        : 'Viewed inquiry',
      metadata: { inquiryId },
    })

    return NextResponse.json({ inquiry: inquiry.toObject() })
  } catch (error) {
    console.error('Inquiry update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
