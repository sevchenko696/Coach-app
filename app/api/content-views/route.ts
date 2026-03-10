import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin, requireUser, isErrorResponse, dbError, errorResponse } from '@/lib/api'
import { createContentViewSchema, formatZodError } from '@/lib/validations'

export async function GET() {
  const auth = await requireAdmin()
  if (isErrorResponse(auth)) return auth

  const { data, error } = await supabaseAdmin
    .from('content_views')
    .select('user_id, day_number, viewed_at')

  if (error) return dbError(error)
  return NextResponse.json({ views: data })
}

export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (isErrorResponse(user)) return user

  const parsed = createContentViewSchema.safeParse(await req.json())
  if (!parsed.success) {
    return errorResponse(formatZodError(parsed.error), 400)
  }

  const { day_number } = parsed.data

  const { error } = await supabaseAdmin
    .from('content_views')
    .upsert(
      { user_id: user.id, day_number },
      { onConflict: 'user_id,day_number' }
    )

  if (error) return dbError(error)
  return NextResponse.json({ success: true })
}
