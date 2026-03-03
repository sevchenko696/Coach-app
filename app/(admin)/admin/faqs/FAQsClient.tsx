'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2, Edit, Check, X, ChevronUp, ChevronDown, HelpCircle } from 'lucide-react'
import type { FAQ } from '@/types'

export default function FAQsClient({ faqs: initial }: { faqs: FAQ[] }) {
  const [faqs, setFaqs] = useState(initial)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ question: '', answer: '' })
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ question: '', answer: '' })
  const [saving, setSaving] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addForm.question.trim() || !addForm.answer.trim()) return
    setSaving(true)
    try {
      const maxOrder = faqs.length > 0 ? Math.max(...faqs.map(f => f.display_order)) : 0
      const res = await fetch('/api/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...addForm, display_order: maxOrder + 1 }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setFaqs([...faqs, data.faq])
      setAddForm({ question: '', answer: '' })
      setShowAdd(false)
      toast.success('FAQ added!')
    } finally { setSaving(false) }
  }

  async function handleSaveEdit() {
    if (!editingId || !editForm.question.trim() || !editForm.answer.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/faqs/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setFaqs(f => f.map(x => x.id === editingId ? data.faq : x))
      setEditingId(null)
      toast.success('FAQ updated!')
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this FAQ?')) return
    const res = await fetch(`/api/faqs/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setFaqs(f => f.filter(x => x.id !== id))
      toast.success('FAQ deleted')
    } else {
      toast.error('Failed to delete')
    }
  }

  async function handleReorder(id: string, direction: 'up' | 'down') {
    const idx = faqs.findIndex(f => f.id === id)
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === faqs.length - 1)) return

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const newFaqs = [...faqs]
    const tempOrder = newFaqs[idx].display_order
    newFaqs[idx].display_order = newFaqs[swapIdx].display_order
    newFaqs[swapIdx].display_order = tempOrder;
    [newFaqs[idx], newFaqs[swapIdx]] = [newFaqs[swapIdx], newFaqs[idx]]
    setFaqs(newFaqs)

    // Update both in DB
    await Promise.all([
      fetch(`/api/faqs/${newFaqs[idx].id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_order: newFaqs[idx].display_order }),
      }),
      fetch(`/api/faqs/${newFaqs[swapIdx].id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_order: newFaqs[swapIdx].display_order }),
      }),
    ])
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{faqs.length} FAQs — drag to reorder</p>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700"
          >
            <Plus size={14} /> Add FAQ
          </button>
        </div>

        {/* Add Form */}
        {showAdd && (
          <form onSubmit={handleAdd} className="bg-white rounded-xl border border-green-200 p-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-900">New FAQ</h3>
            <input
              value={addForm.question}
              onChange={e => setAddForm(p => ({ ...p, question: e.target.value }))}
              placeholder="Question"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
            <textarea
              value={addForm.answer}
              onChange={e => setAddForm(p => ({ ...p, answer: e.target.value }))}
              placeholder="Answer"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              required
            />
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">
                {saving ? 'Adding...' : 'Add'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        )}

        {/* FAQ List */}
        {faqs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <HelpCircle size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-400">No FAQs yet. Add your first one above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {faqs.map((faq, idx) => (
              <div key={faq.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {editingId === faq.id ? (
                  <div className="p-4 space-y-3">
                    <input
                      value={editForm.question}
                      onChange={e => setEditForm(p => ({ ...p, question: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <textarea
                      value={editForm.answer}
                      onChange={e => setEditForm(p => ({ ...p, answer: e.target.value }))}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={handleSaveEdit} disabled={saving} className="flex items-center gap-1 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        <Check size={12} /> {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={() => setEditingId(null)} className="flex items-center gap-1 border border-gray-300 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-50">
                        <X size={12} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 flex items-start gap-3">
                    {/* Reorder buttons */}
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => handleReorder(faq.id, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => handleReorder(faq.id, 'down')}
                        disabled={idx === faqs.length - 1}
                        className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{faq.question}</p>
                      <p className="text-sm text-gray-500 mt-1 leading-relaxed">{faq.answer}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => { setEditingId(faq.id); setEditForm({ question: faq.question, answer: faq.answer }) }}
                        className="p-2 text-gray-400 hover:text-blue-600"
                      >
                        <Edit size={15} />
                      </button>
                      <button onClick={() => handleDelete(faq.id)} className="p-2 text-gray-400 hover:text-red-500">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
