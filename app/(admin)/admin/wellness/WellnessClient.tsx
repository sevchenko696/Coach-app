'use client'

import { useState } from 'react'
import { TrendingDown, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import type { DailyCheckin, UserWithBatch, BatchOption } from '@/types'
import { MOOD_EMOJIS, MOOD_LABELS, PROGRAM_DAYS } from '@/lib/constants'

interface Props {
  checkins: DailyCheckin[]
  users: UserWithBatch[]
  batches: BatchOption[]
}

const CHECKIN_PAGE_SIZE = 20

export default function WellnessClient({ checkins, users, batches }: Props) {
  const [filterBatch, setFilterBatch] = useState<string>('all')
  const [checkinPage, setCheckinPage] = useState(0)

  const filteredUsers = users.filter(u =>
    filterBatch === 'all' || (filterBatch === 'unassigned' ? !u.batch_id : u.batch_id === filterBatch)
  )
  const filteredUserIds = new Set(filteredUsers.map(u => u.id))
  const filteredCheckins = checkins.filter(c => filteredUserIds.has(c.user_id))

  // Per-day averages
  const days = Array.from({ length: PROGRAM_DAYS }, (_, i) => i + 1)
  const dayStats = days.map(d => {
    const dayCheckins = filteredCheckins.filter(c => c.day_number === d)
    const count = dayCheckins.length
    if (count === 0) return { day: d, count: 0, avgMood: 0, avgEnergy: 0, dietYes: 0 }
    const avgMood = dayCheckins.reduce((s, c) => s + c.mood, 0) / count
    const avgEnergy = dayCheckins.reduce((s, c) => s + c.energy, 0) / count
    const dietYes = dayCheckins.filter(c => c.diet_compliance === 'yes').length
    return { day: d, count, avgMood, avgEnergy, dietYes }
  })

  // Flag users with declining mood (3+ day downtrend)
  const decliningUsers: { user: UserWithBatch; moods: { day: number; mood: number }[] }[] = []
  filteredUsers.forEach(u => {
    const userCheckins = filteredCheckins
      .filter(c => c.user_id === u.id)
      .sort((a, b) => a.day_number - b.day_number)
    if (userCheckins.length >= 3) {
      const last3 = userCheckins.slice(-3)
      if (last3[0].mood > last3[1].mood && last3[1].mood > last3[2].mood) {
        decliningUsers.push({
          user: u,
          moods: last3.map(c => ({ day: c.day_number, mood: c.mood })),
        })
      }
    }
  })

  // Per-user check-in summary
  const userMap = new Map(users.map(u => [u.id, u]))

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {/* Filter */}
        <select
          value={filterBatch}
          onChange={e => setFilterBatch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="all">All batches ({users.length} users)</option>
          <option value="unassigned">Unassigned</option>
          {batches.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        {/* Declining mood alerts */}
        {decliningUsers.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-red-500" />
              <h3 className="text-sm font-semibold text-red-800">Declining Mood Alert</h3>
            </div>
            <div className="space-y-2">
              {decliningUsers.map(({ user, moods }) => (
                <div key={user.id} className="flex items-center gap-3 text-sm">
                  <span className="font-medium text-red-900">{user.name}</span>
                  <div className="flex items-center gap-1">
                    {moods.map((m, i) => (
                      <span key={m.day} className="flex items-center gap-0.5">
                        {i > 0 && <TrendingDown size={10} className="text-red-400" />}
                        <span title={`Day ${m.day}`}>{MOOD_EMOJIS[m.mood - 1]}</span>
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-red-500">Days {moods.map(m => m.day).join(' → ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Day averages */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Daily Averages</h3>
          {filteredCheckins.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No check-ins recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Day</th>
                    <th className="py-2 px-3 font-medium text-gray-500 text-center">Check-ins</th>
                    <th className="py-2 px-3 font-medium text-gray-500 text-center">Avg Mood</th>
                    <th className="py-2 px-3 font-medium text-gray-500 text-center">Avg Energy</th>
                    <th className="py-2 px-3 font-medium text-gray-500 text-center">Diet Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {dayStats.filter(d => d.count > 0).map(({ day, count, avgMood, avgEnergy, dietYes }) => (
                    <tr key={day} className="hover:bg-gray-50">
                      <td className="py-2.5 px-3 font-medium text-gray-900">Day {day}</td>
                      <td className="py-2.5 px-3 text-center text-gray-600">{count}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="mr-1">{MOOD_EMOJIS[Math.round(avgMood) - 1]}</span>
                        <span className="text-gray-600">{avgMood.toFixed(1)}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <div className="w-16 bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-green-500 rounded-full h-2"
                              style={{ width: `${(avgEnergy / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-gray-600">{avgEnergy.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`text-xs font-bold ${
                          count > 0 && (dietYes / count) >= 0.7 ? 'text-green-600' :
                          count > 0 && (dietYes / count) >= 0.4 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {count > 0 ? Math.round((dietYes / count) * 100) : 0}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Per-user check-ins */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            User Check-ins ({filteredCheckins.length} total)
          </h3>
          {filteredCheckins.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No check-ins yet.</p>
          ) : (() => {
            const totalCheckinPages = Math.ceil(filteredCheckins.length / CHECKIN_PAGE_SIZE)
            const paginatedCheckins = filteredCheckins.slice(checkinPage * CHECKIN_PAGE_SIZE, (checkinPage + 1) * CHECKIN_PAGE_SIZE)
            return (
              <>
                <div className="space-y-2">
                  {paginatedCheckins.map(c => {
                    const u = userMap.get(c.user_id)
                    return (
                      <div key={c.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-sm">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs flex-shrink-0">
                          {u?.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 truncate">{u?.name || 'Unknown'}</span>
                            <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">Day {c.day_number}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                            <span>{MOOD_EMOJIS[c.mood - 1]} {MOOD_LABELS[c.mood - 1]}</span>
                            <span>Energy: {c.energy}/5</span>
                            <span>Diet: {c.diet_compliance === 'yes' ? '✅' : c.diet_compliance === 'partially' ? '🟡' : '❌'}</span>
                          </div>
                          {c.notes && <p className="text-xs text-gray-400 mt-1 truncate">{c.notes}</p>}
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    )
                  })}
                </div>
                {totalCheckinPages > 1 && (
                  <div className="flex items-center justify-between pt-3">
                    <button
                      onClick={() => setCheckinPage(p => Math.max(0, p - 1))}
                      disabled={checkinPage === 0}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={16} /> Previous
                    </button>
                    <span className="text-sm text-gray-500">Page {checkinPage + 1} of {totalCheckinPages}</span>
                    <button
                      onClick={() => setCheckinPage(p => Math.min(totalCheckinPages - 1, p + 1))}
                      disabled={checkinPage >= totalCheckinPages - 1}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Next <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )
          })()}
        </div>
    </div>
  )
}
