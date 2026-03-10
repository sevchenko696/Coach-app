import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin, isErrorResponse, dbError, errorResponse } from '@/lib/api'
import { createAnnouncementSchema, formatZodError } from '@/lib/validations'

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

  const parsed = createAnnouncementSchema.safeParse(await req.json())
  if (!parsed.success) {
    return errorResponse(formatZodError(parsed.error), 400)
  }

  const { title, message } = parsed.data

  const { data, error } = await supabaseAdmin
    .from('announcements')
    .insert({ title: title.trim(), message: message.trim() })
    .select()
    .single()

  if (error) return dbError(error)
  return NextResponse.json({ announcement: data })
}
