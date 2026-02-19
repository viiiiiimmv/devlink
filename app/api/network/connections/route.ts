import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-user'
import connectDB from '@/lib/mongodb'
import Connection from '@/models/Connection'

const toPeerPayload = (connection: any, viewerUserId: string) => {
  const isRequester = connection.requesterUserId === viewerUserId

  const peerUserId = isRequester ? connection.recipientUserId : connection.requesterUserId
  const peerUsername = isRequester ? connection.recipientUsername : connection.requesterUsername
  const peerName = isRequester ? connection.recipientName : connection.requesterName
  const peerImage = isRequester ? connection.recipientImage : connection.requesterImage

  return {
    connectionId: connection._id?.toString() || '',
    peerUserId,
    peerUsername,
    peerName,
    peerImage,
    requesterUserId: connection.requesterUserId,
    status: connection.status,
    createdAt: connection.createdAt,
    updatedAt: connection.updatedAt,
    respondedAt: connection.respondedAt,
  }
}

export async function GET() {
  try {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    await connectDB()

    const connections = await Connection.find({
      $or: [
        { requesterUserId: authUser.userId },
        { recipientUserId: authUser.userId },
      ],
      status: { $in: ['pending', 'accepted'] },
    })
      .sort({ updatedAt: -1 })
      .lean()

    const codeCircles: Array<Record<string, unknown>> = []
    const incomingSparks: Array<Record<string, unknown>> = []
    const outgoingSparks: Array<Record<string, unknown>> = []

    for (const connection of connections) {
      const payload = toPeerPayload(connection, authUser.userId)

      if (connection.status === 'accepted') {
        codeCircles.push(payload)
        continue
      }

      if (connection.status === 'pending') {
        if (connection.recipientUserId === authUser.userId) {
          incomingSparks.push(payload)
        } else {
          outgoingSparks.push(payload)
        }
      }
    }

    return NextResponse.json({
      codeCircles,
      incomingSparks,
      outgoingSparks,
    })
  } catch (error) {
    console.error('Connection list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
