import { NextRequest, NextResponse } from 'next/server'
import { createToken, ADMIN_COOKIE_NAME } from '@/lib/auth'
import { errorResponse } from '@/lib/api'
import { adminLoginSchema, formatZodError } from '@/lib/validations'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const parsed = adminLoginSchema.safeParse(await req.json())
  if (!parsed.success) {
    return errorResponse(formatZodError(parsed.error), 400)
  }

  const { email, password } = parsed.data

  if (email !== process.env.ADMIN_EMAIL) {
    return errorResponse('Invalid credentials', 401)
  }

  const hash = process.env.ADMIN_PASSWORD_HASH
  if (!hash) {
    console.error('[Admin Login] ADMIN_PASSWORD_HASH is not configured')
    return errorResponse('Invalid credentials', 401)
  }

  const valid = await bcrypt.compare(password, hash)
  if (!valid) {
    return errorResponse('Invalid credentials', 401)
  }

  const token = await createToken({ role: 'admin' })

  const response = NextResponse.json({ success: true })
  response.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return response
}
