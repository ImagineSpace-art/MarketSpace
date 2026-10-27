import { describe, expect, it } from 'vitest'
import {
  hashSensitiveIdentifier,
  normalizeIdNumber,
  normalizePhoneE164,
} from '../functions/_shared/storeRegistrationHash'

describe('store registration sensitive identifier hashing', () => {
  it('trims and uppercases government ID numbers before hashing', async () => {
    expect(normalizeIdNumber('  ab-123  ')).toBe('AB-123')
    await expect(hashSensitiveIdentifier(' ab-123 ', 'id', 'test-secret'))
      .resolves.toBe(await hashSensitiveIdentifier('AB-123', 'id', 'test-secret'))
  })

  it('normalizes phone formatting to E.164 before hashing', async () => {
    expect(normalizePhoneE164(' +260 97 123-4567 ')).toBe('+260971234567')
    await expect(hashSensitiveIdentifier('+260 97 123-4567', 'phone', 'test-secret'))
      .resolves.toBe(await hashSensitiveIdentifier('+260971234567', 'phone', 'test-secret'))
  })

  it('rejects phone numbers that cannot be normalized to E.164', () => {
    expect(() => normalizePhoneE164('0971234567')).toThrow('valid international format')
  })
})
