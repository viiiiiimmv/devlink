import type { Server as SocketIOServer } from 'socket.io'

const globalSocketState = globalThis as typeof globalThis & {
  __devlinkIO?: SocketIOServer
}

export const setSocketServer = (io: SocketIOServer) => {
  globalSocketState.__devlinkIO = io
}

export const getSocketServer = (): SocketIOServer | null => {
  return globalSocketState.__devlinkIO ?? null
}

export const emitToUsers = (userIds: string[], eventName: string, payload: unknown) => {
  const io = getSocketServer()
  if (!io) return

  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)))
  for (const userId of uniqueUserIds) {
    io.to(`user:${userId}`).emit(eventName, payload)
  }
}

export const emitToConversation = (conversationId: string, eventName: string, payload: unknown) => {
  const io = getSocketServer()
  if (!io || !conversationId) return

  io.to(`conversation:${conversationId}`).emit(eventName, payload)
}
