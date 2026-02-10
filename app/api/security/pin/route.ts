import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
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

type AuthedUserResult =
  | { ok: true; user: any; email: string }
  | { ok: false; response: NextResponse }

const getAuthedUser = async (): Promise<AuthedUserResult> => {
  const session = await getServerSession(authOptions)
  const email = normalizeEmail(session?.user?.email)
  if (!email) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  await connectDB()
  const user = await User.findOne({ email }).lean()
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'User not found' }, { status: 404 }) }
  }

  return { ok: true, user, email }
}

export async function GET(): Promise<Response> {
  const result = await getAuthedUser()
  if (!result.ok) return result.response

  const { user } = result
  return NextResponse.json({
    pinEnabled: typeof user.securityPinHash === 'string' && user.securityPinHash.trim().length > 0,
    recoveryCodesGeneratedAt: user.pinRecoveryGeneratedAt ?? null,
  })
}

export async function POST(req: NextRequest): Promise<Response> {
  const result = await getAuthedUser()
  if (!result.ok) return result.response

  const { user, email } = result
  if (typeof user.securityPinHash === 'string' && user.securityPinHash.trim().length > 0) {
    return NextResponse.json({ error: 'PIN already set. Use update instead.' }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  const pin = typeof body?.pin === 'string' ? body.pin.trim() : ''
  if (!PIN_REGEX.test(pin)) {
    return NextResponse.json({ error: 'PIN must be exactly 6 digits.' }, { status: 400 })
  }

  const pinHash = await bcrypt.hash(pin, 10)
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

export async function PUT(req: NextRequest): Promise<Response> {
  const result = await getAuthedUser()
  if (!result.ok) return result.response

  const { user, email } = result
  if (!user.securityPinHash) {
    return NextResponse.json({ error: 'PIN not set yet.' }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  const currentPin = typeof body?.currentPin === 'string' ? body.currentPin.trim() : ''
  const newPin = typeof body?.newPin === 'string' ? body.newPin.trim() : ''

  if (!PIN_REGEX.test(currentPin) || !PIN_REGEX.test(newPin)) {
    return NextResponse.json({ error: 'PIN must be exactly 6 digits.' }, { status: 400 })
  }

  const matches = await bcrypt.compare(currentPin, user.securityPinHash)
  if (!matches) {
    return NextResponse.json({ error: 'Current PIN is incorrect.' }, { status: 400 })
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

export async function PATCH(req: NextRequest): Promise<Response> {
  const result = await getAuthedUser()
  if (!result.ok) return result.response

  const { user, email } = result
  if (!user.securityPinHash) {
    return NextResponse.json({ error: 'PIN not set yet.' }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  const currentPin = typeof body?.currentPin === 'string' ? body.currentPin.trim() : ''
  if (!PIN_REGEX.test(currentPin)) {
    return NextResponse.json({ error: 'PIN must be exactly 6 digits.' }, { status: 400 })
  }

  const matches = await bcrypt.compare(currentPin, user.securityPinHash)
  if (!matches) {
    return NextResponse.json({ error: 'Current PIN is incorrect.' }, { status: 400 })
  }

  const recoveryCodes = generateRecoveryCodes()
  const hashedCodes = await hashRecoveryCodes(recoveryCodes)

  await User.updateOne(
    { email },
    {
      $set: {
        pinRecoveryCodes: hashedCodes,
        pinRecoveryGeneratedAt: new Date(),
      },
    }
  )

  return NextResponse.json({ success: true, recoveryCodes })
}
