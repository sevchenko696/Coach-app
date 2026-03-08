import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireUser, isErrorResponse, errorResponse } from '@/lib/api'

export async function POST(request: NextRequest) {
  const user = await requireUser()
  if (isErrorResponse(user)) return user

  const body = await request.json()
  const { token, platform } = body

  if (!token || !platform) {
    return errorResponse('Token and platform are required', 400)
  }

  // Upsert — update if token exists, insert if not
  const { error } = await supabaseAdmin
    .from('push_tokens')
    .upsert(
      { user_id: user.id, token, platform },
      { onConflict: 'token' }
    )

  if (error) {
    return errorResponse(error.message, 500)
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const user = await requireUser()
  if (isErrorResponse(user)) return user

  const body = await request.json()
  const { token } = body

  if (!token) {
    return errorResponse('Token is required', 400)
  }

  await supabaseAdmin
    .from('push_tokens')
    .delete()
    .eq('user_id', user.id)
    .eq('token', token)

  return NextResponse.json({ success: true })
}
