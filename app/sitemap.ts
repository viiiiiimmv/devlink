import type { MetadataRoute } from 'next'
import connectDB from '@/lib/mongodb'
import Profile from '@/models/Profile'
import { absoluteUrl } from '@/lib/seo'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl('/'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: absoluteUrl('/auth/signin'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ]

  try {
    await connectDB()
    const profiles = await Profile.find(
      { isPublished: true },
      { username: 1, updatedAt: 1 }
    ).lean()

    const dynamicEntries: MetadataRoute.Sitemap = profiles
      .filter((profile) => typeof profile.username === 'string' && profile.username.trim().length > 0)
      .map((profile) => ({
        url: absoluteUrl(`/${profile.username.trim()}`),
        lastModified: profile.updatedAt ? new Date(profile.updatedAt) : now,
        changeFrequency: 'weekly',
        priority: 0.8,
      }))

    return [...staticEntries, ...dynamicEntries]
  } catch (error) {
    console.error('Sitemap generation error:', error)
    return staticEntries
  }
}
