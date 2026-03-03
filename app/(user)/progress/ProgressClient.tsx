'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, TrendingUp, Heart, Zap, Salad, Flame } from 'lucide-react'
import type { DailyCheckin } from '@/types'
import { PROGRAM_DAYS, MOOD_EMOJIS, MOOD_LABELS, ENERGY_LABELS, DIET_OPTIONS } from '@/lib/constants'
import { calculateStreak } from '@/lib/dates'

interface Props {
  userName: string
  checkins: DailyCheckin[]
  viewedDays: number[]
  currentDay: number
}

export default function UserProgressClient({ userName, checkins, viewedDays, currentDay }: Props) {
  const router = useRouter()
  const streak = calculateStreak(viewedDays, currentDay)
  const completionPct = Math.round((viewedDays.length / PROGRAM_DAYS) * 100)

  const checkinMap = new Map(checkins.map(c => [c.day_number, c]))

  // Compute averages
  const avgMood = checkins.length > 0 ? checkins.reduce((s, c) => s + c.mood, 0) / checkins.length : 0
  const avgEnergy = checkins.length > 0 ? checkins.reduce((s, c) => s + c.energy, 0) / checkins.length : 0
  const dietYesPct = checkins.length > 0
    ? Math.round((checkins.filter(c => c.diet_compliance === 'yes').length / checkins.length) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 text-gray-400 hover:text-gray-600">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-semibold text-gray-900">My Progress</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={14} className="text-green-600" />
              <span className="text-xs text-gray-500">Completion</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{viewedDays.length}/{PROGRAM_DAYS}</p>
            <div className="mt-2 bg-gray-100 rounded-full h-2">
              <div className="bg-green-500 rounded-full h-2 transition-all" style={{ width: `${completionPct}%` }} />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Flame size={14} className="text-amber-500" />
              <span className="text-xs text-gray-500">Current Streak</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{streak} day{streak !== 1 ? 's' : ''}</p>
            <p className="text-xs text-gray-400 mt-2">{checkins.length} check-in{checkins.length !== 1 ? 's' : ''} logged</p>
          </div>
        </div>

        {/* Averages */}
        {checkins.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Your Averages</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <Heart size={16} className="mx-auto text-pink-500 mb-1" />
                <p className="text-lg font-bold text-gray-900">{MOOD_EMOJIS[Math.round(avgMood) - 1]}</p>
                <p className="text-xs text-gray-500">{MOOD_LABELS[Math.round(avgMood) - 1]}</p>
                <p className="text-xs text-gray-400">Avg Mood</p>
              </div>
              <div className="text-center">
                <Zap size={16} className="mx-auto text-amber-500 mb-1" />
                <p className="text-lg font-bold text-gray-900">{avgEnergy.toFixed(1)}/5</p>
                <p className="text-xs text-gray-500">{ENERGY_LABELS[Math.round(avgEnergy) - 1]}</p>
                <p className="text-xs text-gray-400">Avg Energy</p>
              </div>
              <div className="text-center">
                <Salad size={16} className="mx-auto text-green-500 mb-1" />
                <p className="text-lg font-bold text-gray-900">{dietYesPct}%</p>
                <p className="text-xs text-gray-500">Compliant</p>
                <p className="text-xs text-gray-400">Diet</p>
              </div>
            </div>
          </div>
        )}

        {/* Mood & Energy Trend */}
        {checkins.length >= 2 && (
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-blue-500" />
              <h3 className="text-sm font-semibold text-gray-900">Mood & Energy Trend</h3>
            </div>
            <div className="space-y-3">
              {/* Mood chart */}
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Mood</p>
                <div className="flex items-end gap-1 h-20">
                  {Array.from({ length: PROGRAM_DAYS }, (_, i) => i + 1).map(day => {
                    const c = checkinMap.get(day)
                    const barHeight = c ? (c.mood / 5) * 100 : 0
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center gap-0.5">
                        <div className="w-full flex items-end justify-center" style={{ height: '64px' }}>
                          {c ? (
                            <div
                              className="w-full max-w-[24px] rounded-t bg-pink-400 transition-all"
                              style={{ height: `${barHeight}%` }}
                              title={`Day ${day}: ${MOOD_LABELS[c.mood - 1]} (${c.mood}/5)`}
                            />
                          ) : (
                            <div className="w-full max-w-[24px] h-1 rounded bg-gray-100" />
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400">{day}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Energy chart */}
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Energy</p>
                <div className="flex items-end gap-1 h-20">
                  {Array.from({ length: PROGRAM_DAYS }, (_, i) => i + 1).map(day => {
                    const c = checkinMap.get(day)
                    const barHeight = c ? (c.energy / 5) * 100 : 0
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center gap-0.5">
                        <div className="w-full flex items-end justify-center" style={{ height: '64px' }}>
                          {c ? (
                            <div
                              className="w-full max-w-[24px] rounded-t bg-amber-400 transition-all"
                              style={{ height: `${barHeight}%` }}
                              title={`Day ${day}: ${ENERGY_LABELS[c.energy - 1]} (${c.energy}/5)`}
                            />
                          ) : (
                            <div className="w-full max-w-[24px] h-1 rounded bg-gray-100" />
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400">{day}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Day-by-Day Log */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Day-by-Day</h3>
          <div className="space-y-2">
            {Array.from({ length: Math.min(currentDay, PROGRAM_DAYS) }, (_, i) => i + 1).reverse().map(day => {
              const c = checkinMap.get(day)
              const viewed = viewedDays.includes(day)
              const dietOption = c ? DIET_OPTIONS.find(d => d.value === c.diet_compliance) : null

              return (
                <div key={day} className={`p-3 rounded-xl ${viewed ? 'bg-green-50 border border-green-100' : 'bg-gray-50 border border-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        viewed ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {viewed ? <CheckCircle size={14} /> : day}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Day {day}</p>
                        {!viewed && <p className="text-xs text-gray-400">Not viewed</p>}
                      </div>
                    </div>
                    {c && (
                      <div className="flex items-center gap-2 text-xs">
                        <span title={MOOD_LABELS[c.mood - 1]}>{MOOD_EMOJIS[c.mood - 1]}</span>
                        <span className="text-gray-500">⚡{c.energy}/5</span>
                        {dietOption && <span>{dietOption.emoji}</span>}
                      </div>
                    )}
                  </div>
                  {c?.notes && (
                    <p className="text-xs text-gray-500 mt-1.5 ml-10 italic">&quot;{c.notes}&quot;</p>
                  )}
                </div>
              )
            })}
            {currentDay === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Your program hasn&apos;t started yet.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
