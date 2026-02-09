const FALLBACK_SITE_URL = 'http://localhost:3000'

function ensureAbsoluteSiteUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim()
  if (!trimmed) return FALLBACK_SITE_URL

  try {
    const hasProtocol = /^https?:\/\//i.test(trimmed)
    const normalized = hasProtocol ? trimmed : `https://${trimmed}`
    const url = new URL(normalized)
    return `${url.protocol}//${url.host}`
  } catch {
    return FALLBACK_SITE_URL
  }
}

export function getSiteUrl(): string {
  const envSiteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || FALLBACK_SITE_URL
  return ensureAbsoluteSiteUrl(envSiteUrl)
}

export function absoluteUrl(pathname: string = '/'): string {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`
  return new URL(normalizedPath, getSiteUrl()).toString()
}

export function clampText(text: string, maxLength: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`
}

export const SITE_NAME = 'DevLink'
export const SITE_DESCRIPTION =
  'Create stunning developer portfolios with ease. Showcase projects, skills, and experience.'
