import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { getAuthenticatedUser } from '@/lib/auth-user'
import { buildPairKey } from '@/lib/network'
import Conversation from '@/models/Conversation'
import Connection from '@/models/Connection'
import Message from '@/models/Message'
import User from '@/models/User'

const serializeConversation = (
  conversation: any,
  viewerUserId: string,
  unreadCount: number
) => {
  const participants = Array.isArray(conversation.participants)
    ? conversation.participants
    : []

  const peer = participants.find((participant: any) => participant.userId !== viewerUserId)

  return {
    id: conversation._id?.toString() || '',
    isDirect: conversation.isDirect !== false,
    peer: peer ? {
      userId: peer.userId,
      username: peer.username,
      name: peer.name,
      image: peer.image,
    } : null,
    participants,
    lastMessageText: conversation.lastMessageText || '',
    lastMessageAt: conversation.lastMessageAt || conversation.updatedAt,
    unreadCount,
    updatedAt: conversation.updatedAt,
  }
}

export async function GET() {
  try {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    await connectDB()

    const conversations = await Conversation.find({
      participantIds: authUser.userId,
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .limit(60)
      .lean() as any[]

    const conversationIds = conversations
      .map((conversation) => conversation._id?.toString())
      .filter((value): value is string => typeof value === 'string' && value.length > 0)

    const unreadAggregates = conversationIds.length > 0
      ? await Message.aggregate([
        {
          $match: {
            conversationId: { $in: conversationIds },
            senderId: { $ne: authUser.userId },
            readBy: { $ne: authUser.userId },
          },
        },
        {
          $group: {
            _id: '$conversationId',
            count: { $sum: 1 },
          },
        },
      ])
      : []

    const unreadByConversationId = new Map<string, number>()
    for (const aggregate of unreadAggregates) {
      if (typeof aggregate?._id === 'string') {
        unreadByConversationId.set(aggregate._id, Number(aggregate.count || 0))
      }
    }

    return NextResponse.json({
      conversations: conversations.map((conversation) =>
        serializeConversation(
          conversation,
          authUser.userId,
          unreadByConversationId.get(conversation._id?.toString() || '') ?? 0
        )
      ),
    })
  } catch (error) {
    console.error('Conversation list error:', error)
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
    const participantUserId = typeof body?.participantUserId === 'string'
      ? body.participantUserId.trim()
      : ''

    if (!participantUserId) {
      return NextResponse.json({ error: 'participantUserId is required' }, { status: 400 })
    }

    if (participantUserId === authUser.userId) {
      return NextResponse.json({ error: 'Cannot create a chat with yourself' }, { status: 400 })
    }

    await connectDB()

    const pairKey = buildPairKey(authUser.userId, participantUserId)

    const activeConnection = await Connection.findOne({
      pairKey,
      status: 'accepted',
    })
      .select('_id')
      .lean() as { _id: { toString(): string } } | null

    if (!activeConnection) {
      return NextResponse.json({ error: 'You can chat only with your Code Circle members' }, { status: 403 })
    }

    const existingConversation = await Conversation.findOne({ pairKey }).lean() as any | null
    if (existingConversation) {
      return NextResponse.json({
        conversation: serializeConversation(existingConversation, authUser.userId, 0),
      })
    }

    const targetUser = await User.findById(participantUserId)
      .select('_id username name image')
      .lean() as {
      _id: { toString(): string }
      username?: string
      name?: string
      image?: string
    } | null

    if (!targetUser || typeof targetUser.username !== 'string' || !targetUser.username) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    const newConversation = await Conversation.create({
      isDirect: true,
      pairKey,
      participantIds: [authUser.userId, participantUserId],
      participants: [
        {
          userId: authUser.userId,
          username: authUser.username,
          name: authUser.name,
          image: authUser.image,
        },
        {
          userId: participantUserId,
          username: targetUser.username,
          name: targetUser.name,
          image: targetUser.image,
        },
      ],
    })

    return NextResponse.json({
      conversation: serializeConversation(newConversation.toObject(), authUser.userId, 0),
    })
  } catch (error) {
    console.error('Conversation create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
