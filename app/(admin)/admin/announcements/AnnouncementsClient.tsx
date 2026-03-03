'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2, Megaphone } from 'lucide-react'
import type { Announcement } from '@/types'

export default function AnnouncementsClient({ announcements: initial }: { announcements: Announcement[] }) {
  const [announcements, setAnnouncements] = useState(initial)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', message: '' })
  const [saving, setSaving] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.message.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setAnnouncements([data.announcement, ...announcements])
      setForm({ title: '', message: '' })
      setShowAdd(false)
      toast.success('Announcement posted!')
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this announcement?')) return
    const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setAnnouncements(a => a.filter(x => x.id !== id))
      toast.success('Announcement deleted')
    } else {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{announcements.length} announcement{announcements.length !== 1 ? 's' : ''}</p>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700"
          >
            <Plus size={14} /> New Announcement
          </button>
        </div>

        {showAdd && (
          <form onSubmit={handleAdd} className="bg-white rounded-xl border border-green-200 p-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-900">Post Announcement</h3>
            <input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Title (e.g. Session Delayed)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
            <textarea
              value={form.message}
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              placeholder="Message details..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              required
            />
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">
                {saving ? 'Posting...' : 'Post'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        )}

        {announcements.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <Megaphone size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-400">No announcements yet. Post one to notify all users.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {announcements.map(a => (
              <div key={a.id} className={`bg-white rounded-xl border p-4 ${a.is_active ? 'border-amber-200' : 'border-gray-100 opacity-60'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Megaphone size={14} className="text-amber-500 flex-shrink-0" />
                      <p className="text-sm font-medium text-gray-900">{a.title}</p>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">{a.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(a.id)} className="p-2 text-gray-400 hover:text-red-500 flex-shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
