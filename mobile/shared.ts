// Barrel re-exports from parent project for shared code

// Types
export type {
  User,
  Batch,
  DailyContent,
  Review,
  FAQ,
  Query,
  Announcement,
  ContentView,
  DailyCheckin,
  UserWithBatch,
  BatchOption,
} from '../types/index'

export { getBatchName } from '../types/index'

// Constants
export {
  PROGRAM_DAYS,
  SESSION_TIME,
  MOOD_EMOJIS,
  MOOD_LABELS,
  ENERGY_LABELS,
  DIET_OPTIONS,
  QUERY_CATEGORIES,
} from '../lib/constants'

// Date utilities
export {
  getCurrentDay,
  getDaysUntilStart,
  calculateStreak,
} from '../lib/dates'

// Phone validation
export { normalizePhone } from '../lib/phone'
