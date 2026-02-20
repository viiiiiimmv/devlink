'use client'

import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type InquiryFormProps = {
  username: string
  profileName: string
}

export default function InquiryForm({ username, profileName }: InquiryFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const [captchaQuestion, setCaptchaQuestion] = useState('')
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [captchaLoading, setCaptchaLoading] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadCaptcha = async () => {
    setCaptchaLoading(true)
    try {
      const response = await fetch('/api/inquiries/captcha', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Failed to load captcha challenge')
      }
      const data = await response.json().catch(() => null)
      const question = typeof data?.question === 'string' ? data.question : ''
      const token = typeof data?.token === 'string' ? data.token : ''
      if (!question || !token) {
        throw new Error('Invalid captcha challenge')
      }
      setCaptchaQuestion(question)
      setCaptchaToken(token)
      setCaptchaAnswer('')
    } catch (error) {
      console.error('Inquiry captcha load error:', error)
      toast.error('Unable to load captcha challenge. Please try again.')
    } finally {
      setCaptchaLoading(false)
    }
  }

  useEffect(() => {
    loadCaptcha()
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim() || !captchaAnswer.trim()) {
      toast.error('Please fill out all fields.')
      return
    }

    if (!captchaToken) {
      toast.error('Captcha challenge expired. Please refresh and try again.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          name,
          email,
          message,
          website,
          captchaToken,
          captchaAnswer,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to send message')
      }

      setName('')
      setEmail('')
      setMessage('')
      setWebsite('')
      setCaptchaAnswer('')
      toast.success(`Your message was sent to ${profileName}.`)
      await loadCaptcha()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send message')
      await loadCaptcha()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Your name</label>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Jane Doe"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="jane@email.com"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Message</label>
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={`Share a quick note for ${profileName}...`}
          rows={6}
          required
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-medium text-foreground">Captcha</label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={loadCaptcha}
            disabled={captchaLoading}
            className="h-auto px-2 py-1 text-xs"
          >
            <RefreshCw className={`mr-1 h-3.5 w-3.5 ${captchaLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {captchaQuestion || 'Loading captcha challenge...'}
        </p>
        <Input
          value={captchaAnswer}
          onChange={(event) => setCaptchaAnswer(event.target.value)}
          placeholder="Enter your answer"
          required
        />
      </div>
      <div className="hidden" aria-hidden>
        <label className="text-sm font-medium text-foreground">Website</label>
        <Input
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <Button type="submit" disabled={loading || captchaLoading} className="w-full md:w-auto">
        {loading ? 'Sending...' : 'Send message'}
      </Button>
    </form>
  )
}
