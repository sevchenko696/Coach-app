/**
 * Normalize an Indian mobile phone number to 10 digits.
 * Strips spaces, dashes, +91 prefix, leading 0.
 * Returns null if invalid.
 */
export function normalizePhone(input: string): string | null {
  // Strip all non-digit characters
  let digits = input.replace(/\D/g, '')

  // Remove country code prefix
  if (digits.startsWith('91') && digits.length > 10) {
    digits = digits.slice(2)
  }

  // Remove leading 0
  if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1)
  }

  // Must be exactly 10 digits
  if (digits.length !== 10) return null

  // Must start with 6-9 (Indian mobile)
  if (!/^[6-9]/.test(digits)) return null

  return digits
}
