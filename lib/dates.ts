import { PROGRAM_DAYS } from './constants'

/**
 * Calculate which program day it is based on batch start date.
 * Returns 0 if the program hasn't started yet, capped at PROGRAM_DAYS.
 */
export function getCurrentDay(startDate: string): number {
  const start = new Date(startDate)
  const today = new Date()
  start.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 0
  return Math.min(diff + 1, PROGRAM_DAYS)
}

/**
 * Calculate days until batch starts. Returns 0 if already started.
 */
export function getDaysUntilStart(startDate: string): number {
  const start = new Date(startDate)
  const today = new Date()
  start.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  const diff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

/**
 * Calculate streak of consecutive viewed days counting backwards from currentDay.
 */
export function calculateStreak(viewedDays: number[], currentDay: number): number {
  if (currentDay < 1) return 0
  let streak = 0
  for (let d = currentDay; d >= 1; d--) {
    if (viewedDays.includes(d)) streak++
    else break
  }
  return streak
}
