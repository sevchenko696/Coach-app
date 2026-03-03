import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth, requireAdmin, isErrorResponse, dbError } from '@/lib/api'

export async function GET() {
  const auth = await requireAuth()
  if (isErrorResponse(auth)) return auth

  const { data, error } = await supabaseAdmin
    .from('batches')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) return dbError(error)
  return NextResponse.json({ batches: data })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (isErrorResponse(auth)) return auth

  const { name, start_date, zoom_link } = await req.json()
  if (!start_date) return NextResponse.json({ error: 'Start date is required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('batches')
    .insert({ name: name || 'L1 10+2 Detox', start_date, zoom_link })
    .select()
    .single()

  if (error) return dbError(error)
  return NextResponse.json({ batch: data })
}
