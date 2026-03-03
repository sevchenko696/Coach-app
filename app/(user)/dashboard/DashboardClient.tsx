'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import OnboardingModal from './OnboardingModal'
import { LogOut, Video, Lock, Unlock, ChevronRight, HelpCircle, Clock, User, CalendarPlus, Megaphone, X, Trophy, Flame, CheckCircle, Award, Heart, Edit3, BarChart3 } from 'lucide-react'
import type { User as UserType, Batch, DailyContent, Announcement, DailyCheckin } from '@/types'
import { getCurrentDay, getDaysUntilStart, calculateStreak } from '@/lib/dates'
import { SESSION_TIME, PROGRAM_DAYS, MOOD_EMOJIS, MOOD_LABELS, ENERGY_LABELS, DIET_OPTIONS } from '@/lib/constants'

interface Props {
  user: UserType & { batches: Batch }
  batch: Batch | null
  content: DailyContent[]
  announcements: Announcement[]
  viewedDays: number[]
  todayCheckin: DailyCheckin | null
  hasPassword: boolean
  unreadQueryCount: number
}

function generateCalendarUrl(batchName: string, zoomLink: string): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const start = `${year}${month}${day}T083000`
  const end = `${year}${month}${day}T100000`
  const title = encodeURIComponent(`${batchName} — Daily Session`)
  const details = encodeURIComponent(`Join Zoom: ${zoomLink}`)
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`
}

export default function DashboardClient({ user, batch, content, announcements, viewedDays, todayCheckin, hasPassword, unreadQueryCount }: Props) {
  const router = useRouter()
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (!hasPassword && typeof window !== 'undefined' && !localStorage.getItem('healeasy_onboarded')) {
      setShowOnboarding(true)
    }
  }, [hasPassword])
  const [checkin, setCheckin] = useState<DailyCheckin | null>(todayCheckin)
  const [checkinMode, setCheckinMode] = useState<'view' | 'edit'>(todayCheckin ? 'view' : 'edit')
  const [mood, setMood] = useState(todayCheckin?.mood || 0)
  const [energy, setEnergy] = useState(todayCheckin?.energy || 0)
  const [dietCompliance, setDietCompliance] = useState<string>(todayCheckin?.diet_compliance || '')
  const [checkinNotes, setCheckinNotes] = useState(todayCheckin?.notes || '')
  const [submittingCheckin, setSubmittingCheckin] = useState(false)
  const currentDay = batch ? getCurrentDay(batch.start_date) : 0
  const hasStarted = currentDay >= 1
  const daysUntil = batch ? getDaysUntilStart(batch.start_date) : 0
  const streak = calculateStreak(viewedDays, currentDay)
  const isComplete = currentDay >= PROGRAM_DAYS && viewedDays.length === PROGRAM_DAYS

  const visibleAnnouncements = announcements.filter(a => !dismissedIds.has(a.id))

  async function handleLogout() {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'user' }),
    })
    router.push('/login')
    router.refresh()
  }

  async function handleCheckinSubmit() {
    if (!mood || !energy || !dietCompliance) {
      toast.error('Please fill in mood, energy, and diet compliance')
      return
    }
    setSubmittingCheckin(true)
    try {
      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_number: currentDay,
          mood,
          energy,
          diet_compliance: dietCompliance,
          notes: checkinNotes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed to submit'); return }
      setCheckin(data.checkin)
      setCheckinMode('view')
      toast.success('Check-in saved!')
    } finally {
      setSubmittingCheckin(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">H</span>
            </div>
            <span className="font-semibold text-gray-900">HealEasy</span>
          </div>
          <div className="flex items-center gap-2">
            {streak > 0 && (
              <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2.5 py-1 rounded-full">
                <Flame size={14} />
                <span className="text-xs font-bold">{streak}</span>
              </div>
            )}
            <button
              onClick={() => router.push('/profile')}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Profile"
            >
              <User size={18} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Announcements */}
        {visibleAnnouncements.length > 0 && (
          <div className="space-y-2">
            {visibleAnnouncements.map(a => (
              <div key={a.id} className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <Megaphone size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-900">{a.title}</p>
                    <p className="text-sm text-amber-700 mt-0.5">{a.message}</p>
                  </div>
                  <button
                    onClick={() => setDismissedIds(prev => new Set([...prev, a.id]))}
                    className="p-1 text-amber-400 hover:text-amber-600 flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Completion Card */}
        {isComplete ? (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Trophy size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Congratulations, {user.name}!</h2>
                <p className="text-green-100 text-sm mt-1">
                  You&apos;ve completed the 12-day L1 Detox Program!
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full">{PROGRAM_DAYS}/{PROGRAM_DAYS} days completed</span>
                  {streak > 0 && (
                    <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Flame size={10} /> {streak} day streak
                    </span>
                  )}
                </div>
                <button
                  onClick={() => router.push('/certificate')}
                  className="mt-4 flex items-center justify-center gap-2 w-full bg-white text-green-700 font-semibold py-2.5 rounded-xl hover:bg-green-50 transition-colors text-sm"
                >
                  <Award size={16} /> View Certificate
                </button>
              </div>
            </div>
          </div>
        ) : batch && hasStarted ? (
          /* Batch Info Card */
          <div className="bg-green-600 rounded-2xl p-5 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-green-200 text-sm font-medium">{batch.name}</p>
                <h2 className="text-2xl font-bold mt-1">Day {currentDay} of {PROGRAM_DAYS}</h2>
                <p className="text-green-200 text-sm mt-1">
                  Started {new Date(batch.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="text-right">
                {streak > 1 && (
                  <div className="flex items-center gap-1 text-green-200 mb-1 justify-end">
                    <Flame size={14} />
                    <span className="text-xs font-medium">{streak} day streak</span>
                  </div>
                )}
                <div className="text-4xl font-bold opacity-30">{currentDay}</div>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4 bg-green-500 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all"
                style={{ width: `${(currentDay / PROGRAM_DAYS) * 100}%` }}
              />
            </div>
            <p className="text-green-200 text-xs mt-1">{PROGRAM_DAYS - currentDay} days remaining</p>
          </div>
        ) : batch && !hasStarted ? (
          <div className="bg-blue-600 rounded-2xl p-5 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium">{batch.name}</p>
                <h2 className="text-2xl font-bold mt-1">
                  {daysUntil === 1 ? 'Starts Tomorrow!' : `Starts in ${daysUntil} days`}
                </h2>
                <p className="text-blue-200 text-sm mt-1">
                  Begins {new Date(batch.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold opacity-30">{daysUntil}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <Clock size={20} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-yellow-800 font-semibold">Waiting for batch assignment</p>
                <p className="text-yellow-600 text-sm mt-0.5">Your coordinator will assign you to a batch. Once assigned, you&apos;ll see your daily content and schedule here.</p>
              </div>
            </div>
          </div>
        )}

        {/* Today's Session */}
        {batch?.zoom_link && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Video size={18} className="text-green-600" />
                <h3 className="font-semibold text-gray-900">Today&apos;s Session</h3>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                <Clock size={13} />
                <span className="font-medium">{SESSION_TIME}</span>
              </div>
            </div>
            <a
              href={batch.zoom_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              <Video size={16} />
              Join Now
            </a>
            <a
              href={generateCalendarUrl(batch.name, batch.zoom_link)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full mt-2 text-green-700 bg-green-50 hover:bg-green-100 font-medium py-2.5 rounded-xl transition-colors text-sm"
            >
              <CalendarPlus size={15} />
              Add to Calendar
            </a>
          </div>
        )}

        {/* Daily Check-In */}
        {batch && hasStarted && currentDay >= 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Heart size={18} className="text-pink-500" />
                <h3 className="font-semibold text-gray-900">Daily Check-in</h3>
              </div>
              {checkin && checkinMode === 'view' && (
                <button
                  onClick={() => setCheckinMode('edit')}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                >
                  <Edit3 size={12} /> Edit
                </button>
              )}
            </div>

            {checkin && checkinMode === 'view' ? (
              <div className="flex items-center gap-4 p-3 bg-green-50 rounded-xl">
                <div className="text-2xl">{MOOD_EMOJIS[checkin.mood - 1]}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">Checked in for Day {currentDay}!</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-green-600">
                    <span>Mood: {MOOD_LABELS[checkin.mood - 1]}</span>
                    <span>Energy: {checkin.energy}/5</span>
                    <span>Diet: {checkin.diet_compliance === 'yes' ? 'Yes' : checkin.diet_compliance === 'partially' ? 'Partial' : 'No'}</span>
                  </div>
                </div>
                <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mood */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">How are you feeling?</label>
                  <div className="flex gap-2">
                    {MOOD_EMOJIS.map((emoji, i) => (
                      <button
                        key={i}
                        onClick={() => setMood(i + 1)}
                        className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all ${
                          mood === i + 1
                            ? 'border-green-500 bg-green-50 scale-105'
                            : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <span className="text-xl">{emoji}</span>
                        <span className="text-[10px] text-gray-500">{MOOD_LABELS[i]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Energy */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Energy Level</label>
                  <div className="flex gap-2">
                    {ENERGY_LABELS.map((label, i) => (
                      <button
                        key={i}
                        onClick={() => setEnergy(i + 1)}
                        className={`flex-1 py-2.5 rounded-xl border-2 text-center transition-all ${
                          energy === i + 1
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <span className="text-sm font-bold text-gray-700">{i + 1}</span>
                        <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Diet Compliance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Followed the diet plan?</label>
                  <div className="flex gap-2">
                    {DIET_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setDietCompliance(opt.value)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 transition-all ${
                          dietCompliance === opt.value
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <span>{opt.emoji}</span>
                        <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optional)</label>
                  <textarea
                    value={checkinNotes}
                    onChange={e => setCheckinNotes(e.target.value)}
                    rows={2}
                    placeholder="How was your day? Any observations..."
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={handleCheckinSubmit}
                  disabled={submittingCheckin || !mood || !energy || !dietCompliance}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Heart size={15} />
                  {submittingCheckin ? 'Saving...' : checkin ? 'Update Check-in' : 'Save Check-in'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Daily Content */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Program Content</h3>
          <div className="space-y-2">
            {content.map((day) => {
              const isUnlocked = batch ? day.day_number <= currentDay : false
              const isToday = day.day_number === currentDay
              const isBonus = day.day_number > 10
              const isViewed = viewedDays.includes(day.day_number)

              return (
                <button
                  key={day.day_number}
                  onClick={() => isUnlocked && router.push(`/dashboard/day/${day.day_number}`)}
                  disabled={!isUnlocked}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                    isToday
                      ? 'bg-green-50 border-green-200 shadow-sm'
                      : isUnlocked
                      ? 'bg-white border-gray-100 hover:border-green-200 hover:shadow-sm'
                      : 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    isViewed ? 'bg-green-600 text-white' :
                    isToday ? 'bg-green-600 text-white' :
                    isUnlocked ? 'bg-green-100 text-green-700' :
                    'bg-gray-200 text-gray-400'
                  }`}>
                    {isViewed ? <CheckCircle size={16} /> : isUnlocked ? day.day_number : <Lock size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 text-sm">{day.title}</p>
                      {isBonus && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Bonus</span>
                      )}
                      {isToday && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Today</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {isUnlocked ? (
                        <span className="flex items-center gap-1">
                          <Unlock size={10} />
                          {day.notes_url || day.recording_url ? 'Notes & recording available' : 'No content yet'}
                        </span>
                      ) : 'Unlocks on Day ' + day.day_number}
                    </p>
                  </div>
                  {isUnlocked && <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Progress & FAQ Links */}
        <div className="space-y-2">
          <button
            onClick={() => router.push('/progress')}
            className="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-green-200 hover:shadow-sm transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <BarChart3 size={18} className="text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">My Progress</p>
              <p className="text-xs text-gray-400">View your mood, energy & wellness trends</p>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>

          <button
            onClick={() => router.push('/faq')}
            className="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-green-200 hover:shadow-sm transition-all text-left relative"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 relative">
              <HelpCircle size={18} className="text-blue-500" />
              {unreadQueryCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadQueryCount > 9 ? '9+' : unreadQueryCount}
                </span>
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">FAQ & Support</p>
              <p className="text-xs text-gray-400">
                {unreadQueryCount > 0
                  ? `${unreadQueryCount} new response${unreadQueryCount > 1 ? 's' : ''} to your queries`
                  : 'Find answers or submit a query'}
              </p>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        </div>
      </main>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal
          userName={user.name}
          userId={user.id}
          onClose={() => setShowOnboarding(false)}
        />
      )}
    </div>
  )
}
