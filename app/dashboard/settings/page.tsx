'use client'

import { useState, useEffect } from 'react'
import type { Profile } from '@/components/public-profile/profile'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Save, Palette, Moon, Sun, Monitor, Trash2, AlertTriangle, X, Check } from 'lucide-react'
import PortfolioMockPreview from '@/components/PortfolioMockPreview'
import PortfolioLivePreview from '@/components/PortfolioLivePreview'
import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import DashboardLayout from '@/components/dashboard/layout'
import toast from 'react-hot-toast'

const themes = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean and professional design with modern elements',
    preview: 'bg-gradient-to-br from-blue-500 to-cyan-500'
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Sleek dark theme perfect for developers',
    preview: 'bg-gradient-to-br from-gray-800 to-gray-900'
  },
  {
    id: 'gradient',
    name: 'Gradient',
    description: 'Vibrant gradient design with bold colors',
    preview: 'bg-gradient-to-br from-purple-500 to-pink-500'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and clean design focused on content',
    preview: 'bg-gradient-to-br from-gray-400 to-gray-600'
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Deep blue ocean-inspired theme with calm vibes',
    preview: 'bg-gradient-to-br from-blue-600 to-teal-600'
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm orange and red gradient like a beautiful sunset',
    preview: 'bg-gradient-to-br from-orange-500 to-red-500'
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Nature-inspired green theme for eco-conscious developers',
    preview: 'bg-gradient-to-br from-green-600 to-emerald-600'
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep purple and blue for night owls',
    preview: 'bg-gradient-to-br from-indigo-800 to-purple-900'
  },
  {
    id: 'coral',
    name: 'Coral',
    description: 'Vibrant coral and pink for creative developers',
    preview: 'bg-gradient-to-br from-pink-400 to-rose-500'
  },
  {
    id: 'steel',
    name: 'Steel',
    description: 'Industrial gray and silver for technical portfolios',
    preview: 'bg-gradient-to-br from-slate-600 to-gray-700'
  },
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Northern lights inspired with green and blue',
    preview: 'bg-gradient-to-br from-emerald-400 to-cyan-500'
  },
  {
    id: 'fire',
    name: 'Fire',
    description: 'Hot red and orange for passionate developers',
    preview: 'bg-gradient-to-br from-red-600 to-orange-600'
  },
  {
    id: 'lavender',
    name: 'Lavender',
    description: 'Soft purple theme for elegant portfolios',
    preview: 'bg-gradient-to-br from-purple-400 to-violet-500'
  },
  {
    id: 'sapphire',
    name: 'Sapphire',
    description: 'Rich blue theme for professional developers',
    preview: 'bg-gradient-to-br from-blue-700 to-indigo-700'
  },
  {
    id: 'amber',
    name: 'Amber',
    description: 'Golden amber theme for experienced developers',
    preview: 'bg-gradient-to-br from-amber-500 to-yellow-500'
  }
]

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  const [selectedTheme, setSelectedTheme] = useState('modern')
  const [username, setUsername] = useState('')
