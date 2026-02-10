import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
    const isDashboard = req.nextUrl.pathname.startsWith('/dashboard')
    const isSetup = req.nextUrl.pathname === '/dashboard/setup'
    const isHomePage = req.nextUrl.pathname === '/' || req.nextUrl.pathname === ''
    const needsOnboarding = token?.onboardingCompleted === false
    
    // Debug logging (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('Middleware - Path:', req.nextUrl.pathname)
      console.log('Middleware - Is authenticated:', isAuth)
      console.log('Middleware - Has username:', !!token?.username)
      console.log('Middleware - Token username:', token?.username)
    }

    // Handle authenticated users
    if (isAuth) {
      // Route users who still need onboarding to setup flow
      if (needsOnboarding && !isSetup) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Middleware - Redirecting user to onboarding setup')
        }
        return NextResponse.redirect(new URL('/dashboard/setup', req.url))
      }

      // If user is authenticated and tries to access home page, redirect to dashboard
      if (isHomePage) {
        if (token?.username) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Middleware - Redirecting authenticated user from home to dashboard')
          }
          return NextResponse.redirect(new URL('/dashboard', req.url))
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('Middleware - Redirecting authenticated user from home to setup')
          }
          return NextResponse.redirect(new URL('/dashboard/setup', req.url))
        }
      }
      
      // If user is authenticated and tries to access auth pages, redirect to dashboard
      if (isAuthPage) {
        if (token?.username) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Middleware - Redirecting authenticated user to dashboard')
          }
          return NextResponse.redirect(new URL('/dashboard', req.url))
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('Middleware - Redirecting authenticated user to setup')
          }
          return NextResponse.redirect(new URL('/dashboard/setup', req.url))
        }
      }

      // Handle dashboard access for authenticated users
      if (isDashboard) {
        const hasUsername = !!token?.username

        // If user doesn't have username and not on setup page, redirect to setup
        if (!hasUsername && !isSetup) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Middleware - Redirecting user without username to setup')
          }
          return NextResponse.redirect(new URL('/dashboard/setup', req.url))
        }

        // If user has username, onboarding is complete, and is on setup page, redirect to dashboard
        if (hasUsername && isSetup && !needsOnboarding) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Middleware - Redirecting user with username away from setup')
          }
          return NextResponse.redirect(new URL('/dashboard', req.url))
        }
      }
    }

    // Handle unauthenticated users
    if (!isAuth) {
      // Redirect unauthenticated users trying to access protected routes
      if (isDashboard) {
        let from = req.nextUrl.pathname
        if (req.nextUrl.search) {
          from += req.nextUrl.search
        }
        if (process.env.NODE_ENV === 'development') {
          console.log('Middleware - Redirecting unauthenticated user to signin')
        }
        return NextResponse.redirect(
          new URL(`/auth/signin?from=${encodeURIComponent(from)}`, req.url)
        )
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Allow access if token exists or if it's a public route
        return true // Let the middleware function handle the logic
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
