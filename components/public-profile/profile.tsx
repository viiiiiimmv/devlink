'use client'

import { motion } from 'framer-motion'
import { Github, Linkedin, Twitter, Globe, ExternalLink, Calendar, Award, ArrowUpRight, Sparkles } from 'lucide-react'
import { themes } from '@/lib/themes'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo } from 'react'
import { normalizeSectionSettings, type ProfileSectionId } from '@/lib/profile-customization'
import ShareProfile from '@/components/ShareProfile'

export interface Profile {
  username: string
  name: string
  bio: string
  skills: string[]
  profileImage?: string
  profilePhoto?: {
    url?: string
    publicId?: string
  }
  socialLinks: {
    github?: string
    linkedin?: string
    twitter?: string
    website?: string
  }
  theme: string
  isPublished?: boolean
  customTheme?: {
    enabled?: boolean
    primary?: string
    secondary?: string
  }
  contactCta?: {
    enabled?: boolean
    title?: string
    description?: string
    buttonLabel?: string
    link?: string
    email?: string
  }
  template?: string
  sectionSettings?: Array<{
    id: string
    visible: boolean
  }>
  projects: Project[]
  experiences: Experience[]
  certifications: Certification[]
  researches: Research[]
}

interface Project {
  id: string
  title: string
  description: string
  technologies: string[]
  githubUrl?: string
  liveUrl?: string
  image?: string
  imagePublicId?: string
  featured: boolean
}

interface Experience {
  id: string
  company: string
  position: string
  startDate: string
  endDate?: string
  isCurrentlyWorking: boolean
  description: string
  technologies: string[]
  linkedinPostUrl?: string
}

interface Certification {
  id: string
  name: string
  issuer: string
  date: string
  credentialId?: string
  credentialUrl?: string
}

interface Research {
  id: string
  title: string
  description: string
  url: string
  publishedAt: string
}

interface PublicProfileProps {
  profile: Profile
  showSignature?: boolean
  showSharePanel?: boolean
}

