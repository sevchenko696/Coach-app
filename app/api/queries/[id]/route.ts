import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin, isErrorResponse, dbError, errorResponse } from '@/lib/api'
import { updateQuerySchema, formatZodError } from '@/lib/validations'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (isErrorResponse(auth)) return auth

  const { id } = await params
  const parsed = updateQuerySchema.safeParse(await req.json())
  if (!parsed.success) {
    return errorResponse(formatZodError(parsed.error), 400)
  }

  const body = parsed.data
  const updates: Record<string, unknown> = {}
  if (body.is_resolved !== undefined) updates.is_resolved = body.is_resolved
  if (body.admin_notes !== undefined) updates.admin_notes = body.admin_notes

  // Mark as unread for the user when admin responds
  if (body.admin_notes !== undefined || body.is_resolved !== undefined) {
    updates.response_read = false
  }

  const { data, error } = await supabaseAdmin
    .from('queries')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return dbError(error)
  return NextResponse.json({ query: data })
}
