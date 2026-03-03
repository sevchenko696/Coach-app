import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin, isErrorResponse } from '@/lib/api'
import { getBatchName } from '@/types'

export async function GET() {
  const auth = await requireAdmin()
  if (isErrorResponse(auth)) return auth

  const { data: users } = await supabaseAdmin
    .from('users')
    .select('*, batches(name)')
    .order('name', { ascending: true })

  const { data: views } = await supabaseAdmin
    .from('content_views')
    .select('user_id, day_number, viewed_at')

  const viewMap = new Map<string, { count: number; lastActive: string }>()
  ;(views || []).forEach(v => {
    if (!viewMap.has(v.user_id)) viewMap.set(v.user_id, { count: 0, lastActive: '' })
    const entry = viewMap.get(v.user_id)!
    entry.count++
    if (!entry.lastActive || v.viewed_at > entry.lastActive) entry.lastActive = v.viewed_at
  })

  const header = 'Name,Phone,DOB,Batch,Days Completed,Last Active'
  const rows = (users || []).map(u => {
    const progress = viewMap.get(u.id)
    const batchName = getBatchName(u.batches)
    const daysCompleted = progress?.count || 0
    const lastActive = progress?.lastActive
      ? new Date(progress.lastActive).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Never'

    return [`"${u.name}"`, u.phone, u.dob, `"${batchName}"`, daysCompleted, lastActive].join(',')
  })

  const csv = [header, ...rows].join('\n')
  const date = new Date().toISOString().split('T')[0]

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="healeasy-users-${date}.csv"`,
    },
  })
}
