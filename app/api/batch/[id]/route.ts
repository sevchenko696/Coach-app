import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin, isErrorResponse, dbError, errorResponse } from '@/lib/api'
import { updateBatchSchema, formatZodError } from '@/lib/validations'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (isErrorResponse(auth)) return auth

  const { id } = await params
  const parsed = updateBatchSchema.safeParse(await req.json())
  if (!parsed.success) {
    return errorResponse(formatZodError(parsed.error), 400)
  }

  const body = parsed.data
  const updates: Record<string, unknown> = {}
  if (body.name) updates.name = body.name
  if (body.start_date) updates.start_date = body.start_date
  if (body.zoom_link !== undefined) updates.zoom_link = body.zoom_link
  if (body.is_active !== undefined) updates.is_active = body.is_active

  const { data, error } = await supabaseAdmin
    .from('batches')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return dbError(error)
  return NextResponse.json({ batch: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (isErrorResponse(auth)) return auth

  const { id } = await params

  // Only allow deleting archived (inactive) batches
  const { data: batch } = await supabaseAdmin
    .from('batches')
    .select('is_active')
    .eq('id', id)
    .single()

  if (batch?.is_active) {
    return NextResponse.json({ error: 'Archive the batch before deleting it' }, { status: 400 })
  }

  // Unassign all users from this batch
  await supabaseAdmin
    .from('users')
    .update({ batch_id: null })
    .eq('batch_id', id)

  const { error } = await supabaseAdmin
    .from('batches')
    .delete()
    .eq('id', id)

  if (error) return dbError(error)
  return NextResponse.json({ success: true })
}
