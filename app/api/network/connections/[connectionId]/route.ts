import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { getAuthenticatedUser } from '@/lib/auth-user'
import { emitToUsers } from '@/lib/socket-server'
import { sendSparkAcceptedEmail } from '@/lib/transactional-email'
import Connection from '@/models/Connection'
import User from '@/models/User'

const logMailResult = (eventName: string, result: {
  ok: boolean
  skipped: boolean
  attempts: number
  error?: unknown
}) => {
  if (result.ok) {
    return
  }

  console.warn(`${eventName} email was not delivered`, {
    skipped: result.skipped,
    attempts: result.attempts,
    error: result.error instanceof Error ? result.error.message : result.error,
  })
}

type RouteParams = {
  params: Promise<{
    connectionId: string
  }>
}

const isParticipant = (connection: any, userId: string) => {
  return connection.requesterUserId === userId || connection.recipientUserId === userId
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { connectionId } = await params
    const body = await request.json().catch(() => null)
    const action = typeof body?.action === 'string' ? body.action.trim() : ''

    if (!connectionId) {
      return NextResponse.json({ error: 'Connection id is required' }, { status: 400 })
    }

    await connectDB()

    const connection = await Connection.findById(connectionId).lean() as {
      requesterUserId: string
      requesterUsername: string
      requesterName: string
      requesterImage?: string
      recipientUserId: string
      recipientUsername: string
      recipientName: string
      recipientImage?: string
      status: 'pending' | 'accepted' | 'declined'
    } | null
    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    if (!isParticipant(connection, authUser.userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (action === 'accept') {
      if (connection.status !== 'pending' || connection.recipientUserId !== authUser.userId) {
        return NextResponse.json({ error: 'Only incoming pending requests can be accepted' }, { status: 400 })
      }

      const updated = await Connection.findByIdAndUpdate(
        connectionId,
        {
          status: 'accepted',
          respondedAt: new Date(),
          recipientName: authUser.name,
          recipientUsername: authUser.username,
          recipientImage: authUser.image,
        },
        { new: true, runValidators: true }
      ).lean() as {
        status: 'pending' | 'accepted' | 'declined'
      } | null

      emitToUsers([connection.requesterUserId, connection.recipientUserId], 'network:connection:update', {
        type: 'spark_accepted',
        connectionId,
        fromUserId: authUser.userId,
        fromUsername: authUser.username,
        fromName: authUser.name,
        fromImage: authUser.image,
        toUserId: connection.requesterUserId === authUser.userId
          ? connection.recipientUserId
          : connection.requesterUserId,
        toUsername: connection.requesterUserId === authUser.userId
          ? connection.recipientUsername
          : connection.requesterUsername,
        toName: connection.requesterUserId === authUser.userId
          ? connection.recipientName
          : connection.requesterName,
        at: new Date().toISOString(),
      })

      const requesterUser = await User.findById(connection.requesterUserId)
        .select('email name username')
        .lean() as {
        email?: string
        name?: string
        username?: string
      } | null

      const sparkAcceptedEmailResult = await sendSparkAcceptedEmail({
        toEmail: requesterUser?.email,
        toName: requesterUser?.name || connection.requesterName,
        acceptedByName: authUser.name,
        acceptedByUsername: authUser.username,
      }).catch((error) => {
        console.error('Spark accepted email dispatch failed:', error)
        return null
      })
      if (sparkAcceptedEmailResult) {
        logMailResult('spark_accepted', sparkAcceptedEmailResult)
      }

      return NextResponse.json({
        connectionId,
        state: 'connected',
        status: updated?.status ?? 'accepted',
      })
    }

    if (action === 'decline') {
      if (connection.status !== 'pending' || connection.recipientUserId !== authUser.userId) {
        return NextResponse.json({ error: 'Only incoming pending requests can be declined' }, { status: 400 })
      }

      await Connection.findByIdAndUpdate(connectionId, {
        status: 'declined',
        respondedAt: new Date(),
      })

      emitToUsers([connection.requesterUserId], 'network:connection:update', {
        type: 'spark_declined',
        connectionId,
        fromUserId: authUser.userId,
        fromUsername: authUser.username,
        fromName: authUser.name,
        fromImage: authUser.image,
        toUserId: connection.requesterUserId,
        toUsername: connection.requesterUsername,
        toName: connection.requesterName,
        at: new Date().toISOString(),
      })

      return NextResponse.json({
        connectionId,
        state: 'none',
        status: 'declined',
      })
    }

    if (action === 'cancel') {
      if (connection.status !== 'pending' || connection.requesterUserId !== authUser.userId) {
        return NextResponse.json({ error: 'Only outgoing pending requests can be canceled' }, { status: 400 })
      }

      await Connection.findByIdAndDelete(connectionId)

      emitToUsers([connection.recipientUserId], 'network:connection:update', {
        type: 'spark_canceled',
        connectionId,
        fromUserId: authUser.userId,
        fromUsername: authUser.username,
        fromName: authUser.name,
        fromImage: authUser.image,
        toUserId: connection.recipientUserId,
        toUsername: connection.recipientUsername,
        toName: connection.recipientName,
        at: new Date().toISOString(),
      })

      return NextResponse.json({
        connectionId,
        state: 'none',
        status: 'canceled',
      })
    }

    if (action === 'remove') {
      if (connection.status !== 'accepted') {
        return NextResponse.json({ error: 'Only active connections can be removed' }, { status: 400 })
      }

      await Connection.findByIdAndUpdate(connectionId, {
        status: 'declined',
        respondedAt: new Date(),
      })

      emitToUsers([connection.requesterUserId, connection.recipientUserId], 'network:connection:update', {
        type: 'connection_removed',
        connectionId,
        fromUserId: authUser.userId,
        fromUsername: authUser.username,
        fromName: authUser.name,
        fromImage: authUser.image,
        toUserId: connection.requesterUserId === authUser.userId
          ? connection.recipientUserId
          : connection.requesterUserId,
        toUsername: connection.requesterUserId === authUser.userId
          ? connection.recipientUsername
          : connection.requesterUsername,
        toName: connection.requesterUserId === authUser.userId
          ? connection.recipientName
          : connection.requesterName,
        at: new Date().toISOString(),
      })

      return NextResponse.json({
        connectionId,
        state: 'none',
        status: 'removed',
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Connection action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
