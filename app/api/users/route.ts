import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin, isErrorResponse, dbError } from '@/lib/api'
import { normalizePhone } from '@/lib/phone'

export async function GET() {
  const auth = await requireAdmin()
  if (isErrorResponse(auth)) return auth

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*, batches(name, start_date)')
    .order('created_at', { ascending: false })

  if (error) return dbError(error)
  return NextResponse.json({ users: data })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (isErrorResponse(auth)) return auth

  const { users, batchId } = await req.json()

  if (!Array.isArray(users) || users.length === 0) {
    return NextResponse.json({ error: 'No users provided' }, { status: 400 })
  }

  const errors: { row: number; phone: string; reason: string }[] = []
  const toInsert: { name: string; phone: string; dob: string; batch_id: string | null }[] = []

  users.forEach((u: { name: string; phone: string; dob: string }, i: number) => {
    const normalized = normalizePhone(u.phone)
    if (!normalized) {
      errors.push({ row: i + 1, phone: u.phone, reason: 'Invalid phone number' })
      return
    }
    toInsert.push({
      name: u.name.trim(),
      phone: normalized,
      dob: u.dob.trim(),
      batch_id: batchId || null,
    })
  })

  if (toInsert.length === 0) {
    return NextResponse.json({ error: 'No valid users to import', errors }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .upsert(toInsert, { onConflict: 'phone' })
    .select()

  if (error) return dbError(error)
  return NextResponse.json({ users: data, count: data?.length, errors })
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin()
  if (isErrorResponse(auth)) return auth

  const { userIds, batchId } = await req.json()

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: 'No users selected' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('users')
    .update({ batch_id: batchId || null })
    .in('id', userIds)

  if (error) return dbError(error)
  return NextResponse.json({ success: true, count: userIds.length })
}
