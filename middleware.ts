import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)
const USER_COOKIE = 'healeasy_user'
const ADMIN_COOKIE = 'healeasy_admin'

// Routes that require user authentication
const USER_PROTECTED = ['/dashboard', '/profile', '/progress', '/certificate', '/faq']
// Routes that require admin authentication
const ADMIN_PROTECTED = '/admin'

async function verifyJwt(token: string): Promise<{ role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as { role: string }
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Admin routes (except /admin/login)
  if (pathname.startsWith(ADMIN_PROTECTED) && pathname !== '/admin/login') {
    const token = request.cookies.get(ADMIN_COOKIE)?.value
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    const payload = await verifyJwt(token)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return NextResponse.next()
  }

  // User-protected routes
  const isProtected = USER_PROTECTED.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )
  if (isProtected) {
    const token = request.cookies.get(USER_COOKIE)?.value
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const payload = await verifyJwt(token)
    if (!payload || payload.role !== 'user') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile',
    '/progress',
    '/certificate',
    '/faq',
    '/admin/:path*',
  ],
}
