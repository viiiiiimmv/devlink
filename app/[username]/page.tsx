import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { db } from '@/lib/db'
import PublicProfile from '@/components/public-profile/profile'
import { absoluteUrl, clampText } from '@/lib/seo'
import { authOptions } from '@/lib/auth'

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

type ProfileRouteParams = {
  username: string
}

type ProfilePageProps = {
  params: Promise<ProfileRouteParams>
}

const getProfileDescription = (name: string, bio: string) =>
  bio?.trim()
    ? clampText(bio, 160)
    : `Explore ${name}'s developer portfolio with projects, skills, and experience.`

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params
  const profile = await db.findProfile(username)
  
  if (!profile) {
    return {
      title: 'Profile not found',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  if (profile.isPublished === false) {
    return {
      title: `${profile.name} - Draft profile`,
      description: 'This profile is currently not published.',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const profilePath = `/${encodeURIComponent(profile.username)}`
  const profileUrl = absoluteUrl(profilePath)
  const ogImageUrl = absoluteUrl(`${profilePath}/opengraph-image`)
  const description = getProfileDescription(profile.name, profile.bio || '')

  return {
    title: `${profile.name} - Developer Portfolio`,
    description,
    keywords: ['developer', 'portfolio', 'projects', ...profile.skills],
    alternates: {
      canonical: profileUrl,
    },
    openGraph: {
      title: `${profile.name} - Developer Portfolio`,
      description,
      url: profileUrl,
      type: 'profile',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${profile.name} portfolio preview`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${profile.name} - Developer Portfolio`,
      description,
      images: [ogImageUrl],
    },
  }
}

function buildStructuredData(profile: any) {
  const profileUrl = absoluteUrl(`/${encodeURIComponent(profile.username)}`)
  const sameAs = [
    profile.socialLinks?.github,
    profile.socialLinks?.linkedin,
    profile.socialLinks?.twitter,
    profile.socialLinks?.website,
  ].filter((url): url is string => typeof url === 'string' && url.trim().length > 0)

  const personSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    identifier: profile.username,
    description: getProfileDescription(profile.name, profile.bio || ''),
    url: profileUrl,
    knowsAbout: Array.isArray(profile.skills) ? profile.skills : [],
    mainEntityOfPage: profileUrl,
  }

  const profileImage = profile.profilePhoto?.url || profile.profileImage
  if (typeof profileImage === 'string' && profileImage.trim().length > 0) {
    personSchema.image = profileImage
  }
  if (sameAs.length > 0) {
    personSchema.sameAs = sameAs
  }

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${profile.name} - Developer Portfolio`,
    url: profileUrl,
    description: getProfileDescription(profile.name, profile.bio || ''),
    about: {
      '@type': 'Person',
      name: profile.name,
    },
  }

  return [personSchema, webPageSchema]
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params
  const profile = await db.findProfile(username)

  if (!profile) {
    notFound()
  }

  const session = await getServerSession(authOptions)
  const viewerUsername =
    session?.user && typeof (session.user as { username?: unknown }).username === 'string'
      ? (session.user as { username: string }).username
      : null
  const canViewUnpublished = viewerUsername === profile.username

  if (profile.isPublished === false && !canViewUnpublished) {
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

  const structuredData = buildStructuredData(fixedProfile)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <PublicProfile profile={fixedProfile} showSignature />
    </>
  )
}
