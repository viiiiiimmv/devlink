import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import { db } from '@/lib/db'
import type { OAuthProvider } from '@/models/User'

const getEnv = (...keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = process.env[key]?.trim()
    if (value) {
      return value
    }
  }

  return undefined
}

const googleClientId = getEnv('GOOGLE_CLIENT_ID', 'AUTH_GOOGLE_ID', 'GOOGLE_ID')
const googleClientSecret = getEnv('GOOGLE_CLIENT_SECRET', 'AUTH_GOOGLE_SECRET', 'GOOGLE_SECRET')
const githubClientId = getEnv('GITHUB_CLIENT_ID', 'AUTH_GITHUB_ID', 'GITHUB_ID')
const githubClientSecret = getEnv('GITHUB_CLIENT_SECRET', 'AUTH_GITHUB_SECRET', 'GITHUB_SECRET')
const nextAuthSecret = getEnv('NEXTAUTH_SECRET', 'AUTH_SECRET')

const hasGoogleProvider = Boolean(googleClientId && googleClientSecret)
const hasGitHubProvider = Boolean(githubClientId && githubClientSecret)
const isOAuthProvider = (provider: string | undefined): provider is OAuthProvider =>
  provider === 'google' || provider === 'github'
const toOAuthProvider = (value: unknown): OAuthProvider | undefined =>
  typeof value === 'string' && isOAuthProvider(value) ? value : undefined
const normalizeEmail = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : ''

export const authOptions: NextAuthOptions = {
  secret: nextAuthSecret,
  providers: [
    ...(hasGoogleProvider ? [
      GoogleProvider({
        clientId: googleClientId!,
        clientSecret: googleClientSecret!,
        authorization: {
          params: {
            prompt: 'consent',
            access_type: 'offline',
            response_type: 'code',
          },
        },
      }),
    ] : []),
    ...(hasGitHubProvider ? [
      GitHubProvider({
        clientId: githubClientId!,
        clientSecret: githubClientSecret!,
        authorization: {
          params: {
            scope: 'read:user user:email',
          },
        },
      }),
    ] : []),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      const provider = account?.provider
      if (!isOAuthProvider(provider)) {
        return false
      }

      const profileEmail =
        profile && typeof profile === 'object' && 'email' in profile
          ? normalizeEmail((profile as { email?: unknown }).email)
          : ''

      const email = normalizeEmail(user.email) || profileEmail
      if (!email) {
        console.error('SignIn error: missing email from OAuth provider', { provider })
        return false
      }

      try {
        const dbUser = await db.upsertOAuthUser({
          email,
          name: user.name,
          image: user.image,
          provider,
        })

        if (!dbUser) {
          console.warn('SignIn denied: OAuth user mismatch or persistence failure', {
            provider,
            email,
          })
          return false
        }
      } catch (error) {
        console.error('SignIn error: OAuth user upsert failed:', error)
        return false
      }

      return true
    },
    async jwt({ token, account, user, trigger, session }) {
      try {
        if (account) {
          const provider = toOAuthProvider(account.provider)
          if (provider) {
            token.provider = provider
          }
        }

        if (account && user) {
          const normalizedEmail = normalizeEmail(user.email)
          if (normalizedEmail) {
            const dbUser = await db.findUser(normalizedEmail)
            if (dbUser) {
              token.id = dbUser._id
              token.email = dbUser.email
              token.name = dbUser.name
              token.picture = dbUser.image
              token.username = dbUser.username || null
              token.provider = dbUser.provider
            } else {
              token.email = normalizedEmail
              if (typeof user.id === 'string') {
                token.id = user.id
              }
              if (typeof user.name === 'string') {
                token.name = user.name
              }
              if (typeof user.image === 'string') {
                token.picture = user.image
              }
            }
          } else if (typeof user.id === 'string') {
            token.id = user.id
          }
        }

        if (trigger === 'update') {
          const updatePayload =
            typeof session === 'object' && session !== null
              ? session as Record<string, unknown>
              : {}

          const updatedUsername = typeof updatePayload.username === 'string'
            ? updatePayload.username.trim()
            : ''
          if (updatedUsername) {
            token.username = updatedUsername
          }

          const updatedProvider = toOAuthProvider(updatePayload.provider)
          if (updatedProvider) {
            token.provider = updatedProvider
          }
        }

        const tokenEmail = normalizeEmail(token.email)

        // If the session is being updated, refresh username from database
        // Also refresh if token is missing username/provider but has an email.
        if (tokenEmail && (trigger === 'update' || !token.username || !token.provider)) {
          const dbUser = await db.findUser(tokenEmail)
          if (dbUser) {
            token.id = dbUser._id
            token.email = dbUser.email
            token.name = dbUser.name
            token.picture = dbUser.image
            token.username = dbUser.username || null
            token.provider = dbUser.provider
          }
        }
      } catch (error) {
        console.error('JWT callback error:', error)
      }

      return token
    },
    async session({ session, token }) {
      try {
        const tokenEmail = normalizeEmail(token.email)

        return {
          ...session,
          user: {
            ...(session.user ?? {}),
            id: typeof token.id === 'string' ? token.id : undefined,
            username: typeof token.username === 'string' ? token.username : null,
            provider: toOAuthProvider(token.provider),
            email: tokenEmail || session.user?.email || '',
            name:
              typeof token.name === 'string'
                ? token.name
                : (session.user?.name ?? null),
            image:
              typeof token.picture === 'string'
                ? token.picture
                : (session.user?.image ?? null),
          },
        }
      } catch (error) {
        console.error('Session callback error:', error)
        return session
      }
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`
      
      // Allows callback URLs on the same origin
      try {
        if (new URL(url).origin === baseUrl) {
          const urlObj = new URL(url)
          const fromParam = urlObj.searchParams.get('from')
          
          // If there's a 'from' parameter, redirect there
          if (fromParam && fromParam.startsWith('/')) {
            return `${baseUrl}${fromParam}`
          }
          
          return url
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Redirect callback error:', error)
        }
      }
      
      return baseUrl
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      if (process.env.NODE_ENV === 'development') {
        console.log('User signed in:', { user: user.email, provider: account?.provider, isNewUser })
      }
    },
    async signOut({ token, session }) {
      if (process.env.NODE_ENV === 'development') {
        console.log('User signed out:', token?.email)
      }
    },
  },
} 
