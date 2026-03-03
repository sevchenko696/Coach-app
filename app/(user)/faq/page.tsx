'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ArrowLeft, Search, ChevronDown, ChevronUp, Send, Clock, CheckCircle, MessageSquare } from 'lucide-react'
import type { FAQ, Query } from '@/types'
import { QUERY_CATEGORIES, CATEGORY_COLORS } from '@/lib/constants'

export default function FAQPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'faqs' | 'my-queries'>('faqs')
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [category, setCategory] = useState('Link')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [myQueries, setMyQueries] = useState<Query[]>([])
  const [loadingQueries, setLoadingQueries] = useState(false)

  useEffect(() => {
    fetch('/api/faqs').then(r => r.json()).then(d => setFaqs(d.faqs || []))
  }, [])

  useEffect(() => {
    if (tab === 'my-queries' && myQueries.length === 0) {
      setLoadingQueries(true)
      fetch('/api/queries/my')
        .then(r => r.json())
        .then(d => {
          setMyQueries(d.queries || [])
          if (d.unreadCount > 0) {
            fetch('/api/queries/my', { method: 'PUT' })
          }
        })
        .finally(() => setLoadingQueries(false))
    }
  }, [tab, myQueries.length])

  const filtered = faqs.filter(f =>
    f.question.toLowerCase().includes(search.toLowerCase()) ||
    f.answer.toLowerCase().includes(search.toLowerCase())
  )

  async function handleQuerySubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, message }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed to submit'); return }
      setSubmitted(true)
      setMessage('')
      setMyQueries([])
      toast.success('Query submitted! We\'ll get back to you soon.')
    } finally {
      setSubmitting(false)
    }
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-gray-900">FAQ & Support</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setTab('faqs')}
            className={`flex-1 text-xs font-medium py-2 rounded-md transition-colors ${
              tab === 'faqs' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            FAQs
          </button>
          <button
            onClick={() => setTab('my-queries')}
            className={`flex-1 text-xs font-medium py-2 rounded-md transition-colors ${
              tab === 'my-queries' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            My Queries
          </button>
        </div>

        {tab === 'faqs' ? (
          <>
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search questions..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
              />
            </div>

            {/* FAQs */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
                Frequently Asked Questions
              </h2>
              {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                  <p className="text-gray-500 text-sm">No results found. Try a different search or submit a query below.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                  {filtered.map((faq) => (
                    <div key={faq.id}>
                      <button
                        onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-900 pr-4">{faq.question}</span>
                        {openId === faq.id ? (
                          <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                        )}
                      </button>
                      {openId === faq.id && (
                        <div className="px-4 pb-4">
                          <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Query Form */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-1">Didn&apos;t find your answer?</h2>
              <p className="text-sm text-gray-500 mb-4">Submit a query and we&apos;ll get back to you.</p>

              {submitted ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Send size={20} className="text-green-600" />
                  </div>
                  <p className="font-medium text-gray-900">Query Submitted!</p>
                  <p className="text-sm text-gray-500 mt-1">We&apos;ll respond as soon as possible.</p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-3 text-sm text-green-600 font-medium"
                  >
                    Submit another query
                  </button>
                </div>
              ) : (
                <form onSubmit={handleQuerySubmit} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                    >
                      {QUERY_CATEGORIES.map(cat => (
                        <option key={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Message</label>
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      rows={4}
                      placeholder="Describe your question or issue..."
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || !message.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={15} />
                    {submitting ? 'Submitting...' : 'Submit Query'}
                  </button>
                </form>
              )}
            </div>
          </>
        ) : (
          /* My Queries Tab */
          <div className="space-y-3">
            {loadingQueries ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center animate-pulse">
                <p className="text-sm text-gray-400">Loading your queries...</p>
              </div>
            ) : myQueries.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <MessageSquare size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-400">No queries submitted yet.</p>
                <button
                  onClick={() => setTab('faqs')}
                  className="mt-3 text-sm text-green-600 font-medium"
                >
                  Go to FAQs
                </button>
              </div>
            ) : (
              myQueries.map(q => (
                <div key={q.id} className={`bg-white rounded-xl border p-4 ${!q.response_read && (q.admin_notes || q.is_resolved) ? 'border-green-300 ring-1 ring-green-100' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[q.category] || CATEGORY_COLORS.Other}`}>
                      {q.category}
                    </span>
                    {q.is_resolved ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircle size={12} /> Resolved
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                        <Clock size={12} /> Open
                      </span>
                    )}
                    {!q.response_read && (q.admin_notes || q.is_resolved) && (
                      <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full font-medium">New</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-900">{q.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(q.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {q.admin_notes && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
                      <p className="text-xs font-medium text-green-800 mb-1">Response from admin:</p>
                      <p className="text-sm text-green-700">{q.admin_notes}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
