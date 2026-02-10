'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Lock, KeyRound, AlertTriangle, LogOut, Copy, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import toast from 'react-hot-toast'

const sanitizeDigits = (value: string, length: number) =>
  value.replace(/\D/g, '').slice(0, length)

const PIN_LENGTH = 6

function OtpPinInput({
  value,
  onChange,
  disabled = false,
  idPrefix = 'pin',
}: {
  value: string
  onChange: (next: string) => void
  disabled?: boolean
  idPrefix?: string
}) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])
  const digits = Array.from({ length: PIN_LENGTH }).map((_, index) => value[index] ?? '')

  const focusIndex = (index: number) => {
    if (index < 0 || index >= PIN_LENGTH) return
    inputsRef.current[index]?.focus()
  }

  const handleChange = (index: number, rawValue: string) => {
    const sanitized = rawValue.replace(/\D/g, '')
    const nextDigits = [...digits]

    if (sanitized.length === 0) {
      nextDigits[index] = ''
      onChange(nextDigits.join(''))
      return
    }

    for (let i = 0; i < sanitized.length && index + i < PIN_LENGTH; i += 1) {
      nextDigits[index + i] = sanitized[i]
    }

    onChange(nextDigits.join(''))
    focusIndex(Math.min(index + sanitized.length, PIN_LENGTH - 1))
  }

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index]) {
      const prevIndex = index - 1
      if (prevIndex >= 0) {
        const nextDigits = [...digits]
        nextDigits[prevIndex] = ''
        onChange(nextDigits.join(''))
        focusIndex(prevIndex)
        event.preventDefault()
      }
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focusIndex(index - 1)
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      focusIndex(index + 1)
    }
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '')
    if (!pasted) return

    const nextDigits = [...digits]
    let startIndex = nextDigits.findIndex((digit) => digit === '')
    if (startIndex === -1) startIndex = 0

    for (let i = 0; i < pasted.length && startIndex + i < PIN_LENGTH; i += 1) {
      nextDigits[startIndex + i] = pasted[i]
    }

    onChange(nextDigits.join(''))
    focusIndex(Math.min(startIndex + pasted.length - 1, PIN_LENGTH - 1))
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {digits.map((digit, index) => (
        <input
          key={`pin-${index}`}
          id={`${idPrefix}-${index}`}
          ref={(el) => {
            inputsRef.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          aria-label={`PIN digit ${index + 1}`}
          value={digit}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          disabled={disabled}
          className="h-12 w-12 rounded-xl border border-border bg-background text-center text-lg font-semibold tracking-wide text-foreground shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
        />
      ))}
    </div>
  )
}

