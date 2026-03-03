import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin, isErrorResponse, dbError } from '@/lib/api'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) return dbError(error)
  return NextResponse.json({ announcements: data })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (isErrorResponse(auth)) return auth

  const { title, message } = await req.json()
  if (!title?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('announcements')
    .insert({ title: title.trim(), message: message.trim() })
    .select()
    .single()

  if (error) return dbError(error)
  return NextResponse.json({ announcement: data })
}
