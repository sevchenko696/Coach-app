'use client'

import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import type { Review } from '@/types'

export default function ReviewsClient({ reviews }: { reviews: Review[] }) {
  const [filterDay, setFilterDay] = useState<number | 'all'>('all')

  const filtered = filterDay === 'all' ? reviews : reviews.filter(r => r.day_number === filterDay)
  const days = Array.from(new Set(reviews.map(r => r.day_number))).sort((a, b) => a - b)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-2xl font-bold text-gray-900">{reviews.length}</p>
            <p className="text-xs text-gray-500">Total Reviews</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-2xl font-bold text-gray-900">{days.length}</p>
            <p className="text-xs text-gray-500">Days with Reviews</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-2xl font-bold text-gray-900">{new Set(reviews.map(r => r.user_id)).size}</p>
            <p className="text-xs text-gray-500">Unique Reviewers</p>
          </div>
        </div>

        {/* Day Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterDay('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterDay === 'all' ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-green-300'
            }`}
          >
            All ({reviews.length})
          </button>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(day => {
            const count = reviews.filter(r => r.day_number === day).length
            return (
              <button
                key={day}
                onClick={() => setFilterDay(day)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  filterDay === day ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-green-300'
                }`}
              >
                Day {day} ({count})
              </button>
            )
          })}
        </div>

        {/* Reviews List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <MessageSquare size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-400">No reviews {filterDay !== 'all' ? `for Day ${filterDay}` : 'yet'}.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(review => (
              <div key={review.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-sm font-bold flex-shrink-0">
                    {review.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-900">{review.user_name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        review.day_number > 10 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      }`}>
                        Day {review.day_number}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">{review.content}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
