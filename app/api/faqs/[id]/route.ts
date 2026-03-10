import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin, isErrorResponse, dbError, errorResponse } from '@/lib/api'
import { updateFaqSchema, formatZodError } from '@/lib/validations'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (isErrorResponse(auth)) return auth

  const { id } = await params
  const parsed = updateFaqSchema.safeParse(await req.json())
  if (!parsed.success) {
    return errorResponse(formatZodError(parsed.error), 400)
  }

  const body = parsed.data
  const updates: Record<string, unknown> = {}
  if (body.question !== undefined) updates.question = body.question
  if (body.answer !== undefined) updates.answer = body.answer
  if (body.display_order !== undefined) updates.display_order = body.display_order

  const { data, error } = await supabaseAdmin
    .from('faqs')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return dbError(error)
  return NextResponse.json({ faq: data })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (isErrorResponse(auth)) return auth

  const { id } = await params
  const { error } = await supabaseAdmin.from('faqs').delete().eq('id', id)
  if (error) return dbError(error)
  return NextResponse.json({ success: true })
}
