import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    // Validate username format
    if (!/^[a-z0-9-]{3,20}$/.test(username)) {
      return NextResponse.json({ 
        available: false, 
        message: 'Username must be 3-20 characters long and contain only lowercase letters, numbers, and hyphens' 
      })
    }

    const available = await db.isUsernameAvailable(username)
    
    return NextResponse.json({ available })
  } catch (error) {
    console.error('Username check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}