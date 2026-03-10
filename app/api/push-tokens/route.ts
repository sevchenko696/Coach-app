import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireUser, isErrorResponse, errorResponse, dbError } from '@/lib/api'
import { savePushTokenSchema, deletePushTokenSchema, formatZodError } from '@/lib/validations'

export async function POST(request: NextRequest) {
  const user = await requireUser()
  if (isErrorResponse(user)) return user

  const parsed = savePushTokenSchema.safeParse(await request.json())
  if (!parsed.success) {
    return errorResponse(formatZodError(parsed.error), 400)
  }

  const { token, platform } = parsed.data

  const { error } = await supabaseAdmin
    .from('push_tokens')
    .upsert(
      { user_id: user.id, token, platform },
      { onConflict: 'token' }
    )

  if (error) return dbError(error)

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const user = await requireUser()
  if (isErrorResponse(user)) return user

  const parsed = deletePushTokenSchema.safeParse(await request.json())
  if (!parsed.success) {
    return errorResponse(formatZodError(parsed.error), 400)
  }

  const { token } = parsed.data

  await supabaseAdmin
    .from('push_tokens')
    .delete()
    .eq('user_id', user.id)
    .eq('token', token)

  return NextResponse.json({ success: true })
}
