import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import UsersClient from './UsersClient'

export default async function AdminUsersPage() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/admin/login')

  const [{ data: users }, { data: batches }] = await Promise.all([
    supabaseAdmin.from('users').select('*, batches(name)').order('created_at', { ascending: false }),
    supabaseAdmin.from('batches').select('id, name').eq('is_active', true),
  ])

  return <UsersClient users={users || []} batches={batches || []} />
}
