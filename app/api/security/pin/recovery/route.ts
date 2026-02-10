import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User, { type IUser } from '@/models/User'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const PIN_REGEX = /^\d{6}$/

const normalizeEmail = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : ''

const generateRecoveryCodes = (count: number = 8) => {
  const codes: string[] = []
  for (let i = 0; i < count; i += 1) {
    const value = crypto.randomInt(0, 100_000_000)
    codes.push(value.toString().padStart(8, '0'))
  }
  return codes
}

const hashRecoveryCodes = async (codes: string[]) => {
  const hashedCodes: string[] = []
  for (const code of codes) {
    hashedCodes.push(await bcrypt.hash(code, 10))
  }
  return hashedCodes
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const email = normalizeEmail(session?.user?.email)
  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const recoveryCode = typeof body?.recoveryCode === 'string' ? body.recoveryCode.trim() : ''
  const newPin = typeof body?.newPin === 'string' ? body.newPin.trim() : ''

  if (!/^\d{8}$/.test(recoveryCode)) {
    return NextResponse.json({ error: 'Recovery code must be 8 digits.' }, { status: 400 })
  }

  if (!PIN_REGEX.test(newPin)) {
    return NextResponse.json({ error: 'PIN must be exactly 6 digits.' }, { status: 400 })
  }

  await connectDB()
  type PinRecoveryUser = Pick<IUser, 'securityPinHash' | 'pinRecoveryCodes'>
  const user = await User.findOne({ email }).lean<PinRecoveryUser>()
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (!user.securityPinHash || !Array.isArray(user.pinRecoveryCodes) || user.pinRecoveryCodes.length === 0) {
    return NextResponse.json({ error: 'Recovery codes are not available.' }, { status: 400 })
  }

  let matched = false
  for (const hashedCode of user.pinRecoveryCodes) {
    // eslint-disable-next-line no-await-in-loop
    if (await bcrypt.compare(recoveryCode, hashedCode)) {
      matched = true
      break
    }
  }

  if (!matched) {
    return NextResponse.json({ error: 'Invalid recovery code.' }, { status: 400 })
  }

  const pinHash = await bcrypt.hash(newPin, 10)
  const recoveryCodes = generateRecoveryCodes()
  const hashedCodes = await hashRecoveryCodes(recoveryCodes)

  await User.updateOne(
    { email },
    {
      $set: {
        securityPinHash: pinHash,
        pinRecoveryCodes: hashedCodes,
        pinRecoveryGeneratedAt: new Date(),
      },
    }
  )

  return NextResponse.json({ success: true, recoveryCodes })
}
