/** Shared input rules, so every form checks the same way. */

export const LIMITS = {
  message: 2000,
  reason: 500,
  address: 200,
  search: 100,
} as const

/** Zambian mobile (097xxxxxxx, +26097xxxxxxx, 26097xxxxxxx) or a general 9-15 digit number. */
export function isValidPhone(value: string) {
  const trimmed = value.trim()
  if (!/^\+?[0-9 ()-]+$/.test(trimmed)) return false
  const digits = trimmed.replace(/\D/g, '')
  return digits.length >= 9 && digits.length <= 15
}

export function isTextWithin(value: string, min: number, max: number) {
  const length = value.trim().length
  return length >= min && length <= max
}

/** Removes control characters and trims; keeps normal punctuation and unicode letters. */
export function cleanText(value: string) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim()
}
