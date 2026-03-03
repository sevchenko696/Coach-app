'use client'

import { useState } from 'react'
import { CheckCircle, BarChart3 } from 'lucide-react'
import type { UserWithBatch, BatchOption } from '@/types'
import { getBatchName } from '@/types'
import { PROGRAM_DAYS } from '@/lib/constants'

interface Props {
  users: UserWithBatch[]
  views: Pick<import('@/types').ContentView, 'user_id' | 'day_number'>[]
  batches: BatchOption[]
}

export default function ProgressClient({ users, views, batches }: Props) {
  const [filterBatch, setFilterBatch] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'progress'>('progress')

  const viewMap = new Map<string, Set<number>>()
  views.forEach(v => {
    if (!viewMap.has(v.user_id)) viewMap.set(v.user_id, new Set())
    viewMap.get(v.user_id)!.add(v.day_number)
  })

  const filteredUsers = users
    .filter(u => filterBatch === 'all' || (filterBatch === 'unassigned' ? !u.batch_id : u.batch_id === filterBatch))
    .sort((a, b) => {
      if (sortBy === 'progress') {
        return (viewMap.get(b.id)?.size || 0) - (viewMap.get(a.id)?.size || 0)
      }
      return a.name.localeCompare(b.name)
    })

  const days = Array.from({ length: PROGRAM_DAYS }, (_, i) => i + 1)

  // Per-day completion stats
  const dayStats = days.map(d => {
    const count = filteredUsers.filter(u => viewMap.get(u.id)?.has(d)).length
    return { day: d, count, pct: filteredUsers.length > 0 ? Math.round((count / filteredUsers.length) * 100) : 0 }
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={filterBatch}
            onChange={e => setFilterBatch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All batches ({users.length})</option>
            <option value="unassigned">Unassigned</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'name' | 'progress')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="progress">Sort by progress</option>
            <option value="name">Sort by name</option>
          </select>
        </div>

        {/* Day completion summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Day Completion Rates</h3>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
            {dayStats.map(({ day, count, pct }) => (
              <div key={day} className="text-center">
                <div className={`text-xs font-bold mb-1 ${day > 10 ? 'text-amber-600' : 'text-gray-900'}`}>D{day}</div>
                <div className="h-16 bg-gray-100 rounded-lg relative overflow-hidden">
                  <div
                    className={`absolute bottom-0 w-full rounded-lg transition-all ${day > 10 ? 'bg-amber-400' : 'bg-green-500'}`}
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Matrix */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <BarChart3 size={16} className="text-gray-400" />
            <h2 className="font-semibold text-gray-900">
              {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
            </h2>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p className="text-sm">No users match your filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-2 px-4 font-medium text-gray-500 sticky left-0 bg-gray-50 min-w-[160px]">User</th>
                    {days.map(d => (
                      <th key={d} className={`py-2 px-1 font-medium text-center w-10 ${d > 10 ? 'text-amber-600' : 'text-gray-500'}`}>
                        {d}
                      </th>
                    ))}
                    <th className="py-2 px-3 font-medium text-gray-500 text-center">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map(user => {
                    const userViews = viewMap.get(user.id) || new Set()
                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="py-2.5 px-4 sticky left-0 bg-white">
                          <p className="font-medium text-gray-900 text-xs truncate">{user.name}</p>
                          <p className="text-xs text-gray-400">{getBatchName(user.batches)}</p>
                        </td>
                        {days.map(d => (
                          <td key={d} className="py-2.5 px-1 text-center">
                            {userViews.has(d) ? (
                              <CheckCircle size={16} className="mx-auto text-green-500" />
                            ) : (
                              <span className="block w-4 h-4 mx-auto rounded-full bg-gray-100" />
                            )}
                          </td>
                        ))}
                        <td className="py-2.5 px-3 text-center">
                          <span className={`text-xs font-bold ${
                            userViews.size === PROGRAM_DAYS ? 'text-green-600' : userViews.size > 0 ? 'text-gray-900' : 'text-gray-300'
                          }`}>
                            {userViews.size}/{PROGRAM_DAYS}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </div>
  )
}
