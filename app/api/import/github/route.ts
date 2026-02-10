import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

type GitHubRepoPayload = {
  name: string
  description?: string
  htmlUrl?: string
  homepage?: string
  topics?: string[]
  language?: string
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')
    if (!username) {
      return NextResponse.json({ error: 'GitHub username is required' }, { status: 400 })
    }

    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'devlink-importer',
          ...(process.env.GITHUB_TOKEN
            ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
            : {}),
        },
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      const rateLimitRemaining = response.headers.get('x-ratelimit-remaining')
      const rateLimitReset = response.headers.get('x-ratelimit-reset')
      const rateLimitMessage = rateLimitRemaining === '0'
        ? 'GitHub rate limit reached. Try again later.'
        : ''
      const detail = errorBody ? errorBody.slice(0, 400) : ''
      return NextResponse.json({
        error: 'Failed to fetch GitHub repositories',
        detail,
        rateLimitRemaining,
        rateLimitReset,
        message: rateLimitMessage,
      }, { status: response.status })
    }

    const repos = await response.json()
    const normalized = Array.isArray(repos)
      ? repos.map((repo) => ({
          id: repo.id,
          name: repo.name,
          description: repo.description || '',
          htmlUrl: repo.html_url,
          homepage: repo.homepage || '',
          topics: Array.isArray(repo.topics) ? repo.topics : [],
          language: repo.language || '',
          stargazersCount: repo.stargazers_count || 0,
          updatedAt: repo.updated_at || '',
          fork: Boolean(repo.fork),
        }))
      : []

    return NextResponse.json({ repos: normalized })
  } catch (error) {
    console.error('GitHub import fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const username = await getUsernameFromSession(session)
    if (!username) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const repos: GitHubRepoPayload[] = Array.isArray(body?.repos) ? body.repos : []
    if (repos.length === 0) {
      return NextResponse.json({ error: 'No repositories selected' }, { status: 400 })
    }

    const profile = await db.findProfile(username)
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const existingProjects = profile.projects || []
    const existingGithubUrls = new Set(
      existingProjects
        .map((project) => (project.githubUrl || '').trim().toLowerCase())
        .filter(Boolean)
    )
    const existingTitles = new Set(
      existingProjects.map((project) => project.title.trim().toLowerCase()).filter(Boolean)
    )

    const newProjects = repos
      .filter((repo) => {
        const title = typeof repo.name === 'string' ? repo.name.trim() : ''
        const githubUrl = typeof repo.htmlUrl === 'string' ? repo.htmlUrl.trim() : ''
        if (!title) return false
        if (githubUrl && existingGithubUrls.has(githubUrl.toLowerCase())) return false
        if (existingTitles.has(title.toLowerCase())) return false
        return true
      })
      .map((repo) => {
        const topics = Array.isArray(repo.topics) ? repo.topics.filter(Boolean) : []
        const technologies = topics.length > 0
          ? topics
          : repo.language
            ? [repo.language]
            : []

        return {
          id: uuidv4(),
          title: repo.name.trim(),
          description: repo.description?.trim() || 'Open-source project from GitHub.',
          technologies,
          githubUrl: repo.htmlUrl?.trim() || '',
          liveUrl: repo.homepage?.trim() || '',
          image: '',
          imagePublicId: '',
          featured: false,
        }
      })

    if (newProjects.length === 0) {
      return NextResponse.json({ message: 'No new repositories to import', imported: 0 })
    }

    const updatedProjects = [...newProjects, ...existingProjects]
    await db.updateProfile(username, { projects: updatedProjects })

    return NextResponse.json({
      success: true,
      imported: newProjects.length,
      skipped: repos.length - newProjects.length,
    })
  } catch (error) {
    console.error('GitHub import apply error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
