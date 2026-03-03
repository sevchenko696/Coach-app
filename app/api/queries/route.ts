import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin, requireUser, isErrorResponse, dbError } from '@/lib/api'
import { sendQueryNotification } from '@/lib/email'

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

  const { category, message } = await req.json()
  if (!category || !message?.trim()) {
    return NextResponse.json({ error: 'Category and message are required' }, { status: 400 })
  }

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
