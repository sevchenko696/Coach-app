import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { PROGRAM_DAYS } from '@/lib/constants'
import CertificateClient from './CertificateClient'

export default async function CertificatePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { data: views } = await supabaseAdmin
    .from('content_views')
    .select('day_number')
    .eq('user_id', user.id)

  const viewedDays = new Set((views || []).map(v => v.day_number))
  if (viewedDays.size < PROGRAM_DAYS) redirect('/dashboard')

  // Fetch user + batch info
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('*, batches(name, start_date)')
    .eq('id', user.id)
    .single()

  // Find latest view date as completion date
  const { data: latestView } = await supabaseAdmin
    .from('content_views')
    .select('viewed_at')
    .eq('user_id', user.id)
    .order('viewed_at', { ascending: false })
    .limit(1)
    .single()

  return (
    <CertificateClient
      userName={userData?.name || user.name}
      batchName={userData?.batches?.name || 'L1 10+2 Detox'}
      completionDate={latestView?.viewed_at || new Date().toISOString()}
    />
  )
}
