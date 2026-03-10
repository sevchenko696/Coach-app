import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth, requireUser, isErrorResponse, dbError, errorResponse } from '@/lib/api'
import { createReviewSchema, formatZodError } from '@/lib/validations'

export async function GET(req: NextRequest) {
  const auth = await requireAuth()
  if (isErrorResponse(auth)) return auth

  const { searchParams } = new URL(req.url)
  const day = searchParams.get('day')

  const query = supabaseAdmin
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false })

  if (day) query.eq('day_number', parseInt(day))

  const { data, error } = await query
  if (error) return dbError(error)
  return NextResponse.json({ reviews: data })
}

export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (isErrorResponse(user)) return user

  const parsed = createReviewSchema.safeParse(await req.json())
  if (!parsed.success) {
    return errorResponse(formatZodError(parsed.error), 400)
  }

  const { day_number, content } = parsed.data

  const { data: existing } = await supabaseAdmin
    .from('reviews')
    .select('id')
    .eq('user_id', user.id)
    .eq('day_number', day_number)
    .single()

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .update({ content: content.trim() })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) return dbError(error)
    return NextResponse.json({ review: data })
  }

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .insert({ user_id: user.id, user_name: user.name, day_number, content: content.trim() })
    .select()
    .single()

  if (error) return dbError(error)
  return NextResponse.json({ review: data })
}
