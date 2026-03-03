import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentDay } from '@/lib/dates'
import ProgressClient from './ProgressClient'

export default async function UserProgressPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [{ data: userData }, { data: checkins }, { data: contentViews }] = await Promise.all([
    supabaseAdmin.from('users').select('*, batches(*)').eq('id', user.id).single(),
    supabaseAdmin.from('daily_checkins').select('*').eq('user_id', user.id).order('day_number', { ascending: true }),
    supabaseAdmin.from('content_views').select('day_number, viewed_at').eq('user_id', user.id),
  ])

  const currentDay = userData?.batches?.start_date ? getCurrentDay(userData.batches.start_date) : 0

  return (
    <ProgressClient
      userName={user.name}
      checkins={checkins || []}
      viewedDays={(contentViews || []).map(v => v.day_number)}
      currentDay={currentDay}
    />
  )
}
