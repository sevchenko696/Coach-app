import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireUser, isErrorResponse, dbError } from '@/lib/api'

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

  const { day_number, mood, energy, diet_compliance, notes } = await req.json()

  if (!day_number || !mood || !energy || !diet_compliance) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (mood < 1 || mood > 5 || energy < 1 || energy > 5) {
    return NextResponse.json({ error: 'Mood and energy must be between 1-5' }, { status: 400 })
  }
  if (!['yes', 'partially', 'no'].includes(diet_compliance)) {
    return NextResponse.json({ error: 'Invalid diet_compliance value' }, { status: 400 })
  }

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
