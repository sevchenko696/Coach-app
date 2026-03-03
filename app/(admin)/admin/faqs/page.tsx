import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import FAQsClient from './FAQsClient'

export default async function AdminFAQsPage() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/admin/login')

  const { data: faqs } = await supabaseAdmin
    .from('faqs')
    .select('*')
    .order('display_order', { ascending: true })

  return <FAQsClient faqs={faqs || []} />
}
