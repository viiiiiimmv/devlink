import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// GET - Fetch all blogs for the authenticated user
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

    return NextResponse.json({ blogs: profile.blogs || [] })
  } catch (error) {
    console.error('Error fetching blogs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Add a new blog post
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

    const newBlog = {
      id: uuidv4(),
      title: title.trim(),
      description: description.trim(),
      url: url.trim(),
      publishedAt: publishedAt
    }

    const updatedBlogs = [...(profile.blogs || []), newBlog]
  await db.updateProfile(username, {
      blogs: updatedBlogs
    })

    return NextResponse.json({ blog: newBlog }, { status: 201 })
  } catch (error) {
    console.error('Blog creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update an existing blog post
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

    const blogIndex = profile.blogs?.findIndex(b => b.id === id)
    if (blogIndex === -1 || blogIndex === undefined) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 })
    }

    const updatedBlog = {
      id,
      title: title.trim(),
      description: description.trim(),
      url: url.trim(),
      publishedAt
    }

    const updatedBlogs = [...(profile.blogs || [])]
    updatedBlogs[blogIndex] = updatedBlog

  await db.updateProfile(username, {
      blogs: updatedBlogs
    })

    return NextResponse.json({ blog: updatedBlog })
  } catch (error) {
    console.error('Blog update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a blog post
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.username) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const blogId = searchParams.get('id')
    
    if (!blogId) {
      return NextResponse.json({ error: 'Blog ID is required' }, { status: 400 })
    }

    const profile = await db.findProfile(session.user.username)
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const updatedBlogs = profile.blogs?.filter(blog => blog.id !== blogId) || []
    await db.updateProfile(session.user.username, {
      blogs: updatedBlogs
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Blog deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
