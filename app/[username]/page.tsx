import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { db } from '@/lib/db'
import PublicProfile from '@/components/public-profile/profile'

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({ params }: { params: any }) {
  const { username } = await params
  const profile = await db.findProfile(username)
  
  if (!profile) {
    return {
      title: 'Profile not found',
    }
  }

  return {
    title: `${profile.name} - Developer Portfolio`,
    description: profile.bio || `Check out ${profile.name}'s developer portfolio showcasing projects, skills, and experience.`,
    keywords: ['developer', 'portfolio', 'projects', ...profile.skills],
    openGraph: {
      title: `${profile.name} - Developer Portfolio`,
      description: profile.bio || `Check out ${profile.name}'s developer portfolio`,
      type: 'profile',
      username: profile.username,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${profile.name} - Developer Portfolio`,
      description: profile.bio || `Check out ${profile.name}'s developer portfolio`,
    },
  }
}

export default async function ProfilePage({ params }: { params: any }) {
  const { username } = await params
  const profile = await db.findProfile(username)

  if (!profile) {
    notFound()
  }

  // Fix experiences endDate type
  const fixedProfile = {
    ...profile,
    experiences: profile.experiences?.map((exp: any) => ({
      ...exp,
      endDate: exp.endDate === null ? undefined : exp.endDate,
    })) ?? [],
  }

  return <PublicProfile profile={fixedProfile} />
}
