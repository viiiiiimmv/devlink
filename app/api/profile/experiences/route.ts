import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// GET - Fetch all experiences for the authenticated user
export async function GET(request: NextRequest) {
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
    const profile = await db.findProfile(username)
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ experiences: profile.experiences || [] })
  } catch (error) {
    console.error('Error fetching experiences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Add a new experience
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { company, position, startDate, endDate, isCurrentlyWorking, description, technologies, linkedinPostUrl } = body

    // Validation
    if (!company || !position || !startDate || !description) {
      return NextResponse.json({ 
        error: 'Company, position, start date and description are required' 
      }, { status: 400 })
    }

    // Validate that end date is provided if not currently working
    if (!isCurrentlyWorking && !endDate) {
      return NextResponse.json({ 
        error: 'End date is required if not currently working' 
      }, { status: 400 })
    }

    const profile = await db.findProfile(username)
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const newExperience = {
      id: uuidv4(),
      company: company.trim(),
      position: position.trim(),
      startDate: startDate.trim(),
      endDate: isCurrentlyWorking ? null : endDate?.trim(),
      isCurrentlyWorking: isCurrentlyWorking || false,
      description: description.trim(),
      technologies: technologies || [],
      linkedinPostUrl: linkedinPostUrl?.trim() || ''
    }

    const updatedExperiences = [...(profile.experiences || []), newExperience]
    await db.updateProfile(username, {
      experiences: updatedExperiences
    })

    return NextResponse.json({ experience: newExperience }, { status: 201 })
  } catch (error) {
    console.error('Experience creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update an existing experience
export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { id, company, position, startDate, endDate, isCurrentlyWorking, description, technologies, linkedinPostUrl } = body

    if (!id || !company || !position || !startDate || !description) {
      return NextResponse.json({ 
        error: 'ID, company, position, start date and description are required' 
      }, { status: 400 })
    }

    // Validate that end date is provided if not currently working
    if (!isCurrentlyWorking && !endDate) {
      return NextResponse.json({ 
        error: 'End date is required if not currently working' 
      }, { status: 400 })
    }

    const profile = await db.findProfile(username)
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const experienceIndex = profile.experiences?.findIndex(e => e.id === id)
    if (experienceIndex === -1 || experienceIndex === undefined) {
      return NextResponse.json({ error: 'Experience not found' }, { status: 404 })
    }

    const updatedExperience = {
      id,
      company: company.trim(),
      position: position.trim(),
      startDate: startDate.trim(),
      endDate: isCurrentlyWorking ? null : endDate?.trim(),
      isCurrentlyWorking: isCurrentlyWorking || false,
      description: description.trim(),
      technologies: technologies || [],
      linkedinPostUrl: linkedinPostUrl?.trim() || ''
    }

    const updatedExperiences = [...(profile.experiences || [])]
    updatedExperiences[experienceIndex] = updatedExperience

    await db.updateProfile(username, {
      experiences: updatedExperiences
    })

    return NextResponse.json({ experience: updatedExperience })
  } catch (error) {
    console.error('Experience update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete an experience
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
    const experienceId = searchParams.get('id')
    
    if (!experienceId) {
      return NextResponse.json({ error: 'Experience ID is required' }, { status: 400 })
    }

    const profile = await db.findProfile(username)
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const updatedExperiences = profile.experiences?.filter(experience => experience.id !== experienceId) || []
    await db.updateProfile(username, {
      experiences: updatedExperiences
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Experience deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
