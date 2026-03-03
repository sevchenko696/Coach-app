'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Upload, FileText, Video, Check, ChevronDown, ChevronUp } from 'lucide-react'
import type { DailyContent } from '@/types'

interface Props { content: DailyContent[] }

export default function ContentClient({ content }: Props) {
  const [openDay, setOpenDay] = useState<number | null>(null)
  const [uploading, setUploading] = useState<number | null>(null)
  const [titles, setTitles] = useState<Record<number, string>>(
    Object.fromEntries(content.map(c => [c.day_number, c.title]))
  )
  const [localContent, setLocalContent] = useState(content)

  async function handleUpload(day: number, formData: FormData) {
    setUploading(day)
    try {
      const res = await fetch(`/api/content/${day}`, { method: 'PUT', body: formData })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setLocalContent(prev => prev.map(c => c.day_number === day ? data.content : c))
      toast.success(`Day ${day} content updated!`)
    } finally { setUploading(null) }
  }

  function handleSubmit(day: number, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData()
    formData.append('title', titles[day] || `Day ${day}`)
    const notesInput = form.querySelector<HTMLInputElement>('[name="notes"]')
    const recordingInput = form.querySelector<HTMLInputElement>('[name="recording"]')
    if (notesInput?.files?.[0]) formData.append('notes', notesInput.files[0])
    if (recordingInput?.files?.[0]) formData.append('recording', recordingInput.files[0])
    handleUpload(day, formData)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
        <p className="text-sm text-gray-500 mb-4">Upload notes (PDF) and recordings (video) for each day. Content is shared across all batches.</p>
        <div className="space-y-2">
          {localContent.map(day => {
            const isOpen = openDay === day.day_number
            const isBonus = day.day_number > 10
            const hasNotes = !!day.notes_url
            const hasRecording = !!day.recording_url

            return (
              <div key={day.day_number} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenDay(isOpen ? null : day.day_number)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    isBonus ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {day.day_number}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{day.title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className={`text-xs flex items-center gap-1 ${hasNotes ? 'text-green-600' : 'text-gray-400'}`}>
                        <FileText size={10} /> {hasNotes ? 'Notes ✓' : 'No notes'}
                      </span>
                      <span className={`text-xs flex items-center gap-1 ${hasRecording ? 'text-green-600' : 'text-gray-400'}`}>
                        <Video size={10} /> {hasRecording ? 'Recording ✓' : 'No recording'}
                      </span>
                    </div>
                  </div>
                  {isBonus && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Bonus</span>}
                  {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>

                {isOpen && (
                  <form onSubmit={e => handleSubmit(day.day_number, e)} className="px-4 pb-4 border-t border-gray-50 pt-4">
                    <div className="space-y-4">
                      {/* Title */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Day Title</label>
                        <input
                          value={titles[day.day_number] || ''}
                          onChange={e => setTitles(p => ({ ...p, [day.day_number]: e.target.value }))}
                          placeholder={`Day ${day.day_number}`}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Notes (PDF) {hasNotes && <span className="text-green-600">— uploaded: {day.notes_filename}</span>}
                        </label>
                        <input name="notes" type="file" accept=".pdf" className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
                      </div>

                      {/* Recording */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Recording (Video) {hasRecording && <span className="text-green-600">— uploaded: {day.recording_filename}</span>}
                        </label>
                        <input name="recording" type="file" accept="video/*" className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
                      </div>

                      <button
                        type="submit"
                        disabled={uploading === day.day_number}
                        className="flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {uploading === day.day_number ? (
                          <><Upload size={14} className="animate-bounce" /> Uploading...</>
                        ) : (
                          <><Check size={14} /> Save Content</>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )
          })}
        </div>
    </div>
  )
}
