'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check, User, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'
import { isValidUsername, normalizeUsernameInput, USERNAME_VALIDATION_MESSAGE } from '@/lib/username'

export default function Setup() {
  const { status, update: updateSession } = useSession()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin?from=/dashboard/setup')
    }
  }, [status, router])

  useEffect(() => {
    if (!username) {
      setIsAvailable(null)
      return
    }

    if (!isValidUsername(username)) {
      setIsAvailable(false)
      return
    }

    let active = true
    const timeoutId = setTimeout(async () => {
      setChecking(true)
      try {
        const response = await fetch('/api/username/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        })
        const data = await response.json()
        if (active) {
          setIsAvailable(Boolean(data?.available))
        }
      } catch (error) {
        if (active) {
          setIsAvailable(null)
        }
        console.error('Error checking username:', error)
      } finally {
        if (active) {
          setChecking(false)
        }
      }
    }, 350)

    return () => {
      active = false
      clearTimeout(timeoutId)
    }
  }, [username])

  const handleUsernameChange = (value: string) => {
    setUsername(normalizeUsernameInput(value))
    setIsAvailable(null)
  }

  const handleSetup = async () => {
    if (status !== 'authenticated') {
      toast.error('Please sign in to continue')
      return
    }

    if (!username || !isAvailable) {
      toast.error('Please choose a valid username')
      return
    }

    if (!isValidUsername(username)) {
      toast.error(USERNAME_VALIDATION_MESSAGE)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        toast.error(data?.error || data?.message || 'Setup failed')
        return
      }

      toast.success(data?.message || 'Setup completed successfully!')
      await updateSession({ username })
      router.replace('/dashboard')
      router.refresh()
    } catch (error) {
      toast.error('An error occurred during setup')
      console.error('Setup error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <User className="h-10 w-10 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Choose Your Username</CardTitle>
            <p className="text-muted-foreground">
              Choose a username that starts with a letter and contains only lowercase letters and numbers.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <Input
                  id="username"
                  placeholder="yourusername"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className="pr-10"
                />
                {checking && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                  </div>
                )}
                {!checking && isAvailable === true && (
                  <Check className="absolute right-3 top-3 h-4 w-4 text-green-600" />
                )}
                {!checking && isAvailable === false && (
                  <div className="absolute right-3 top-3 h-4 w-4 rounded-full bg-red-500" />
                )}
              </div>

              {username && (
                <div className="text-sm space-y-1">
                  <p className="text-muted-foreground">
                    Your portfolio will be available at:
                  </p>
                  <p className="font-mono text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2 py-1 rounded">
                    devlink.vercel.app/{username}
                  </p>
                  {isAvailable === false && (
                    <p className="text-red-600">
                      This username is unavailable or invalid
                    </p>
                  )}
                  {isAvailable === true && (
                    <p className="text-green-600">
                      Username is available!
                    </p>
                  )}
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                <p>• Must start with a letter</p>
                <p>• Only lowercase letters and numbers allowed</p>
                <p>• No symbols or special characters</p>
              </div>
            </div>

            <Button
              onClick={handleSetup}
              disabled={!username || !isAvailable || loading || checking || status === 'loading'}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  Complete Setup
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p>You can change this later in your dashboard</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
