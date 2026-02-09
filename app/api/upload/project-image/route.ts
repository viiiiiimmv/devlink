import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const normalizeId = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

export async function POST(req: import('next/server').NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('image')

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided or invalid file type' }, { status: 400 })
    }

    const bytes = await (file as Blob).arrayBuffer()
    const buffer = Buffer.from(bytes)
    const safeEmail = normalizeId(session.user.email)
    const publicId = `${safeEmail}_project_${Date.now()}`

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'portfolio/project-images',
          public_id: publicId,
          overwrite: true,
          transformation: [
            { width: 1200, height: 675, crop: 'fill', gravity: 'auto' },
            { quality: 'auto' },
            { format: 'jpg' }
          ]
        },
        (error, uploadResult) => {
          if (error) {
            reject(error)
          } else {
            resolve(uploadResult as any)
          }
        }
      ).end(buffer)
    })

    return NextResponse.json({
      url: result.secure_url,
      public_id: result.public_id,
    })
  } catch (error) {
    console.error('Project image upload error:', error)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}
