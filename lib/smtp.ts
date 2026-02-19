import nodemailer from 'nodemailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'

type MailHeaders = Record<string, string | string[]>

export type SmtpMailInput = {
  to: string | string[]
  subject: string
  html: string
  text: string
  replyTo?: string
  headers?: MailHeaders
}

export type SmtpMailResult = {
  ok: boolean
  skipped: boolean
  attempts: number
  messageId?: string
  error?: unknown
}

const parseNumber = (value: string | undefined, fallback: number, min?: number, max?: number): number => {
  const parsed = Number.parseInt(value ?? '', 10)
  if (!Number.isFinite(parsed)) return fallback

  if (typeof min === 'number' && parsed < min) return min
  if (typeof max === 'number' && parsed > max) return max
  return parsed
}

const parseBoolean = (value: string | undefined): boolean | undefined => {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false
  return undefined
}

const normalizeEmail = (value: string | undefined): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : ''

const SMTP_HOST = process.env.SMTP_HOST?.trim() ?? ''
const SMTP_PORT = parseNumber(process.env.SMTP_PORT, 587, 1, 65535)
const SMTP_SECURE = parseBoolean(process.env.SMTP_SECURE) ?? SMTP_PORT === 465
const SMTP_USER = process.env.SMTP_USER?.trim() ?? ''
const SMTP_PASS = process.env.SMTP_PASS?.trim() ?? ''
const SMTP_FROM = process.env.SMTP_FROM?.trim() ?? ''
const SMTP_REPLY_TO = process.env.SMTP_REPLY_TO?.trim() || undefined
const SMTP_MAX_CONNECTIONS = parseNumber(process.env.SMTP_MAX_CONNECTIONS, 5, 1, 20)
const SMTP_MAX_MESSAGES = parseNumber(process.env.SMTP_MAX_MESSAGES, 100, 1, 1000)
const SMTP_RETRY_LIMIT = parseNumber(process.env.SMTP_RETRY_LIMIT, 3, 1, 5)
const SMTP_RETRY_DELAY_MS = parseNumber(process.env.SMTP_RETRY_DELAY_MS, 800, 100, 10000)
const SMTP_CONNECTION_TIMEOUT_MS = parseNumber(process.env.SMTP_CONNECTION_TIMEOUT_MS, 10000, 1000, 60000)
const SMTP_GREETING_TIMEOUT_MS = parseNumber(process.env.SMTP_GREETING_TIMEOUT_MS, 10000, 1000, 60000)
const SMTP_SOCKET_TIMEOUT_MS = parseNumber(process.env.SMTP_SOCKET_TIMEOUT_MS, 20000, 1000, 120000)
const SMTP_TLS_REJECT_UNAUTHORIZED = parseBoolean(process.env.SMTP_TLS_REJECT_UNAUTHORIZED) ?? true

const hasSmtpConfig = (): boolean =>
  Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS && SMTP_FROM)

export const isSmtpConfigured = (): boolean => hasSmtpConfig()

let transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo> | null = null
let transporterVerified = false
let verifyPromise: Promise<void> | null = null
let hasLoggedMissingConfigWarning = false

const wait = async (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

const normalizeRecipients = (input: string | string[]): string[] => {
  const list = Array.isArray(input) ? input : [input]

  return Array.from(
    new Set(
      list
        .map((value) => normalizeEmail(value))
        .filter((value) => Boolean(value))
    )
  )
}

const createTransporter = (): nodemailer.Transporter<SMTPTransport.SentMessageInfo> => {
  const options = {
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    pool: true,
    maxConnections: SMTP_MAX_CONNECTIONS,
    maxMessages: SMTP_MAX_MESSAGES,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
    greetingTimeout: SMTP_GREETING_TIMEOUT_MS,
    socketTimeout: SMTP_SOCKET_TIMEOUT_MS,
    tls: {
      rejectUnauthorized: SMTP_TLS_REJECT_UNAUTHORIZED,
    },
  }

  return nodemailer.createTransport(options)
}

const resetTransporter = () => {
  if (transporter) {
    transporter.close()
  }

  transporter = null
  transporterVerified = false
  verifyPromise = null
}

const ensureTransporterVerified = async (
  currentTransporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>
) => {
  if (transporterVerified) return

  if (!verifyPromise) {
    verifyPromise = currentTransporter
      .verify()
      .then(() => {
        transporterVerified = true
      })
      .catch((error: unknown) => {
        resetTransporter()
        throw error
      })
      .finally(() => {
        verifyPromise = null
      })
  }

  await verifyPromise
}

const getTransporter = async (): Promise<nodemailer.Transporter<SMTPTransport.SentMessageInfo>> => {
  if (!transporter) {
    transporter = createTransporter()
  }

  await ensureTransporterVerified(transporter)
  return transporter
}

export const sendSmtpMail = async (input: SmtpMailInput): Promise<SmtpMailResult> => {
  const recipients = normalizeRecipients(input.to)
  if (recipients.length === 0) {
    return {
      ok: false,
      skipped: true,
      attempts: 0,
      error: new Error('No valid email recipients were provided'),
    }
  }

  if (!hasSmtpConfig()) {
    if (!hasLoggedMissingConfigWarning) {
      hasLoggedMissingConfigWarning = true
      console.warn('SMTP is not configured. Skipping email delivery.')
    }

    return {
      ok: false,
      skipped: true,
      attempts: 0,
      error: new Error('SMTP configuration is incomplete'),
    }
  }

  let lastError: unknown
  let attempts = 0

  for (let attempt = 1; attempt <= SMTP_RETRY_LIMIT; attempt += 1) {
    attempts = attempt
    try {
      const smtpTransporter = await getTransporter()
      const info = await smtpTransporter.sendMail({
        from: SMTP_FROM,
        to: recipients,
        subject: input.subject,
        html: input.html,
        text: input.text,
        replyTo: input.replyTo ?? SMTP_REPLY_TO,
        headers: input.headers,
      })

      const acceptedCount = Array.isArray(info.accepted) ? info.accepted.length : 0
      if (acceptedCount === 0) {
        throw new Error('SMTP accepted zero recipients')
      }

      return {
        ok: true,
        skipped: false,
        attempts,
        messageId: info.messageId,
      }
    } catch (error) {
      lastError = error
      resetTransporter()

      if (attempt < SMTP_RETRY_LIMIT) {
        const backoffMs = SMTP_RETRY_DELAY_MS * attempt
        await wait(backoffMs)
      }
    }
  }

  console.error('SMTP delivery failed after retries', {
    subject: input.subject,
    recipients,
    attempts,
    error: lastError,
  })

  return {
    ok: false,
    skipped: false,
    attempts,
    error: lastError,
  }
}
