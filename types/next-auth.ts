import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      username?: string | null
      id?: string
      provider?: 'google' | 'github'
      onboardingCompleted?: boolean
    } & DefaultSession['user']
  }

  interface User {
    username?: string | null
    provider?: 'google' | 'github'
    onboardingCompleted?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    username?: string | null
    id?: string
    provider?: 'google' | 'github'
    onboardingCompleted?: boolean
  }
}

export {}
