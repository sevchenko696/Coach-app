import { NextRequest, NextResponse } from 'next/server'
import { USER_COOKIE_NAME, ADMIN_COOKIE_NAME } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { role } = await req.json()
  const response = NextResponse.json({ success: true })
  const cookieName = role === 'admin' ? ADMIN_COOKIE_NAME : USER_COOKIE_NAME
  response.cookies.set(cookieName, '', { maxAge: 0, path: '/' })
  return response
}
