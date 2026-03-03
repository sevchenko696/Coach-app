import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import ContentClient from './ContentClient'

export default async function AdminContentPage() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/admin/login')

  const { data: content } = await supabaseAdmin
    .from('daily_content')
    .select('*')
    .order('day_number', { ascending: true })

  return <ContentClient content={content || []} />
}
