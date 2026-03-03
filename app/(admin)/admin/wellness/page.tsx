import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import WellnessClient from './WellnessClient'

export default async function WellnessPage() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/admin/login')

  const { data: checkins } = await supabaseAdmin
    .from('daily_checkins')
    .select('*')
    .order('day_number', { ascending: true })

  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, name, phone, batch_id, batches(name)')
    .order('name')

  const { data: batches } = await supabaseAdmin
    .from('batches')
    .select('id, name')
    .order('created_at', { ascending: false })

  return (
    <WellnessClient
      checkins={checkins || []}
      users={users || []}
      batches={batches || []}
    />
  )
}
