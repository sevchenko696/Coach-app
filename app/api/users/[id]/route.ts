import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentAdmin, getCurrentUser } from '@/lib/auth'
import { requireAdmin, isErrorResponse, dbError, unauthorized } from '@/lib/api'
import { normalizePhone } from '@/lib/phone'
import bcrypt from 'bcryptjs'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = await getCurrentAdmin()
  const currentUser = await getCurrentUser()

  if (!admin && (!currentUser || currentUser.id !== id)) {
    return unauthorized()
  }

  const body = await req.json()
  const updates: Record<string, string> = {}

  if (body.name) updates.name = body.name.trim()
  if (body.phone && admin) {
    const normalized = normalizePhone(body.phone)
    if (!normalized) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    }
    updates.phone = normalized
  }
  if (body.batch_id !== undefined && admin) updates.batch_id = body.batch_id

  if (body.password) {
    const trimmed = body.password.trim()
    if (trimmed.length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 })
    }
    updates.password = await bcrypt.hash(trimmed, 10)
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
