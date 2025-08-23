import { NextAuthOptions, Session, User } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import { db } from '@/lib/db'
import { AdapterUser } from 'next-auth/adapters'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    // Only enable GitHub if credentials are provided
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET && 
        process.env.GITHUB_CLIENT_ID !== 'your-github-client-id' ? [
      GitHubProvider({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      }),
    ] : []),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' || account?.provider === 'github') {
        try {
          const existingUser = await db.findUser(user.email!)
          
          if (!existingUser) {
            // Create new user
            await db.createUser({
              email: user.email!,
              name: user.name!,
              image: user.image ?? undefined,
              provider: account.provider,
            })
          }
          return true
        } catch (error) {
          console.error('SignIn error:', error)
          return false
        }
      }
      return false
    },
    async jwt({ token, account, user, trigger }) {
      if (account && user) {
        token.id = user.id
        // Get user from database to include username
        const dbUser = await db.findUser(user.email!)
        if (dbUser?.username) {
          token.username = dbUser.username
        }
      }
      
      // If the session is being updated, refresh username from database
      if (trigger === 'update' && token.email) {
        const dbUser = await db.findUser(token.email as string)
        if (dbUser?.username) {
          token.username = dbUser.username
        }
      }
      
      // Also check for username if token doesn't have it but user exists
      if (!token.username && token.email) {
        const dbUser = await db.findUser(token.email as string)
        if (dbUser?.username) {
          token.username = dbUser.username
        }
      }
      
      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          username: token.username || null,
          email: token.email || '',
          name: token.name || null,
          image: token.picture || null
        }
      }
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`
      
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) {
        const urlObj = new URL(url)
        const fromParam = urlObj.searchParams.get('from')
        
        // If there's a 'from' parameter, redirect there
        if (fromParam && fromParam.startsWith('/')) {
          return `${baseUrl}${fromParam}`
        }
        
        return url
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