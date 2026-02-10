import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import { logActivity } from '@/lib/activity'

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

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const username = await getUsernameFromSession(session)
    if (!username) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const profile = await db.findProfile(username)
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ testimonials: profile.testimonials || [] })
  } catch (error) {
    console.error('Error fetching testimonials:', error)
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

    const body = await request.json()
    const { name, role, company, quote, avatarUrl, avatarPublicId, sourceUrl } = body || {}

    if (!name || !quote) {
      return NextResponse.json({ error: 'Name and quote are required' }, { status: 400 })
    }

    const profile = await db.findProfile(username)
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const newTestimonial = {
      id: uuidv4(),
      name: String(name).trim(),
      role: typeof role === 'string' ? role.trim() : '',
      company: typeof company === 'string' ? company.trim() : '',
      quote: String(quote).trim(),
      avatarUrl: typeof avatarUrl === 'string' ? avatarUrl.trim() : '',
      avatarPublicId: typeof avatarPublicId === 'string' ? avatarPublicId.trim() : '',
      sourceUrl: typeof sourceUrl === 'string' ? sourceUrl.trim() : '',
    }

    const updatedTestimonials = [...(profile.testimonials || []), newTestimonial]
    await db.updateProfile(username, { testimonials: updatedTestimonials })

    await logActivity({
      username,
      userId: profile.userId,
      type: 'testimonial_added',
      message: `Added testimonial from ${newTestimonial.name}`,
      metadata: { testimonialId: newTestimonial.id },
    })

    return NextResponse.json({ testimonial: newTestimonial }, { status: 201 })
  } catch (error) {
    console.error('Testimonial creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const username = await getUsernameFromSession(session)
    if (!username) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, role, company, quote, avatarUrl, avatarPublicId, sourceUrl } = body || {}

    if (!id || !name || !quote) {
      return NextResponse.json({ error: 'ID, name and quote are required' }, { status: 400 })
    }

    const profile = await db.findProfile(username)
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const index = profile.testimonials?.findIndex((item) => item.id === id) ?? -1
    if (index < 0) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 })
    }

    const updatedTestimonials = [...(profile.testimonials || [])]
    updatedTestimonials[index] = {
      id,
      name: String(name).trim(),
      role: typeof role === 'string' ? role.trim() : '',
      company: typeof company === 'string' ? company.trim() : '',
      quote: String(quote).trim(),
      avatarUrl: typeof avatarUrl === 'string' ? avatarUrl.trim() : '',
      avatarPublicId: typeof avatarPublicId === 'string' ? avatarPublicId.trim() : '',
      sourceUrl: typeof sourceUrl === 'string' ? sourceUrl.trim() : '',
    }

    await db.updateProfile(username, { testimonials: updatedTestimonials })

    await logActivity({
      username,
      userId: profile.userId,
      type: 'testimonial_updated',
      message: `Updated testimonial from ${updatedTestimonials[index].name}`,
      metadata: { testimonialId: id },
    })

    return NextResponse.json({ testimonial: updatedTestimonials[index] })
  } catch (error) {
    console.error('Testimonial update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const username = await getUsernameFromSession(session)
    if (!username) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const testimonialId = searchParams.get('id')
    if (!testimonialId) {
      return NextResponse.json({ error: 'Testimonial ID is required' }, { status: 400 })
    }

    const profile = await db.findProfile(username)
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const updatedTestimonials = profile.testimonials?.filter((item) => item.id !== testimonialId) || []
    await db.updateProfile(username, { testimonials: updatedTestimonials })

    const deletedTestimonial = profile.testimonials?.find((item) => item.id === testimonialId)
    if (deletedTestimonial) {
      await logActivity({
        username,
        userId: profile.userId,
        type: 'testimonial_deleted',
        message: `Removed testimonial from ${deletedTestimonial.name}`,
        metadata: { testimonialId },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Testimonial deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
