import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin, requireUser, isErrorResponse, dbError } from '@/lib/api'
import { PROGRAM_DAYS } from '@/lib/constants'

export async function GET() {
  const auth = await requireAdmin()
  if (isErrorResponse(auth)) return auth

  const { data, error } = await supabaseAdmin
    .from('content_views')
    .select('user_id, day_number, viewed_at')

  if (error) return dbError(error)
  return NextResponse.json({ views: data })
}

export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (isErrorResponse(user)) return user

  const { day_number } = await req.json()
  if (!day_number || day_number < 1 || day_number > PROGRAM_DAYS) {
    return NextResponse.json({ error: 'Invalid day number' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('content_views')
    .upsert(
      { user_id: user.id, day_number },
      { onConflict: 'user_id,day_number' }
    )

  if (error) return dbError(error)
  return NextResponse.json({ success: true })
}
