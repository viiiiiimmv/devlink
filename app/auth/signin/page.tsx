'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Github, Chrome, Code, ArrowLeft, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import toast from 'react-hot-toast'

function SignInContent() {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const from = searchParams.get('from')

  useEffect(() => {
    if (error) {
      let message = 'An error occurred during sign in'
      switch (error) {
        case 'OAuthSignin':
        case 'OAuthCallback':
        case 'OAuthCreateAccount':
        case 'EmailCreateAccount':
          message = 'Error with OAuth provider. Please try again.'
          break
        case 'OAuthAccountNotLinked':
          message = 'Account already exists with different provider.'
          break
        case 'SessionRequired':
          message = 'Please sign in to continue.'
          break
        default:
          message = 'Authentication failed. Please try again.'
      }
      toast.error(message)
    }
  }, [error])

  const handleSignIn = async (provider: string) => {
    setLoading(provider)
    try {
      const result = await signIn(provider, {
        callbackUrl: from || '/dashboard',
        redirect: false
      })
      
      if (result?.error) {
        toast.error('Sign in failed. Please try again.')
        setLoading(null)
      } else if (result?.ok) {
        // Redirect will be handled by NextAuth callback
        toast.success('Signing you in...')
        router.push(from || '/dashboard')
      }
    } catch (error) {
      console.error('Sign in error:', error)
      toast.error('An unexpected error occurred')
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-1">
            <div className="flex items-center justify-center mb-4">
              <Code className="h-10 w-10 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome to DevLink</CardTitle>
            <CardDescription>
              Sign in to create your developer portfolio
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Button
              onClick={() => handleSignIn('google')}
              disabled={loading !== null}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              size="lg"
            >
              {loading === 'google' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Chrome className="h-5 w-5 mr-2" />
              )}
              Continue with Google
            </Button>

            {process.env.NEXT_PUBLIC_GITHUB_ENABLED && (
              <Button
                onClick={() => handleSignIn('github')}
                disabled={loading !== null}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                size="lg"
              >
                {loading === 'github' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Github className="h-5 w-5 mr-2" />
                )}
                Continue with GitHub
              </Button>
            )}

            <div className="text-center text-sm text-gray-600 pt-4">
              <p>
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>

            <div className="text-center pt-4">
              <Link href="/">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  )
}