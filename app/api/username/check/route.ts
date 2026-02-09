import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { isValidUsername, normalizeUsernameInput, USERNAME_VALIDATION_MESSAGE } from '@/lib/username'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const username = normalizeUsernameInput(body?.username)

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    if (!isValidUsername(username)) {
      return NextResponse.json({ 
        available: false, 
        message: USERNAME_VALIDATION_MESSAGE,
        normalizedUsername: username,
      })
    }

    const session = await getServerSession(authOptions)
    if (session?.user?.email) {
      const currentUser = await db.findUser(session.user.email)
      if (currentUser?.username === username) {
        return NextResponse.json({
          available: true,
          normalizedUsername: username,
        })
      }
    }

    const available = await db.isUsernameAvailable(username)
    
    return NextResponse.json({ available, normalizedUsername: username })
  } catch (error) {
    console.error('Username check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
