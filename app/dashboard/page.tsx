'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Settings, Eye, ExternalLink, BarChart3, Palette, CircleDashed, CheckCircle2, TrendingUp, Mail, Activity, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import Link from 'next/link'
import DashboardLayout from '@/components/dashboard/layout'
import { calculateProfileCompletion } from '@/lib/profile-completion'
import { useSiteUrl } from '@/hooks/use-site-url'

interface Profile {
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
  projects: any[]
  experiences: any[]
  certifications: any[]
  researches: any[]
  testimonials?: any[]
  theme: string
  template?: string
  isPublished?: boolean
  lastPublishedAt?: string | null
  lastPublishedSnapshot?: {
    name?: string
    bio?: string
    skillsCount?: number
    projectsCount?: number
    experiencesCount?: number
    certificationsCount?: number
    researchesCount?: number
    testimonialsCount?: number
    socialLinksCount?: number
    hasPhoto?: boolean
    theme?: string
    template?: string
  }
  updatedAt?: string
  sectionSettings?: Array<{
    id: string
    visible: boolean
  }>
}

interface AnalyticsSummary {
  rangeStart: string
  rangeEnd: string
  views: number
  uniqueVisitors: number
  topReferrers: Array<{ referrer: string; count: number }>
  topProjects: Array<{ projectId: string; title: string; count: number }>
}

interface InquiryItem {
  _id: string
  name: string
  email: string
  message: string
  status: 'new' | 'replied'
  createdAt: string
}

