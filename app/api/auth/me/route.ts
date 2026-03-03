import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireUser, isErrorResponse, dbError } from '@/lib/api'

export async function GET() {
  const user = await requireUser()
  if (isErrorResponse(user)) return user

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*, batches(*)')
    .eq('id', user.id)
    .single()

  if (error) return dbError(error)
  return NextResponse.json({ user: data })
}
