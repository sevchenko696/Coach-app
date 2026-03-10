import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin, isErrorResponse, dbError, errorResponse } from '@/lib/api'
import { normalizePhone } from '@/lib/phone'
import { bulkCreateUsersSchema, assignBatchSchema, formatZodError } from '@/lib/validations'

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

  const parsed = bulkCreateUsersSchema.safeParse(await req.json())
  if (!parsed.success) {
    return errorResponse(formatZodError(parsed.error), 400)
  }

  const { users, batchId } = parsed.data
  const errors: { row: number; phone: string; reason: string }[] = []
  const toInsert: { name: string; phone: string; dob: string; batch_id: string | null }[] = []

  users.forEach((u, i) => {
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
    return errorResponse('No valid users to import', 400)
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

  const parsed = assignBatchSchema.safeParse(await req.json())
  if (!parsed.success) {
    return errorResponse(formatZodError(parsed.error), 400)
  }

  const { userIds, batchId } = parsed.data

  const { error } = await supabaseAdmin
    .from('users')
    .update({ batch_id: batchId || null })
    .in('id', userIds)

  if (error) return dbError(error)
  return NextResponse.json({ success: true, count: userIds.length })
}
