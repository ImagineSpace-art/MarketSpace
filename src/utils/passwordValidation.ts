/**
 * Password Security Validation Utility
 * Enforces strong password criteria matching Supabase security settings:
 * - Minimum 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one digit (0-9)
 * - At least one special symbol (!@#$%^&* etc.)
 */

export interface PasswordValidationResult {
  isValid: boolean
  hasMinLength: boolean
  hasUpper: boolean
  hasLower: boolean
  hasDigit: boolean
  hasSymbol: boolean
}

export function validatePassword(password: string): PasswordValidationResult {
  const hasMinLength = password.length >= 8
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasDigit = /[0-9]/.test(password)
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)

  const isValid = hasMinLength && hasUpper && hasLower && hasDigit && hasSymbol

  return {
    isValid,
    hasMinLength,
    hasUpper,
    hasLower,
    hasDigit,
    hasSymbol,
  }
}
