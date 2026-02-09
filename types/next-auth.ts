import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      username?: string | null
      id?: string
      provider?: 'google' | 'github'
    } & DefaultSession['user']
  }

  interface User {
    username?: string | null
    provider?: 'google' | 'github'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    username?: string | null
    id?: string
    provider?: 'google' | 'github'
  }
}

export {}
