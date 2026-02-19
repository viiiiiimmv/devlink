import { NextResponse } from 'next/server'
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

export async function POST(_request: Request, { params }: RouteParams) {
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

    const conversation = await Conversation.findById(conversationId)
      .select('participantIds')
      .lean() as {
      participantIds?: string[]
    } | null

    const participantIds = conversation?.participantIds

    if (!conversation || !Array.isArray(participantIds) || !participantIds.includes(authUser.userId)) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const updateResult = await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: authUser.userId },
        readBy: { $ne: authUser.userId },
      },
      {
        $addToSet: { readBy: authUser.userId },
      }
    )

    emitToUsers(participantIds, 'chat:read', {
      conversationId,
      userId: authUser.userId,
      readCount: updateResult.modifiedCount,
    })

    return NextResponse.json({
      updatedCount: updateResult.modifiedCount,
    })
  } catch (error) {
    console.error('Mark read error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
