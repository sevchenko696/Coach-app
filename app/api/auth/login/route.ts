import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createToken, USER_COOKIE_NAME } from '@/lib/auth'
import { normalizePhone } from '@/lib/phone'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { phone, password } = await req.json()

  if (!phone || !password) {
    return NextResponse.json({ error: 'Phone and password are required' }, { status: 400 })
  }

  const normalized = normalizePhone(phone)
  if (!normalized) {
    return NextResponse.json({ error: 'Invalid phone number. Enter a 10-digit Indian mobile number.' }, { status: 400 })
  }

  // Find user by phone
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('phone', normalized)
    .single()

  if (error || !user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  let isValid = false

  if (user.password) {
    // User has set a custom password — check against hashed password
    isValid = await bcrypt.compare(password, user.password)
  } else {
    // First-time login — check DOB as password (YYYY-MM-DD format)
    isValid = user.dob === password
  }

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = await createToken({
    id: user.id,
    name: user.name,
    phone: user.phone,
    batchId: user.batch_id,
    role: 'user',
  })

  const response = NextResponse.json({
    success: true,
    user: { id: user.id, name: user.name },
    firstLogin: !user.password,
    token,
  })
  response.cookies.set(USER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return response
}
