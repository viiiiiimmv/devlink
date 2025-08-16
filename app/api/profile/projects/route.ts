import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import { revalidatePath } from 'next/cache'

// GET - Fetch all projects for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.username) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const profile = await db.findProfile(session.user.username)
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ projects: profile.projects || [] })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.username) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, technologies, githubUrl, liveUrl, image, featured } = body

    // Validation
    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    const profile = await db.findProfile(session.user.username)
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const newProject = {
      id: uuidv4(),
      title: title.trim(),
      description: description.trim(),
      technologies: technologies || [],
      githubUrl: githubUrl?.trim() || '',
      liveUrl: liveUrl?.trim() || '',
      image: image?.trim() || '',
      featured: featured || false
    }

    const updatedProjects = [...(profile.projects || []), newProject]
    await db.updateProfile(session.user.username, {
      projects: updatedProjects
    })

    // Revalidate the profile page to ensure fresh data is shown
    revalidatePath(`/${session.user.username}`)

    return NextResponse.json({ project: newProject }, { status: 201 })
  } catch (error) {
    console.error('Project creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.username) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id, ...updates } = await request.json()
    const profile = await db.findProfile(session.user.username)
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const updatedProjects = profile.projects.map(project =>
      project.id === id ? { ...project, ...updates } : project
    )

    const updatedProfile = await db.updateProfile(session.user.username, {
      projects: updatedProjects
    })

    // Revalidate the profile page to ensure fresh data is shown
    revalidatePath(`/${session.user.username}`)

    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error('Project update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.username) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('id')
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const profile = await db.findProfile(session.user.username)
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const updatedProjects = profile.projects.filter(project => project.id !== projectId)
    const updatedProfile = await db.updateProfile(session.user.username, {
      projects: updatedProjects
    })

    // Revalidate the profile page to ensure fresh data is shown
    revalidatePath(`/${session.user.username}`)

    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error('Project deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}