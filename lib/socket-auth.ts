import jwt from 'jsonwebtoken'

export type SocketAuthPayload = {
  userId: string
  username: string
  name: string
}

const SOCKET_ISSUER = 'devlink-chat'
const SOCKET_TOKEN_TTL_SECONDS = 60 * 60

const getSocketSecret = () => {
  const secret = process.env.NEXTAUTH_SECRET?.trim()
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is required for socket auth')
  }

  return secret
}

export const createSocketAuthToken = (payload: SocketAuthPayload): string => {
  return jwt.sign(payload, getSocketSecret(), {
    issuer: SOCKET_ISSUER,
    subject: payload.userId,
    expiresIn: SOCKET_TOKEN_TTL_SECONDS,
  })
}

export const verifySocketAuthToken = (token: string): SocketAuthPayload | null => {
  try {
    const decoded = jwt.verify(token, getSocketSecret(), {
      issuer: SOCKET_ISSUER,
    })

    if (typeof decoded !== 'object' || decoded === null) {
      return null
    }

    const userId = typeof decoded.userId === 'string' ? decoded.userId : ''
    const username = typeof decoded.username === 'string' ? decoded.username : ''
    const name = typeof decoded.name === 'string' ? decoded.name : ''

    if (!userId || !username || !name) {
      return null
    }

    return { userId, username, name }
  } catch {
    return null
  }
}
