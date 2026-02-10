import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

type ImportProject = {
  title: string
  description: string
  technologies?: string[]
  githubUrl?: string
  liveUrl?: string
}

type ImportExperience = {
  company: string
  position: string
  startDate: string
  endDate?: string
  isCurrentlyWorking?: boolean
  description: string
  technologies?: string[]
  linkedinPostUrl?: string
}

type ImportPayload = {
  name?: string
  bio?: string
  skills?: string[]
  projects?: ImportProject[]
  experiences?: ImportExperience[]
  socialLinks?: {
    github?: string
    linkedin?: string
    twitter?: string
    website?: string
  }
  overwrite?: {
    name?: boolean
    bio?: boolean
    skills?: boolean
    projects?: boolean
    experiences?: boolean
    socialLinks?: boolean
  }
}

const getUsernameFromSession = async (session: any): Promise<string | undefined> => {
  if (session && session.user) {
    if ('username' in session.user && typeof session.user.username === 'string') {
      return session.user.username
    }
    if ('email' in session.user && typeof session.user.email === 'string') {
      const dbUser = await db.findUser(session.user.email)
      if (dbUser?.username) return dbUser.username
    }
  }
  return undefined
}

const normalizeString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const username = await getUsernameFromSession(session)
    if (!username) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const payload: ImportPayload = typeof body === 'object' && body !== null ? body : {}
    const overwrite = payload.overwrite || {}

    const profile = await db.findProfile(username)
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const updates: Record<string, unknown> = {}

    const incomingName = normalizeString(payload.name)
    if (incomingName && (overwrite.name || !normalizeString(profile.name))) {
      updates.name = incomingName
    }

    const incomingBio = normalizeString(payload.bio)
    if (incomingBio && (overwrite.bio || !normalizeString(profile.bio))) {
      updates.bio = incomingBio
    }

    if (Array.isArray(payload.skills)) {
      const incomingSkills = payload.skills.map(normalizeString).filter(Boolean)
      if (overwrite.skills) {
        updates.skills = incomingSkills
      } else if (incomingSkills.length > 0) {
        const existingSkills = Array.isArray(profile.skills) ? profile.skills : []
        const skillSet = new Set(existingSkills.map((skill) => skill.trim().toLowerCase()))
        for (const skill of incomingSkills) {
          const key = skill.toLowerCase()
          if (!skillSet.has(key)) {
            existingSkills.push(skill)
            skillSet.add(key)
          }
        }
        updates.skills = existingSkills
      }
    }

    if (Array.isArray(payload.projects)) {
      const incomingProjects = payload.projects
        .map((project) => ({
          title: normalizeString(project.title),
          description: normalizeString(project.description),
          technologies: Array.isArray(project.technologies)
            ? project.technologies.map(normalizeString).filter(Boolean)
            : [],
          githubUrl: normalizeString(project.githubUrl),
          liveUrl: normalizeString(project.liveUrl),
        }))
        .filter((project) => project.title && project.description)

      if (overwrite.projects) {
        updates.projects = incomingProjects.map((project) => ({
          id: uuidv4(),
          ...project,
          image: '',
          imagePublicId: '',
          featured: false,
        }))
      } else if (incomingProjects.length > 0) {
        const existingProjects = profile.projects || []
        const existingTitles = new Set(existingProjects.map((project) => project.title.trim().toLowerCase()))
        const newProjects = incomingProjects
          .filter((project) => !existingTitles.has(project.title.toLowerCase()))
          .map((project) => ({
            id: uuidv4(),
            ...project,
            image: '',
            imagePublicId: '',
            featured: false,
          }))
        updates.projects = [...newProjects, ...existingProjects]
      }
    }

    if (Array.isArray(payload.experiences)) {
      const incomingExperiences = payload.experiences
        .map((experience) => ({
          company: normalizeString(experience.company),
          position: normalizeString(experience.position),
          startDate: normalizeString(experience.startDate),
          endDate: normalizeString(experience.endDate),
          isCurrentlyWorking: Boolean(experience.isCurrentlyWorking),
          description: normalizeString(experience.description),
          technologies: Array.isArray(experience.technologies)
            ? experience.technologies.map(normalizeString).filter(Boolean)
            : [],
          linkedinPostUrl: normalizeString(experience.linkedinPostUrl),
        }))
        .filter((experience) => experience.company && experience.position && experience.startDate && experience.description)

      if (overwrite.experiences) {
        updates.experiences = incomingExperiences.map((experience) => ({
          id: uuidv4(),
          ...experience,
          endDate: experience.isCurrentlyWorking ? null : experience.endDate || '',
        }))
      } else if (incomingExperiences.length > 0) {
        const existingExperiences = profile.experiences || []
        const existingKeys = new Set(
          existingExperiences.map((experience) =>
            `${experience.company}`.trim().toLowerCase() +
            `|${experience.position}`.trim().toLowerCase() +
            `|${experience.startDate}`.trim().toLowerCase()
          )
        )
        const newExperiences = incomingExperiences
          .filter((experience) => {
            const key = `${experience.company}`.trim().toLowerCase() +
              `|${experience.position}`.trim().toLowerCase() +
              `|${experience.startDate}`.trim().toLowerCase()
            if (existingKeys.has(key)) return false
            existingKeys.add(key)
            return true
          })
          .map((experience) => ({
            id: uuidv4(),
            ...experience,
            endDate: experience.isCurrentlyWorking ? null : experience.endDate || '',
          }))
        updates.experiences = [...newExperiences, ...existingExperiences]
      }
    }

    if (payload.socialLinks && typeof payload.socialLinks === 'object') {
      const incoming = {
        github: normalizeString(payload.socialLinks.github),
        linkedin: normalizeString(payload.socialLinks.linkedin),
        twitter: normalizeString(payload.socialLinks.twitter),
        website: normalizeString(payload.socialLinks.website),
      }
      const hasAny = Object.values(incoming).some((value) => value.length > 0)
      if (hasAny) {
        updates.socialLinks = overwrite.socialLinks
          ? incoming
          : { ...(profile.socialLinks || {}), ...incoming }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: 'No data to import' })
    }

    await db.updateProfile(username, updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Import apply error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
