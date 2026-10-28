import { describe, expect, it } from 'vitest'
import {
  fuzzyNameSimilarity,
  isAtLeast18,
  isDisposableEmailDomain,
  validateStoreSubdomain,
} from '../../supabase/functions/_shared/storeRegistrationValidation'

describe('store registration validation', () => {
  it('accepts valid store addresses and rejects malformed or reserved values', () => {
    expect(validateStoreSubdomain('lusaka-gadgets')).toBe('')
    expect(validateStoreSubdomain('x')).not.toBe('')
    expect(validateStoreSubdomain('admin')).toContain('reserved')
    expect(validateStoreSubdomain('my store')).not.toBe('')
  })

  it('rejects protected-brand names and close lookalikes', () => {
    expect(validateStoreSubdomain('nike-outlet')).toContain('protected brand')
    expect(validateStoreSubdomain('n1ke')).toContain('protected brand')
  })

  it('requires the owner to be at least 18 using the birthday boundary', () => {
    const today = new Date('2026-10-26T12:00:00Z')
    expect(isAtLeast18('2008-10-26', today)).toBe(true)
    expect(isAtLeast18('2008-10-27', today)).toBe(false)
    expect(isAtLeast18('not-a-date', today)).toBe(false)
  })

  it('blocks configured disposable-email domains', () => {
    expect(isDisposableEmailDomain('seller@mailinator.com')).toBe(true)
    expect(isDisposableEmailDomain('seller@example.com')).toBe(false)
  })

  it('returns a normalized fuzzy similarity score for payout-name review', () => {
    expect(fuzzyNameSimilarity('Grace Banda', 'Banda Grace')).toBe(1)
    expect(fuzzyNameSimilarity('Grace Banda', 'Grace Mumba')).toBeCloseTo(0.5)
    expect(fuzzyNameSimilarity('', 'Grace Banda')).toBe(0)
  })
})
