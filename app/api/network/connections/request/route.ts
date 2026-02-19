import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { getAuthenticatedUser } from '@/lib/auth-user'
import { buildPairKey } from '@/lib/network'
import { emitToUsers } from '@/lib/socket-server'
import { sendSparkAcceptedEmail, sendSparkIncomingEmail } from '@/lib/transactional-email'
import User from '@/models/User'
import Connection from '@/models/Connection'

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

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const targetUserId = typeof body?.targetUserId === 'string' ? body.targetUserId.trim() : ''

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user is required' }, { status: 400 })
    }

    if (targetUserId === authUser.userId) {
      return NextResponse.json({ error: 'You cannot connect with yourself' }, { status: 400 })
    }

    await connectDB()

    const targetUser = await User.findById(targetUserId)
      .select('_id username name image email')
      .lean() as {
      _id: { toString(): string }
      username?: string
      name?: string
      image?: string
      email?: string
    } | null

    if (!targetUser || typeof targetUser.username !== 'string' || !targetUser.username) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const pairKey = buildPairKey(authUser.userId, targetUserId)
    const existingConnection = await Connection.findOne({ pairKey }).lean() as {
      _id: { toString(): string }
      requesterUserId: string
      recipientUserId: string
      status: 'pending' | 'accepted' | 'declined'
    } | null

    if (!existingConnection) {
      const connection = await Connection.create({
        pairKey,
        requesterUserId: authUser.userId,
        requesterUsername: authUser.username,
        requesterName: authUser.name,
        requesterImage: authUser.image,
        recipientUserId: targetUserId,
        recipientUsername: targetUser.username,
        recipientName: targetUser.name,
        recipientImage: targetUser.image,
        status: 'pending',
      })

      emitToUsers([targetUserId], 'network:connection:update', {
        type: 'spark_incoming',
        connectionId: connection._id.toString(),
        fromUserId: authUser.userId,
        fromUsername: authUser.username,
        fromName: authUser.name,
        fromImage: authUser.image,
        toUserId: targetUserId,
        toUsername: targetUser.username,
        toName: targetUser.name,
        at: new Date().toISOString(),
      })

      const sparkIncomingEmailResult = await sendSparkIncomingEmail({
        toEmail: targetUser.email,
        toName: targetUser.name,
        fromName: authUser.name,
        fromUsername: authUser.username,
      }).catch((error) => {
        console.error('Spark incoming email dispatch failed:', error)
        return null
      })
      if (sparkIncomingEmailResult) {
        logMailResult('spark_incoming', sparkIncomingEmailResult)
      }

      return NextResponse.json({
        connectionId: connection._id.toString(),
        state: 'pending_outgoing',
      })
    }

    if (existingConnection.status === 'accepted') {
      return NextResponse.json({
        connectionId: existingConnection._id.toString(),
        state: 'connected',
      })
    }

    if (existingConnection.status === 'pending') {
      if (existingConnection.requesterUserId === authUser.userId) {
        return NextResponse.json({
          connectionId: existingConnection._id.toString(),
          state: 'pending_outgoing',
        })
      }

      const acceptedConnection = await Connection.findByIdAndUpdate(
        existingConnection._id,
        {
          status: 'accepted',
          respondedAt: new Date(),
          requesterImage: targetUser.image,
          recipientImage: authUser.image,
          recipientName: authUser.name,
          recipientUsername: authUser.username,
        },
        { new: true, runValidators: true }
      ).lean() as {
        _id: { toString(): string }
      } | null

      emitToUsers([authUser.userId, targetUserId], 'network:connection:update', {
        type: 'spark_accepted',
        connectionId: acceptedConnection?._id?.toString() || existingConnection._id.toString(),
        fromUserId: authUser.userId,
        fromUsername: authUser.username,
        fromName: authUser.name,
        fromImage: authUser.image,
        toUserId: targetUserId,
        toUsername: targetUser.username,
        toName: targetUser.name,
        at: new Date().toISOString(),
      })

      const sparkAcceptedEmailResult = await sendSparkAcceptedEmail({
        toEmail: targetUser.email,
        toName: targetUser.name,
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
        connectionId: acceptedConnection?._id?.toString() || existingConnection._id.toString(),
        state: 'connected',
      })
    }

    const refreshedConnection = await Connection.findByIdAndUpdate(
      existingConnection._id,
      {
        status: 'pending',
        respondedAt: null,
        requesterUserId: authUser.userId,
        requesterUsername: authUser.username,
        requesterName: authUser.name,
        requesterImage: authUser.image,
        recipientUserId: targetUserId,
        recipientUsername: targetUser.username,
        recipientName: targetUser.name,
        recipientImage: targetUser.image,
      },
      { new: true, runValidators: true }
    ).lean() as {
      _id: { toString(): string }
    } | null

    emitToUsers([targetUserId], 'network:connection:update', {
      type: 'spark_incoming',
      connectionId: refreshedConnection?._id?.toString() || existingConnection._id.toString(),
      fromUserId: authUser.userId,
      fromUsername: authUser.username,
      fromName: authUser.name,
      fromImage: authUser.image,
      toUserId: targetUserId,
      toUsername: targetUser.username,
      toName: targetUser.name,
      at: new Date().toISOString(),
    })

    const sparkIncomingEmailResult = await sendSparkIncomingEmail({
      toEmail: targetUser.email,
      toName: targetUser.name,
      fromName: authUser.name,
      fromUsername: authUser.username,
    }).catch((error) => {
      console.error('Spark incoming email dispatch failed:', error)
      return null
    })
    if (sparkIncomingEmailResult) {
      logMailResult('spark_incoming', sparkIncomingEmailResult)
    }

    return NextResponse.json({
      connectionId: refreshedConnection?._id?.toString() || existingConnection._id.toString(),
      state: 'pending_outgoing',
    })
  } catch (error) {
    console.error('Connection request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
