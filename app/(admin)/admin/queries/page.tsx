import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import QueriesClient from './QueriesClient'

export default async function AdminQueriesPage() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/admin/login')

  const { data: queries } = await supabaseAdmin
    .from('queries')
    .select('*')
    .order('created_at', { ascending: false })

  return <QueriesClient queries={queries || []} />
}
