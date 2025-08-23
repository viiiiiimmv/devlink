'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check, User, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'

export default function Setup() {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)

  const checkUsername = async (value: string) => {
    if (!value || value.length < 3) {
      setIsAvailable(null)
      return
    }

    setChecking(true)
    try {
      const response = await fetch('/api/username/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: value }),
      })
      
      const data = await response.json()
      setIsAvailable(data.available)
    } catch (error) {
      console.error('Error checking username:', error)
    } finally {
      setChecking(false)
    }
  }

  const handleUsernameChange = (value: string) => {
    // Clean username: only lowercase letters and numbers, no symbols
    const cleaned = value.toLowerCase().replace(/[^a-z0-9]/g, '')
    setUsername(cleaned)
    
    // Debounce username check
    const timeoutId = setTimeout(() => checkUsername(cleaned), 500)
    return () => clearTimeout(timeoutId)
  }

  const handleSetup = async () => {
    if (!username || !isAvailable) {
      toast.error('Please choose a valid username')
      return
    }

    // Validate username format
    if (!/^[a-z][a-z0-9]*[a-z][a-z0-9]*$|^[a-z][a-z0-9]*$/.test(username)) {
      toast.error('Username must start with a letter, contain at least one letter, and only use lowercase letters and numbers')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Setup completed successfully!')
        
        // Force session refresh by calling update with username
        await updateSession({ username: username })
        
        // Give some time for the session to update then redirect
        setTimeout(() => {
          // Force a hard navigation to ensure middleware sees updated session
          window.location.href = '/dashboard'
        }, 1500)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Setup failed')
      }
    } catch (error) {
      toast.error('An error occurred during setup')
      console.error('Setup error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
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
            <p className="text-gray-600">
              Choose a username that starts with a letter and contains only lowercase letters and numbers
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <Input
                  id="username"
                  placeholder="your-username"
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
                  <p className="text-gray-600">
                    Your portfolio will be available at:
                  </p>
                  <p className="font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    devlink.vercel.io/{username}
                  </p>
                  {isAvailable === false && (
                    <p className="text-red-600">
                      This username is already taken
                    </p>
                  )}
                  {isAvailable === true && (
                    <p className="text-green-600">
                      Username is available!
                    </p>
                  )}
                </div>
              )}
              
              <div className="text-xs text-gray-500">
                <p>• Must start with a letter</p>
                <p>• Must contain at least one letter</p>
                <p>• Only lowercase letters and numbers allowed</p>
                <p>• No symbols or special characters</p>
              </div>
            </div>

            <Button
              onClick={handleSetup}
              disabled={!username || !isAvailable || loading}
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

            <div className="text-center text-sm text-gray-600">
              <p>You can change this later in your dashboard</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}