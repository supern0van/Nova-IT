import { INAKTIVITETS_TIMEOUT_MS } from '@/lib/auth/session-timeouts'

export const SESSION_LEASE_COOKIE = 'nova-it-admin-session-lease'

interface LeasePayload {
  sessionId: string
  userId: string
  lastSeen: number
}

function base64Url(bytes: Uint8Array) {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function bytesFromBase64Url(value: string) {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function secretForLease() {
  const secret = process.env.ADMIN_SESSION_LEASE_SECRET
  return secret ? `nova-it-admin-session-lease:${secret}` : null
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
  return key
}

async function signValue(value: string, secret: string) {
  const key = await sign(value, secret)
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  return base64Url(new Uint8Array(signature))
}

export async function skapaSessionLease(sessionId: string, userId: string, now = Date.now()) {
  const secret = secretForLease()
  if (!secret) return null
  const payload: LeasePayload = { sessionId, userId, lastSeen: now }
  const encodedPayload = base64Url(new TextEncoder().encode(JSON.stringify(payload)))
  return `${encodedPayload}.${await signValue(encodedPayload, secret)}`
}

export async function verifieraSessionLease(
  value: string | null,
  sessionId: string,
  userId: string,
  now = Date.now(),
) {
  const secret = secretForLease()
  if (!secret || !value) return { giltig: false as const, orsak: 'saknas' as const }

  const [encodedPayload, signature] = value.split('.')
  if (!encodedPayload || !signature) return { giltig: false as const, orsak: 'ogiltig' as const }

  try {
    const key = await sign(encodedPayload, secret)
    const godkand = await crypto.subtle.verify(
      'HMAC',
      key,
      bytesFromBase64Url(signature),
      new TextEncoder().encode(encodedPayload),
    )
    if (!godkand) return { giltig: false as const, orsak: 'ogiltig' as const }

    const payload = JSON.parse(new TextDecoder().decode(bytesFromBase64Url(encodedPayload))) as LeasePayload
    const arRattSession = payload.sessionId === sessionId && payload.userId === userId
    const harInteVaritInaktiv = now - payload.lastSeen < INAKTIVITETS_TIMEOUT_MS
    if (!arRattSession || !harInteVaritInaktiv) {
      return { giltig: false as const, orsak: 'utgangen' as const }
    }
    return { giltig: true as const, payload }
  } catch {
    return { giltig: false as const, orsak: 'ogiltig' as const }
  }
}
