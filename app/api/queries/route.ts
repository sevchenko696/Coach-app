import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin, requireUser, isErrorResponse, dbError, errorResponse } from '@/lib/api'
import { sendQueryNotification } from '@/lib/email'
import { createQuerySchema, formatZodError } from '@/lib/validations'

export async function GET() {
  const auth = await requireAdmin()
  if (isErrorResponse(auth)) return auth

  const { data, error } = await supabaseAdmin
    .from('queries')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return dbError(error)
  return NextResponse.json({ queries: data })
}

export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (isErrorResponse(user)) return user

  const parsed = createQuerySchema.safeParse(await req.json())
  if (!parsed.success) {
    return errorResponse(formatZodError(parsed.error), 400)
  }

  const { category, message } = parsed.data

  const { data, error } = await supabaseAdmin
    .from('queries')
    .insert({
      user_id: user.id,
      user_name: user.name,
      user_phone: user.phone,
      category,
      message: message.trim(),
    })
    .select()
    .single()

  if (error) return dbError(error)

  try {
    await sendQueryNotification({
      userName: user.name,
      userPhone: user.phone,
      category,
      message: message.trim(),
    })
  } catch (emailError) {
    console.error('Failed to send email notification:', emailError)
  }

  return NextResponse.json({ query: data })
}
