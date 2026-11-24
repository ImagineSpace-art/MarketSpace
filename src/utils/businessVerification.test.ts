import { describe, expect, it } from 'vitest'
import {
  BUSINESS_DOCUMENT_TYPES,
  canGrantBusinessVerification,
  isBusinessDocumentType,
  isChallengeCodeLive,
  isValidDocumentNumber,
  isValidEndorserPhone,
  isValidPersonOrRole,
  validateBusinessEvidencePath,
} from '../../supabase/functions/_shared/businessVerificationValidation'

const USER = '3f8a1d52-1c2b-4e6f-9a10-0b5f2c7d8e91'

describe('business document validation', () => {
  it('accepts only the supported document types', () => {
    for (const type of BUSINESS_DOCUMENT_TYPES) expect(isBusinessDocumentType(type)).toBe(true)
    expect(isBusinessDocumentType('passport')).toBe(false)
    expect(isBusinessDocumentType(undefined)).toBe(false)
  })

  it('checks the document number format and length', () => {
    expect(isValidDocumentNumber('119 2021 000123')).toBe(true)
    expect(isValidDocumentNumber('TPIN-1002345678')).toBe(true)
    expect(isValidDocumentNumber('ab')).toBe(false)
    expect(isValidDocumentNumber('<script>alert(1)</script>')).toBe(false)
    expect(isValidDocumentNumber('x'.repeat(41))).toBe(false)
  })
})

describe('endorser details', () => {
  it('validates phone numbers like the database check', () => {
    expect(isValidEndorserPhone('0977123456')).toBe(true)
    expect(isValidEndorserPhone('+260 977 123 456')).toBe(true)
    expect(isValidEndorserPhone('12345')).toBe(false)
    expect(isValidEndorserPhone('0977-123-456')).toBe(false)
  })

  it('requires a real name and role', () => {
    expect(isValidPersonOrRole('Mr Banda')).toBe(true)
    expect(isValidPersonOrRole(' A ')).toBe(false)
    expect(isValidPersonOrRole('x'.repeat(101))).toBe(false)
  })
})

describe('private evidence paths', () => {
  it('only allows files inside the owner’s own business folder', () => {
    expect(validateBusinessEvidencePath(`${USER}/business/document/a1.jpg`, USER, 'document')).toBe(true)
    expect(validateBusinessEvidencePath(`${USER}/business/endorsement/a1.jpg`, USER, 'endorsement')).toBe(true)
  })

  it('rejects other users, wrong kinds and traversal', () => {
    expect(validateBusinessEvidencePath(`other/business/document/a1.jpg`, USER, 'document')).toBe(false)
    expect(validateBusinessEvidencePath(`${USER}/business/document/a1.jpg`, USER, 'endorsement')).toBe(false)
    expect(validateBusinessEvidencePath(`${USER}/business/document/../x.jpg`, USER, 'document')).toBe(false)
    expect(validateBusinessEvidencePath(`${USER}/business/document/`, USER, 'document')).toBe(false)
    expect(validateBusinessEvidencePath(`${USER}/business/document/a b.jpg`, USER, 'document')).toBe(false)
  })
})

describe('granting Business verified', () => {
  const verified = { status: 'verified' }
  const passed = { status: 'passed' }
  const confirmed = { status: 'confirmed' }

  it('needs all three checks to pass', () => {
    expect(canGrantBusinessVerification({ documents: [verified], videoChecks: [passed], endorsements: [confirmed] })).toBe(true)
  })

  it('fails when any one check is missing', () => {
    expect(canGrantBusinessVerification({ documents: [], videoChecks: [passed], endorsements: [confirmed] })).toBe(false)
    expect(canGrantBusinessVerification({ documents: [verified], videoChecks: [], endorsements: [confirmed] })).toBe(false)
    expect(canGrantBusinessVerification({ documents: [verified], videoChecks: [passed], endorsements: [] })).toBe(false)
  })

  it('does not count pending, rejected or failed rows', () => {
    expect(canGrantBusinessVerification({
      documents: [{ status: 'pending' }, { status: 'rejected' }],
      videoChecks: [{ status: 'failed' }],
      endorsements: [{ status: 'not_confirmed' }],
    })).toBe(false)
  })

  it('still passes when an old rejected row exists next to a verified one', () => {
    expect(canGrantBusinessVerification({
      documents: [{ status: 'rejected' }, verified],
      videoChecks: [{ status: 'failed' }, passed],
      endorsements: [confirmed],
    })).toBe(true)
  })
})

describe('live-presence code expiry', () => {
  const now = new Date('2026-11-24T12:00:00Z')

  it('is live before the expiry time', () => {
    expect(isChallengeCodeLive('2026-11-24T12:20:00Z', now)).toBe(true)
  })

  it('is not live at or after the expiry time, or for bad dates', () => {
    expect(isChallengeCodeLive('2026-11-24T12:00:00Z', now)).toBe(false)
    expect(isChallengeCodeLive('2026-11-24T11:59:00Z', now)).toBe(false)
    expect(isChallengeCodeLive('not a date', now)).toBe(false)
  })
})
