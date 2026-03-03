import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import AnnouncementsClient from './AnnouncementsClient'

export default async function AnnouncementsPage() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/admin/login')

  const { data } = await supabaseAdmin
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })

  return <AnnouncementsClient announcements={data || []} />
}
