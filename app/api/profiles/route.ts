import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = (searchParams.get('q') || '').trim()

    const limitParam = Number(searchParams.get('limit') || '10')
    const skipParam = Number(searchParams.get('skip') || '0')
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(Math.floor(limitParam), 1), 50)
      : 10
    const skip = Number.isFinite(skipParam)
      ? Math.max(Math.floor(skipParam), 0)
      : 0

    let profiles
    if (query) {
      profiles = await db.searchProfiles(query, limit, skip)
    } else {
      profiles = await db.getAllProfiles(limit, skip)
    }

    return NextResponse.json(profiles)
  } catch (error) {
    console.error('Profiles fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
