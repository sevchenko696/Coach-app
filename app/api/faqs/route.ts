import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin, isErrorResponse, dbError, errorResponse } from '@/lib/api'
import { createFaqSchema, formatZodError } from '@/lib/validations'

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

  const parsed = createFaqSchema.safeParse(await req.json())
  if (!parsed.success) {
    return errorResponse(formatZodError(parsed.error), 400)
  }

  const { question, answer, display_order } = parsed.data
  const { data, error } = await supabaseAdmin
    .from('faqs')
    .insert({ question, answer, display_order: display_order || 0 })
    .select()
    .single()

  if (error) return dbError(error)
  return NextResponse.json({ faq: data })
}
