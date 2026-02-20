import { NextResponse } from 'next/server'
import { createInquiryCaptchaChallenge } from '@/lib/inquiry-captcha'

export async function GET(): Promise<Response> {
  try {
    const { question, token } = createInquiryCaptchaChallenge()
    return NextResponse.json({ question, token })
  } catch (error) {
    console.error('Inquiry captcha generation error:', error)
    return NextResponse.json({ error: 'Failed to generate captcha challenge' }, { status: 500 })
  }
}
