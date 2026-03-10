import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createToken, USER_COOKIE_NAME } from '@/lib/auth'
import { normalizePhone } from '@/lib/phone'
import { errorResponse } from '@/lib/api'
import { loginSchema, formatZodError } from '@/lib/validations'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const parsed = loginSchema.safeParse(await req.json())
  if (!parsed.success) {
    return errorResponse(formatZodError(parsed.error), 400)
  }

  const { phone, password } = parsed.data

  const normalized = normalizePhone(phone)
  if (!normalized) {
    return errorResponse('Invalid phone number. Enter a 10-digit Indian mobile number.', 400)
  }

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('phone', normalized)
    .single()

  if (error || !user) {
    return errorResponse('Invalid credentials', 401)
  }

  let isValid = false

  if (user.password) {
    isValid = await bcrypt.compare(password, user.password)
  } else {
    isValid = user.dob === password
  }

  if (!isValid) {
    return errorResponse('Invalid credentials', 401)
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
