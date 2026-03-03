import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin, isErrorResponse, dbError } from '@/lib/api'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ day: string }> }) {
  const auth = await requireAdmin()
  if (isErrorResponse(auth)) return auth

  const { day } = await params
  const formData = await req.formData() as unknown as globalThis.FormData
  const title = String(formData.get('title') || '')
  const notesFile = formData.get('notes')
  const recordingFile = formData.get('recording')
  const dayNumber = parseInt(day)

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (title) updates.title = title

  if (notesFile && notesFile instanceof File) {
    const buffer = await notesFile.arrayBuffer()
    const filename = `day-${dayNumber}-notes-${Date.now()}.pdf`
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('notes')
      .upload(filename, buffer, { contentType: 'application/pdf', upsert: true })

    if (uploadError) return dbError(uploadError)
    const { data: urlData } = supabaseAdmin.storage.from('notes').getPublicUrl(uploadData.path)
    updates.notes_url = urlData.publicUrl
    updates.notes_filename = notesFile.name
  }

  if (recordingFile && recordingFile instanceof File) {
    const buffer = await recordingFile.arrayBuffer()
    const ext = recordingFile.name.split('.').pop()
    const filename = `day-${dayNumber}-recording-${Date.now()}.${ext}`
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('recordings')
      .upload(filename, buffer, { contentType: recordingFile.type, upsert: true })

    if (uploadError) return dbError(uploadError)
    const { data: urlData } = supabaseAdmin.storage.from('recordings').getPublicUrl(uploadData.path)
    updates.recording_url = urlData.publicUrl
    updates.recording_filename = recordingFile.name
  }

  const { data, error } = await supabaseAdmin
    .from('daily_content')
    .update(updates)
    .eq('day_number', dayNumber)
    .select()
    .single()

  if (error) return dbError(error)
  return NextResponse.json({ content: data })
}
