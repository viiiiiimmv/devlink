import type { Server as HTTPServer } from 'http'
import type { Socket as NetSocket } from 'net'
import type { NextApiRequest, NextApiResponse } from 'next'
import type { Socket } from 'socket.io'
import { Server as SocketIOServer } from 'socket.io'
import connectDB from '@/lib/mongodb'
import Conversation from '@/models/Conversation'
import Message from '@/models/Message'
import { setSocketServer } from '@/lib/socket-server'
import { verifySocketAuthToken, type SocketAuthPayload } from '@/lib/socket-auth'

type NextApiResponseServerIO = NextApiResponse & {
  socket: NetSocket & {
    server: HTTPServer & {
      io?: SocketIOServer
    }
  }
}

type AuthenticatedSocket = Socket & {
  data: {
    user?: SocketAuthPayload
  }
}

type SendMessageAck =
  | {
    ok: true
    message: {
      id: string
      conversationId: string
      senderId: string
      senderUsername: string
      senderName: string
      senderImage?: string
      body: string
      createdAt: string
      isOwnMessage?: boolean
      isRead?: boolean
    }
  }
  | {
    ok: false
    error: string
  }

type ConversationDoc = {
  _id: { toString(): string }
  participantIds?: string[]
}

const toSocketMessage = (message: any) => ({
  id: message._id?.toString() || '',
  conversationId: String(message.conversationId || ''),
  senderId: String(message.senderId || ''),
  senderUsername: String(message.senderUsername || ''),
  senderName: String(message.senderName || ''),
  senderImage: typeof message.senderImage === 'string' ? message.senderImage : undefined,
  body: String(message.body || ''),
  createdAt: new Date(message.createdAt || new Date()).toISOString(),
})

const resolveSocketToken = (socket: AuthenticatedSocket): string => {
  const authToken = socket.handshake.auth?.token
  if (typeof authToken === 'string' && authToken.trim().length > 0) {
    return authToken.trim()
  }

  const headerToken = socket.handshake.headers['x-socket-token']
  if (typeof headerToken === 'string' && headerToken.trim().length > 0) {
    return headerToken.trim()
  }

  return ''
}

export default function handler(_req: NextApiRequest, res: NextApiResponseServerIO) {
  if (!res.socket.server.io) {
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket/io',
      addTrailingSlash: false,
      cors: {
        origin: true,
        credentials: true,
      },
    })

    io.use((socket, next) => {
      const authSocket = socket as AuthenticatedSocket
      const token = resolveSocketToken(authSocket)
      if (!token) {
        return next(new Error('Authentication required'))
      }

      const decoded = verifySocketAuthToken(token)
      if (!decoded) {
        return next(new Error('Invalid authentication token'))
      }

      authSocket.data.user = decoded
      next()
    })

    io.on('connection', (socket) => {
      const authSocket = socket as AuthenticatedSocket
      const authUser = authSocket.data.user

      if (!authUser) {
        authSocket.disconnect(true)
        return
      }

      authSocket.join(`user:${authUser.userId}`)

      authSocket.on('chat:join-conversation', async (conversationId: unknown) => {
        const normalizedConversationId = typeof conversationId === 'string'
          ? conversationId.trim()
          : ''

        if (!normalizedConversationId) {
          return
        }

        try {
          await connectDB()
          const conversation = await Conversation.findById(normalizedConversationId)
            .select('participantIds')
            .lean() as ConversationDoc | null

          const participantIds = conversation?.participantIds

          if (Array.isArray(participantIds) && participantIds.includes(authUser.userId)) {
            authSocket.join(`conversation:${normalizedConversationId}`)
          }
        } catch (error) {
          console.error('Socket join conversation failed:', error)
        }
      })

      authSocket.on('chat:leave-conversation', (conversationId: unknown) => {
        const normalizedConversationId = typeof conversationId === 'string'
          ? conversationId.trim()
          : ''

        if (!normalizedConversationId) {
          return
        }

        authSocket.leave(`conversation:${normalizedConversationId}`)
      })

      authSocket.on('chat:send-message', async (payload: unknown, callback?: (response: SendMessageAck) => void) => {
        const fail = (error: string) => {
          if (typeof callback === 'function') {
            callback({ ok: false, error })
          }
        }

        try {
          const source = typeof payload === 'object' && payload !== null
            ? payload as Record<string, unknown>
            : null

          const conversationId = typeof source?.conversationId === 'string'
            ? source.conversationId.trim()
            : ''
          const body = typeof source?.body === 'string'
            ? source.body.trim()
            : ''

          if (!conversationId) {
            fail('Conversation id is required')
            return
          }

          if (!body) {
            fail('Message cannot be empty')
            return
          }

          if (body.length > 2000) {
            fail('Message cannot exceed 2000 characters')
            return
          }

          await connectDB()

          const conversation = await Conversation.findById(conversationId)
            .select('participantIds')
            .lean() as ConversationDoc | null

          const participantIds = conversation?.participantIds
          if (!conversation || !Array.isArray(participantIds) || !participantIds.includes(authUser.userId)) {
            fail('Conversation not found')
            return
          }

          const message = await Message.create({
            conversationId,
            senderId: authUser.userId,
            senderUsername: authUser.username,
            senderName: authUser.name,
            body,
            readBy: [authUser.userId],
          })

          await Conversation.findByIdAndUpdate(conversationId, {
            lastMessageText: body,
            lastMessageAt: message.createdAt,
            lastMessageSenderId: authUser.userId,
            updatedAt: new Date(),
          })

          const socketMessage = toSocketMessage(message.toObject())
          const conversationEvent = {
            conversationId,
            lastMessageText: body,
            lastMessageAt: new Date(message.createdAt).toISOString(),
            lastMessageSenderId: authUser.userId,
            senderName: authUser.name,
          }

          const uniqueParticipantIds = Array.from(new Set(participantIds.filter(Boolean)))
          for (const participantId of uniqueParticipantIds) {
            io.to(`user:${participantId}`).emit('chat:message', {
              conversationId,
              message: socketMessage,
            })
            io.to(`user:${participantId}`).emit('chat:conversation:update', conversationEvent)
          }

          if (typeof callback === 'function') {
            callback({
              ok: true,
              message: {
                ...socketMessage,
                isOwnMessage: true,
                isRead: true,
              },
            })
          }
        } catch (error) {
          console.error('Socket send message failed:', error)
          fail('Failed to send message')
        }
      })
    })

    res.socket.server.io = io
    setSocketServer(io)
  }

  res.status(200).json({ ok: true })
}

export const config = {
  api: {
    bodyParser: false,
  },
}
