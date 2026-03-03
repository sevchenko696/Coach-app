export const PROGRAM_DAYS = 12
export const SESSION_TIME = '8:30 AM'

export const MOOD_EMOJIS = ['😟', '😕', '😐', '🙂', '😊'] as const
export const MOOD_LABELS = ['Very Low', 'Low', 'Okay', 'Good', 'Great'] as const
export const ENERGY_LABELS = ['Very Low', 'Low', 'Moderate', 'High', 'Very High'] as const

export const DIET_OPTIONS = [
  { value: 'yes', label: 'Yes', emoji: '✅' },
  { value: 'partially', label: 'Partially', emoji: '🟡' },
  { value: 'no', label: 'No', emoji: '❌' },
] as const

export const QUERY_CATEGORIES = ['Link', 'Diet', 'Technical', 'Other'] as const

export const CATEGORY_COLORS: Record<string, string> = {
  Link: 'bg-blue-100 text-blue-700',
  Diet: 'bg-green-100 text-green-700',
  Technical: 'bg-purple-100 text-purple-700',
  Other: 'bg-gray-100 text-gray-700',
}
