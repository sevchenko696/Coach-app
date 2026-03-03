import { SignJWT, jwtVerify } from 'jose'
import { cookies, headers } from 'next/headers'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)
const USER_COOKIE = 'healeasy_user'
const ADMIN_COOKIE = 'healeasy_admin'

export interface UserPayload {
  id: string
  name: string
  phone: string
  batchId: string | null
  role: 'user'
}

export interface AdminPayload {
  role: 'admin'
}

// Create JWT token
export async function createToken(payload: UserPayload | AdminPayload) {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

// Verify JWT token
export async function verifyToken(token: string): Promise<UserPayload | AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as UserPayload | AdminPayload
  } catch {
    return null
  }
}

// Extract Bearer token from Authorization header
async function getBearerToken(): Promise<string | null> {
  const headerStore = await headers()
  const authHeader = headerStore.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  return null
}

// Get current user from cookie or Bearer token
export async function getCurrentUser(): Promise<UserPayload | null> {
  // Try cookie first (web flow)
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get(USER_COOKIE)?.value
  if (cookieToken) {
    const payload = await verifyToken(cookieToken)
    if (payload && payload.role === 'user') return payload as UserPayload
  }

  // Fallback: try Authorization Bearer header (mobile flow)
  const bearerToken = await getBearerToken()
  if (bearerToken) {
    const payload = await verifyToken(bearerToken)
    if (payload && payload.role === 'user') return payload as UserPayload
  }

  return null
}

// Get current admin from cookie or Bearer token
export async function getCurrentAdmin(): Promise<AdminPayload | null> {
  // Try cookie first (web flow)
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get(ADMIN_COOKIE)?.value
  if (cookieToken) {
    const payload = await verifyToken(cookieToken)
    if (payload && payload.role === 'admin') return payload as AdminPayload
  }

  // Fallback: try Authorization Bearer header (mobile flow)
  const bearerToken = await getBearerToken()
  if (bearerToken) {
    const payload = await verifyToken(bearerToken)
    if (payload && payload.role === 'admin') return payload as AdminPayload
  }

  return null
}

export const USER_COOKIE_NAME = USER_COOKIE
export const ADMIN_COOKIE_NAME = ADMIN_COOKIE
