import { describe, expect, it } from 'vitest'
import {
  isAtLeast18,
  isDisposableEmailDomain,
  isValidZambianNrc,
  validateOptionalMapCoordinates,
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

  it('accepts only a 9-digit numeric Zambian NRC', () => {
    expect(isValidZambianNrc('123456789')).toBe(true)
    expect(isValidZambianNrc('012345678')).toBe(true)
    expect(isValidZambianNrc('12345678')).toBe(false)
    expect(isValidZambianNrc('1234567890')).toBe(false)
    expect(isValidZambianNrc('12345A789')).toBe(false)
  })

  it('allows physical store applications without a map pin but validates optional coordinates', () => {
    expect(validateOptionalMapCoordinates('', '')).toBe('')
    expect(validateOptionalMapCoordinates(' -15.4 ', '28.3')).toBe('')
    expect(validateOptionalMapCoordinates('-15.4', '')).toContain('both map coordinates')
    expect(validateOptionalMapCoordinates('91', '28.3')).toContain('valid map coordinates')
    expect(validateOptionalMapCoordinates('-15.4', '181')).toContain('valid map coordinates')
  })
})
