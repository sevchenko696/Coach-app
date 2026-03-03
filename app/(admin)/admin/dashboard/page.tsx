import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { headers } from 'next/headers'
import os from 'os'
import AdminDashboardClient from './AdminDashboardClient'

function getNetworkIP(): string {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return 'localhost'
}

export default async function AdminDashboardPage() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/admin/login')

  const [{ data: users }, { data: batches }, { data: queries }] = await Promise.all([
    supabaseAdmin.from('users').select('id'),
    supabaseAdmin.from('batches').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('queries').select('id, is_resolved'),
  ])

  const stats = {
    totalUsers: users?.length || 0,
    activeBatches: batches?.filter(b => b.is_active).length || 0,
    openQueries: queries?.filter(q => !q.is_resolved).length || 0,
    resolvedQueries: queries?.filter(q => q.is_resolved).length || 0,
  }

  // Get the network IP so QR code works on mobile
  const headerList = await headers()
  const host = headerList.get('host') || 'localhost:3000'
  const protocol = headerList.get('x-forwarded-proto') || 'http'

  let networkUrl = `${protocol}://${host}`
  // If host is localhost, also provide network IP
  const networkIP = host.includes('localhost') ? getNetworkIP() : null
  const port = host.includes(':') ? host.split(':')[1] : ''
  if (networkIP) {
    networkUrl = `http://${networkIP}${port ? ':' + port : ''}`
  }

  return <AdminDashboardClient stats={stats} batches={batches || []} networkUrl={networkUrl} />
}
