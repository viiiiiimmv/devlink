import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-user'
import { createSocketAuthToken } from '@/lib/socket-auth'

export async function GET() {
  try {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const token = createSocketAuthToken({
      userId: authUser.userId,
      username: authUser.username,
      name: authUser.name,
    })

    return NextResponse.json({ token })
  } catch (error) {
    console.error('Socket token error:', error)
    return NextResponse.json({ error: 'Failed to create socket token' }, { status: 500 })
  }
}
