import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('*, batches(name, start_date)')
    .eq('id', user.id)
    .single()

  return <ProfileClient user={userData} />
}
