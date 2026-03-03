export interface User {
  id: string
  name: string
  phone: string
  dob: string
  batch_id: string | null
  created_at: string
}

export interface Batch {
  id: string
  name: string
  start_date: string
  zoom_link: string | null
  is_active: boolean
  created_at: string
}

export interface DailyContent {
  id: string
  day_number: number
  title: string
  notes_url: string | null
  notes_filename: string | null
  recording_url: string | null
  recording_filename: string | null
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  user_id: string
  user_name: string
  day_number: number
  content: string
  created_at: string
}

export interface FAQ {
  id: string
  question: string
  answer: string
  display_order: number
}

export interface Query {
  id: string
  user_id: string | null
  user_name: string
  user_phone: string
  category: 'Link' | 'Diet' | 'Technical' | 'Other'
  message: string
  is_resolved: boolean
  admin_notes: string | null
  response_read: boolean
  created_at: string
}

export interface Announcement {
  id: string
  title: string
  message: string
  is_active: boolean
  created_at: string
}

export interface ContentView {
  id: string
  user_id: string
  day_number: number
  viewed_at: string
}

export interface DailyCheckin {
  id: string
  user_id: string
  day_number: number
  mood: number
  energy: number
  diet_compliance: 'yes' | 'partially' | 'no'
  notes: string | null
  created_at: string
}

/** Supabase joins return relations as arrays or objects — this union handles both */
export interface UserWithBatch {
  id: string
  name: string
  phone: string
  batch_id: string | null
  batches?: { name: string } | { name: string }[]
}

export interface BatchOption {
  id: string
  name: string
}

/** Helper to safely extract batch name from a Supabase join result */
export function getBatchName(batches?: { name: string } | { name: string }[]): string {
  if (!batches) return 'Unassigned'
  if (Array.isArray(batches)) return batches[0]?.name || 'Unassigned'
  return batches.name
}
