import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireUser, isErrorResponse, dbError, errorResponse } from '@/lib/api'
import { createCheckinSchema, formatZodError } from '@/lib/validations'

export async function GET() {
  const user = await requireUser()
  if (isErrorResponse(user)) return user

  const { data, error } = await supabaseAdmin
    .from('daily_checkins')
    .select('*')
    .eq('user_id', user.id)
    .order('day_number', { ascending: true })

  if (error) return dbError(error)
  return NextResponse.json({ checkins: data })
}

export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (isErrorResponse(user)) return user

  const parsed = createCheckinSchema.safeParse(await req.json())
  if (!parsed.success) {
    return errorResponse(formatZodError(parsed.error), 400)
  }

  const { day_number, mood, energy, diet_compliance, notes } = parsed.data

  const { data, error } = await supabaseAdmin
    .from('daily_checkins')
    .upsert(
      { user_id: user.id, day_number, mood, energy, diet_compliance, notes: notes || null },
      { onConflict: 'user_id,day_number' }
    )
    .select()
    .single()

  if (error) return dbError(error)
  return NextResponse.json({ checkin: data })
}
