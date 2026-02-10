'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Settings, Eye, ExternalLink, BarChart3, Palette, CircleDashed, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
  sectionSettings?: Array<{
    id: string
    visible: boolean
  }>
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
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

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
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

        {/* Portfolio Preview */}
        <Card>
          <CardHeader>
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
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
