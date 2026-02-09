"use client"

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function ErrorPageContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  
  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return {
          title: 'Server Configuration Error',
          description: 'There is a problem with the server configuration. Please try again later.',
        }
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          description: 'You do not have permission to sign in.',
        }
      case 'Verification':
        return {
          title: 'Unable to Sign In',
          description: 'The sign in link is no longer valid. It may have been used already or it may have expired.',
        }
      case 'OAuthSignin':
      case 'OAuthCallback':
      case 'OAuthCreateAccount':
      case 'EmailCreateAccount':
        return {
          title: 'OAuth Error',
          description: 'Error with the OAuth provider. Please try signing in again.',
        }
      case 'OAuthAccountNotLinked':
        return {
          title: 'Account Already Exists',
          description: 'An account with this email already exists with a different provider. Please sign in with your original provider.',
        }
      case 'EmailSignin':
        return {
          title: 'Unable to Send Email',
          description: 'The email could not be sent. Please try again.',
        }
      case 'CredentialsSignin':
        return {
          title: 'Sign In Failed',
          description: 'Check that you entered the correct details.',
        }
      case 'SessionRequired':
        return {
          title: 'Session Required',
          description: 'You must be signed in to view this page.',
        }
      default:
        return {
          title: 'Something Went Wrong',
          description: 'An unexpected error occurred. Please try signing in again.',
        }
    }
  }

  const errorInfo = getErrorMessage(error)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-600">
              {errorInfo.title}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {errorInfo.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <Link href="/auth/signin">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Try Signing In Again
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
            {error && (
              <div className="text-center text-xs text-muted-foreground mt-4">
                Error code: {error}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorPageContent />
    </Suspense>
  )
}
