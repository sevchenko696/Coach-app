import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentAdmin, getCurrentUser } from '@/lib/auth'
import { requireAdmin, isErrorResponse, dbError, unauthorized, errorResponse } from '@/lib/api'
import { normalizePhone } from '@/lib/phone'
import { updateUserSchema, formatZodError } from '@/lib/validations'
import bcrypt from 'bcryptjs'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = await getCurrentAdmin()
  const currentUser = await getCurrentUser()

  if (!admin && (!currentUser || currentUser.id !== id)) {
    return unauthorized()
  }

  const parsed = updateUserSchema.safeParse(await req.json())
  if (!parsed.success) {
    return errorResponse(formatZodError(parsed.error), 400)
  }

  const body = parsed.data
  const updates: Record<string, string> = {}

  if (body.name) updates.name = body.name.trim()
  if (body.phone && admin) {
    const normalized = normalizePhone(body.phone)
    if (!normalized) {
      return errorResponse('Invalid phone number', 400)
    }
    updates.phone = normalized
  }
  if (body.batch_id !== undefined && admin) updates.batch_id = body.batch_id as string

  if (body.password) {
    updates.password = await bcrypt.hash(body.password.trim(), 10)
  }

  if (body.reset_password && admin) {
    updates.password = ''
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return dbError(error)
  return NextResponse.json({ user: data })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (isErrorResponse(auth)) return auth

  const { id } = await params
  const { error } = await supabaseAdmin.from('users').delete().eq('id', id)
  if (error) return dbError(error)
  return NextResponse.json({ success: true })
}
