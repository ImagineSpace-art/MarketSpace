import { describe, expect, it } from 'vitest'
import { PILOT_MALL, formatStoreAddress, isValidUnitNumber } from './storeLocations'

describe('shop and unit numbers', () => {
  it('accepts alphanumeric identifiers', () => {
    for (const unit of ['A12', 'G-07', 'Shop 14B', '2/15', 'L1.04']) expect(isValidUnitNumber(unit)).toBe(true)
  })
  it('rejects empty, symbol-led and over-long values', () => {
    for (const unit of ['', '  ', '-12', '<script>', 'A'.repeat(21)]) expect(isValidUnitNumber(unit)).toBe(false)
  })
  it('formats the stored address with the mall', () => {
    expect(formatStoreAddress(' shop  14b ')).toBe(`SHOP 14B, ${PILOT_MALL}`)
  })
})
