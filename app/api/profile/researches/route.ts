import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    let username = (session?.user && 'username' in session.user) ? (session.user as any).username : undefined;
    // If username is not present, try to fetch profile by email
    if (!username && session?.user?.email) {
      const userProfile = await db.findProfileByUserId(session.user.email)
      username = userProfile?.username
    }
    if (!username) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const profile = await db.findProfile(username)
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ researches: profile.researches || [] })
  } catch (error) {
    console.error('Error fetching research papers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    

    let username = (session?.user && 'username' in session.user) ? (session.user as any).username : undefined;
    // If username is not present, try to fetch profile by email
    if (!username && session?.user?.email) {
      const userProfile = await db.findProfileByUserId(session.user.email)
      username = userProfile?.username
    }
    if (!username) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, url, publishedAt } = body

    // Validation
    if (!title || !description || !url || !publishedAt) {
      return NextResponse.json({ 
        error: 'Title, description, URL and published date are required' 
      }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

  const profile = await db.findProfile(username)
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const newResearch = {
      id: uuidv4(),
      title: title.trim(),
      description: description.trim(),
      url: url.trim(),
      publishedAt: publishedAt
    }

    const updatedResearches = [...(profile.researches || []), newResearch]
  await db.updateProfile(username, {
      researches: updatedResearches
    })

    return NextResponse.json({ research: newResearch }, { status: 201 })
  } catch (error) {
    console.error('Research paper creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    

    let username = (session?.user && 'username' in session.user) ? (session.user as any).username : undefined;
    // If username is not present, try to fetch profile by email
    if (!username && session?.user?.email) {
      const userProfile = await db.findProfileByUserId(session.user.email)
      username = userProfile?.username
    }
    if (!username) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { id, title, description, url, publishedAt } = body

    if (!id || !title || !description || !url || !publishedAt) {
      return NextResponse.json({ 
        error: 'ID, title, description, URL and published date are required' 
      }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

  const profile = await db.findProfile(username)
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const researchIndex = profile.researches?.findIndex(b => b.id === id)
    if (researchIndex === -1 || researchIndex === undefined) {
      return NextResponse.json({ error: 'Research paper not found' }, { status: 404 })
    }

    const updatedResearch = {
      id,
      title: title.trim(),
      description: description.trim(),
      url: url.trim(),
      publishedAt
    }

    const updatedResearches = [...(profile.researches || [])]
    updatedResearches[researchIndex] = updatedResearch

  await db.updateProfile(username, {
      researches: updatedResearches
    })

    return NextResponse.json({ research: updatedResearch })
  } catch (error) {
    console.error('Research paper update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    let username: string | undefined = undefined;
    if (session && session.user) {
      if ('username' in session.user && typeof session.user.username === 'string') {
        username = session.user.username;
      } else if ('email' in session.user && typeof session.user.email === 'string') {
        const dbUser = await db.findUser(session.user.email);
        if (dbUser?.username) username = dbUser.username;
      }
    }
    if (!username) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const researchID = searchParams.get('id')
    
    if (!researchID) {
      return NextResponse.json({ error: 'Research Paper ID is required' }, { status: 400 })
    }

    const profile = await db.findProfile(username)
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const updatedResearches = profile.researches?.filter(research => research.id !== researchID) || []
    await db.updateProfile(username, {
      researches: updatedResearches
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Research paper deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
