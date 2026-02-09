import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { absoluteUrl } from '@/lib/seo'
import { generateResumePdf } from '@/lib/resume-pdf'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    let username: string | undefined
    if ('username' in session.user && typeof session.user.username === 'string') {
      username = session.user.username
    } else if ('email' in session.user && typeof session.user.email === 'string') {
      const dbUser = await db.findUser(session.user.email)
      if (dbUser?.username) username = dbUser.username
    }

    if (!username) {
      return NextResponse.json({ error: 'Profile is not set up yet' }, { status: 400 })
    }

    const profile = await db.findProfile(username)
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const profileUrl = absoluteUrl(`/${profile.username}`)
    const pdfBuffer = generateResumePdf(
      {
        username: profile.username,
        name: profile.name,
        bio: profile.bio,
        skills: profile.skills,
        socialLinks: profile.socialLinks,
        projects: profile.projects,
        experiences: profile.experiences,
        certifications: profile.certifications,
        researches: profile.researches,
      },
      profileUrl
    )

    const fileName = `${profile.username}-resume.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Resume export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
