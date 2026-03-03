'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ArrowLeft, FileText, Video, Star, Send, ChevronDown, ChevronUp } from 'lucide-react'
import type { DailyContent, Review } from '@/types'

interface Props {
  dayNumber: number
  content: DailyContent | null
  reviews: Review[]
  myReview: Review | null
  userName: string
}

export default function DayDetailClient({ dayNumber, content, reviews, myReview, userName }: Props) {
  const router = useRouter()
  const [reviewText, setReviewText] = useState(myReview?.content || '')
  const [submitting, setSubmitting] = useState(false)
  const [allReviews, setAllReviews] = useState(reviews)
  const [myCurrentReview, setMyCurrentReview] = useState(myReview)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const isBonus = dayNumber > 10

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reviewText.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day_number: dayNumber, content: reviewText }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to submit')
        return
      }
      toast.success(myCurrentReview ? 'Review updated!' : 'Review shared!')
      setMyCurrentReview(data.review)
      // Update reviews list
      if (myCurrentReview) {
        setAllReviews(prev => prev.map(r => r.id === data.review.id ? data.review : r))
      } else {
        setAllReviews(prev => [data.review, ...prev])
      }
    } finally {
      setSubmitting(false)
    }
  }

  const visibleReviews = showAllReviews ? allReviews : allReviews.slice(0, 3)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-semibold text-gray-900 text-sm">{content?.title || `Day ${dayNumber}`}</h1>
            {isBonus && <span className="text-xs text-amber-600 font-medium">Bonus Day</span>}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Notes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} className="text-green-600" />
            <h2 className="font-semibold text-gray-900">Session Notes</h2>
          </div>
          {content?.notes_url ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <FileText size={18} className="text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{content.notes_filename || 'Notes.pdf'}</p>
                  <p className="text-xs text-gray-400">PDF Document</p>
                </div>
                <a
                  href={content.notes_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-600 font-medium hover:underline"
                >
                  Open
                </a>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Notes not uploaded yet</p>
          )}
        </div>

        {/* Recording */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Video size={18} className="text-green-600" />
            <h2 className="font-semibold text-gray-900">Session Recording</h2>
          </div>
          {content?.recording_url ? (
            <div>
              <video
                controls
                className="w-full rounded-xl bg-black"
                style={{ maxHeight: '280px' }}
              >
                <source src={content.recording_url} />
                Your browser does not support video playback.
              </video>
              <p className="text-xs text-gray-400 mt-2 text-center">{content.recording_filename}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Recording not uploaded yet</p>
          )}
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Star size={18} className="text-amber-500" />
            <h2 className="font-semibold text-gray-900">
              Experiences & Reviews
              {allReviews.length > 0 && (
                <span className="ml-2 text-xs text-gray-400 font-normal">({allReviews.length})</span>
              )}
            </h2>
          </div>

          {/* Write Review */}
          <form onSubmit={handleReviewSubmit} className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {myCurrentReview ? 'Update your experience' : 'Share your experience for Day ' + dayNumber}
            </label>
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              rows={3}
              placeholder="How was today's session? Share your thoughts, learnings, or how you're feeling..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
            <button
              type="submit"
              disabled={submitting || !reviewText.trim()}
              className="mt-2 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={14} />
              {submitting ? 'Sharing...' : myCurrentReview ? 'Update' : 'Share'}
            </button>
          </form>

          {/* Reviews List */}
          {allReviews.length > 0 ? (
            <div className="space-y-3">
              <div className="border-t border-gray-100 pt-4">
                {visibleReviews.map((review) => (
                  <div key={review.id} className="mb-3 last:mb-0">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-green-700 text-xs font-bold">
                          {review.user_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-gray-900">{review.user_name}</span>
                          {review.user_id === myCurrentReview?.user_id && (
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">You</span>
                          )}
                          <span className="text-xs text-gray-400">
                            {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{review.content}</p>
                      </div>
                    </div>
                    {visibleReviews.indexOf(review) < visibleReviews.length - 1 && (
                      <div className="border-t border-gray-50 mt-3" />
                    )}
                  </div>
                ))}
              </div>
              {allReviews.length > 3 && (
                <button
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  className="flex items-center gap-1 text-sm text-green-600 font-medium"
                >
                  {showAllReviews ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Show all {allReviews.length} reviews</>}
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-400">
              <Star size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Be the first to share your experience!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
