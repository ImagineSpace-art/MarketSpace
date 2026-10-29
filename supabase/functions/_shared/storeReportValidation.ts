export const STORE_REPORT_REASONS = [
  'scam_or_fake_store',
  'prohibited_items',
  'misleading_information',
  'impersonation',
  'other',
] as const

export type StoreReportReason = (typeof STORE_REPORT_REASONS)[number]

export const STORE_REPORT_RATE_LIMIT = 5
export const STORE_REPORT_RATE_WINDOW_SECONDS = 86400

export function validateStoreReportInput(input: unknown) {
  const errors: string[] = []
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { errors: ['Report details are invalid.'], reason: null, details: '' }
  }

  const body = input as Record<string, unknown>
  const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
  if (!STORE_REPORT_REASONS.includes(reason as StoreReportReason)) {
    errors.push('Choose a valid reason for this report.')
  }

  const rawDetails = body.details ?? ''
  if (typeof rawDetails !== 'string') {
    errors.push('Additional details must be text.')
  }
  const details = typeof rawDetails === 'string' ? rawDetails.trim() : ''
  if (Array.from(details).length > 500) errors.push('Additional details must be 500 characters or fewer.')

  return {
    errors,
    reason: STORE_REPORT_REASONS.includes(reason as StoreReportReason) ? reason as StoreReportReason : null,
    details,
  }
}
