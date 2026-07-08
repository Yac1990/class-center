import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

// ==========================================
// PASSWORD HASHING — bcrypt with salt rounds
// ==========================================
const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  // Check if it's a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  if (hashedPassword.startsWith('$2')) {
    return bcrypt.compare(password, hashedPassword)
  }

  // Legacy SHA-256 hash — verify and return true so the login route can upgrade
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  const sha256Hash = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
  return sha256Hash === hashedPassword
}

/** Check if a password hash needs upgrade from SHA-256 to bcrypt */
export function needsHashUpgrade(hashedPassword: string): boolean {
  return !hashedPassword.startsWith('$2')
}

/** Upgrade a user's password hash from SHA-256 to bcrypt */
export async function upgradePasswordHash(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

// ==========================================
// JWT SESSION — HttpOnly cookies
// ==========================================
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-dev-secret-change-in-production'
)

const COOKIE_NAME = 'cc_session'
const SESSION_DURATION = '7d' // 7 days

export interface SessionPayload {
  userId: string
  email: string
  role: string
  cabineId?: string
}

/** Create a signed JWT and set it as an HttpOnly cookie */
export async function createSession(payload: SessionPayload): Promise<string> {
  const token = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .setIssuer('class-center')
    .sign(JWT_SECRET)

  return token
}

/** Verify a JWT token and return the payload */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: 'class-center',
    })
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
      cabineId: payload.cabineId as string | undefined,
    }
  } catch {
    return null
  }
}

/** Get the current session from cookies (server-side only) */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null
    return verifySession(token)
  } catch {
    return null
  }
}

/** Cookie config for setting the session */
export function getSessionCookieConfig() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  }
}

export { COOKIE_NAME }
