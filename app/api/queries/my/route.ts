import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireUser, isErrorResponse, dbError } from '@/lib/api'

export async function GET() {
  const user = await requireUser()
  if (isErrorResponse(user)) return user

  const { data, error } = await supabaseAdmin
    .from('queries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return dbError(error)

  const unreadCount = (data || []).filter(q => !q.response_read && (q.admin_notes || q.is_resolved)).length

  return NextResponse.json({ queries: data, unreadCount })
}

export async function PUT() {
  const user = await requireUser()
  if (isErrorResponse(user)) return user

  const { error } = await supabaseAdmin
    .from('queries')
    .update({ response_read: true })
    .eq('user_id', user.id)
    .eq('response_read', false)

  if (error) return dbError(error)
  return NextResponse.json({ success: true })
}
