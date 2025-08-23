'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Settings, Eye, ExternalLink, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import DashboardLayout from '@/components/dashboard/layout'

interface Profile {
  username: string
  name: string
  bio: string
  skills: string[]
  projects: any[]
  experiences: any[]
  certifications: any[]
  blogs: any[]
  theme: string
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Type guard for session user
  const hasUsername = (session: any): session is { user: { username: string } } => {
    return session?.user?.username != null
  }

  useEffect(() => {
    if (status === 'loading') return // Still loading session
    
    if (status === 'unauthenticated') {
      router.push('/auth/signin?from=/dashboard')
      return
    }

    if (status === 'authenticated') {
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
    { label: 'Blog Posts', value: profile.blogs.length, color: 'bg-orange-500' },
  ] : []

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

          <Link href="/dashboard/settings">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="h-5 w-5 text-gray-600" />
                  Customize Theme
                </CardTitle>
                <CardDescription>
                  Change your portfolio look
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Portfolio Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Status</CardTitle>
            <CardDescription>
              Your portfolio is live at{' '}
              <Link 
                href={`/${profile?.username}`} 
                target="_blank"
                className="text-blue-600 hover:underline font-medium"
              >
                devlink.vercel.io/{profile?.username}
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">Live</span>
                </div>
                <Badge variant="secondary">{profile?.theme} theme</Badge>
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