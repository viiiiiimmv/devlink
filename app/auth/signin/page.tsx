'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn, getProviders } from 'next-auth/react'
import type { ClientSafeProvider } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Github, Chrome, Code, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import toast from 'react-hot-toast'

type SupportedProviderId = 'google' | 'github'

const providerConfig: Record<
  SupportedProviderId,
  {
    label: string
    className: string
    Icon: typeof Chrome
  }
> = {
  google: {
    label: 'Continue with Google',
    className: 'w-full bg-red-600 hover:bg-red-700 text-white',
    Icon: Chrome,
  },
  github: {
    label: 'Continue with GitHub',
    className: 'w-full bg-gray-900 hover:bg-gray-800 text-white',
    Icon: Github,
  },
}

const providerOrder: SupportedProviderId[] = ['google', 'github']

function SignInContent() {
  const [loading, setLoading] = useState<string | null>(null)
  const [providers, setProviders] = useState<Record<string, ClientSafeProvider>>({})
  const [providersLoading, setProvidersLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams?.get('error') ?? null
  const from = searchParams?.get('from') ?? null

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
        case 'AccessDenied':
          message = 'Sign in was denied. Please verify OAuth credentials and try again.'
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

  useEffect(() => {
    let active = true

    const loadProviders = async () => {
      try {
        const providerMap = await getProviders()
        if (active && providerMap) {
          setProviders(providerMap)
        }
      } catch (providerError) {
        console.error('Failed to load auth providers:', providerError)
      } finally {
        if (active) {
          setProvidersLoading(false)
        }
      }
    }

    loadProviders()

    return () => {
      active = false
    }
  }, [])

  const enabledProviderIds = providerOrder.filter((providerId) => Boolean(providers[providerId]))

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
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
            {enabledProviderIds.map((providerId) => {
              const config = providerConfig[providerId]
              const Icon = config.Icon

              return (
                <Button
                  key={providerId}
                  onClick={() => handleSignIn(providerId)}
                  disabled={loading !== null || providersLoading}
                  className={config.className}
                  size="lg"
                >
                  {loading === providerId ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Icon className="h-5 w-5 mr-2" />
                  )}
                  {config.label}
                </Button>
              )
            })}

            {!providersLoading && enabledProviderIds.length === 0 && (
              <p className="text-sm text-destructive text-center">
                No authentication providers are configured. Please set OAuth credentials in `.env`.
              </p>
            )}

            <div className="text-center text-sm text-muted-foreground pt-4">
              <p>
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>

            <div className="text-center pt-4">
              <Link href="/">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
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
