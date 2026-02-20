import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/lib/activity'

const normalizeText = (value: unknown, maxLength: number): string => {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLength)
}

const normalizeUrl = (value: unknown): string => normalizeText(value, 400)

const normalizeTechnologies = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  const normalized = value
    .map((item) => normalizeText(item, 40))
    .filter(Boolean)

  return Array.from(new Set(normalized)).slice(0, 25)
}

const normalizeGallery = (value: unknown): Array<{
  id: string
  url: string
  caption?: string
  publicId?: string
}> => {
  if (!Array.isArray(value)) return []

  const normalized: Array<{
    id: string
    url: string
    caption?: string
    publicId?: string
  }> = []

  for (const item of value) {
    const source = typeof item === 'object' && item !== null ? item as Record<string, unknown> : {}
    const url = normalizeUrl(source.url)
    if (!url) continue

    const caption = normalizeText(source.caption, 180)
    const publicId = normalizeText(source.publicId, 240)

    normalized.push({
      id: normalizeText(source.id, 120) || uuidv4(),
      url,
      caption: caption || undefined,
      publicId: publicId || undefined,
    })

    if (normalized.length >= 12) break
  }

  return normalized
}

const normalizeMetrics = (value: unknown): Array<{
  id: string
  label: string
  value: string
  detail?: string
}> => {
  if (!Array.isArray(value)) return []

  const normalized: Array<{
    id: string
    label: string
    value: string
    detail?: string
  }> = []

  for (const item of value) {
    const source = typeof item === 'object' && item !== null ? item as Record<string, unknown> : {}
    const label = normalizeText(source.label, 80)
    const metricValue = normalizeText(source.value, 80)
    if (!label || !metricValue) continue

    const detail = normalizeText(source.detail, 180)

    normalized.push({
      id: normalizeText(source.id, 120) || uuidv4(),
      label,
      value: metricValue,
      detail: detail || undefined,
    })

    if (normalized.length >= 12) break
  }

  return normalized
}

// GET - Fetch all projects for the authenticated user
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

    return NextResponse.json({ projects: profile.projects || [] })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const {
      title,
      description,
      caseStudy,
      technologies,
      githubUrl,
      liveUrl,
      image,
      imagePublicId,
      gallery,
      metrics,
      featured,
    } = body

    // Validation
    const normalizedTitle = normalizeText(title, 140)
    const normalizedDescription = normalizeText(description, 1200)
    if (!normalizedTitle || !normalizedDescription) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    const profile = await db.findProfile(username)
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const newProject = {
      id: uuidv4(),
      title: normalizedTitle,
      description: normalizedDescription,
      caseStudy: normalizeText(caseStudy, 12000),
      technologies: normalizeTechnologies(technologies),
      githubUrl: normalizeUrl(githubUrl),
      liveUrl: normalizeUrl(liveUrl),
      image: normalizeUrl(image),
      imagePublicId: normalizeText(imagePublicId, 240),
      gallery: normalizeGallery(gallery),
      metrics: normalizeMetrics(metrics),
      featured: Boolean(featured),
    }

    const updatedProjects = [...(profile.projects || []), newProject]
    await db.updateProfile(username, {
      projects: updatedProjects
    })

    // Revalidate the profile page to ensure fresh data is shown
    revalidatePath(`/${username}`)
    revalidatePath(`/${username}/projects/${newProject.id}`)

    await logActivity({
      username,
      userId: profile.userId,
      type: 'project_added',
      message: `Added project: ${newProject.title}`,
      metadata: { projectId: newProject.id },
    })

    return NextResponse.json({ project: newProject }, { status: 201 })
  } catch (error) {
    console.error('Project creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    const { id, ...updates } = await request.json()
    const profile = await db.findProfile(username)
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const projectId = normalizeText(id, 120)
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const normalizedUpdates: Record<string, unknown> = {}

    if (Object.prototype.hasOwnProperty.call(updates, 'title')) {
      const value = normalizeText(updates.title, 140)
      if (!value) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 })
      }
      normalizedUpdates.title = value
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'description')) {
      const value = normalizeText(updates.description, 1200)
      if (!value) {
        return NextResponse.json({ error: 'Description is required' }, { status: 400 })
      }
      normalizedUpdates.description = value
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'caseStudy')) {
      normalizedUpdates.caseStudy = normalizeText(updates.caseStudy, 12000)
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'technologies')) {
      normalizedUpdates.technologies = normalizeTechnologies(updates.technologies)
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'githubUrl')) {
      normalizedUpdates.githubUrl = normalizeUrl(updates.githubUrl)
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'liveUrl')) {
      normalizedUpdates.liveUrl = normalizeUrl(updates.liveUrl)
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'image')) {
      normalizedUpdates.image = normalizeUrl(updates.image)
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'imagePublicId')) {
      normalizedUpdates.imagePublicId = normalizeText(updates.imagePublicId, 240)
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'gallery')) {
      normalizedUpdates.gallery = normalizeGallery(updates.gallery)
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'metrics')) {
      normalizedUpdates.metrics = normalizeMetrics(updates.metrics)
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'featured')) {
      normalizedUpdates.featured = Boolean(updates.featured)
    }

    const updatedProjects = profile.projects.map(project =>
      project.id === projectId ? { ...project, ...normalizedUpdates } : project
    )

    const updatedProfile = await db.updateProfile(username, {
      projects: updatedProjects
    })

    // Revalidate the profile page to ensure fresh data is shown
    revalidatePath(`/${username}`)
    revalidatePath(`/${username}/projects/${projectId}`)

    const updatedProject = updatedProjects.find(project => project.id === projectId)
    if (updatedProject) {
      await logActivity({
        username,
        userId: profile.userId,
        type: 'project_updated',
        message: `Updated project: ${updatedProject.title}`,
        metadata: { projectId },
      })
    }

    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error('Project update error:', error)
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
    const projectId = searchParams.get('id')
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const profile = await db.findProfile(username)
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const updatedProjects = profile.projects.filter(project => project.id !== projectId)
    const updatedProfile = await db.updateProfile(username, {
      projects: updatedProjects
    })

    // Revalidate the profile page to ensure fresh data is shown
    revalidatePath(`/${username}`)
    revalidatePath(`/${username}/projects/${projectId}`)

    const deletedProject = profile.projects.find(project => project.id === projectId)
    if (deletedProject) {
      await logActivity({
        username,
        userId: profile.userId,
        type: 'project_deleted',
        message: `Removed project: ${deletedProject.title}`,
        metadata: { projectId },
      })
    }

    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error('Project deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
