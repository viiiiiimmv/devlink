import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = parseInt(searchParams.get('skip') || '0')

    let profiles
    if (query) {
      profiles = await db.searchProfiles(query, limit)
    } else {
      profiles = await db.getAllProfiles(limit, skip)
    }

    return NextResponse.json(profiles)
  } catch (error) {
    console.error('Profiles fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}