import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: import('next/server').NextRequest) {
  try {
    // Check if user is authenticated and has email
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Ensure we have user's email for the upload
    const userEmail = session.user.email;

    const formData = await req.formData();
    const file = formData.get('photo');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided or invalid file type' }, { status: 400 });
    }

    // Convert file to buffer (file is a Blob)
    const bytes = await (file as Blob).arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'portfolio/profile-photos',
                public_id: `${userEmail}_profile_photo`,
          overwrite: true,
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto' },
            { format: 'jpg' }
          ]
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result as any); // Cloudinary types do not export UploadApiResponse
          }
        }
      ).end(buffer);
    });

    return NextResponse.json({
      url: result.secure_url,
      public_id: result.public_id,
    });

  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: import('next/server').NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get('public_id');

    if (!publicId) {
      return NextResponse.json({ error: 'No public_id provided' }, { status: 400 });
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      return NextResponse.json({ message: 'Photo deleted successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
    }

  } catch (error) {
    console.error('Photo delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}
