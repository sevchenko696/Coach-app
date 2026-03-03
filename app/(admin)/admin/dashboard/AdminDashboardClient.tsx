'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Users, Calendar, MessageSquare, CheckCircle, Plus, Edit, QrCode, Copy, Link, Smartphone, Archive, Trash2, RotateCcw, ChevronDown } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import type { Batch } from '@/types'

interface Props {
  stats: { totalUsers: number; activeBatches: number; openQueries: number; resolvedQueries: number }
  batches: Batch[]
  networkUrl: string
}

export default function AdminDashboardClient({ stats, batches, networkUrl }: Props) {
  const router = useRouter()
  const [showNewBatch, setShowNewBatch] = useState(false)
  const [batchForm, setBatchForm] = useState({ name: 'L1 10+2 Detox', start_date: '', zoom_link: '' })
  const [creating, setCreating] = useState(false)
  const [editBatch, setEditBatch] = useState<Batch | null>(null)
  const [editForm, setEditForm] = useState({ name: '', start_date: '', zoom_link: '' })
  const [updating, setUpdating] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  const shareUrl = `${networkUrl}/login`
  const activeBatches = batches.filter(b => b.is_active)
  const archivedBatches = batches.filter(b => !b.is_active)

  async function handleCreateBatch(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/batch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(batchForm) })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('Batch created!')
      setShowNewBatch(false)
      router.refresh()
    } finally { setCreating(false) }
  }

  async function handleUpdateBatch(e: React.FormEvent) {
    e.preventDefault()
    if (!editBatch) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/batch/${editBatch.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('Batch updated!')
      setEditBatch(null)
      router.refresh()
    } finally { setUpdating(false) }
  }

  async function handleToggleArchive(batch: Batch) {
    const action = batch.is_active ? 'archive' : 'restore'
    const res = await fetch(`/api/batch/${batch.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !batch.is_active }),
    })
    if (res.ok) {
      toast.success(batch.is_active ? 'Batch archived' : 'Batch restored')
      router.refresh()
    } else {
      toast.error(`Failed to ${action}`)
    }
  }

  async function handleDeleteBatch(batch: Batch) {
    if (!confirm(`Delete "${batch.name}"? Users in this batch will become unassigned.`)) return
    const res = await fetch(`/api/batch/${batch.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) {
      toast.success('Batch deleted')
      router.refresh()
    } else {
      toast.error(data.error || 'Failed to delete')
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'HealEasy — L1 Detox Program',
          text: 'Access your L1 10+2 Detox Program dashboard here:',
          url: shareUrl,
        })
      } catch {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied!')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'blue' },
          { label: 'Active Batches', value: stats.activeBatches, icon: Calendar, color: 'green' },
          { label: 'Open Queries', value: stats.openQueries, icon: MessageSquare, color: 'amber' },
          { label: 'Resolved', value: stats.resolvedQueries, icon: CheckCircle, color: 'green' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className={`w-8 h-8 rounded-lg mb-2 flex items-center justify-center ${
              color === 'blue' ? 'bg-blue-100' : color === 'amber' ? 'bg-amber-100' : 'bg-green-100'
            }`}>
              <Icon size={16} className={
                color === 'blue' ? 'text-blue-600' : color === 'amber' ? 'text-amber-600' : 'text-green-600'
              } />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Batches */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Batches</h2>
          <button
            onClick={() => setShowNewBatch(!showNewBatch)}
            className="flex items-center gap-1.5 text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={14} /> New Batch
          </button>
        </div>

        {showNewBatch && (
          <form onSubmit={handleCreateBatch} className="mb-5 p-4 bg-gray-50 rounded-xl space-y-3">
            <h3 className="text-sm font-medium text-gray-900">Create New Batch</h3>
            <input value={batchForm.name} onChange={e => setBatchForm(p => ({ ...p, name: e.target.value }))} placeholder="Batch name" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" required />
            <input type="date" value={batchForm.start_date} onChange={e => setBatchForm(p => ({ ...p, start_date: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" required />
            <input value={batchForm.zoom_link} onChange={e => setBatchForm(p => ({ ...p, zoom_link: e.target.value }))} placeholder="Zoom link (optional)" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            <div className="flex gap-2">
              <button type="submit" disabled={creating} className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">{creating ? 'Creating...' : 'Create'}</button>
              <button type="button" onClick={() => setShowNewBatch(false)} className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        )}

        {editBatch && (
          <form onSubmit={handleUpdateBatch} className="mb-5 p-4 bg-blue-50 rounded-xl space-y-3 border border-blue-100">
            <h3 className="text-sm font-medium text-gray-900">Edit Batch</h3>
            <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} placeholder="Batch name" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="date" value={editForm.start_date} onChange={e => setEditForm(p => ({ ...p, start_date: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input value={editForm.zoom_link} onChange={e => setEditForm(p => ({ ...p, zoom_link: e.target.value }))} placeholder="Zoom link" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex gap-2">
              <button type="submit" disabled={updating} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{updating ? 'Saving...' : 'Save'}</button>
              <button type="button" onClick={() => setEditBatch(null)} className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        )}

        {/* Active Batches */}
        <div className="space-y-2">
          {activeBatches.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No active batches. Create one to get started.</p>
          ) : activeBatches.map(batch => (
            <div key={batch.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-900">{batch.name}</p>
                <p className="text-xs text-gray-500">Started: {new Date(batch.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                {batch.zoom_link && <p className="text-xs text-green-600 mt-0.5">Zoom link set</p>}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setEditBatch(batch); setEditForm({ name: batch.name, start_date: batch.start_date, zoom_link: batch.zoom_link || '' }) }}
                  className="p-2 text-gray-400 hover:text-blue-600" title="Edit"
                >
                  <Edit size={15} />
                </button>
                <button
                  onClick={() => handleToggleArchive(batch)}
                  className="p-2 text-gray-400 hover:text-amber-600" title="Archive"
                >
                  <Archive size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Archived Batches */}
        {archivedBatches.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              <ChevronDown size={14} className={`transition-transform ${showArchived ? 'rotate-180' : ''}`} />
              Archived ({archivedBatches.length})
            </button>
            {showArchived && (
              <div className="mt-2 space-y-2">
                {archivedBatches.map(batch => (
                  <div key={batch.id} className="flex items-center justify-between p-3 bg-gray-100 rounded-xl opacity-70">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{batch.name}</p>
                      <p className="text-xs text-gray-400">Started: {new Date(batch.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleArchive(batch)}
                        className="p-2 text-gray-400 hover:text-green-600" title="Restore"
                      >
                        <RotateCcw size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteBatch(batch)}
                        className="p-2 text-gray-400 hover:text-red-500" title="Delete permanently"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Share Portal */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Share Portal</h2>
          <button
            onClick={() => setShowQR(!showQR)}
            className="flex items-center gap-1.5 text-sm text-green-600 font-medium"
          >
            <QrCode size={15} /> {showQR ? 'Hide QR' : 'Show QR'}
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-3">Share this link with users on your network. After deployment, this will be your public URL.</p>

        <div className="flex items-center gap-1.5 text-xs text-blue-600 mb-2">
          <Smartphone size={12} />
          <span>Mobile-accessible link (same WiFi network)</span>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200 min-w-0">
            <Link size={14} className="text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-700 truncate">{shareUrl}</span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(shareUrl)
              toast.success('Link copied!')
            }}
            className="flex items-center gap-1.5 bg-green-600 text-white text-sm px-4 py-2.5 rounded-lg hover:bg-green-700 flex-shrink-0"
          >
            <Copy size={14} /> Copy
          </button>
        </div>

        <button
          onClick={handleShare}
          className="w-full mt-2 flex items-center justify-center gap-2 text-sm text-green-700 bg-green-50 hover:bg-green-100 font-medium py-2.5 rounded-xl transition-colors"
        >
          <Smartphone size={15} />
          Share via WhatsApp / Message
        </button>

        {showQR && (
          <div className="mt-4 flex flex-col items-center p-6 bg-white rounded-xl border border-gray-100">
            <QRCodeSVG
              value={shareUrl}
              size={200}
              fgColor="#111827"
              bgColor="#ffffff"
              level="M"
              includeMargin
            />
            <p className="text-xs text-gray-500 mt-3 text-center">
              Scan with phone camera to open the HealEasy portal
            </p>
            <p className="text-xs text-gray-400 mt-1 text-center break-all">{shareUrl}</p>
          </div>
        )}
      </div>
    </div>
  )
}
