import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import ReviewsClient from './ReviewsClient'

export default async function AdminReviewsPage() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/admin/login')

  const { data } = await supabaseAdmin
    .from('reviews')
    .select('*')
    .order('day_number', { ascending: true })
    .order('created_at', { ascending: false })

  return <ReviewsClient reviews={data || []} />
}
