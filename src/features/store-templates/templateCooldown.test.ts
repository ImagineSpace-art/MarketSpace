import { describe, expect, it } from 'vitest'
import { getTemplateChangeAvailableAt } from './templateCooldown'

describe('getTemplateChangeAvailableAt', () => {
  it('adds six calendar months and clamps month-end dates', () => {
    expect(getTemplateChangeAvailableAt('2026-08-31T12:00:00.000Z')?.toISOString())
      .toBe('2027-02-28T12:00:00.000Z')
  })

  it('returns null when no valid change timestamp is available', () => {
    expect(getTemplateChangeAvailableAt()).toBeNull()
    expect(getTemplateChangeAvailableAt('not-a-date')).toBeNull()
  })
})