interface ActivityItem {
  _id: string
  message: string
  createdAt: string
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [inquiries, setInquiries] = useState<InquiryItem[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [publishSaving, setPublishSaving] = useState(false)
  const siteUrl = useSiteUrl()

  // Type guard for session user
  const hasUsername = (session: any): session is { user: { username: string } } => {
    return typeof session?.user?.username === 'string' && session.user.username.trim().length > 0
  }

  useEffect(() => {
    if (status === 'loading') return // Still loading session

    if (status === 'unauthenticated') {
      router.push('/auth/signin?from=/dashboard')
      return
    }

    if (status === 'authenticated') {
      if (session?.user?.onboardingCompleted === false) {
        router.push('/dashboard/setup')
        return
      }
      if (hasUsername(session)) {
        fetchProfile()
      } else {
        // User is authenticated but doesn't have username, redirect to setup
        router.push('/dashboard/setup')
        return
      }
    }
  }, [session, status, router])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics?days=30')
      if (!response.ok) return
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const fetchInquiries = async () => {
    try {
      const response = await fetch('/api/inquiries?limit=6')
      if (!response.ok) return
      const data = await response.json()
      setInquiries(Array.isArray(data?.inquiries) ? data.inquiries : [])
    } catch (error) {
      console.error('Error fetching inquiries:', error)
    }
  }

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/activity?limit=8')
      if (!response.ok) return
      const data = await response.json()
      setActivities(Array.isArray(data?.activities) ? data.activities : [])
    } catch (error) {
      console.error('Error fetching activity:', error)
    }
  }

  const refreshInsights = async () => {
    setInsightsLoading(true)
    await Promise.all([fetchAnalytics(), fetchInquiries(), fetchActivities()])
    setInsightsLoading(false)
  }

  useEffect(() => {
    if (!profile?.username) return
    refreshInsights()
  }, [profile?.username])

  const handlePublishToggle = async (nextValue: boolean) => {
    if (!profile) return
    setPublishSaving(true)
    try {
      const response = await fetch('/api/profile/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: nextValue }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to update publish status')
      }

      const data = await response.json()
      if (data?.profile) {
        setProfile(data.profile)
      }
      await fetchActivities()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update publish status')
    } finally {
      setPublishSaving(false)
    }
  }

  const handleInquiryStatus = async (id: string, status: 'new' | 'replied') => {
    try {
      const response = await fetch(`/api/inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to update inquiry')
      }
      setInquiries((prev) =>
        prev.map((item) => item._id === id ? { ...item, status } : item)
      )
      await fetchActivities()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update inquiry')
    }
  }

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  const countSocialLinks = (links?: Profile['socialLinks']) => {
    if (!links) return 0
    let count = 0
    if (typeof links.github === 'string' && links.github.trim()) count += 1
    if (typeof links.linkedin === 'string' && links.linkedin.trim()) count += 1
    if (typeof links.twitter === 'string' && links.twitter.trim()) count += 1
    if (typeof links.website === 'string' && links.website.trim()) count += 1
    return count
  }

  const hasProfilePhoto = (source?: Profile | null) => {
    if (!source) return false
    const candidate = source.profilePhoto?.url || source.profileImage
    return typeof candidate === 'string' && candidate.trim().length > 0
  }

  const stats = profile ? [
    { label: 'Projects', value: profile.projects.length, color: 'bg-blue-500' },
    { label: 'Experiences', value: profile.experiences.length, color: 'bg-green-500' },
    { label: 'Certifications', value: profile.certifications.length, color: 'bg-purple-500' },
    { label: 'Research Papers', value: profile.researches.length, color: 'bg-orange-500' },
    { label: 'Testimonials', value: profile.testimonials?.length ?? 0, color: 'bg-rose-500' },
  ] : []

  const completion = profile ? calculateProfileCompletion(profile) : null
  const pendingSteps = completion?.steps.filter((step) => !step.completed) ?? []
  const isPublished = profile?.isPublished !== false

  const publishChanges = (() => {
    if (!profile?.lastPublishedSnapshot) return []
    const snapshot = profile.lastPublishedSnapshot
    const changes: string[] = []

    const diff = (label: string, current: number, previous: number | undefined) => {
      if (typeof previous !== 'number') return
      const delta = current - previous
      if (delta > 0) changes.push(`Added ${delta} ${label}${delta > 1 ? 's' : ''}`)
      if (delta < 0) changes.push(`Removed ${Math.abs(delta)} ${label}${delta < -1 ? 's' : ''}`)
    }

    diff('project', profile.projects.length, snapshot.projectsCount)
    diff('experience', profile.experiences.length, snapshot.experiencesCount)
    diff('certification', profile.certifications.length, snapshot.certificationsCount)
    diff('research paper', profile.researches.length, snapshot.researchesCount)
    diff('testimonial', profile.testimonials?.length ?? 0, snapshot.testimonialsCount)
    diff('skill', profile.skills.length, snapshot.skillsCount)

    const socialCount = countSocialLinks(profile.socialLinks)
    if (typeof snapshot.socialLinksCount === 'number' && snapshot.socialLinksCount !== socialCount) {
      changes.push('Updated social links')
    }

    if (typeof snapshot.bio === 'string' && snapshot.bio !== profile.bio) {
      changes.push('Updated bio')
    }

    if (snapshot.theme && profile.theme && snapshot.theme !== profile.theme) {
      changes.push(`Theme changed to ${profile.theme}`)
    }

    if (snapshot.template && profile.template && snapshot.template !== profile.template) {
      changes.push(`Template changed to ${profile.template}`)
    }

    const photoNow = hasProfilePhoto(profile)
    if (typeof snapshot.hasPhoto === 'boolean' && snapshot.hasPhoto !== photoNow) {
      changes.push(photoNow ? 'Added profile photo' : 'Removed profile photo')
    }

    return changes
  })()

  const actionableTasks = (() => {
    if (!profile) return []
    const tasks: Array<{ title: string; description: string; href: string }> = []

    const skillsMissing = Math.max(0, 5 - profile.skills.length)
    if (skillsMissing > 0) {
      tasks.push({
        title: `Add ${skillsMissing} skill${skillsMissing > 1 ? 's' : ''}`,
        description: 'Boost your visibility and skill coverage.',
        href: '/dashboard/profile',
      })
    }

    const projectsMissing = Math.max(0, 2 - profile.projects.length)
    if (projectsMissing > 0) {
      tasks.push({
        title: `Add ${projectsMissing} project${projectsMissing > 1 ? 's' : ''}`,
        description: 'Showcase real work and outcomes.',
        href: '/dashboard/projects',
      })
    }

    if (profile.experiences.length === 0) {
      tasks.push({
        title: 'Add an experience',
        description: 'Add your latest role or internship.',
        href: '/dashboard/experience',
      })
    }

    const testimonialsCount = profile.testimonials?.length ?? 0
    if (testimonialsCount === 0) {
      tasks.push({
        title: 'Request a testimonial',
        description: 'Social proof helps profiles convert.',
        href: '/dashboard/testimonials',
      })
    }

    const socialLinksMissing = Math.max(0, 2 - countSocialLinks(profile.socialLinks))
    if (socialLinksMissing > 0) {
      tasks.push({
        title: `Add ${socialLinksMissing} social link${socialLinksMissing > 1 ? 's' : ''}`,
        description: 'Make it easy for visitors to reach you.',
        href: '/dashboard/profile',
      })
    }

    if (!hasProfilePhoto(profile)) {
      tasks.push({
        title: 'Upload a profile photo',
        description: 'Profiles with photos build more trust.',
        href: '/dashboard/profile',
      })
    }

    if ((profile.bio || '').length < 120) {
      tasks.push({
        title: 'Expand your bio',
        description: 'Aim for 120+ characters for clarity.',
        href: '/dashboard/profile',
      })
    }

    return tasks.slice(0, 3)
  })()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {profile?.name || 'Developer'}! 👋
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/${profile?.username}`} target="_blank">
              <Button variant="outline" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                View Portfolio
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
            <Link href="/dashboard/profile">
              <Button>
                <Settings className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Portfolio Analytics
              </CardTitle>
              <CardDescription>
                {analytics
                  ? `Last 30 days · ${new Date(analytics.rangeStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(analytics.rangeEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                  : 'Track views, referrers, and project clicks.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm text-muted-foreground">Views</p>
                  <p className="text-2xl font-bold text-foreground">{analytics?.views ?? 0}</p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm text-muted-foreground">Unique visitors</p>
                  <p className="text-2xl font-bold text-foreground">{analytics?.uniqueVisitors ?? 0}</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Top referrers</p>
                  {analytics?.topReferrers?.length ? (
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {analytics.topReferrers.map((referrer) => (
                        <li key={referrer.referrer} className="flex items-center justify-between">
                          <span>{referrer.referrer}</span>
                          <span className="font-medium text-foreground">{referrer.count}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {insightsLoading ? 'Loading analytics...' : 'No referrers yet.'}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Most clicked projects</p>
                  {analytics?.topProjects?.length ? (
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {analytics.topProjects.map((project) => (
                        <li key={project.projectId} className="flex items-center justify-between">
                          <span>{project.title}</span>
                          <span className="font-medium text-foreground">{project.count}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {insightsLoading ? 'Loading analytics...' : 'No project clicks yet.'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-rose-500" />
                Inquiry Inbox
              </CardTitle>
              <CardDescription>Latest messages from your public profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {inquiries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {insightsLoading ? 'Loading inquiries...' : 'No inquiries yet.'}
                </p>
              ) : (
                inquiries.map((inquiry) => {
                  const subject = encodeURIComponent(`Re: ${profile?.name || 'DevLink'} portfolio inquiry`)
                  return (
                    <div key={inquiry._id} className="rounded-lg border border-border p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{inquiry.name}</p>
                          <p className="text-xs text-muted-foreground">{inquiry.email}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={inquiry.status === 'new' ? 'default' : 'secondary'}>
                            {inquiry.status === 'new' ? 'New' : 'Replied'}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(inquiry.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {inquiry.message.length > 140 ? `${inquiry.message.slice(0, 140)}...` : inquiry.message}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                          <a href={`mailto:${inquiry.email}?subject=${subject}`}>Reply</a>
                        </Button>
                        {inquiry.status === 'new' && (
                          <Button size="sm" onClick={() => handleInquiryStatus(inquiry._id, 'replied')}>
                            Mark replied
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

        {completion && (
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-xl">Profile Completion</CardTitle>
                  <CardDescription>
                    Guided setup to make your portfolio stronger and easier to discover.
                  </CardDescription>
                </div>
                <Badge variant={completion.percentage >= 100 ? 'default' : 'secondary'}>
                  {completion.percentage}% complete
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{completion.completedSteps} of {completion.totalSteps} steps done</span>
                  <span>{completion.earnedPoints}/{completion.totalPoints} points</span>
                </div>
                <Progress value={completion.percentage} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingSteps.length > 0 ? (
                pendingSteps.slice(0, 4).map((step) => (
                  <div
                    key={step.id}
                    className="flex flex-col gap-3 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <CircleDashed className="mt-0.5 h-4 w-4 text-blue-600" />
                      <div>
                        <p className="font-medium text-foreground">{step.title}</p>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                    <Link href={step.href}>
                      <Button variant="outline" size="sm">Complete Step</Button>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="flex items-start gap-3 rounded-lg border border-emerald-300/60 bg-emerald-50/40 p-4 dark:border-emerald-800 dark:bg-emerald-950/25">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="font-medium text-foreground">Portfolio setup complete</p>
                    <p className="text-sm text-muted-foreground">
                      Your profile is fully optimized. Keep it fresh by adding new projects regularly.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Next Best Steps
            </CardTitle>
            <CardDescription>Actionable tasks to improve portfolio quality.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {actionableTasks.length > 0 ? (
              actionableTasks.map((task) => (
                <div
                  key={task.title}
                  className="flex flex-col gap-3 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium text-foreground">{task.title}</p>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  </div>
                  <Link href={task.href}>
                    <Button variant="outline" size="sm">Do it</Button>
                  </Link>
                </div>
              ))
            ) : (
              <div className="flex items-start gap-3 rounded-lg border border-emerald-300/60 bg-emerald-50/40 p-4 dark:border-emerald-800 dark:bg-emerald-950/25">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-medium text-foreground">All set</p>
                  <p className="text-sm text-muted-foreground">
                    You have no urgent tasks right now. Keep your profile fresh with new updates.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/dashboard/projects">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Plus className="h-5 w-5 text-blue-600" />
                  Add Project
                </CardTitle>
                <CardDescription>
                  Showcase your latest work
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/experience">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Plus className="h-5 w-5 text-green-600" />
                  Add Experience
                </CardTitle>
                <CardDescription>
                  Update your work history
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/certifications">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Plus className="h-5 w-5 text-purple-600" />
                  Add Certification
                </CardTitle>
                <CardDescription>
                  Display your achievements
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/customise">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Palette className="h-5 w-5 text-indigo-600" />
                  Customise Portfolio
                </CardTitle>
                <CardDescription>
                  Change template and theme
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                Activity Feed
              </CardTitle>
              <CardDescription>Recent changes and additions to your portfolio.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Last updated {profile?.updatedAt
                  ? new Date(profile.updatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                  : '—'}
              </p>
              {activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity._id} className="rounded-lg border border-border p-3">
                      <p className="text-sm font-medium text-foreground">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {insightsLoading ? 'Loading activity...' : 'No recent activity yet.'}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Portfolio Status
                    {!isPublished ? (
                      <Badge variant="secondary" className="h-5 px-2 text-[10px] uppercase tracking-[0.12em] text-amber-700 dark:text-amber-300">
                        Draft
                      </Badge>
                    ) : null}
                  </CardTitle>
                  <CardDescription>
                    {isPublished ? 'Your portfolio is live at ' : 'Your draft portfolio URL is '}
                    <Link
                      href={`/${profile?.username}`}
                      target="_blank"
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      {siteUrl}/{profile?.username}
                    </Link>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{isPublished ? 'Published' : 'Draft'}</span>
                  <Switch checked={isPublished} onCheckedChange={handlePublishToggle} disabled={publishSaving} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isPublished ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                    <span className="text-sm font-medium text-foreground">{isPublished ? 'Live' : 'Draft'}</span>
                  </div>
                  <Badge variant="secondary">{profile?.theme} theme</Badge>
                  <Badge variant="secondary">{profile?.template || 'editorial'} template</Badge>
                </div>
                <Link href={`/${profile?.username}`} target="_blank">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open
                  </Button>
                </Link>
              </div>

              <div className="rounded-lg border border-border p-4 space-y-2">
                <p className="text-sm font-semibold text-foreground">Changes since last publish</p>
                {profile?.lastPublishedAt ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Last published {new Date(profile.lastPublishedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    {publishChanges.length > 0 ? (
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {publishChanges.slice(0, 4).map((change, index) => (
                          <li key={`${change}-${index}`}>{change}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No changes since last publish.</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Publish your portfolio to start tracking changes.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