// Fallback mock profile for preview if profileData is incomplete
  const emptyProfile: Profile = {
    username: '',
    name: '',
    bio: '',
    skills: [],
    profileImage: '',
    profilePhoto: {},
    socialLinks: {},
    theme: selectedTheme,
    projects: [],
    experiences: [],
    certifications: [],
    blogs: []
  }
  const [profileData, setProfileData] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [updatingUsername, setUpdatingUsername] = useState(false)
  const [showUsernameConfirm, setShowUsernameConfirm] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const checkUsernameAvailability = async (value: string) => {
  if (!value || value.length < 3 || value === (profileData?.username ?? '')) {
      setUsernameAvailable(null)
      return
    }

    setCheckingUsername(true)
    try {
      const response = await fetch('/api/username/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: value })
      })
      
      const data = await response.json()
      setUsernameAvailable(data.available)
    } catch (error) {
      console.error('Error checking username:', error)
      setUsernameAvailable(null)
    } finally {
      setCheckingUsername(false)
    }
  }

  const handleUsernameChange = (value: string) => {
    // Clean username: only lowercase letters and numbers, no symbols
    const cleaned = value.toLowerCase().replace(/[^a-z0-9]/g, '')
    setUsername(cleaned)
    
    // Debounce username check
    const timeoutId = setTimeout(() => checkUsernameAvailability(cleaned), 500)
    return () => clearTimeout(timeoutId)
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setSelectedTheme(data.theme || 'modern')
        setUsername(data.username || '')
        setProfileData(data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTheme = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: selectedTheme })
      })

      if (response.ok) {
        toast.success('Theme updated successfully!')
      } else {
        toast.error('Failed to update theme')
      }
    } catch (error) {
      console.error('Error updating theme:', error)
      toast.error('Failed to update theme')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateUsername = async () => {
    if (!username || username === profileData?.username) {
      return
    }

    // Validate username format
    if (!/^[a-z][a-z0-9]*[a-z][a-z0-9]*$|^[a-z][a-z0-9]*$/.test(username)) {
      toast.error('Username must start with a letter, contain at least one letter, and only use lowercase letters and numbers')
      return
    }

    // Check if username is available
    try {
      const checkResponse = await fetch('/api/username/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      })
      
      const checkData = await checkResponse.json()
      if (!checkData.available) {
        toast.error('Username is already taken')
        return
      }
    } catch (error) {
      toast.error('Failed to check username availability')
      return
    }

    // Show confirmation modal
    setNewUsername(username)
    setShowUsernameConfirm(true)
  }

  const confirmUsernameUpdate = async () => {
    setUpdatingUsername(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Username updated successfully!')
        
        // Update local state
        setProfileData(prev => ({
          username: newUsername,
          name: prev?.name ?? '',
          bio: prev?.bio ?? '',
          skills: prev?.skills ?? [],
          profileImage: prev?.profileImage ?? '',
          profilePhoto: prev?.profilePhoto ?? {},
          socialLinks: prev?.socialLinks ?? {},
          theme: prev?.theme ?? selectedTheme,
          projects: prev?.projects ?? [],
          experiences: prev?.experiences ?? [],
          certifications: prev?.certifications ?? [],
          blogs: prev?.blogs ?? []
        }))
        setUsername(newUsername)
        
        // Update session to reflect new username
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            username: newUsername
          }
        })
        
        // Close modal
        setShowUsernameConfirm(false)
        
        // Redirect to new profile URL after a short delay
        setTimeout(() => {
          router.push(`/${newUsername}`)
        }, 1000)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to update username')
      }
    } catch (error) {
      console.error('Error updating username:', error)
      toast.error('Failed to update username')
    } finally {
      setUpdatingUsername(false)
    }
  }

  const handleDeletePortfolio = async () => {
    setDeleting(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Portfolio deleted successfully')
        // Sign out the user and redirect to home page
        await signOut({ callbackUrl: '/' })
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to delete portfolio')
      }
    } catch (error) {
      console.error('Error deleting portfolio:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">
              Customize your portfolio appearance and account settings
            </p>
          </div>
        </div>

        {/* Theme Palette in 5 columns x 3 rows */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-6 w-6 text-blue-600" />
              Portfolio Theme
            </CardTitle>
            <CardDescription>
              Instantly preview your portfolio as you select a theme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedTheme} onValueChange={setSelectedTheme} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {themes.map((theme) => (
                <label key={theme.id} className={`cursor-pointer group block rounded-lg border-2 p-3 transition-all duration-150 ${selectedTheme === theme.id ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-blue-300'}`}
                  htmlFor={theme.id}
                >
                  <div className={`w-full h-16 rounded-lg mb-2 ${theme.preview} transition-all duration-150`} />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 group-hover:text-blue-600">{theme.name}</span>
                    <RadioGroupItem value={theme.id} id={theme.id} className="ml-2" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{theme.description}</p>
                </label>
              ))}
            </RadioGroup>
            <Button 
              onClick={handleSaveTheme} 
              disabled={saving}
              className="w-full flex items-center gap-2 mt-6"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Theme
            </Button>
          </CardContent>
        </Card>

        {/* Portfolio Preview directly below theme options */}
        <Card className="mt-8 w-full">
          <CardHeader>
            <CardTitle>Portfolio Preview</CardTitle>
            <CardDescription>
              See your portfolio update in real-time as you change the theme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[70vh] overflow-y-auto bg-gray-100 rounded-lg border border-gray-200">
               <PortfolioLivePreview profile={profileData ?? emptyProfile} themeId={selectedTheme} />
            </div>
          </CardContent>
        </Card>

        {/* Account Settings & Danger Zone below preview */}
        <div className="space-y-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio URL</CardTitle>
              <CardDescription>
                Your unique portfolio URL that visitors will use
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">devlink.vercel.io/</span>
                  <div className="flex-1 relative">
                    <Input 
                      value={username} 
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      className="pr-10"
                      placeholder="your-username"
                    />
                    {checkingUsername && (
                      <div className="absolute right-3 top-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      </div>
                    )}
                    {!checkingUsername && usernameAvailable === true && (
                      <Check className="absolute right-3 top-3 h-4 w-4 text-green-600" />
                    )}
                    {!checkingUsername && usernameAvailable === false && (
                      <X className="absolute right-3 top-3 h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <Button 
                    onClick={handleUpdateUsername}
                    disabled={!username || username === profileData?.username || updatingUsername || usernameAvailable === false}
                    size="sm"
                  >
                    {updatingUsername ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      'Update'
                    )}
                  </Button>
                </div>
                <div className="text-sm">
                  <p className="text-gray-600 mb-2">
                    Choose a unique username for your portfolio. Username must start with a letter and contain only lowercase letters and numbers.
                  </p>
                  {username && username !== profileData?.username && (
                    <div className="space-y-2">
                      <p className="text-gray-600">
                        New portfolio URL will be:
                      </p>
                      <p className="font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        devlink.vercel.io/{username}
                      </p>
                      {usernameAvailable === true && (
                        <p className="text-green-600">✓ Username is available!</p>
                      )}
                      {usernameAvailable === false && (
                        <p className="text-red-600">✗ Username is already taken</p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-gray-500 mt-2">
                  <p>• Must start with a letter</p>
                  <p>• Must contain at least one letter</p>
                  <p>• Only lowercase letters and numbers allowed</p>
                  <p>• No symbols or special characters</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h3 className="font-medium text-red-800 mb-2">Delete Portfolio</h3>
                  <p className="text-sm text-red-700 mb-4">
                    This will permanently delete your portfolio, all your projects, experiences, and data. This action cannot be undone.
                  </p>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="flex items-center gap-2"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Portfolio
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-700">Delete Portfolio</h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">This action cannot be undone</p>
                  <p className="text-sm text-gray-600">This will permanently delete your account and all data.</p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  <strong>What will be deleted:</strong>
                </p>
                <ul className="text-sm text-red-700 mt-2 space-y-1">
                  <li>• Your profile and portfolio</li>
                  <li>• All projects, experiences, and certifications</li>
                  <li>• Your account and authentication data</li>
                  <li>• All associated data and files</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeletePortfolio}
                className="flex-1"
                disabled={deleting}
              >
                {deleting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {deleting ? 'Deleting...' : 'Delete Forever'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Username Update Confirmation Modal */}
      {showUsernameConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-700">Confirm Username Change</h3>
              <button
                onClick={() => setShowUsernameConfirm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-900">
                Are you sure you want to change your username from <strong>{profileData?.username}</strong> to <strong>{newUsername}</strong>?
              </p>
              <p className="text-sm text-gray-600">
                This will update your portfolio URL and cannot be undone immediately.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowUsernameConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmUsernameUpdate}
                className="flex-1"
                disabled={updatingUsername}
              >
                {updatingUsername ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {updatingUsername ? 'Updating...' : 'Confirm Change'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  )
}
