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
      url: absoluteUrl('/discover'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
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
      { username: 1, updatedAt: 1, 'projects.id': 1 }
    ).lean()

    const dynamicEntries: MetadataRoute.Sitemap = []

    for (const profile of profiles) {
      if (typeof profile.username !== 'string' || profile.username.trim().length === 0) {
        continue
      }

      const normalizedUsername = profile.username.trim()
      const lastModified = profile.updatedAt ? new Date(profile.updatedAt) : now

      dynamicEntries.push({
        url: absoluteUrl(`/${normalizedUsername}`),
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.8,
      })

      const projects = Array.isArray(profile.projects) ? profile.projects : []
      for (const project of projects) {
        if (typeof project?.id !== 'string' || project.id.trim().length === 0) {
          continue
        }

        dynamicEntries.push({
          url: absoluteUrl(`/${normalizedUsername}/projects/${encodeURIComponent(project.id.trim())}`),
          lastModified,
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      }
    }

    return [...staticEntries, ...dynamicEntries]
  } catch (error) {
    console.error('Sitemap generation error:', error)
    return staticEntries
  }
}
