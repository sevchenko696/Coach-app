import { NextResponse } from 'next/server'
import { getCurrentAdmin, getCurrentUser, type UserPayload, type AdminPayload } from './auth'

/** Standard JSON error response */
export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

/** Return 401 Unauthorized */
export function unauthorized() {
  return errorResponse('Unauthorized', 401)
}

/** Convert a Supabase error into a 500 response */
export function dbError(error: { message: string }) {
  return errorResponse(error.message, 500)
}

/** Require admin auth — returns admin payload or a 401 response */
export async function requireAdmin(): Promise<AdminPayload | NextResponse> {
  const admin = await getCurrentAdmin()
  if (!admin) return unauthorized()
  return admin
}

/** Require user auth — returns user payload or a 401 response */
export async function requireUser(): Promise<UserPayload | NextResponse> {
  const user = await getCurrentUser()
  if (!user) return unauthorized()
  return user
}

/** Require either admin or user auth */
export async function requireAuth(): Promise<{ admin: AdminPayload | null; user: UserPayload | null } | NextResponse> {
  const admin = await getCurrentAdmin()
  const user = await getCurrentUser()
  if (!admin && !user) return unauthorized()
  return { admin, user }
}

/** Type guard: check if result is a NextResponse (error) */
export function isErrorResponse(result: unknown): result is NextResponse {
  return result instanceof NextResponse
}
