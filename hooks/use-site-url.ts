'use client'

import { useEffect, useState } from 'react'
import { getClientSiteUrl, getSiteUrl } from '@/lib/seo'

export function useSiteUrl(): string {
  const [siteUrl, setSiteUrl] = useState(getSiteUrl())

  useEffect(() => {
    setSiteUrl(getClientSiteUrl())
  }, [])

  return siteUrl
}
