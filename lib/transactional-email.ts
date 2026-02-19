import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { SITE_NAME } from '@/lib/seo'
import { isSmtpConfigured, sendSmtpMail, type SmtpMailResult } from '@/lib/smtp'

type EmailTemplate = {
  subject: string
  html: string
  text: string
}

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/+$/, '')
const BRAND_NAME = SITE_NAME || 'DevLink'
const WELCOME_LOCK_TTL_MS = 15 * 60 * 1000

const skippedResult = (reason: string): SmtpMailResult => ({
  ok: false,
  skipped: true,
  attempts: 0,
  error: new Error(reason),
})

const normalizeEmail = (value: string | undefined | null): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : ''

const normalizeName = (value: string | undefined | null): string =>
  typeof value === 'string' ? value.trim() : ''

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const firstNameOrFallback = (name: string | undefined | null, fallback = 'there'): string => {
  const normalized = normalizeName(name)
  if (!normalized) return fallback
  return normalized.split(/\s+/)[0] || fallback
}

const fullUrl = (path: string): string => {
  if (!path) return APP_URL
  if (/^https?:\/\//i.test(path)) return path
  return `${APP_URL}${path.startsWith('/') ? path : `/${path}`}`
}

const renderLayout = (title: string, intro: string, body: string, ctaLabel: string, ctaUrl: string, outro: string): string => {
  const escapedTitle = escapeHtml(title)
  const escapedIntro = escapeHtml(intro)
  const escapedBody = escapeHtml(body).replace(/\n/g, '<br />')
  const escapedCtaLabel = escapeHtml(ctaLabel)
  const escapedCtaUrl = escapeHtml(ctaUrl)
  const escapedOutro = escapeHtml(outro)

  return `
<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <div style="background:#111827;color:#ffffff;padding:20px 24px;font-size:20px;font-weight:700;">
        ${escapeHtml(BRAND_NAME)}
      </div>
      <div style="padding:24px;">
        <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#111827;">${escapedTitle}</h1>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">${escapedIntro}</p>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#111827;">${escapedBody}</p>
        <a href="${escapedCtaUrl}" style="display:inline-block;background:#111827;color:#ffffff;padding:11px 16px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">${escapedCtaLabel}</a>
        <p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#6b7280;">${escapedOutro}</p>
      </div>
    </div>
  </body>
</html>`
}

const buildWelcomeTemplate = (name: string | undefined | null): EmailTemplate => {
  const firstName = firstNameOrFallback(name, 'there')
  const subject = `Welcome to ${BRAND_NAME}, ${firstName}`
  const intro = `Hi ${firstName}, your account is ready.`
  const body = `Start by finishing your profile and sharing your work so others can discover you.`
  const ctaLabel = 'Complete your profile'
  const ctaUrl = fullUrl('/dashboard/setup')
  const outro = `You are receiving this email because a new ${BRAND_NAME} account was created with this address.`

  return {
    subject,
    text: `${intro}\n\n${body}\n\n${ctaLabel}: ${ctaUrl}\n\n${outro}`,
    html: renderLayout(subject, intro, body, ctaLabel, ctaUrl, outro),
  }
}

const buildSparkIncomingTemplate = (
  recipientName: string | undefined | null,
  senderName: string | undefined | null,
  senderUsername: string | undefined | null
): EmailTemplate => {
  const cleanSenderName = normalizeName(senderName) || normalizeName(senderUsername) || 'A DevLink member'
  const firstName = firstNameOrFallback(recipientName, 'there')
  const subject = `${cleanSenderName} sent you a Spark on ${BRAND_NAME}`
  const intro = `Hi ${firstName}, you have a new Spark request.`
  const body = `${cleanSenderName} wants to connect with you. Review the request and accept or decline it from your network dashboard.`
  const ctaLabel = 'Review Spark request'
  const ctaUrl = fullUrl('/dashboard/network')
  const outro = `You can manage notification preferences from your account settings.`

  return {
    subject,
    text: `${intro}\n\n${body}\n\n${ctaLabel}: ${ctaUrl}\n\n${outro}`,
    html: renderLayout(subject, intro, body, ctaLabel, ctaUrl, outro),
  }
}

const buildSparkAcceptedTemplate = (
  requesterName: string | undefined | null,
  accepterName: string | undefined | null,
  accepterUsername: string | undefined | null
): EmailTemplate => {
  const cleanAccepterName = normalizeName(accepterName) || normalizeName(accepterUsername) || 'A DevLink member'
  const firstName = firstNameOrFallback(requesterName, 'there')
  const subject = `${cleanAccepterName} accepted your Spark on ${BRAND_NAME}`
  const intro = `Hi ${firstName}, your Spark request was accepted.`
  const body = `You can now continue the conversation and build your connection on ${BRAND_NAME}.`
  const ctaLabel = 'Open your network'
  const ctaUrl = fullUrl('/dashboard/network')
  const outro = `Keep your profile updated so new connections can learn more about you.`

  return {
    subject,
    text: `${intro}\n\n${body}\n\n${ctaLabel}: ${ctaUrl}\n\n${outro}`,
    html: renderLayout(subject, intro, body, ctaLabel, ctaUrl, outro),
  }
}

const buildInquiryTemplate = (
  recipientName: string | undefined | null,
  senderName: string,
  senderEmail: string,
  message: string,
  username: string
): EmailTemplate => {
  const firstName = firstNameOrFallback(recipientName, 'there')
  const safeMessage = message.replace(/\s+/g, ' ').slice(0, 280)
  const subject = `New inquiry from ${senderName} on your ${BRAND_NAME} profile`
  const intro = `Hi ${firstName}, someone submitted your contact form.`
  const body = `${senderName} (${senderEmail}) sent: "${safeMessage}${message.length > 280 ? '...' : ''}"`
  const ctaLabel = 'View inquiries'
  const ctaUrl = fullUrl('/dashboard')
  const outro = `Public profile URL: ${fullUrl(`/${username}`)}`

  return {
    subject,
    text: `${intro}\n\n${body}\n\n${ctaLabel}: ${ctaUrl}\n\n${outro}`,
    html: renderLayout(subject, intro, body, ctaLabel, ctaUrl, outro),
  }
}

const buildOnboardingCompletedTemplate = (
  name: string | undefined | null,
  username: string | undefined | null
): EmailTemplate => {
  const firstName = firstNameOrFallback(name, 'there')
  const subject = `Your ${BRAND_NAME} profile setup is complete`
  const intro = `Hi ${firstName}, your onboarding is complete.`
  const body = `Your profile is now ready. Keep refining your projects, experience, and portfolio to improve discoverability.`
  const ctaLabel = 'Open your dashboard'
  const ctaUrl = fullUrl('/dashboard')
  const outro = username ? `Your public profile: ${fullUrl(`/${username}`)}` : `Thanks for building on ${BRAND_NAME}.`

  return {
    subject,
    text: `${intro}\n\n${body}\n\n${ctaLabel}: ${ctaUrl}\n\n${outro}`,
    html: renderLayout(subject, intro, body, ctaLabel, ctaUrl, outro),
  }
}

const claimWelcomeEmailLock = async (email: string): Promise<boolean> => {
  const staleLockThreshold = new Date(Date.now() - WELCOME_LOCK_TTL_MS)

  const claimed = await User.findOneAndUpdate(
    {
      email,
      welcomeEmailSentAt: { $exists: false },
      $or: [
        { welcomeEmailLockAt: { $exists: false } },
        { welcomeEmailLockAt: null },
        { welcomeEmailLockAt: { $lt: staleLockThreshold } },
      ],
    },
    { $set: { welcomeEmailLockAt: new Date() } },
    { new: true }
  )
    .select('_id')
    .lean()

  return Boolean(claimed)
}

const finishWelcomeEmailAttempt = async (email: string, sent: boolean) => {
  if (sent) {
    await User.updateOne(
      { email },
      {
        $set: { welcomeEmailSentAt: new Date() },
        $unset: { welcomeEmailLockAt: 1 },
      }
    )
    return
  }

  await User.updateOne(
    { email },
    { $unset: { welcomeEmailLockAt: 1 } }
  )
}

export const sendWelcomeEmailOnce = async (params: {
  toEmail?: string | null
  name?: string | null
}): Promise<SmtpMailResult> => {
  const toEmail = normalizeEmail(params.toEmail)
  if (!toEmail) return skippedResult('Missing welcome email recipient')

  if (!isSmtpConfigured()) {
    return skippedResult('SMTP is not configured')
  }

  await connectDB()
  const hasClaim = await claimWelcomeEmailLock(toEmail)
  if (!hasClaim) {
    return skippedResult('Welcome email has already been handled')
  }

  const template = buildWelcomeTemplate(params.name)
  let result: SmtpMailResult = skippedResult('Welcome email dispatch was not attempted')

  try {
    result = await sendSmtpMail({
      to: toEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
      headers: {
        'X-DevLink-Event': 'welcome_signup',
      },
    })

    return result
  } finally {
    await finishWelcomeEmailAttempt(toEmail, result.ok).catch((error) => {
      console.error('Failed to update welcome email lock state', { toEmail, error })
    })
  }
}

export const sendSparkIncomingEmail = async (params: {
  toEmail?: string | null
  toName?: string | null
  fromName?: string | null
  fromUsername?: string | null
}): Promise<SmtpMailResult> => {
  const toEmail = normalizeEmail(params.toEmail)
  if (!toEmail) return skippedResult('Missing Spark recipient email')

  const template = buildSparkIncomingTemplate(params.toName, params.fromName, params.fromUsername)
  return sendSmtpMail({
    to: toEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
    headers: {
      'X-DevLink-Event': 'spark_incoming',
    },
  })
}

export const sendSparkAcceptedEmail = async (params: {
  toEmail?: string | null
  toName?: string | null
  acceptedByName?: string | null
  acceptedByUsername?: string | null
}): Promise<SmtpMailResult> => {
  const toEmail = normalizeEmail(params.toEmail)
  if (!toEmail) return skippedResult('Missing Spark acceptance recipient email')

  const template = buildSparkAcceptedTemplate(params.toName, params.acceptedByName, params.acceptedByUsername)
  return sendSmtpMail({
    to: toEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
    headers: {
      'X-DevLink-Event': 'spark_accepted',
    },
  })
}

export const sendInquiryReceivedEmail = async (params: {
  toEmail?: string | null
  toName?: string | null
  senderName: string
  senderEmail: string
  message: string
  username: string
}): Promise<SmtpMailResult> => {
  const toEmail = normalizeEmail(params.toEmail)
  if (!toEmail) return skippedResult('Missing inquiry recipient email')

  const template = buildInquiryTemplate(
    params.toName,
    normalizeName(params.senderName) || 'Someone',
    normalizeEmail(params.senderEmail),
    params.message,
    params.username
  )

  return sendSmtpMail({
    to: toEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
    headers: {
      'X-DevLink-Event': 'inquiry_received',
    },
  })
}

export const sendOnboardingCompletedEmail = async (params: {
  toEmail?: string | null
  name?: string | null
  username?: string | null
}): Promise<SmtpMailResult> => {
  const toEmail = normalizeEmail(params.toEmail)
  if (!toEmail) return skippedResult('Missing onboarding recipient email')

  const template = buildOnboardingCompletedTemplate(params.name, params.username)
  return sendSmtpMail({
    to: toEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
    headers: {
      'X-DevLink-Event': 'onboarding_completed',
    },
  })
}
