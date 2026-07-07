import { toHex, fromHex, encoder, decoder, timingSafeEqualHex } from "./crypto"

export const SESSION_COOKIE = "hr_session"
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

interface SessionPayload {
  sub: string
  exp: number
}

function getSecret(): string {
  return process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me"
}

async function getKey() {
  return crypto.subtle.importKey("raw", encoder.encode(getSecret()), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ])
}

export async function createSessionToken(userId: string): Promise<string> {
  const payload: SessionPayload = { sub: userId, exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000 }
  const payloadBytes = encoder.encode(JSON.stringify(payload))
  const key = await getKey()
  const sig = await crypto.subtle.sign("HMAC", key, payloadBytes)
  return `${toHex(payloadBytes)}.${toHex(sig)}`
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null
  const [payloadHex, sigHex] = token.split(".")
  if (!payloadHex || !sigHex) return null
  try {
    const payloadBytes = fromHex(payloadHex)
    const key = await getKey()
    const expectedSig = await crypto.subtle.sign("HMAC", key, payloadBytes)
    if (!timingSafeEqualHex(toHex(expectedSig), sigHex)) return null
    const payload = JSON.parse(decoder.decode(payloadBytes)) as SessionPayload
    if (Date.now() > payload.exp) return null
    return payload
  } catch {
    return null
  }
}
