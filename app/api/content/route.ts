import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth, isErrorResponse, dbError } from '@/lib/api'

export async function GET() {
  const auth = await requireAuth()
  if (isErrorResponse(auth)) return auth

  const { data, error } = await supabaseAdmin
    .from('daily_content')
    .select('*')
    .order('day_number', { ascending: true })

  if (error) return dbError(error)
  return NextResponse.json({ content: data })
}
