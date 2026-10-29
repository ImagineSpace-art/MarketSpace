import { describe, expect, it } from 'vitest'
import { STORE_REPORT_REASONS, validateStoreReportInput } from './storeReportValidation'

describe('store report validation', () => {
  it('accepts each supported reason and trims optional details', () => {
    for (const reason of STORE_REPORT_REASONS) {
      expect(validateStoreReportInput({ reason, details: '  Helpful context  ' })).toEqual({
        errors: [],
        reason,
        details: 'Helpful context',
      })
    }
  })

  it('rejects unknown reasons and details beyond 500 Unicode characters', () => {
    const result = validateStoreReportInput({
      reason: 'invalid',
      details: '😀'.repeat(501),
    })
    expect(result.errors).toHaveLength(2)
    expect(result.reason).toBeNull()
  })

  it('rejects non-text details', () => {
    const result = validateStoreReportInput({ reason: 'other', details: 12 })
    expect(result.errors).toContain('Additional details must be text.')
  })
})
