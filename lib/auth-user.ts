import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export type AuthenticatedUser = {
  userId: string
  email: string
  username: string
  name: string
  image?: string
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const session = await getServerSession(authOptions)
  const email = typeof session?.user?.email === 'string' ? session.user.email.trim().toLowerCase() : ''

  if (!email) {
    return null
  }

  const dbUser = await db.findUser(email)
  if (!dbUser || !dbUser.username) {
    return null
  }

  return {
    userId: dbUser._id,
    email: dbUser.email,
    username: dbUser.username,
    name: dbUser.name,
    image: typeof dbUser.image === 'string' ? dbUser.image : undefined,
  }
}
