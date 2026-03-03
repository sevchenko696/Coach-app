'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { CheckCircle, Circle, MessageSquare, StickyNote, Save, ChevronLeft, ChevronRight } from 'lucide-react'

interface Query {
  id: string
  user_name: string
  user_phone: string
  category: string
  message: string
  is_resolved: boolean
  admin_notes: string
  created_at: string
}

const CATEGORY_COLORS: Record<string, string> = {
  Link: 'bg-blue-100 text-blue-700',
  Diet: 'bg-green-100 text-green-700',
  Technical: 'bg-purple-100 text-purple-700',
  Other: 'bg-gray-100 text-gray-700',
}

interface Props { queries: Query[] }

const PAGE_SIZE = 20

export default function QueriesClient({ queries: initial }: Props) {
  const [queries, setQueries] = useState(initial)
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [notesInput, setNotesInput] = useState<Record<string, string>>({})
  const [savingNotes, setSavingNotes] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  const filtered = queries.filter(q =>
    filter === 'all' ? true : filter === 'open' ? !q.is_resolved : q.is_resolved
  )

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  async function toggleResolved(id: string, current: boolean) {
    const res = await fetch(`/api/queries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_resolved: !current }),
    })
    if (res.ok) {
      setQueries(q => q.map(x => x.id === id ? { ...x, is_resolved: !current } : x))
      toast.success(!current ? 'Marked as resolved' : 'Marked as open')
    }
  }

  async function saveNotes(id: string) {
    setSavingNotes(id)
    try {
      const res = await fetch(`/api/queries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: notesInput[id] || '' }),
      })
      if (res.ok) {
        const data = await res.json()
        setQueries(q => q.map(x => x.id === id ? { ...x, admin_notes: data.query.admin_notes } : x))
        toast.success('Notes saved')
      }
    } finally { setSavingNotes(null) }
  }

  const open = queries.filter(q => !q.is_resolved).length
  const resolved = queries.filter(q => q.is_resolved).length

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Filter tabs */}
        <div className="flex gap-2">
          {(['all', 'open', 'resolved'] as const).map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(0) }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === f ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f} {f === 'open' ? `(${open})` : f === 'resolved' ? `(${resolved})` : `(${queries.length})`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <MessageSquare size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-400">No queries in this category</p>
          </div>
        ) : (
          <div className="space-y-2">
            {paginated.map(query => (
              <div key={query.id} className={`bg-white rounded-xl border overflow-hidden ${query.is_resolved ? 'border-gray-100' : 'border-gray-200'}`}>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleResolved(query.id, query.is_resolved)}
                      className={`mt-0.5 flex-shrink-0 transition-colors ${query.is_resolved ? 'text-green-500' : 'text-gray-300 hover:text-green-400'}`}
                    >
                      {query.is_resolved ? <CheckCircle size={20} /> : <Circle size={20} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-medium text-gray-900">{query.user_name}</span>
                        <span className="text-xs text-gray-400">{query.user_phone}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[query.category] || CATEGORY_COLORS.Other}`}>
                          {query.category}
                        </span>
                        {query.is_resolved && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Resolved</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{query.message}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <p className="text-xs text-gray-400">
                          {new Date(query.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <button
                          onClick={() => {
                            setExpandedId(expandedId === query.id ? null : query.id)
                            if (!notesInput[query.id]) setNotesInput(p => ({ ...p, [query.id]: query.admin_notes || '' }))
                          }}
                          className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline"
                        >
                          <StickyNote size={11} />
                          {query.admin_notes ? 'View Notes' : 'Add Notes'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin Notes Section */}
                {expandedId === query.id && (
                  <div className="px-4 pb-4 border-t border-gray-50 pt-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Admin Notes</label>
                    <textarea
                      value={notesInput[query.id] || ''}
                      onChange={e => setNotesInput(p => ({ ...p, [query.id]: e.target.value }))}
                      rows={2}
                      placeholder="Add internal notes about how this was resolved..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <button
                      onClick={() => saveNotes(query.id)}
                      disabled={savingNotes === query.id}
                      className="mt-2 flex items-center gap-1.5 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Save size={12} />
                      {savingNotes === query.id ? 'Saving...' : 'Save Notes'}
                    </button>
                  </div>
                )}
              </div>
            ))}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <span className="text-sm text-gray-500">Page {page + 1} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
    </div>
  )
}
