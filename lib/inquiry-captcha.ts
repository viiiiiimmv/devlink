import crypto from 'crypto'

type CaptchaPayload = {
  answer: string
  exp: number
}

const CAPTCHA_TTL_SECONDS = 10 * 60

const getCaptchaSecret = () =>
  process.env.INQUIRY_CAPTCHA_SECRET?.trim() ||
  process.env.NEXTAUTH_SECRET?.trim() ||
  'devlink-inquiry-captcha'

const toBase64Url = (value: string): string =>
  Buffer.from(value, 'utf8').toString('base64url')

const fromBase64Url = (value: string): string =>
  Buffer.from(value, 'base64url').toString('utf8')

const sign = (value: string): string =>
  crypto
    .createHmac('sha256', getCaptchaSecret())
    .update(value)
    .digest('base64url')

export const createInquiryCaptchaChallenge = () => {
  const left = crypto.randomInt(2, 12)
  const right = crypto.randomInt(2, 12)
  const operator = crypto.randomInt(0, 2) === 0 ? '+' : '-'
  const answerNumber = operator === '+' ? left + right : left - right
  const question = `What is ${left} ${operator} ${right}?`

  const payload: CaptchaPayload = {
    answer: String(answerNumber),
    exp: Math.floor(Date.now() / 1000) + CAPTCHA_TTL_SECONDS,
  }

  const encodedPayload = toBase64Url(JSON.stringify(payload))
  const signature = sign(encodedPayload)
  const token = `${encodedPayload}.${signature}`

  return { question, token }
}

export const verifyInquiryCaptcha = (token: string, answer: string): boolean => {
  const normalizedToken = token.trim()
  const normalizedAnswer = answer.trim()
  if (!normalizedToken || !normalizedAnswer) return false

  const [encodedPayload, providedSignature] = normalizedToken.split('.')
  if (!encodedPayload || !providedSignature) return false

  const expectedSignature = sign(encodedPayload)
  const providedBuffer = Buffer.from(providedSignature, 'utf8')
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8')
  if (providedBuffer.length !== expectedBuffer.length) return false
  if (!crypto.timingSafeEqual(providedBuffer, expectedBuffer)) return false

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as CaptchaPayload
    if (!payload || typeof payload.answer !== 'string' || typeof payload.exp !== 'number') {
      return false
    }
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return false
    }
    return payload.answer === normalizedAnswer
  } catch {
    return false
  }
}
