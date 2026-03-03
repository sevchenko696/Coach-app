import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin, isErrorResponse, dbError } from '@/lib/api'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('faqs')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) return dbError(error)
  return NextResponse.json({ faqs: data })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (isErrorResponse(auth)) return auth

  const { question, answer, display_order } = await req.json()
  const { data, error } = await supabaseAdmin
    .from('faqs')
    .insert({ question, answer, display_order: display_order || 0 })
    .select()
    .single()

  if (error) return dbError(error)
  return NextResponse.json({ faq: data })
}
