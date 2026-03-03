import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentDay } from '@/lib/dates'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [{ data: userData }, { data: content }, { data: announcements }, { data: contentViews }, { data: unreadQueries }] =
    await Promise.all([
      supabaseAdmin.from('users').select('*, batches(*)').eq('id', user.id).single(),
      supabaseAdmin.from('daily_content').select('*').order('day_number', { ascending: true }),
      supabaseAdmin.from('announcements').select('*').eq('is_active', true).order('created_at', { ascending: false }),
      supabaseAdmin.from('content_views').select('day_number, viewed_at').eq('user_id', user.id),
      supabaseAdmin.from('queries').select('id').eq('user_id', user.id).eq('response_read', false),
    ])

  const currentDay = userData?.batches?.start_date ? getCurrentDay(userData.batches.start_date) : 0

  let todayCheckin = null
  if (currentDay >= 1) {
    const { data: checkin } = await supabaseAdmin
      .from('daily_checkins')
      .select('*')
      .eq('user_id', user.id)
      .eq('day_number', currentDay)
      .maybeSingle()
    todayCheckin = checkin
  }

  return (
    <DashboardClient
      user={userData}
      batch={userData?.batches || null}
      content={content || []}
      announcements={announcements || []}
      viewedDays={(contentViews || []).map(v => v.day_number)}
      todayCheckin={todayCheckin}
      hasPassword={!!userData?.password}
      unreadQueryCount={unreadQueries?.length || 0}
    />
  )
}
