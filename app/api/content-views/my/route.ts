import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireUser, isErrorResponse, dbError } from '@/lib/api'

export async function GET() {
  const user = await requireUser()
  if (isErrorResponse(user)) return user

  const { data, error } = await supabaseAdmin
    .from('content_views')
    .select('day_number, viewed_at')
    .eq('user_id', user.id)

  if (error) return dbError(error)
  return NextResponse.json({ views: data })
}
