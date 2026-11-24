export const BUSINESS_DOCUMENT_TYPES = [
  'pacra_certificate',
  'zra_tpin',
  'council_licence',
  'market_permit',
  'lease_or_landlord_letter',
] as const

export type BusinessDocumentType = typeof BUSINESS_DOCUMENT_TYPES[number]

export const BUSINESS_DOCUMENT_LABELS: Record<BusinessDocumentType, string> = {
  pacra_certificate: 'PACRA registration certificate',
  zra_tpin: 'ZRA TPIN certificate',
  council_licence: 'Council trading licence',
  market_permit: 'Market stall permit',
  lease_or_landlord_letter: 'Lease agreement or landlord letter',
}

export type BusinessEvidenceKind = 'document' | 'endorsement'

export function isBusinessDocumentType(value: unknown): value is BusinessDocumentType {
  return typeof value === 'string' && (BUSINESS_DOCUMENT_TYPES as readonly string[]).includes(value)
}

/** 3 to 40 characters: letters, digits, spaces and . / _ - only. */
export function isValidDocumentNumber(value: string) {
  return /^[A-Za-z0-9][A-Za-z0-9 /._-]{2,39}$/.test(value.trim())
}

/** Matches the database check: optional +, then 9 to 15 digits or spaces. */
export function isValidEndorserPhone(value: string) {
  return /^\+?[0-9 ]{9,15}$/.test(value.trim())
}

export function isValidPersonOrRole(value: string) {
  const trimmed = value.trim()
  return trimmed.length >= 2 && trimmed.length <= 100
}

/**
 * Evidence files must sit in the signed-in owner's private folder:
 * {userId}/business/{document|endorsement}/{filename}
 */
export function validateBusinessEvidencePath(path: string, userId: string, kind: BusinessEvidenceKind) {
  const prefix = `${userId}/business/${kind}/`
  if (!path.startsWith(prefix)) return false
  const filename = path.slice(prefix.length)
  return filename.length > 0 && /^[A-Za-z0-9._-]+$/.test(filename) && !filename.includes('..')
}

type StatusRow = { status: string }

/** The same rule the database enforces before it sets the badge. */
export function canGrantBusinessVerification(evidence: {
  documents: StatusRow[]
  videoChecks: StatusRow[]
  endorsements: StatusRow[]
}) {
  return evidence.documents.some(row => row.status === 'verified')
    && evidence.videoChecks.some(row => row.status === 'passed')
    && evidence.endorsements.some(row => row.status === 'confirmed')
}

export function isChallengeCodeLive(expiresAt: string | Date, now: Date = new Date()) {
  const expires = expiresAt instanceof Date ? expiresAt : new Date(expiresAt)
  return Number.isFinite(expires.getTime()) && expires.getTime() > now.getTime()
}
