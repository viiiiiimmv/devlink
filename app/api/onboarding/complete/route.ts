import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendOnboardingCompletedEmail } from '@/lib/transactional-email'

const normalizeEmail = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : ''

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    const sessionEmail = normalizeEmail(session?.user?.email)

    if (!sessionEmail) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const updatedUser = await db.updateUser(sessionEmail, { onboardingCompleted: true })
    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update onboarding status' }, { status: 500 })
    }

    void sendOnboardingCompletedEmail({
      toEmail: updatedUser.email,
      name: updatedUser.name,
      username: updatedUser.username,
    }).catch((error) => {
      console.error('Onboarding completion email dispatch failed:', error)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Onboarding completion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
