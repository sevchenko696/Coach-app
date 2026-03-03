import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import ProgressClient from './ProgressClient'

export default async function ProgressPage() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/admin/login')

  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, name, phone, batch_id, batches(name)')
    .order('name', { ascending: true })

  const { data: views } = await supabaseAdmin
    .from('content_views')
    .select('user_id, day_number, viewed_at')

  const { data: batches } = await supabaseAdmin
    .from('batches')
    .select('id, name')
    .eq('is_active', true)

  return (
    <ProgressClient
      users={users || []}
      views={views || []}
      batches={batches || []}
    />
  )
}
