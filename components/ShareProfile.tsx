'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Linkedin,
  Mail,
  MessageCircle,
  Share2,
  Twitter,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShareProfileProps {
  url: string
}

const resolveShareUrl = (value: string, origin?: string) => {
  const trimmed = typeof value === 'string' ? value.trim() : ''

  if (!trimmed) return ''

  try {
    return new URL(trimmed).toString()
  } catch {
    if (!origin) return trimmed
    try {
      return new URL(trimmed, origin).toString()
    } catch {
      return trimmed
    }
  }
}

export default function ShareProfile({ url }: ShareProfileProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copying, setCopying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState(() => resolveShareUrl(url))

  useEffect(() => {
    const trimmed = typeof url === 'string' ? url.trim() : ''
    if (trimmed.length === 0) {
      setShareUrl(window.location.href)
      return
    }

    setShareUrl(resolveShareUrl(trimmed, window.location.origin))
  }, [url])

  const qrCodeUrl = useMemo(() => {
    if (!shareUrl) return null
    const encoded = encodeURIComponent(shareUrl)
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encoded}`
  }, [shareUrl])

  const shareActions = useMemo(() => {
    if (!shareUrl) return []

    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedMessage = encodeURIComponent(`Check out this profile: ${shareUrl}`)

    return [
      {
        id: 'linkedin',
        label: 'LinkedIn',
        href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        icon: Linkedin,
      },
      {
        id: 'x',
        label: 'X',
        href: `https://twitter.com/intent/tweet?url=${encodedUrl}`,
        icon: Twitter,
      },
      {
        id: 'whatsapp',
        label: 'WhatsApp',
        href: `https://wa.me/?text=${encodedMessage}`,
        icon: MessageCircle,
      },
      {
        id: 'email',
        label: 'Email',
        href: `mailto:?subject=${encodeURIComponent('Developer profile')}&body=${encodedMessage}`,
        icon: Mail,
      },
    ]
  }, [shareUrl])

  const handleCopy = async () => {
    const linkToCopy =
      resolveShareUrl(shareUrl, typeof window !== 'undefined' ? window.location.origin : undefined) ||
      (typeof window !== 'undefined' ? window.location.href : '')

    if (!linkToCopy) {
      toast.error('Profile link is not available yet')
      return
    }

    try {
      setCopying(true)
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(linkToCopy)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1800)
        toast.success('Profile link copied')
        return
      }

      window.prompt('Copy this link:', linkToCopy)
    } catch (error) {
      console.error('Copy link error:', error)
      toast.error('Could not copy link')
    } finally {
      setCopying(false)
    }
  }

  return (
    <div className="pointer-events-auto relative inline-flex w-full flex-col sm:max-w-sm">
      <div
        className={cn(
          'absolute bottom-full left-0 mb-3 w-full origin-bottom-left transition-all duration-200',
          isOpen
            ? 'translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-2 scale-[0.98] opacity-0'
        )}
      >
        <div className="rounded-3xl border border-white/20 bg-slate-950/90 p-4 text-white shadow-2xl backdrop-blur-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
            Shareable link tools
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Copy, scan QR, or share on social platforms.
          </p>

          <div className="mt-4 rounded-xl border border-white/15 bg-black/30 p-2">
            <div className="flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-xs text-slate-200">
                {shareUrl || 'Preparing profile URL...'}
              </p>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleCopy}
                disabled={copying}
                className="h-8 gap-1.5 bg-white/10 text-white hover:bg-white/20"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {shareActions.map((action) => {
              const Icon = action.icon
              return (
                <a
                  key={action.id}
                  href={action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-between rounded-xl border border-white/15 bg-white/[0.05] px-3 py-2 text-xs font-medium text-slate-100 transition-colors hover:bg-white/[0.11]"
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5" />
                    {action.label}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                </a>
              )
            })}
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/15 bg-black/30 p-3">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white p-1.5">
              {qrCodeUrl ? (
                <Image
                  src={qrCodeUrl}
                  alt="Profile QR code"
                  className="h-full w-full"
                  width={96}
                  height={96}
                  unoptimized
                />
              ) : null}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">QR code</p>
              <p className="mt-1 text-xs text-slate-400">
                Scan to open this profile instantly on mobile.
              </p>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="group inline-flex items-center justify-between rounded-2xl border border-white/30 bg-black/65 px-4 py-2.5 text-left text-white shadow-xl backdrop-blur-md transition-colors hover:bg-black/75"
      >
        <span className="inline-flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          <span className="text-sm font-semibold tracking-[0.08em] uppercase">Share Profile</span>
        </span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 opacity-80 transition-transform group-hover:translate-y-0.5" />
        ) : (
          <ChevronUp className="h-4 w-4 opacity-80 transition-transform group-hover:-translate-y-0.5" />
        )}
      </button>
    </div>
  )
}