function PinContent() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pin, setPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [recoveryLoading, setRecoveryLoading] = useState(false)
  const [showRecovery, setShowRecovery] = useState(false)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])

  const rawFrom = searchParams.get('from') || '/dashboard'
  const redirectTo = rawFrom.startsWith('/') ? rawFrom : '/dashboard'

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.replace(`/auth/signin?from=${encodeURIComponent(redirectTo)}`)
      return
    }
    if (session?.user?.pinEnabled !== true || session?.user?.pinVerified === true) {
      router.replace(redirectTo)
    }
  }, [status, session, redirectTo, router])

  const handleVerify = async () => {
    if (pin.length !== PIN_LENGTH) {
      toast.error('PIN must be exactly 6 digits')
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/api/security/pin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to verify PIN')
      }

      await update({ pinVerified: true })
      router.replace(redirectTo)
    } catch (error) {
      console.error('PIN verify error:', error)
      toast.error(error instanceof Error ? error.message : 'Invalid PIN')
    } finally {
      setLoading(false)
    }
  }

  const handleRecovery = async () => {
    if (recoveryCode.length !== 8) {
      toast.error('Recovery code must be 8 digits')
      return
    }
    if (newPin.length !== 6 || confirmPin.length !== 6) {
      toast.error('PIN must be exactly 6 digits')
      return
    }
    if (newPin !== confirmPin) {
      toast.error('PIN confirmation does not match')
      return
    }

    setRecoveryLoading(true)
    try {
      const response = await fetch('/api/security/pin/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recoveryCode, newPin }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to reset PIN')
      }

      setRecoveryCodes(data.recoveryCodes || [])
      toast.success('PIN reset successfully')
    } catch (error) {
      console.error('Recovery error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to reset PIN')
    } finally {
      setRecoveryLoading(false)
    }
  }

  const handleContinueAfterRecovery = async () => {
    await update({ pinVerified: true, pinEnabled: true })
    router.replace(redirectTo)
  }

  const handleCopyRecoveryCodes = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'))
      toast.success('Recovery codes copied')
    } catch (error) {
      toast.error('Unable to copy recovery codes')
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = confirm('This will permanently delete your account and all data. Continue?')
    if (!confirmed) return

    try {
      const response = await fetch('/api/profile', { method: 'DELETE' })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to delete account')
      }
      toast.success('Account deleted successfully')
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Delete account error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete account')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-1">
            <div className="flex items-center justify-center mb-4">
              <Lock className="h-10 w-10 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Enter Security PIN</CardTitle>
            <CardDescription>
              {showRecovery
                ? 'Use a recovery code to reset your PIN.'
                : 'This extra step keeps your account secure.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {!showRecovery ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="pin-0">
                    6-digit PIN
                  </label>
                  <OtpPinInput
                    value={pin}
                    onChange={(next) => setPin(sanitizeDigits(next, PIN_LENGTH))}
                    disabled={loading}
                    idPrefix="pin"
                  />
                </div>
                <Button onClick={handleVerify} disabled={loading} className="w-full">
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <KeyRound className="h-4 w-4 mr-2" />
                  )}
                  Verify PIN
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-700"
                    onClick={() => setShowRecovery(true)}
                  >
                    Forgot PIN? Use a recovery code
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="recovery-code">
                    Recovery Code
                  </label>
                  <Input
                    id="recovery-code"
                    type="text"
                    inputMode="numeric"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(sanitizeDigits(e.target.value, 8))}
                    placeholder="8-digit code"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="new-pin">
                    New PIN
                  </label>
                  <Input
                    id="new-pin"
                    type="password"
                    inputMode="numeric"
                    value={newPin}
                    onChange={(e) => setNewPin(sanitizeDigits(e.target.value, 6))}
                    placeholder="Enter 6-digit PIN"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="confirm-pin">
                    Confirm New PIN
                  </label>
                  <Input
                    id="confirm-pin"
                    type="password"
                    inputMode="numeric"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(sanitizeDigits(e.target.value, 6))}
                    placeholder="Re-enter PIN"
                  />
                </div>

                <Button onClick={handleRecovery} disabled={recoveryLoading} className="w-full">
                  {recoveryLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <KeyRound className="h-4 w-4 mr-2" />
                  )}
                  Reset PIN
                </Button>

                {recoveryCodes.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-4 space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                        Save your new recovery codes
                      </p>
                      <p className="text-xs text-amber-800 dark:text-amber-300">
                        You will need these if you ever forget your PIN again.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-amber-900 dark:text-amber-100">
                      {recoveryCodes.map((code) => (
                        <span key={code} className="rounded bg-white/70 dark:bg-white/10 px-2 py-1 text-center">
                          {code}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopyRecoveryCodes} className="flex items-center gap-2">
                        <Copy className="h-4 w-4" />
                        Copy Codes
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleContinueAfterRecovery}>
                        Continue to Dashboard
                      </Button>
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-700"
                    onClick={() => setShowRecovery(false)}
                  >
                    Back to PIN entry
                  </button>
                </div>
              </>
            )}

            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-3 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <p>
                If you lose your PIN and recovery codes, the only option is to delete your account.
              </p>
            </div>

            <Button variant="destructive" className="w-full" onClick={handleDeleteAccount}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>

            <Button variant="outline" className="w-full" onClick={() => signOut({ callbackUrl: '/' })}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default function PinPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PinContent />
    </Suspense>
  )
}
