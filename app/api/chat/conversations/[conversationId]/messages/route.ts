import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { getAuthenticatedUser } from '@/lib/auth-user'
import Conversation from '@/models/Conversation'
import Message from '@/models/Message'
import { emitToUsers } from '@/lib/socket-server'

type RouteParams = {
  params: Promise<{
    conversationId: string
  }>
}

const normalizeMessage = (message: any, viewerUserId: string) => ({
  id: message._id?.toString() || '',
  conversationId: message.conversationId,
  senderId: message.senderId,
  senderUsername: message.senderUsername,
  senderName: message.senderName,
  senderImage: message.senderImage,
  body: message.body,
  createdAt: message.createdAt,
  isOwnMessage: message.senderId === viewerUserId,
  isRead: Array.isArray(message.readBy) && message.readBy.includes(viewerUserId),
})

const findConversationForUser = async (conversationId: string, userId: string) => {
  const conversation = await Conversation.findById(conversationId).lean() as {
    _id: { toString(): string }
    participantIds?: string[]
    participants?: Array<{
      userId: string
      username: string
      name: string
      image?: string
    }>
  } | null
  if (!conversation) return null

  const participantIds = Array.isArray(conversation.participantIds)
    ? conversation.participantIds
    : []

  if (!participantIds.includes(userId)) {
    return null
  }

  return conversation
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { conversationId } = await params
    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId is required' }, { status: 400 })
    }

    await connectDB()

    const conversation = await findConversationForUser(conversationId, authUser.userId)
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const rawLimit = Number(searchParams.get('limit') || 40)
    const limit = Math.min(80, Math.max(1, Number.isFinite(rawLimit) ? Math.floor(rawLimit) : 40))
    const beforeParam = searchParams.get('before')

    const filter: Record<string, unknown> = {
      conversationId,
    }

    if (beforeParam) {
      const beforeDate = new Date(beforeParam)
      if (!Number.isNaN(beforeDate.getTime())) {
        filter.createdAt = { $lt: beforeDate }
      }
    }

    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean() as any[]

    return NextResponse.json({
      messages: messages
        .reverse()
        .map((message) => normalizeMessage(message, authUser.userId)),
      conversation: {
        id: conversation._id?.toString() || '',
        participants: conversation.participants,
      },
    })
  } catch (error) {
    console.error('Message list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { conversationId } = await params
    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId is required' }, { status: 400 })
    }

    const body = await request.json().catch(() => null)
    const rawMessage = typeof body?.body === 'string' ? body.body : ''
    const normalizedMessage = rawMessage.trim()

    if (!normalizedMessage) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 })
    }

    if (normalizedMessage.length > 2000) {
      return NextResponse.json({ error: 'Message cannot exceed 2000 characters' }, { status: 400 })
    }

    await connectDB()

    const conversation = await findConversationForUser(conversationId, authUser.userId)
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const participantIds = Array.isArray(conversation.participantIds)
      ? conversation.participantIds
      : []

    const message = await Message.create({
      conversationId,
      senderId: authUser.userId,
      senderUsername: authUser.username,
      senderName: authUser.name,
      senderImage: authUser.image,
      body: normalizedMessage,
      readBy: [authUser.userId],
    })

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessageText: normalizedMessage,
      lastMessageAt: message.createdAt,
      lastMessageSenderId: authUser.userId,
      updatedAt: new Date(),
    })

    const serializedMessage = normalizeMessage(message.toObject(), authUser.userId)
    const conversationEvent = {
      conversationId,
      lastMessageText: normalizedMessage,
      lastMessageAt: message.createdAt,
      lastMessageSenderId: authUser.userId,
      senderName: authUser.name,
    }

    emitToUsers(participantIds, 'chat:message', {
      conversationId,
      message: serializedMessage,
    })
    emitToUsers(participantIds, 'chat:conversation:update', conversationEvent)

    return NextResponse.json({ message: serializedMessage })
  } catch (error) {
    console.error('Message create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
