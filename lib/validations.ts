import { z } from 'zod'

// ── Auth ──────────────────────────────────────────────
export const loginSchema = z.object({
  phone: z.string().min(1, 'Phone is required'),
  password: z.string().min(1, 'Password is required'),
})

export const adminLoginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
})

// ── Batches ───────────────────────────────────────────
export const createBatchSchema = z.object({
  name: z.string().optional(),
  start_date: z.string().min(1, 'Start date is required'),
  zoom_link: z.string().optional(),
})

export const updateBatchSchema = z.object({
  name: z.string().optional(),
  start_date: z.string().optional(),
  zoom_link: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
})

// ── Users ─────────────────────────────────────────────
const userRowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  dob: z.string().min(1, 'Date of birth is required'),
})

export const bulkCreateUsersSchema = z.object({
  users: z.array(userRowSchema).min(1, 'At least one user is required'),
  batchId: z.string().uuid().nullable().optional(),
})

export const assignBatchSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1, 'At least one user must be selected'),
  batchId: z.string().uuid().nullable().optional(),
})

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  password: z.string().min(4, 'Password must be at least 4 characters').optional(),
  batch_id: z.string().uuid().nullable().optional(),
  reset_password: z.boolean().optional(),
})

// ── Queries ───────────────────────────────────────────
export const createQuerySchema = z.object({
  category: z.enum(['Link', 'Diet', 'Technical', 'Other'], {
    message: 'Category must be Link, Diet, Technical, or Other',
  }),
  message: z.string().min(1, 'Message is required'),
})

export const updateQuerySchema = z.object({
  is_resolved: z.boolean().optional(),
  admin_notes: z.string().nullable().optional(),
})

// ── Reviews ───────────────────────────────────────────
export const createReviewSchema = z.object({
  day_number: z.number().int().min(1).max(12, 'Day must be between 1 and 12'),
  content: z.string().min(1, 'Content is required'),
})

// ── Checkins ──────────────────────────────────────────
export const createCheckinSchema = z.object({
  day_number: z.number().int().min(1, 'Day number is required'),
  mood: z.number().int().min(1).max(5, 'Mood must be between 1 and 5'),
  energy: z.number().int().min(1).max(5, 'Energy must be between 1 and 5'),
  diet_compliance: z.enum(['yes', 'partially', 'no'], {
    message: 'Diet compliance must be yes, partially, or no',
  }),
  notes: z.string().nullable().optional(),
})

// ── Content Views ─────────────────────────────────────
export const createContentViewSchema = z.object({
  day_number: z.number().int().min(1).max(12, 'Day must be between 1 and 12'),
})

// ── Push Tokens ───────────────────────────────────────
export const savePushTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  platform: z.enum(['ios', 'android'], {
    message: 'Platform must be ios or android',
  }),
})

export const deletePushTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

// ── Announcements ─────────────────────────────────────
export const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
})

// ── FAQs ──────────────────────────────────────────────
export const createFaqSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
  display_order: z.number().int().optional(),
})

export const updateFaqSchema = z.object({
  question: z.string().min(1).optional(),
  answer: z.string().min(1).optional(),
  display_order: z.number().int().optional(),
})

// ── Helper ────────────────────────────────────────────
/** Extract first user-friendly error message from a ZodError */
export function formatZodError(error: z.ZodError): string {
  const first = error.issues[0]
  return first?.message ?? 'Invalid input'
}
