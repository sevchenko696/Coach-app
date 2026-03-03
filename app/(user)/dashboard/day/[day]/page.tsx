import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentDay } from '@/lib/dates'
import { PROGRAM_DAYS } from '@/lib/constants'
import DayDetailClient from './DayDetailClient'

export default async function DayPage({ params }: { params: Promise<{ day: string }> }) {
  const { day } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const dayNumber = parseInt(day)
  if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > PROGRAM_DAYS) redirect('/dashboard')

  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('*, batches(*)')
    .eq('id', user.id)
    .single()

  if (userData?.batches?.start_date) {
    const currentDay = getCurrentDay(userData.batches.start_date)
    if (dayNumber > currentDay) redirect('/dashboard')
  }

  // Record content view + fetch content and reviews in parallel
  await supabaseAdmin
    .from('content_views')
    .upsert({ user_id: user.id, day_number: dayNumber }, { onConflict: 'user_id,day_number' })

  const [{ data: content }, { data: reviews }, { data: myReview }] = await Promise.all([
    supabaseAdmin.from('daily_content').select('*').eq('day_number', dayNumber).single(),
    supabaseAdmin.from('reviews').select('*').eq('day_number', dayNumber).order('created_at', { ascending: false }),
    supabaseAdmin.from('reviews').select('*').eq('day_number', dayNumber).eq('user_id', user.id).single(),
  ])

  return (
    <DayDetailClient
      dayNumber={dayNumber}
      content={content}
      reviews={reviews || []}
      myReview={myReview || null}
      userName={user.name}
    />
  )
}
