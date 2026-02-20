'use client'

import { io, type Socket } from 'socket.io-client'

type ServerToClientEvents = {
  'chat:message': (payload: {
    conversationId: string
    message: {
      id: string
      conversationId: string
      senderId: string
      senderUsername: string
      senderName: string
      senderImage?: string
      body: string
      createdAt: string
    }
  }) => void
  'chat:conversation:update': (payload: {
    conversationId: string
    lastMessageText: string
    lastMessageAt: string
    lastMessageSenderId: string
    senderName: string
  }) => void
  'chat:read': (payload: {
    conversationId: string
    userId: string
    readCount: number
  }) => void
  'network:connection:update': (payload: {
    type: 'spark_incoming' | 'spark_accepted' | 'spark_declined' | 'spark_canceled' | 'connection_removed'
    connectionId: string
    fromUserId: string
    fromUsername: string
    fromName: string
    fromImage?: string
    toUserId: string
    toUsername?: string
    toName?: string
    at: string
  }) => void
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

type ClientToServerEvents = {
  'chat:join-conversation': (conversationId: string) => void
  'chat:leave-conversation': (conversationId: string) => void
  'chat:send-message': (
    payload: {
      conversationId: string
      body: string
    },
    callback: (response: SendMessageAck) => void
  ) => void
}

type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>

let socket: ChatSocket | null = null
let connectingPromise: Promise<ChatSocket> | null = null

export const getChatSocket = (): ChatSocket | null => socket

export const connectChatSocket = async (): Promise<ChatSocket> => {
  if (socket && socket.connected) {
    return socket
  }

  if (connectingPromise) {
    return connectingPromise
  }

  connectingPromise = (async () => {
    try {
      await fetch('/api/socket', { method: 'GET', cache: 'no-store' })
    } catch (error) {
      // Do not fail here; some deployments may not keep a warm socket bootstrap endpoint.
      console.warn('Socket bootstrap endpoint failed:', error)
    }

    const tokenResponse = await fetch('/api/chat/socket-token', {
      method: 'GET',
      cache: 'no-store',
    })

    if (!tokenResponse.ok) {
      throw new Error('Unable to initialize realtime chat')
    }

    const tokenData = await tokenResponse.json()
    const token = typeof tokenData?.token === 'string' ? tokenData.token : ''

    if (!token) {
      throw new Error('Missing socket token')
    }

    if (socket) {
      socket.disconnect()
      socket = null
    }

    socket = io({
      path: '/api/socket/io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 500,
      reconnectionDelayMax: 4000,
      auth: {
        token,
      },
    }) as ChatSocket

    await new Promise<void>((resolve, reject) => {
      let latestError: Error | null = null

      const handleConnect = () => {
        cleanup()
        resolve()
      }

      const handleConnectError = (error: Error) => {
        latestError = error
      }

      const cleanup = () => {
        window.clearTimeout(timeout)
        socket?.off('connect', handleConnect)
        socket?.off('connect_error', handleConnectError)
      }

      const timeout = window.setTimeout(() => {
        cleanup()
        reject(latestError || new Error('Socket connection timeout'))
      }, 12000)

      socket?.on('connect', handleConnect)
      socket?.on('connect_error', handleConnectError)
    })

    return socket
  })()

  try {
    return await connectingPromise
  } catch (error) {
    if (socket) {
      socket.disconnect()
      socket = null
    }
    throw error
  } finally {
    connectingPromise = null
  }
}

export const disconnectChatSocket = () => {
  if (!socket) return
  socket.disconnect()
  socket = null
}
