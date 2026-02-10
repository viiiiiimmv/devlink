import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User, { type IUser } from '@/models/User'
import bcrypt from 'bcryptjs'

const PIN_REGEX = /^\d{6}$/

const normalizeEmail = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : ''

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const email = normalizeEmail(session?.user?.email)
  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const pin = typeof body?.pin === 'string' ? body.pin.trim() : ''
  if (!PIN_REGEX.test(pin)) {
    return NextResponse.json({ error: 'PIN must be exactly 6 digits.' }, { status: 400 })
  }

  await connectDB()
  type PinVerifyUser = Pick<IUser, 'securityPinHash'>
  const user = await User.findOne({ email }).lean<PinVerifyUser>()
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (!user.securityPinHash) {
    return NextResponse.json({ error: 'PIN not set.' }, { status: 400 })
  }

  const matches = await bcrypt.compare(pin, user.securityPinHash)
  if (!matches) {
    return NextResponse.json({ error: 'Invalid PIN.' }, { status: 400 })
  }

  return NextResponse.json({ verified: true })
}