export default function PublicProfile({
  profile,
  showSignature = false,
  showSharePanel = true,
}: PublicProfileProps) {
  // Ensure all required properties exist with fallbacks
  const safeProfile = {
    ...profile,
    skills: profile.skills || [],
    projects: profile.projects || [],
    experiences: profile.experiences || [],
    certifications: profile.certifications || [],
    researches: profile.researches || [],
    socialLinks: profile.socialLinks || {},
    bio: profile.bio || '',
    name: profile.name || 'Developer',
    theme: profile.theme || 'modern',
    isPublished: profile.isPublished !== false,
    customTheme: {
      enabled: profile.customTheme?.enabled === true,
      primary: profile.customTheme?.primary || '',
      secondary: profile.customTheme?.secondary || '',
    },
    contactCta: {
      enabled: profile.contactCta?.enabled !== false,
      title: profile.contactCta?.title || 'Let us work together',
      description: profile.contactCta?.description || 'Open to freelance, full-time roles, and collaboration opportunities.',
      buttonLabel: profile.contactCta?.buttonLabel || 'Contact me',
      link: profile.contactCta?.link || '',
      email: profile.contactCta?.email || '',
    },
    template: profile.template || 'editorial',
    sectionSettings: normalizeSectionSettings(profile.sectionSettings),
  }
  const profileImageUrl = (() => {
    const candidate = safeProfile.profilePhoto?.url || safeProfile.profileImage
    if (typeof candidate !== 'string') return undefined
    const trimmed = candidate.trim()
    return trimmed.length > 0 ? trimmed : undefined
  })()

  const currentTheme = themes[safeProfile.theme as keyof typeof themes] || themes.modern

  // Memoize current year to prevent hydration mismatch
  const currentYear = useMemo(() => new Date().getUTCFullYear(), [])

  // Theme-based colors
  const themeColors = useMemo(() => {
    const isHex = (value?: string) =>
      typeof value === 'string' && /^#([0-9a-f]{6})$/i.test(value)

    const customPrimary =
      safeProfile.customTheme.enabled && isHex(safeProfile.customTheme.primary)
        ? safeProfile.customTheme.primary
        : undefined
    const customSecondary =
      safeProfile.customTheme.enabled && isHex(safeProfile.customTheme.secondary)
        ? safeProfile.customTheme.secondary
        : undefined

    const primary = customPrimary || (
      isHex(currentTheme.primary)
        ? currentTheme.primary
        : (themes.modern.primary || '#3b82f6')
    )
    const secondary = customSecondary || (
      isHex(currentTheme.secondary)
        ? currentTheme.secondary
        : (themes.modern.secondary || '#06b6d4')
    )

    // Convert hex to RGB for gradient effects
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 250, g: 204, b: 21 }
    }

    const primaryRgb = hexToRgb(primary)
    const secondaryRgb = hexToRgb(secondary)

    const getLuminance = (rgb: { r: number; g: number; b: number }) => {
      const toLinear = (value: number) => {
        const channel = value / 255
        return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
      }
      const r = toLinear(rgb.r)
      const g = toLinear(rgb.g)
      const b = toLinear(rgb.b)
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }

    const avgRgb = {
      r: Math.round((primaryRgb.r + secondaryRgb.r) / 2),
      g: Math.round((primaryRgb.g + secondaryRgb.g) / 2),
      b: Math.round((primaryRgb.b + secondaryRgb.b) / 2)
    }
    const badgeText = getLuminance(avgRgb) > 0.5 ? '#0a0a0a' : '#ffffff'

    return {
      primary,
      secondary,
      primaryRgb: `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`,
      secondaryRgb: `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`,
      gradient: `linear-gradient(135deg, ${primary}, ${secondary})`,
      badgeText
    }
  }, [currentTheme, safeProfile.customTheme.enabled, safeProfile.customTheme.primary, safeProfile.customTheme.secondary])

  const normalizeContactHref = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return ''
    if (/^(mailto:|https?:\/\/|tel:)/i.test(trimmed)) return trimmed
    return `https://${trimmed}`
  }

  const contactHref = useMemo(() => {
    const customLink = normalizeContactHref(safeProfile.contactCta.link)
    if (customLink) return customLink

    const email = safeProfile.contactCta.email.trim()
    if (email.length > 0) return `mailto:${email}`

    const fallbackLinks = [
      safeProfile.socialLinks.website,
      safeProfile.socialLinks.linkedin,
      safeProfile.socialLinks.github,
      safeProfile.socialLinks.twitter,
    ]
    for (const candidate of fallbackLinks) {
      if (typeof candidate !== 'string') continue
      const normalized = normalizeContactHref(candidate)
      if (normalized) return normalized
    }

    return ''
  }, [
    safeProfile.contactCta.email,
    safeProfile.contactCta.link,
    safeProfile.socialLinks.github,
    safeProfile.socialLinks.linkedin,
    safeProfile.socialLinks.twitter,
    safeProfile.socialLinks.website,
  ])

  useEffect(() => {
    if (!showSignature) return

    const root = document.documentElement
    const baseClass = 'devlink-scrollbars'
    const activeClass = 'devlink-scrolling'
    let timeoutId: number | undefined

    root.classList.add(baseClass)

    const handleScroll = () => {
      root.classList.add(activeClass)
      if (timeoutId) window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
        root.classList.remove(activeClass)
      }, 400)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (timeoutId) window.clearTimeout(timeoutId)
      root.classList.remove(baseClass, activeClass)
    }
  }, [showSignature])

  const socialPlatforms = ['github', 'linkedin', 'twitter', 'website'] as const
  const socialLinkEntries = socialPlatforms.map((platform) => [
    platform,
    safeProfile.socialLinks?.[platform]
  ] as const)
  const hasSocialLinks = socialLinkEntries.some(([, url]) => url)

  const socialIcons = {
    github: Github,
    linkedin: Linkedin,
    twitter: Twitter,
    website: Globe,
  }

  const formatExperienceDuration = (startDate: string, endDate?: string, isCurrentlyWorking?: boolean) => {
    const formatDate = (dateStr: string) => {
      // Handle different date formats
      if (dateStr.includes('-')) {
        // Format: "YYYY-MM"
        const date = new Date(dateStr + '-01')
        return date.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
          timeZone: 'UTC'
        })
      } else {
        // Format: "Month YYYY"
        return dateStr
      }
    }

    const start = formatDate(startDate)
    if (isCurrentlyWorking) {
      return `${start} - Present`
    }
    const end = endDate ? formatDate(endDate) : 'Present'
    return `${start} - ${end}`
  }

  const templateId = safeProfile.template || 'editorial'
  const sectionVisibilityMap = useMemo(() => {
    return safeProfile.sectionSettings.reduce((acc, setting) => {
      acc[setting.id] = setting.visible
      return acc
    }, {} as Record<ProfileSectionId, boolean>)
  }, [safeProfile.sectionSettings])

  const sectionOrderMap = useMemo(() => {
    return safeProfile.sectionSettings.reduce((acc, setting, index) => {
      acc[setting.id] = index
      return acc
    }, {} as Record<ProfileSectionId, number>)
  }, [safeProfile.sectionSettings])

  const isSectionVisible = (sectionId: ProfileSectionId) =>
    sectionVisibilityMap[sectionId] !== false

  const getSectionOrder = (sectionId: ProfileSectionId) =>
    sectionOrderMap[sectionId] ?? 999

  const getDisplayProjects = () => {
    const featuredProjects = safeProfile.projects.filter((project) => project.featured)
    return featuredProjects.length > 0 ? featuredProjects : safeProfile.projects
  }

  const renderSignatureBadge = () => {
    if (!showSignature) return null

    return (
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[120] pointer-events-none">
        <Link
          href="/"
          className="pointer-events-auto group inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] shadow-lg backdrop-blur-md transition-transform duration-200 hover:-translate-y-0.5"
          style={{
            background: themeColors.gradient,
            borderColor: themeColors.primary,
            color: themeColors.badgeText,
            boxShadow: `0 18px 40px rgba(${themeColors.primaryRgb}, 0.35)`
          }}
          aria-label="Designed with DevLink"
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: themeColors.secondary }}
          />
          Designed with DevLink
        </Link>
      </div>
    )
  }

  const shareUrl = useMemo(() => {
    const path = safeProfile.username ? `/${safeProfile.username}` : ''
    return path || '/'
  }, [safeProfile.username])

  const renderSharePanel = () => (
    <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-[120] w-[calc(100%-2rem)] sm:w-80">
      <ShareProfile url={shareUrl} />
    </div>
  )

  const renderContactCta = (variant: 'bento' | 'terminal' | 'glass' | 'editorial') => {
    if (!safeProfile.contactCta.enabled || !contactHref) return null

    const title = safeProfile.contactCta.title.trim() || 'Let us work together'
    const description =
      safeProfile.contactCta.description.trim() ||
      'Open to freelance, full-time roles, and collaboration opportunities.'
    const buttonLabel = safeProfile.contactCta.buttonLabel.trim() || 'Contact me'
    const openInNewTab = /^https?:\/\//i.test(contactHref)

    if (variant === 'terminal') {
      return (
        <section>
          <p className="text-sm" style={{ color: themeColors.primary }}>$ contact --open</p>
          <div className="mt-3 rounded-xl border border-white/10 bg-zinc-950/70 p-4">
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="mt-1 text-sm text-zinc-300">{description}</p>
            <Link
              href={contactHref}
              target={openInNewTab ? '_blank' : undefined}
              rel={openInNewTab ? 'noopener noreferrer' : undefined}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs uppercase tracking-[0.2em] hover:border-white/40 transition-colors"
              style={{ color: themeColors.secondary }}
            >
              {buttonLabel}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      )
    }

    if (variant === 'glass') {
      return (
        <section className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl p-6">
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="mt-2 text-sm text-white/80">{description}</p>
          <Link
            href={contactHref}
            target={openInNewTab ? '_blank' : undefined}
            rel={openInNewTab ? 'noopener noreferrer' : undefined}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/15 px-4 py-2 text-sm font-semibold hover:border-white/50 transition-colors"
          >
            {buttonLabel}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </section>
      )
    }

    if (variant === 'bento') {
      return (
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Contact</p>
              <h2 className="mt-2 text-2xl font-black">{title}</h2>
              <p className="mt-2 text-sm text-slate-300">{description}</p>
            </div>
            <Link
              href={contactHref}
              target={openInNewTab ? '_blank' : undefined}
              rel={openInNewTab ? 'noopener noreferrer' : undefined}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: themeColors.gradient }}
            >
              {buttonLabel}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )
    }

    return (
      <section className="relative py-16 px-6 md:px-12 lg:px-24 border-t-4 border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="p-8 bg-white/5 border-2 border-white/20">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-3xl font-black">{title}</h2>
                <p className="mt-2 text-gray-300 max-w-2xl">{description}</p>
              </div>
              <Link
                href={contactHref}
                target={openInNewTab ? '_blank' : undefined}
                rel={openInNewTab ? 'noopener noreferrer' : undefined}
                className="group inline-flex items-center gap-2 px-5 py-3 border-2 text-sm font-bold uppercase tracking-[0.16em] transition-colors"
                style={{ borderColor: themeColors.primary, color: themeColors.primary }}
              >
                {buttonLabel}
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const renderBentoTemplate = () => {
    const projectsToShow = getDisplayProjects()

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `radial-gradient(circle at 20% 20%, rgba(${themeColors.primaryRgb}, 0.35), transparent 45%), radial-gradient(circle at 80% 10%, rgba(${themeColors.secondaryRgb}, 0.28), transparent 40%)`
            }}
          />
          <div className="relative max-w-7xl mx-auto px-6 py-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-xl">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl overflow-hidden border border-white/20 bg-slate-900 flex items-center justify-center text-2xl font-black">
                      {profileImageUrl ? (
                        <Image
                          src={profileImageUrl}
                          alt={safeProfile.name}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{safeProfile.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Developer Profile</p>
                      <h1 className="text-4xl md:text-5xl font-black leading-tight">{safeProfile.name}</h1>
                    </div>
                  </div>
                  <div
                    className="rounded-xl px-4 py-2 text-sm font-semibold"
                    style={{
                      backgroundColor: `rgba(${themeColors.primaryRgb}, 0.2)`,
                      border: `1px solid ${themeColors.primary}`
                    }}
                  >
                    Template: Bento Grid
                  </div>
                </div>
                <p className="mt-6 text-slate-300 leading-relaxed text-lg">
                  {safeProfile.bio || 'Full Stack Developer passionate about creating reliable digital products.'}
                </p>
                {hasSocialLinks && (
                  <div className="mt-6 flex flex-wrap gap-3">
                    {socialLinkEntries.map(([platform, url]) => {
                      const Icon = socialIcons[platform]
                      if (!Icon || !url) return null

                      return (
                        <Link
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] hover:border-white/40 transition-colors"
                        >
                          <Icon className="h-4 w-4" />
                          {platform}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="lg:col-span-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-4">Snapshot</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-slate-900/70 p-3 border border-white/10">
                    <p className="text-2xl font-black" style={{ color: themeColors.primary }}>
                      {safeProfile.projects.length}
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Projects</p>
                  </div>
                  <div className="rounded-xl bg-slate-900/70 p-3 border border-white/10">
                    <p className="text-2xl font-black" style={{ color: themeColors.secondary }}>
                      {safeProfile.experiences.length}
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Experience</p>
                  </div>
                  <div className="rounded-xl bg-slate-900/70 p-3 border border-white/10">
                    <p className="text-2xl font-black text-white">{safeProfile.skills.length}</p>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Skills</p>
                  </div>
                </div>
              </div>

              {isSectionVisible('skills') && safeProfile.skills.length > 0 && (
                <div
                  className="lg:col-span-5 self-start h-fit rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
                  style={{ order: getSectionOrder('skills') }}
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-4">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {safeProfile.skills.map((skill, index) => (
                      <span
                        key={`${skill}-${index}`}
                        className="rounded-lg px-3 py-2 text-sm border border-white/10 bg-slate-900/60"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {isSectionVisible('projects') && projectsToShow.length > 0 && (
                <div
                  className="lg:col-span-7 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
                  style={{ order: getSectionOrder('projects') }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Projects</p>
                    <span className="text-xs text-slate-400">Top {Math.min(projectsToShow.length, 4)}</span>
                  </div>
                  <div className="space-y-4">
                    {projectsToShow.slice(0, 4).map((project) => (
                      <div key={project.id} className="rounded-2xl border border-white/10 bg-slate-900/65 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="text-xl font-bold">{project.title}</h3>
                          {project.featured && (
                            <span
                              className="rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.15em]"
                              style={{
                                backgroundColor: `rgba(${themeColors.primaryRgb}, 0.2)`,
                                color: themeColors.primary
                              }}
                            >
                              Featured
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-slate-300 text-sm leading-relaxed">{project.description}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {project.technologies.slice(0, 5).map((tech, techIndex) => (
                            <span
                              key={`${project.id}-tech-${techIndex}`}
                              className="rounded-md border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-slate-300"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isSectionVisible('experience') && safeProfile.experiences.length > 0 && (
                <div
                  className="lg:col-span-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
                  style={{ order: getSectionOrder('experience') }}
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-4">Experience</p>
                  <div className="space-y-4">
                    {safeProfile.experiences.map((experience) => (
                      <div key={experience.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-bold">{experience.position}</p>
                            <p className="text-sm" style={{ color: themeColors.primary }}>{experience.company}</p>
                          </div>
                          <p className="text-xs uppercase tracking-[0.15em] text-slate-400">
                            {formatExperienceDuration(experience.startDate, experience.endDate, experience.isCurrentlyWorking)}
                          </p>
                        </div>
                        <p className="mt-2 text-sm text-slate-300">{experience.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isSectionVisible('certifications') && safeProfile.certifications.length > 0 && (
                <div
                  className="lg:col-span-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
                  style={{ order: getSectionOrder('certifications') }}
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-4">Certifications</p>
                  <div className="space-y-3">
                    {safeProfile.certifications.slice(0, 4).map((cert) => (
                      <div key={cert.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
                        <p className="text-sm font-semibold">{cert.name}</p>
                        <p className="text-xs text-slate-400">{cert.issuer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isSectionVisible('research') && safeProfile.researches.length > 0 && (
                <div
                  className="lg:col-span-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
                  style={{ order: getSectionOrder('research') }}
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-4">Research</p>
                  <div className="space-y-3">
                    {safeProfile.researches.slice(0, 3).map((research) => (
                      <Link
                        key={research.id}
                        href={research.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-xl border border-white/10 bg-slate-900/60 p-3 hover:border-white/30 transition-colors"
                      >
                        <p className="text-sm font-semibold">{research.title}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(research.publishedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            timeZone: 'UTC'
                          })}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {renderContactCta('bento')}

            <footer className="mt-12 pt-8 border-t border-white/10 text-sm text-slate-400">
              © {currentYear} {safeProfile.name}
            </footer>
          </div>
        </div>

        {renderSignatureBadge()}
        {showSharePanel ? renderSharePanel() : null}
      </div>
    )
  }

  const renderTerminalTemplate = () => {
    const projectsToShow = getDisplayProjects()

    return (
      <div className="min-h-screen bg-[#040608] text-[#d1d5db] font-mono">
        <div className="max-w-6xl mx-auto px-5 py-10">
          <div className="rounded-2xl border border-white/10 bg-black/80 overflow-hidden shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-zinc-900/80">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              </div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">terminal://profile</p>
            </div>

            <div className="flex flex-col gap-8 p-5 md:p-8">
              <section>
                <p className="text-sm" style={{ color: themeColors.primary }}>
                  $ whoami
                </p>
                <h1 className="mt-2 text-3xl md:text-5xl font-bold text-white">{safeProfile.name}</h1>
                <p className="mt-3 text-zinc-300 leading-relaxed">
                  {safeProfile.bio || 'Developer building robust products and useful internet tools.'}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  theme={safeProfile.theme} template=terminal user={safeProfile.username || 'developer'}
                </p>
              </section>

              {isSectionVisible('skills') && safeProfile.skills.length > 0 && (
                <section className="h-fit" style={{ order: getSectionOrder('skills') }}>
                  <p className="text-sm" style={{ color: themeColors.primary }}>$ ls skills/</p>
                  <div className="mt-3 rounded-xl border border-white/10 bg-zinc-950/70 p-4">
                    <div className="flex flex-wrap gap-2">
                      {safeProfile.skills.map((skill, index) => (
                        <span
                          key={`${skill}-${index}`}
                          className="px-2 py-1 text-xs uppercase tracking-[0.15em] rounded border border-white/15 bg-white/5"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {isSectionVisible('projects') && projectsToShow.length > 0 && (
                <section style={{ order: getSectionOrder('projects') }}>
                  <p className="text-sm" style={{ color: themeColors.primary }}>$ tree projects/ --max-depth=1</p>
                  <div className="mt-3 space-y-3">
                    {projectsToShow.slice(0, 5).map((project) => (
                      <div key={project.id} className="rounded-xl border border-white/10 bg-zinc-950/70 p-4">
                        <p className="text-base font-semibold text-white">{project.title}</p>
                        <p className="mt-1 text-sm text-zinc-300">{project.description}</p>
                        <p className="mt-2 text-xs text-zinc-500">
                          tech=[{project.technologies.join(', ')}]
                        </p>
                        <div className="mt-3 flex flex-wrap gap-4 text-xs">
                          {project.githubUrl && (
                            <Link href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: themeColors.secondary }}>
                              open github
                            </Link>
                          )}
                          {project.liveUrl && (
                            <Link href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: themeColors.primary }}>
                              open live
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {isSectionVisible('experience') && safeProfile.experiences.length > 0 && (
                <section style={{ order: getSectionOrder('experience') }}>
                  <p className="text-sm" style={{ color: themeColors.primary }}>$ cat experience.log</p>
                  <div className="mt-3 rounded-xl border border-white/10 bg-zinc-950/70 p-4 space-y-4">
                    {safeProfile.experiences.map((experience) => (
                      <div key={experience.id} className="border-l-2 pl-4" style={{ borderColor: themeColors.secondary }}>
                        <p className="text-sm text-white font-semibold">{experience.position} @ {experience.company}</p>
                        <p className="text-xs text-zinc-500">
                          {formatExperienceDuration(experience.startDate, experience.endDate, experience.isCurrentlyWorking)}
                        </p>
                        <p className="mt-1 text-sm text-zinc-300">{experience.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {isSectionVisible('certifications') && safeProfile.certifications.length > 0 && (
                <section style={{ order: getSectionOrder('certifications') }}>
                  <p className="text-sm" style={{ color: themeColors.primary }}>$ ls certs/</p>
                  <div className="mt-2 rounded-xl border border-white/10 bg-zinc-950/70 p-4 space-y-2">
                    {safeProfile.certifications.slice(0, 5).map((cert) => (
                      <p key={cert.id} className="text-sm">
                        <span style={{ color: themeColors.secondary }}>-</span> {cert.name}
                      </p>
                    ))}
                  </div>
                </section>
              )}

              {isSectionVisible('research') && safeProfile.researches.length > 0 && (
                <section style={{ order: getSectionOrder('research') }}>
                  <p className="text-sm" style={{ color: themeColors.primary }}>$ ls papers/</p>
                  <div className="mt-2 rounded-xl border border-white/10 bg-zinc-950/70 p-4 space-y-2">
                    {safeProfile.researches.slice(0, 5).map((research) => (
                      <Link
                        key={research.id}
                        href={research.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm hover:underline"
                      >
                        {research.title}
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {hasSocialLinks && (
                <section>
                  <p className="text-sm" style={{ color: themeColors.primary }}>$ connect --all</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {socialLinkEntries.map(([platform, url]) => {
                      if (!url) return null
                      return (
                        <Link
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-white/15 px-3 py-2 text-xs uppercase tracking-[0.2em] hover:border-white/40 transition-colors"
                        >
                          {platform}
                        </Link>
                      )
                    })}
                  </div>
                </section>
              )}

              {renderContactCta('terminal')}

              <section className="text-xs text-zinc-500">
                <p>$ echo &quot;© {currentYear} {safeProfile.name}&quot;</p>
              </section>
            </div>
          </div>
        </div>

        {renderSignatureBadge()}
        {showSharePanel ? renderSharePanel() : null}
      </div>
    )
  }

  const renderGlassTemplate = () => {
    const projectsToShow = getDisplayProjects()

    return (
      <div className="min-h-screen text-white relative overflow-hidden bg-[#070b16]">
        <div
          className="absolute -top-24 -left-24 h-80 w-80 rounded-full blur-3xl"
          style={{ backgroundColor: `rgba(${themeColors.primaryRgb}, 0.45)` }}
        />
        <div
          className="absolute top-20 -right-16 h-72 w-72 rounded-full blur-3xl"
          style={{ backgroundColor: `rgba(${themeColors.secondaryRgb}, 0.4)` }}
        />
        <div className="relative max-w-7xl mx-auto px-6 py-14 space-y-7">
          <section className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl p-7 md:p-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.28em] text-white/70">Futuristic Profile</p>
                <h1 className="text-4xl md:text-6xl font-black leading-tight">{safeProfile.name}</h1>
                <p className="text-white/85 max-w-2xl text-lg">
                  {safeProfile.bio || 'Shipping polished web products with performance, design quality, and reliability.'}
                </p>
              </div>
              <div
                className="rounded-2xl border px-4 py-3 text-sm font-semibold"
                style={{
                  borderColor: `rgba(${themeColors.secondaryRgb}, 0.8)`,
                  backgroundColor: `rgba(${themeColors.secondaryRgb}, 0.2)`
                }}
              >
                Glass Template
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl border border-white/20 bg-white/10 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">Projects</p>
                <p className="text-2xl font-black mt-1">{safeProfile.projects.length}</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">Experience</p>
                <p className="text-2xl font-black mt-1">{safeProfile.experiences.length}</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">Skills</p>
                <p className="text-2xl font-black mt-1">{safeProfile.skills.length}</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">Template</p>
                <p className="text-lg font-bold mt-1 capitalize">{templateId}</p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {isSectionVisible('skills') && safeProfile.skills.length > 0 && (
              <section
                className="lg:col-span-4 self-start h-fit rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl p-6"
                style={{ order: getSectionOrder('skills') }}
              >
                <h2 className="text-xl font-bold mb-4">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {safeProfile.skills.map((skill, index) => (
                    <span
                      key={`${skill}-${index}`}
                      className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {isSectionVisible('experience') && safeProfile.experiences.length > 0 && (
              <section
                className="lg:col-span-8 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl p-6"
                style={{ order: getSectionOrder('experience') }}
              >
                <h2 className="text-xl font-bold mb-4">Experience</h2>
                <div className="space-y-4">
                  {safeProfile.experiences.map((experience) => (
                    <div key={experience.id} className="rounded-xl border border-white/20 bg-black/20 p-4">
                      <div className="flex flex-wrap justify-between gap-2">
                        <div>
                          <p className="font-semibold">{experience.position}</p>
                          <p className="text-sm text-white/75">{experience.company}</p>
                        </div>
                        <p className="text-xs uppercase tracking-[0.15em] text-white/70">
                          {formatExperienceDuration(experience.startDate, experience.endDate, experience.isCurrentlyWorking)}
                        </p>
                      </div>
                      <p className="mt-2 text-sm text-white/80">{experience.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {isSectionVisible('projects') && projectsToShow.length > 0 && (
              <section
                className="lg:col-span-7 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl p-6"
                style={{ order: getSectionOrder('projects') }}
              >
                <h2 className="text-xl font-bold mb-4">Projects</h2>
                <div className="space-y-4">
                  {projectsToShow.slice(0, 4).map((project) => (
                    <article key={project.id} className="rounded-xl border border-white/20 bg-black/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold text-lg">{project.title}</h3>
                        {project.featured && (
                          <span
                            className="text-[11px] uppercase tracking-[0.15em] px-2 py-1 rounded-md"
                            style={{
                              backgroundColor: `rgba(${themeColors.primaryRgb}, 0.25)`,
                              color: themeColors.badgeText
                            }}
                          >
                            Featured
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-white/80">{project.description}</p>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {isSectionVisible('certifications') && safeProfile.certifications.length > 0 && (
              <section
                className="lg:col-span-5 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl p-6"
                style={{ order: getSectionOrder('certifications') }}
              >
                <h2 className="text-xl font-bold mb-4">Certifications</h2>
                <div className="space-y-3">
                  {safeProfile.certifications.slice(0, 4).map((cert) => (
                    <div key={cert.id} className="rounded-xl border border-white/20 bg-black/20 p-3">
                      <p className="font-semibold text-sm">{cert.name}</p>
                      <p className="text-xs text-white/70">{cert.issuer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {isSectionVisible('research') && safeProfile.researches.length > 0 && (
              <section
                className="lg:col-span-5 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl p-6"
                style={{ order: getSectionOrder('research') }}
              >
                <h2 className="text-xl font-bold mb-4">Research</h2>
                <div className="space-y-3">
                  {safeProfile.researches.slice(0, 4).map((research) => (
                    <Link
                      key={research.id}
                      href={research.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-xl border border-white/20 bg-black/20 p-3 hover:bg-black/30 transition-colors"
                    >
                      <p className="font-semibold text-sm">{research.title}</p>
                      <p className="text-xs text-white/70 mt-1">
                        {new Date(research.publishedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          timeZone: 'UTC'
                        })}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {hasSocialLinks && (
            <section className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Connect</h2>
              <div className="flex flex-wrap gap-3">
                {socialLinkEntries.map(([platform, url]) => {
                  const Icon = socialIcons[platform]
                  if (!Icon || !url) return null
                  return (
                    <Link
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm hover:border-white/40 transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                      {platform}
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {renderContactCta('glass')}

          <footer className="text-center text-sm text-white/70 pt-2">
            © {currentYear} {safeProfile.name}
          </footer>
        </div>

        {renderSignatureBadge()}
        {showSharePanel ? renderSharePanel() : null}
      </div>
    )
  }

  if (templateId === 'bento') {
    return renderBentoTemplate()
  }

  if (templateId === 'terminal') {
    return renderTerminalTemplate()
  }

  if (templateId === 'glass') {
    return renderGlassTemplate()
  }

  return (
      <>
        <style jsx global>{`
          .mono {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          }

          .grain {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            opacity: 0.03;
            z-index: 100;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }

          @keyframes pulse-glow {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
          }

          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        html.devlink-scrollbars {
          scrollbar-color: transparent transparent;
        }

        html.devlink-scrollbars.devlink-scrolling {
          scrollbar-color: rgba(255, 255, 255, 0.35) transparent;
        }

        html.devlink-scrollbars::-webkit-scrollbar {
          width: 10px;
        }

        html.devlink-scrollbars::-webkit-scrollbar-track {
          background: transparent;
        }

        html.devlink-scrollbars::-webkit-scrollbar-thumb {
          background-color: transparent;
          border-radius: 999px;
          border: 2px solid transparent;
          background-clip: content-box;
        }

        html.devlink-scrollbars.devlink-scrolling::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.35);
        }
      `}</style>

        <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
          {/* Grain overlay */}
          <div className="grain" />

          {/* Hero Section - Magazine Editorial Layout */}
          <section className="relative min-h-screen flex items-center px-6 md:px-12 lg:px-24 py-16 md:py-20 lg:py-24 overflow-x-hidden">
            <div className="max-w-7xl mx-auto w-full">

              {/* Top Bar - Year Label */}
              <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="mb-8 md:mb-12"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div
                      className="px-4 py-2 font-bold text-sm tracking-wider mono"
                      style={{
                        backgroundColor: themeColors.primary,
                        color: themeColors.badgeText
                      }}
                  >
                    {currentYear} PORTFOLIO
                  </div>
                  <div className="hidden md:flex items-center gap-2 mono text-xs text-gray-500 tracking-widest">
                    <div
                        className="w-8 h-0.5"
                        style={{ backgroundColor: themeColors.primary }}
                    />
                    <span>SCROLL TO EXPLORE</span>
                  </div>
                </div>
              </motion.div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

                {/* Left Side - Image with Overlay Text */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="lg:col-span-5 relative order-2 lg:order-1"
                >
                  {/* Image Container with Cut-out Effect */}
                  <div className="relative aspect-[3/4] lg:aspect-square max-w-md mx-auto lg:mx-0">
                    {/* Background Accent Block */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="absolute -right-8 -bottom-8 w-full h-full -z-10"
                        style={{ backgroundColor: themeColors.primary, opacity: 0.15 }}
                    />

                    {/* Main Image */}
                    <div className="relative w-full h-full overflow-hidden border-4 border-white/10">
                      {profileImageUrl ? (
                          <Image
                              src={profileImageUrl}
                              alt={safeProfile.name}
                              fill
                              className="object-cover"
                              priority
                          />
                      ) : (
                          <div
                              className="w-full h-full flex items-center justify-center"
                              style={{ background: themeColors.gradient }}
                          >
                        <span className="text-9xl font-black" style={{ color: themeColors.badgeText }}>
                          {safeProfile.name.charAt(0).toUpperCase()}
                        </span>
                          </div>
                      )}

                      {/* Image Overlay Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>

                    {/* Floating Label on Image */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="absolute -top-4 -right-4 px-4 py-2 border-4 border-black mono text-xs font-bold tracking-wider"
                        style={{
                          backgroundColor: themeColors.secondary,
                          color: themeColors.badgeText
                        }}
                    >
                      AVAILABLE FOR WORK
                    </motion.div>

                    {/* Decorative Corner Lines */}
                    <div
                        className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4"
                        style={{ borderColor: themeColors.primary }}
                    />
                    <div
                        className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4"
                        style={{ borderColor: themeColors.secondary }}
                    />
                  </div>
                </motion.div>

                {/* Right Side - Name and Info */}
                <div className="lg:col-span-7 flex flex-col justify-center space-y-8 lg:space-y-12 order-1 lg:order-2">

                  {/* Large Name Display */}
                  <div className="space-y-4">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                      <h1 className="text-7xl md:text-8xl xl:text-9xl font-black leading-[0.9] tracking-tighter">
                        {safeProfile.name.split(' ').map((word, idx) => (
                            <motion.span
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 + idx * 0.1 }}
                                className="block relative"
                            >
                              {/* Background Text Shadow */}
                              <span
                                  className="absolute inset-0 opacity-20 blur-sm"
                                  style={{ color: themeColors.primary }}
                              >
                            {word}
                          </span>
                              {/* Main Text */}
                              <span className="relative">
                            {word}
                          </span>
                              {/* Underline accent for first word */}
                              {idx === 0 && (
                                  <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: '60%' }}
                                      transition={{ duration: 0.8, delay: 0.8 }}
                                      className="h-2 md:h-3 mt-2"
                                      style={{ backgroundColor: themeColors.primary }}
                                  />
                              )}
                            </motion.span>
                        ))}
                      </h1>
                    </motion.div>

                    {/* Role/Bio Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                        className="space-y-4"
                    >
                      {/* Bio Text with Side Accent */}
                      <div className="flex gap-4 items-start">
                        <div
                            className="w-1 h-full min-h-[60px] mt-1"
                            style={{ backgroundColor: themeColors.secondary }}
                        />
                        <p className="text-xl md:text-2xl text-gray-300 font-light leading-relaxed max-w-2xl">
                          {safeProfile.bio || 'Full Stack Developer passionate about creating amazing digital experiences.'}
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Social Links - Stacked Brutalist Style */}
                {hasSocialLinks && (
                    <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.9 }}
                          className="space-y-3"
                      >
                        {/* Section Label */}
                        <div className="mono text-xs tracking-widest text-gray-500 mb-4">
                          CONNECT
                        </div>

                        {/* Links */}
                        <div className="flex flex-wrap gap-3">
                          {socialLinkEntries.map(([platform, url], index) => {
                            const Icon = socialIcons[platform as keyof typeof socialIcons]
                            if (!Icon || !url) return null
                            return (
                                <motion.div
                                    key={platform}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: 1 + index * 0.1 }}
                                >
                                  <Link
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="group relative px-5 py-2.5 bg-white/5 border-2 border-white/20 hover:border-white/40 transition-all duration-200 inline-flex items-center gap-2"
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = themeColors.primary
                                        e.currentTarget.style.backgroundColor = `rgba(${themeColors.primaryRgb}, 0.1)`
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
                                      }}
                                  >
                                    <Icon className="w-4 h-4" />
                                    <span className="mono text-xs font-bold tracking-wider">
                                {platform.toUpperCase()}
                              </span>
                                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                  </Link>
                                </motion.div>
                            )
                          })}
                        </div>
                      </motion.div>
                  )}

                  {/* Stats or Quick Info */}
                  <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 1.1 }}
                      className="flex flex-wrap gap-8 pt-4 border-t border-white/10"
                  >
                    {safeProfile.projects.length > 0 && (
                        <div>
                          <div className="text-3xl md:text-4xl font-black" style={{ color: themeColors.primary }}>
                            {safeProfile.projects.filter(p => p.featured).length || safeProfile.projects.length}+
                          </div>
                          <div className="text-sm mono text-gray-500 tracking-wider">
                            PROJECTS
                          </div>
                        </div>
                    )}
                    {safeProfile.experiences.length > 0 && (
                        <div>
                          <div className="text-3xl md:text-4xl font-black" style={{ color: themeColors.secondary }}>
                            {safeProfile.experiences.length}+
                          </div>
                          <div className="text-sm mono text-gray-500 tracking-wider">
                            EXPERIENCES
                          </div>
                        </div>
                    )}
                    {safeProfile.skills.length > 0 && (
                        <div>
                          <div className="text-3xl md:text-4xl font-black text-white">
                            {safeProfile.skills.length}+
                          </div>
                          <div className="text-sm mono text-gray-500 tracking-wider">
                            SKILLS
                          </div>
                        </div>
                    )}
                  </motion.div>
                </div>
              </div>
            </div>

          </section>

          <div className="flex flex-col">
          {/* Skills Section - Grid Layout */}
          {isSectionVisible('skills') && safeProfile.skills && safeProfile.skills.length > 0 && (
              <section className="relative py-20 md:py-24 px-6 md:px-12 lg:px-24 border-t-4 border-white/10" style={{ order: getSectionOrder('skills') }}>
                <div className="max-w-7xl mx-auto">
                  <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6 }}
                      className="mb-16"
                  >
                    <div
                        className="inline-block px-6 py-3 text-black font-bold text-sm tracking-wider mono mb-4"
                        style={{ backgroundColor: themeColors.secondary }}
                    >
                      EXPERTISE
                    </div>
                    <h2 className="text-5xl md:text-7xl font-extrabold">Skills & Technologies</h2>
                  </motion.div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {safeProfile.skills.map((skill, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                            whileHover={{ scale: 1.05, rotate: 2 }}
                            className="group relative p-6 bg-white/5 border-2 border-white/20 transition-all duration-300 cursor-default"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = themeColors.primary
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                            }}
                        >
                          <div
                              className="absolute top-2 right-2 w-2 h-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ backgroundColor: themeColors.primary }}
                          />
                          <span className="text-lg font-bold">{skill}</span>
                        </motion.div>
                    ))}
                  </div>
                </div>
              </section>
          )}

          {/* Projects Section - Masonry-inspired Layout */}
          {isSectionVisible('projects') && safeProfile.projects && safeProfile.projects.length > 0 && (
              <section className="relative py-20 md:py-24 px-6 md:px-12 lg:px-24 border-t-4 border-white/10" style={{ order: getSectionOrder('projects') }}>
                <div className="max-w-7xl mx-auto">
                  <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6 }}
                      className="mb-16"
                  >
                    <div
                        className="inline-block px-6 py-3 text-black font-bold text-sm tracking-wider mono mb-4"
                        style={{ backgroundColor: themeColors.primary }}
                    >
                      WORK
                    </div>
                    <h2 className="text-5xl md:text-7xl font-extrabold">Selected Projects</h2>
                  </motion.div>

                  <div className="space-y-8">
                    {(() => {
                      const featuredProjects = safeProfile.projects.filter(project => project.featured)
                      const otherProjects = safeProfile.projects.filter(project => !project.featured)
                      const allProjects = [...featuredProjects, ...otherProjects]
                      const projectsToShow = featuredProjects.length > 0 ? featuredProjects : allProjects

                      return projectsToShow.slice(0, 6).map((project, index) => (
                          <motion.div
                              key={project.id}
                              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.6, delay: index * 0.1 }}
                              className="group relative"
                          >
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                              {/* Number */}
                              <div className="hidden lg:block lg:col-span-1">
                          <span
                              className="text-6xl font-black text-white/10 transition-colors mono"
                              style={{
                                color: `rgba(${themeColors.primaryRgb}, 0.1)`
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.color = `rgba(${themeColors.primaryRgb}, 0.3)`
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.color = `rgba(${themeColors.primaryRgb}, 0.1)`
                              }}
                          >
                            {String(index + 1).padStart(2, '0')}
                          </span>
                              </div>

                              {/* Content */}
                              <div className={`lg:col-span-6 ${index % 2 === 0 ? 'lg:order-1' : 'lg:order-2'}`}>
                                <div className="space-y-4">
                                  {project.featured && (
                                      <div
                                          className="inline-block px-3 py-1 text-black text-xs font-bold mono"
                                          style={{ backgroundColor: themeColors.primary }}
                                      >
                                        FEATURED
                                      </div>
                                  )}
                                  <h3
                                      className="text-3xl md:text-4xl font-bold transition-colors"
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.color = themeColors.primary
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.color = 'white'
                                      }}
                                  >
                                    {project.title}
                                  </h3>
                                  <p className="text-lg text-gray-400 leading-relaxed">
                                    {project.description}
                                  </p>

                                  {/* Technologies */}
                                  <div className="flex flex-wrap gap-2">
                                    {project.technologies.map((tech, techIndex) => (
                                        <span
                                            key={techIndex}
                                            className="px-3 py-1 bg-white/5 border border-white/20 text-sm mono"
                                        >
                                  {tech}
                                </span>
                                    ))}
                                  </div>

                                  {/* Links */}
                                  <div className="flex gap-4 pt-4">
                                    {project.githubUrl && (
                                        <Link
                                            href={project.githubUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group/link flex items-center gap-2 text-white transition-colors"
                                            onMouseEnter={(e) => {
                                              e.currentTarget.style.color = themeColors.primary
                                            }}
                                            onMouseLeave={(e) => {
                                              e.currentTarget.style.color = 'white'
                                            }}
                                        >
                                          <Github className="w-5 h-5" />
                                          <span className="mono text-sm font-bold">CODE</span>
                                          <ArrowUpRight className="w-4 h-4 transform group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
                                        </Link>
                                    )}
                                    {project.liveUrl && (
                                        <Link
                                            href={project.liveUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group/link flex items-center gap-2 text-white transition-colors"
                                            onMouseEnter={(e) => {
                                              e.currentTarget.style.color = themeColors.secondary
                                            }}
                                            onMouseLeave={(e) => {
                                              e.currentTarget.style.color = 'white'
                                            }}
                                        >
                                          <ExternalLink className="w-5 h-5" />
                                          <span className="mono text-sm font-bold">LIVE</span>
                                          <ArrowUpRight className="w-4 h-4 transform group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
                                        </Link>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Image */}
                              <div className={`lg:col-span-5 ${index % 2 === 0 ? 'lg:order-2' : 'lg:order-1'}`}>
                                {project.image ? (
                                    <div
                                        className="relative aspect-video overflow-hidden border-4 border-white/20 transition-all duration-300"
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.borderColor = themeColors.primary
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                                        }}
                                    >
                                      <Image
                                          src={project.image}
                                          alt={project.title}
                                          fill
                                          className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                      />
                                    </div>
                                ) : (
                                    <div
                                        className="relative aspect-video border-4 border-white/20 transition-all flex items-center justify-center"
                                        style={{
                                          background: `linear-gradient(135deg, rgba(${themeColors.primaryRgb}, 0.2), rgba(${themeColors.secondaryRgb}, 0.2))`
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.borderColor = themeColors.primary
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                                        }}
                                    >
                                      <Sparkles className="w-16 h-16 text-white/20" />
                                    </div>
                                )}
                              </div>
                            </div>

                            {/* Divider */}
                            {index < projectsToShow.slice(0, 6).length - 1 && (
                                <div className="mt-8 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                            )}
                          </motion.div>
                      ))
                    })()}
                  </div>
                </div>
              </section>
          )}

          {/* Experience Section - Timeline */}
          {isSectionVisible('experience') && safeProfile.experiences && safeProfile.experiences.length > 0 && (
              <section className="relative py-20 md:py-24 px-6 md:px-12 lg:px-24 border-t-4 border-white/10" style={{ order: getSectionOrder('experience') }}>
                <div className="max-w-7xl mx-auto">
                  <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6 }}
                      className="mb-16"
                  >
                    <div
                        className="inline-block px-6 py-3 text-black font-bold text-sm tracking-wider mono mb-4"
                        style={{ backgroundColor: themeColors.secondary }}
                    >
                      JOURNEY
                    </div>
                    <h2 className="text-5xl md:text-7xl font-extrabold">Experience</h2>
                  </motion.div>

                  <div className="relative space-y-12">
                    {/* Timeline Line */}
                    <div
                        className="absolute left-8 top-0 bottom-0 w-0.5 hidden md:block"
                        style={{
                          backgroundImage: `linear-gradient(to bottom, ${themeColors.primary}, ${themeColors.secondary}, ${themeColors.primary})`
                        }}
                    />

                    {safeProfile.experiences.map((experience, index) => (
                        <motion.div
                            key={experience.id}
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className="relative md:pl-24"
                        >
                          {/* Timeline Dot */}
                          <div
                              className="absolute left-6 top-6 w-5 h-5 border-4 border-black rounded-full hidden md:block"
                              style={{ backgroundColor: themeColors.primary }}
                          />

                          <div
                              className="p-8 bg-white/5 border-2 border-white/20 transition-all duration-300"
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = themeColors.primary
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                              }}
                          >
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                              <div>
                                <h3 className="text-2xl md:text-3xl font-bold mb-2">{experience.position}</h3>
                                <p
                                    className="text-xl font-semibold"
                                    style={{ color: themeColors.primary }}
                                >
                                  {experience.company}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 mono text-sm text-gray-400">
                                <Calendar className="w-4 h-4" />
                                {formatExperienceDuration(experience.startDate, experience.endDate, experience.isCurrentlyWorking)}
                              </div>
                            </div>

                            <p className="text-gray-300 mb-6 leading-relaxed">{experience.description}</p>

                            {/* Technologies */}
                            <div className="flex flex-wrap gap-2">
                              {experience.technologies.map((tech, techIndex) => (
                                  <span
                                      key={techIndex}
                                      className="px-3 py-1 bg-white/10 border border-white/20 text-sm mono"
                                  >
                            {tech}
                          </span>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                    ))}
                  </div>
                </div>
              </section>
          )}

          {/* Certifications Section - Cards */}
          {isSectionVisible('certifications') && safeProfile.certifications && safeProfile.certifications.length > 0 && (
              <section className="relative py-20 md:py-24 px-6 md:px-12 lg:px-24 border-t-4 border-white/10" style={{ order: getSectionOrder('certifications') }}>
                <div className="max-w-7xl mx-auto">
                  <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6 }}
                      className="mb-16"
                  >
                    <div
                        className="inline-block px-6 py-3 text-black font-bold text-sm tracking-wider mono mb-4"
                        style={{ backgroundColor: themeColors.primary }}
                    >
                      ACHIEVEMENTS
                    </div>
                    <h2 className="text-5xl md:text-7xl font-extrabold">Certifications</h2>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {safeProfile.certifications.map((cert, index) => (
                        <motion.div
                            key={cert.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            whileHover={{ y: -5 }}
                            className="group p-8 bg-white/5 border-2 border-white/20 transition-all duration-300 relative overflow-hidden"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = themeColors.secondary
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                            }}
                        >
                          <div className="absolute top-4 right-4">
                            <Award
                                className="w-8 h-8 transition-colors"
                                style={{
                                  color: `rgba(${themeColors.secondaryRgb}, 0.2)`
                                }}
                            />
                          </div>

                          <h3 className="text-xl font-bold mb-2 pr-12">{cert.name}</h3>
                          <p className="text-gray-400 mb-4">{cert.issuer}</p>
                          <div className="flex items-center justify-between">
                            <span className="mono text-sm text-gray-500">{cert.date}</span>
                            {cert.credentialUrl && (
                                <Link
                                    href={cert.credentialUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 transition-colors mono text-xs font-bold"
                                    style={{ color: themeColors.secondary }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.opacity = '0.8'
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.opacity = '1'
                                    }}
                                >
                                  VIEW
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                            )}
                          </div>
                        </motion.div>
                    ))}
                  </div>
                </div>
              </section>
          )}

          {/* Research Section - List */}
          {isSectionVisible('research') && safeProfile.researches && safeProfile.researches.length > 0 && (
              <section className="relative py-20 md:py-24 px-6 md:px-12 lg:px-24 border-t-4 border-white/10" style={{ order: getSectionOrder('research') }}>
                <div className="max-w-7xl mx-auto">
                  <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6 }}
                      className="mb-16"
                  >
                    <div
                        className="inline-block px-6 py-3 text-black font-bold text-sm tracking-wider mono mb-4"
                        style={{ backgroundColor: themeColors.secondary }}
                    >
                      RESEARCH
                    </div>
                    <h2 className="text-5xl md:text-7xl font-extrabold">Publications</h2>
                  </motion.div>

                  <div className="space-y-6">
                    {safeProfile.researches.slice(0, 4).map((research, index) => (
                        <motion.div
                            key={research.id}
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                          <Link
                              href={research.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group block p-8 bg-white/5 border-2 border-white/20 transition-all duration-300"
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = themeColors.primary
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                              }}
                          >
                            <div className="flex items-start justify-between gap-6">
                              <div className="flex-1">
                                <h3
                                    className="text-2xl font-bold mb-3 transition-colors"
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.color = themeColors.primary
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.color = 'white'
                                    }}
                                >
                                  {research.title}
                                </h3>
                                <p className="text-gray-400 leading-relaxed mb-4">{research.description}</p>
                                <span className="mono text-sm text-gray-500">
                            {new Date(research.publishedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              timeZone: 'UTC'
                            })}
                          </span>
                              </div>
                              <ArrowUpRight
                                  className="w-6 h-6 text-gray-500 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-all flex-shrink-0"
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = themeColors.primary
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = '#6b7280'
                                  }}
                              />
                            </div>
                          </Link>
                        </motion.div>
                    ))}
                  </div>
                </div>
              </section>
          )}

          </div>

          {renderContactCta('editorial')}

          {/* Footer */}
          <footer className="relative py-16 px-6 md:px-12 lg:px-24 border-t-4 border-white/10">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                  <h3 className="text-3xl font-black mb-2">{safeProfile.name}</h3>
                  <p className="text-gray-500 mono text-sm">© {currentYear} All rights reserved</p>
                  <p className="text-gray-400 mono text-xs mt-1">Designed with DevLink</p>
                </div>

                {hasSocialLinks && (
                    <div className="flex gap-4">
                      {socialLinkEntries.map(([platform, url]) => {
                        const Icon = socialIcons[platform as keyof typeof socialIcons]
                        if (!Icon || !url) return null
                        return (
                            <Link
                                key={platform}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-12 h-12 flex items-center justify-center border-2 border-white/20 transition-all"
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = themeColors.primary
                                  e.currentTarget.style.backgroundColor = `rgba(${themeColors.primaryRgb}, 0.1)`
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                            >
                              <Icon className="w-5 h-5" />
                            </Link>
                        )
                      })}
                    </div>
                )}
              </div>
            </div>
          </footer>

          {showSignature && (
            <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[120] pointer-events-none">
              <Link
                href="/"
                className="pointer-events-auto group inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] shadow-lg backdrop-blur-md transition-transform duration-200 hover:-translate-y-0.5"
                style={{
                  background: themeColors.gradient,
                  borderColor: themeColors.primary,
                  color: themeColors.badgeText,
                  boxShadow: `0 18px 40px rgba(${themeColors.primaryRgb}, 0.35)`
                }}
                aria-label="Designed with DevLink"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: themeColors.secondary }}
                />
                Designed with DevLink
              </Link>
            </div>
          )}
        </div>
        {showSharePanel ? renderSharePanel() : null}
      </>
  )
}
