'use client'

import { useState, useEffect } from 'react'
import type { Profile } from '@/components/public-profile/profile'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Save, Trash2, AlertTriangle, X, Check, Download, FileText, Lock, KeyRound, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import toast from 'react-hot-toast'
import { isValidUsername, normalizeUsernameInput, USERNAME_VALIDATION_MESSAGE } from '@/lib/username'
import { useSiteUrl } from '@/hooks/use-site-url'

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [profileData, setProfileData] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [updatingUsername, setUpdatingUsername] = useState(false)
  const [showUsernameConfirm, setShowUsernameConfirm] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const siteUrl = useSiteUrl()
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [updatingPin, setUpdatingPin] = useState(false)
  const [regeneratingCodes, setRegeneratingCodes] = useState(false)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  useEffect(() => {
    if (!profileData) {
      return
    }

    if (!username || username === profileData.username) {
      setUsernameAvailable(null)
      return
    }

    if (!isValidUsername(username)) {
      setUsernameAvailable(null)
      return
    }

    let active = true
    const timeoutId = setTimeout(async () => {
      setCheckingUsername(true)
      try {
        const response = await fetch('/api/username/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        })

        const data = await response.json()
        if (active) {
          setUsernameAvailable(Boolean(data?.available))
        }
      } catch (error) {
        if (active) {
          setUsernameAvailable(null)
        }
        console.error('Error checking username:', error)
      } finally {
        if (active) {
          setCheckingUsername(false)
        }
      }
    }, 350)

    return () => {
      active = false
      clearTimeout(timeoutId)
    }
  }, [username, profileData])

  const handleUsernameChange = (value: string) => {
    setUsername(normalizeUsernameInput(value))
    setUsernameAvailable(null)
  }

  const pinEnabled = session?.user?.pinEnabled === true

  const sanitizePinInput = (value: string, length: number = 6) =>
    value.replace(/\D/g, '').slice(0, length)

  const resetPinFields = () => {
    setCurrentPin('')
    setNewPin('')
    setConfirmPin('')
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setUsername(data.username || '')
        setProfileData(data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUsername = async () => {
    const normalizedUsername = normalizeUsernameInput(username)
    if (!normalizedUsername || normalizedUsername === profileData?.username) {
      return
    }

    if (!isValidUsername(normalizedUsername)) {
      toast.error(USERNAME_VALIDATION_MESSAGE)
      return
    }

    try {
      const checkResponse = await fetch('/api/username/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: normalizedUsername })
      })

      const checkData = await checkResponse.json()
      if (!checkData.available) {
        toast.error(checkData?.message || 'Username is already taken')
        return
      }
    } catch (error) {
      toast.error('Failed to check username availability')
      return
    }

    setNewUsername(normalizedUsername)
    setUsername(normalizedUsername)
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
          theme: prev?.theme ?? 'modern',
          template: prev?.template ?? 'editorial',
          projects: prev?.projects ?? [],
          experiences: prev?.experiences ?? [],
          certifications: prev?.certifications ?? [],
          researches: prev?.researches ?? [],
          testimonials: prev?.testimonials ?? []
        }))
        setUsername(newUsername)

        // Update session to reflect new username
        await updateSession({ username: newUsername })

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

  const handleSetPin = async () => {
    if (newPin.length !== 6 || confirmPin.length !== 6) {
      toast.error('PIN must be exactly 6 digits')
      return
    }
    if (newPin !== confirmPin) {
      toast.error('PIN confirmation does not match')
      return
    }

    setUpdatingPin(true)
    try {
      const response = await fetch('/api/security/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: newPin })
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to set PIN')
      }

      toast.success('Security PIN enabled!')
      setRecoveryCodes(data.recoveryCodes || [])
      setShowRecoveryCodes(true)
      resetPinFields()
      await updateSession({ pinEnabled: true, pinVerified: true })
    } catch (error) {
      console.error('Error setting PIN:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to set PIN')
    } finally {
      setUpdatingPin(false)
    }
  }

  const handleChangePin = async () => {
    if (currentPin.length !== 6 || newPin.length !== 6 || confirmPin.length !== 6) {
      toast.error('PIN must be exactly 6 digits')
      return
    }
    if (newPin !== confirmPin) {
      toast.error('PIN confirmation does not match')
      return
    }

    setUpdatingPin(true)
    try {
      const response = await fetch('/api/security/pin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin, newPin })
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to update PIN')
      }

      toast.success('Security PIN updated!')
      setRecoveryCodes(data.recoveryCodes || [])
      setShowRecoveryCodes(true)
      resetPinFields()
      await updateSession({ pinEnabled: true, pinVerified: true })
    } catch (error) {
      console.error('Error updating PIN:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update PIN')
    } finally {
      setUpdatingPin(false)
    }
  }

  const handleRegenerateCodes = async () => {
    if (currentPin.length !== 6) {
      toast.error('Enter your current PIN to regenerate recovery codes')
      return
    }

    setRegeneratingCodes(true)
    try {
      const response = await fetch('/api/security/pin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin })
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to regenerate recovery codes')
      }

      toast.success('Recovery codes regenerated')
      setRecoveryCodes(data.recoveryCodes || [])
      setShowRecoveryCodes(true)
    } catch (error) {
      console.error('Error regenerating recovery codes:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to regenerate recovery codes')
    } finally {
      setRegeneratingCodes(false)
    }
  }

  const handleCopyRecoveryCodes = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'))
      toast.success('Recovery codes copied')
    } catch (error) {
      toast.error('Unable to copy recovery codes')
    }
  }

  if (loading) {
    return (
      
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and critical portfolio actions
            </p>
          </div>
        </div>

        <div className="space-y-6">
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
                  <span className="text-muted-foreground">{siteUrl}/</span>
                  <div className="flex-1 relative">
                    <Input
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      className="pr-10"
                      placeholder="yourusername"
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
                    disabled={!username || username === profileData?.username || updatingUsername || checkingUsername || usernameAvailable === false}
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
                  <p className="text-muted-foreground mb-2">
                    Choose a unique username for your portfolio. Username must start with a letter and contain only lowercase letters and numbers.
                  </p>
                  {username && username !== profileData?.username && (
                    <div className="space-y-2">
                      <p className="text-muted-foreground">
                        New portfolio URL will be:
                      </p>
                      <p className="font-mono text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2 py-1 rounded">
                        {siteUrl}/{username}
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

                <div className="text-xs text-muted-foreground mt-2">
                  <p>• Must start with a letter</p>
                  <p>• Only lowercase letters and numbers allowed</p>
                  <p>• No symbols or special characters</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resume Export
              </CardTitle>
              <CardDescription>
                Download your current portfolio data as a resume PDF.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-muted-foreground">
                The exported PDF includes your profile summary, skills, projects, experience, certifications, and research.
              </p>
              <Button asChild>
                <a href="/api/profile/resume" target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security PIN
              </CardTitle>
              <CardDescription>
                Require a 6-digit PIN after signing in for an extra layer of security.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                <div className="rounded-lg border border-border bg-muted/40 p-4">
                  <p className="text-sm font-medium text-foreground">
                    {pinEnabled ? 'PIN protection is enabled.' : 'PIN protection is not enabled yet.'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    If you forget your PIN and don’t have recovery codes, the only option is to delete your account.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {pinEnabled && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground" htmlFor="current-pin">
                        Current PIN
                      </label>
                      <Input
                        id="current-pin"
                        type="password"
                        inputMode="numeric"
                        value={currentPin}
                        onChange={(e) => setCurrentPin(sanitizePinInput(e.target.value))}
                        placeholder="Enter current 6-digit PIN"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="new-pin">
                      {pinEnabled ? 'New PIN' : 'Set PIN'}
                    </label>
                    <Input
                      id="new-pin"
                      type="password"
                      inputMode="numeric"
                      value={newPin}
                      onChange={(e) => setNewPin(sanitizePinInput(e.target.value))}
                      placeholder="Enter 6-digit PIN"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="confirm-pin">
                      Confirm PIN
                    </label>
                    <Input
                      id="confirm-pin"
                      type="password"
                      inputMode="numeric"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(sanitizePinInput(e.target.value))}
                      placeholder="Re-enter PIN"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={pinEnabled ? handleChangePin : handleSetPin}
                    disabled={updatingPin}
                    className="flex items-center gap-2"
                  >
                    {updatingPin ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <KeyRound className="h-4 w-4" />
                    )}
                    {pinEnabled ? 'Update PIN' : 'Enable PIN'}
                  </Button>

                  {pinEnabled && (
                    <Button
                      variant="outline"
                      onClick={handleRegenerateCodes}
                      disabled={regeneratingCodes}
                      className="flex items-center gap-2"
                    >
                      {regeneratingCodes ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground" />
                      ) : (
                        <KeyRound className="h-4 w-4" />
                      )}
                      Regenerate Recovery Codes
                    </Button>
                  )}
                </div>

                {showRecoveryCodes && recoveryCodes.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-4 space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                        Save these recovery codes now
                      </p>
                      <p className="text-xs text-amber-800 dark:text-amber-300">
                        Each code can be used to reset your PIN if you forget it.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono text-amber-900 dark:text-amber-100">
                      {recoveryCodes.map((code) => (
                        <span key={code} className="rounded bg-white/70 dark:bg-white/10 px-2 py-1 text-center">
                          {code}
                        </span>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={handleCopyRecoveryCodes} className="flex items-center gap-2">
                      <Copy className="h-4 w-4" />
                      Copy Codes
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-red-600 dark:text-red-300">
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                  <h3 className="font-medium text-red-800 dark:text-red-200 mb-2">
                    Delete Portfolio
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                    This will permanently delete your portfolio, all your projects, experiences,
                    and data. This action cannot be undone.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-2 dark:hover:bg-red-700"
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card rounded-lg p-6 max-w-md w-full border border-border"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">Delete Portfolio</h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-300" />
                </div>
                <div>
                  <p className="font-medium text-foreground">This action cannot be undone</p>
                  <p className="text-sm text-muted-foreground">This will permanently delete your account and all data.</p>
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-800 dark:text-red-200">
                  <strong>What will be deleted:</strong>
                </p>
                <ul className="text-sm text-red-700 dark:text-red-300 mt-2 space-y-1">
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card rounded-lg p-6 max-w-md w-full border border-border"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300">Confirm Username Change</h3>
              <button
                onClick={() => setShowUsernameConfirm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-foreground">
                Are you sure you want to change your username from <strong>{profileData?.username}</strong> to <strong>{newUsername}</strong>?
              </p>
              <p className="text-sm text-muted-foreground">
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
    </>
  )
}
