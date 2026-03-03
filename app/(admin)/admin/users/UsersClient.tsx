'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import toast from 'react-hot-toast'
import { Upload, Trash2, Edit, Check, X, Users, Search, Download, ChevronLeft, ChevronRight } from 'lucide-react'

interface User { id: string; name: string; phone: string; dob: string; batch_id: string | null; batches?: { name: string } }
interface Batch { id: string; name: string }

interface Props { users: User[]; batches: Batch[] }

const PAGE_SIZE = 25

export default function UsersClient({ users: initialUsers, batches }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [users, setUsers] = useState(initialUsers)
  const [selectedBatch, setSelectedBatch] = useState(batches[0]?.id || '')
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', phone: '', dob: '', batch_id: '' })
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterBatch, setFilterBatch] = useState<string>('all')
  const [importErrors, setImportErrors] = useState<{ row: number; phone: string; reason: string }[]>([])
  const [page, setPage] = useState(0)

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkBatchId, setBulkBatchId] = useState('')
  const [bulkAssigning, setBulkAssigning] = useState(false)

  const filteredUsers = users.filter(u => {
    const matchesSearch = !searchQuery ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery)
    const matchesBatch = filterBatch === 'all' ||
      (filterBatch === 'unassigned' ? !u.batch_id : u.batch_id === filterBatch)
    return matchesSearch && matchesBatch
  })

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE)
  const paginatedUsers = filteredUsers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // Reset page when filters change
  function handleSearchChange(q: string) { setSearchQuery(q); setPage(0) }
  function handleFilterChange(f: string) { setFilterBatch(f); setPage(0) }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === paginatedUsers.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedUsers.map(u => u.id)))
    }
  }

  async function handleBulkAssign() {
    if (selectedIds.size === 0) return
    setBulkAssigning(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: Array.from(selectedIds), batchId: bulkBatchId || null }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success(`${data.count} users reassigned`)
      setSelectedIds(new Set())
      router.refresh()
    } finally { setBulkAssigning(false) }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as Array<Record<string, string>>
        const mapped = rows.map(r => ({
          name: r.name || r.Name || r.NAME || '',
          phone: r.phone || r.Phone || r.PHONE || r['Phone Number'] || '',
          dob: r.dob || r.DOB || r['Date of Birth'] || r.date_of_birth || '',
        })).filter(r => r.name && r.phone && r.dob)

        if (mapped.length === 0) { toast.error('No valid rows found. Ensure columns: name, phone, dob'); return }
        setUploading(true)
        setImportErrors([])
        try {
          const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ users: mapped, batchId: selectedBatch || null }),
          })
          const data = await res.json()
          if (!res.ok) { toast.error(data.error); if (data.errors) setImportErrors(data.errors); return }
          if (data.errors?.length > 0) {
            setImportErrors(data.errors)
            toast.success(`${data.count} users imported, ${data.errors.length} skipped`)
          } else {
            toast.success(`${data.count} users imported!`)
          }
          router.refresh()
        } finally { setUploading(false) }
      }
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this user?')) return
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
    if (res.ok) { setUsers(u => u.filter(x => x.id !== id)); toast.success('User deleted') }
    else toast.error('Failed to delete')
  }

  async function handleSaveEdit() {
    if (!editingId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setUsers(u => u.map(x => x.id === editingId ? { ...x, ...data.user } : x))
      setEditingId(null)
      toast.success('User updated')
    } finally { setSaving(false) }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      {/* CSV Upload */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-1">Bulk Import Users</h2>
        <p className="text-sm text-gray-500 mb-3">Upload a CSV with columns: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">name, phone, dob</code> (DOB format: YYYY-MM-DD)</p>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedBatch}
            onChange={e => setSelectedBatch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 flex-1"
          >
            <option value="">No batch (unassigned)</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
          >
            <Upload size={15} />
            {uploading ? 'Importing...' : 'Upload CSV'}
          </button>
          <button
            onClick={async () => {
              const res = await fetch('/api/export/users')
              const blob = await res.blob()
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `healeasy-users-${new Date().toISOString().split('T')[0]}.csv`
              a.click()
              URL.revokeObjectURL(url)
              toast.success('CSV exported!')
            }}
            className="flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg"
          >
            <Download size={15} />
            Export
          </button>
        </div>
        <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />

        {importErrors.length > 0 && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800 mb-1">Skipped {importErrors.length} row(s) with invalid phone numbers:</p>
            <ul className="text-xs text-red-600 space-y-0.5">
              {importErrors.map((err, i) => (
                <li key={i}>Row {err.row}: &quot;{err.phone}&quot; — {err.reason}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <select
          value={filterBatch}
          onChange={e => handleFilterChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="all">All batches ({users.length})</option>
          <option value="unassigned">Unassigned ({users.filter(u => !u.batch_id).length})</option>
          {batches.map(b => (
            <option key={b.id} value={b.id}>{b.name} ({users.filter(u => u.batch_id === b.id).length})</option>
          ))}
        </select>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 sticky top-12 md:top-0 z-10">
          <span className="text-sm font-medium text-blue-800">{selectedIds.size} selected</span>
          <div className="flex items-center gap-2 flex-1">
            <select
              value={bulkBatchId}
              onChange={e => setBulkBatchId(e.target.value)}
              className="border border-blue-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 sm:flex-none sm:w-48"
            >
              <option value="">Unassigned</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <button
              onClick={handleBulkAssign}
              disabled={bulkAssigning}
              className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {bulkAssigning ? 'Assigning...' : 'Assign Batch'}
            </button>
          </div>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <input
            type="checkbox"
            checked={paginatedUsers.length > 0 && selectedIds.size === paginatedUsers.length}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <Users size={16} className="text-gray-400" />
          <h2 className="font-semibold text-gray-900">
            {searchQuery || filterBatch !== 'all'
              ? `${filteredUsers.length} of ${users.length} users`
              : `All Users (${users.length})`}
          </h2>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Users size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">{searchQuery || filterBatch !== 'all' ? 'No users match your search.' : 'No users yet. Upload a CSV to get started.'}</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-50">
              {paginatedUsers.map(user => (
                <div key={user.id} className="p-4">
                  {editingId === user.id ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} placeholder="Name" className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                        <input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                        <input type="date" value={editForm.dob} onChange={e => setEditForm(p => ({ ...p, dob: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                        <select value={editForm.batch_id} onChange={e => setEditForm(p => ({ ...p, batch_id: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                          <option value="">Unassigned</option>
                          {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleSaveEdit} disabled={saving} className="flex items-center gap-1 bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50">
                          <Check size={12} /> {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={() => setEditingId(null)} className="flex items-center gap-1 border border-gray-300 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-50">
                          <X size={12} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(user.id)}
                        onChange={() => toggleSelect(user.id)}
                        className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.phone} · DOB: {user.dob}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{user.batches?.name || 'Unassigned'}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => { setEditingId(user.id); setEditForm({ name: user.name, phone: user.phone, dob: user.dob, batch_id: user.batch_id || '' }) }}
                          className="p-2 text-gray-400 hover:text-blue-600"
                        >
                          <Edit size={15} />
                        </button>
                        <button onClick={() => handleDelete(user.id)} className="p-2 text-gray-400 hover:text-red-500">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
