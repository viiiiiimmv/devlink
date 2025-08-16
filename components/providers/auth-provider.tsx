'use client'

import { SessionProvider } from 'next-auth/react'
import { useEffect } from 'react'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  useEffect(() => {
    // Add error listener for auth errors
    const handleAuthError = (event: any) => {
      if (event.detail?.error) {
        console.error('NextAuth error:', event.detail.error)
      }
    }

    window.addEventListener('next-auth.error', handleAuthError)
    
    return () => {
      window.removeEventListener('next-auth.error', handleAuthError)
    }
  }, [])

  return (
    <SessionProvider 
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={false} // Disable automatic refetch on window focus
    >
      {children}
    </SessionProvider>
  )
}
