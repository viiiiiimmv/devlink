import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import { logActivity } from '@/lib/activity'

// GET - Fetch all certifications for the authenticated user
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
    return NextResponse.json({ certifications: profile.certifications || [] })
  } catch (error) {
    console.error('Error fetching certifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Add a new certification
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
    const { name, issuer, date, credentialId, credentialUrl } = body
    // Validation
    if (!name || !issuer || !date) {
      return NextResponse.json({ 
        error: 'Name, issuer and date are required' 
      }, { status: 400 })
    }
    const profile = await db.findProfile(username)
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
    const newCertification = {
      id: uuidv4(),
      name: name.trim(),
      issuer: issuer.trim(),
      date: date.trim(),
      credentialId: credentialId?.trim() || '',
      credentialUrl: credentialUrl?.trim() || ''
    }
    const updatedCertifications = [...(profile.certifications || []), newCertification]
    await db.updateProfile(username, {
      certifications: updatedCertifications
    })

    await logActivity({
      username,
      userId: profile.userId,
      type: 'certification_added',
      message: `Added certification: ${newCertification.name}`,
      metadata: { certificationId: newCertification.id },
    })
    return NextResponse.json({ certification: newCertification }, { status: 201 })
  } catch (error) {
    console.error('Certification creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update an existing certification
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
    const { id, name, issuer, date, credentialId, credentialUrl } = body
    if (!id || !name || !issuer || !date) {
      return NextResponse.json({ 
        error: 'ID, name, issuer and date are required' 
      }, { status: 400 })
    }
    const profile = await db.findProfile(username)
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
    const certificationIndex = profile.certifications?.findIndex(c => c.id === id)
    if (certificationIndex === -1 || certificationIndex === undefined) {
      return NextResponse.json({ error: 'Certification not found' }, { status: 404 })
    }
    const updatedCertification = {
      id,
      name: name.trim(),
      issuer: issuer.trim(),
      date: date.trim(),
      credentialId: credentialId?.trim() || '',
      credentialUrl: credentialUrl?.trim() || ''
    }
    const updatedCertifications = [...(profile.certifications || [])]
    updatedCertifications[certificationIndex] = updatedCertification
    await db.updateProfile(username, {
      certifications: updatedCertifications
    })

    await logActivity({
      username,
      userId: profile.userId,
      type: 'certification_updated',
      message: `Updated certification: ${updatedCertification.name}`,
      metadata: { certificationId: id },
    })
    return NextResponse.json({ certification: updatedCertification })
  } catch (error) {
    console.error('Certification update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a certification
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
    const certificationId = searchParams.get('id')
    if (!certificationId) {
      return NextResponse.json({ error: 'Certification ID is required' }, { status: 400 })
    }
    const profile = await db.findProfile(username)
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
    const updatedCertifications = profile.certifications?.filter(cert => cert.id !== certificationId) || []
    await db.updateProfile(username, {
      certifications: updatedCertifications
    })

    const deletedCertification = profile.certifications?.find(cert => cert.id === certificationId)
    if (deletedCertification) {
      await logActivity({
        username,
        userId: profile.userId,
        type: 'certification_deleted',
        message: `Removed certification: ${deletedCertification.name}`,
        metadata: { certificationId },
      })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Certification deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
