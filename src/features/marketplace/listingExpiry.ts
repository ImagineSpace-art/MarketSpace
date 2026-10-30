import type { Listing } from '../../types'

export const DAY_MS = 24 * 60 * 60 * 1000

export function getListingRenewalDurationMs(
  listing: Listing,
  globalFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' = 'weekly',
): number {
  const frequency = listing.use_global_renewal === false
    ? listing.renewal_frequency || 'weekly'
    : globalFrequency
  const cycleDays = frequency === 'daily' ? 1 : frequency === 'biweekly' ? 14 : frequency === 'monthly' ? 30 : 7
  return cycleDays * DAY_MS
}

export function getListingTimeRemainingMs(
  listing: Listing,
  globalFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' = 'weekly',
  now = Date.now(),
): number {
  const renewedAt = new Date(listing.last_renewed_at || listing.created_at || now).getTime()
  if (!Number.isFinite(renewedAt)) return 0
  return getListingRenewalDurationMs(listing, globalFrequency) - (now - renewedAt)
}

export function isListingExpired(
  listing: Listing,
  globalFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' = 'weekly',
  globalDay = 'Monday',
  now = Date.now(),
): boolean {
  const renewedAt = new Date(listing.last_renewed_at || listing.created_at || now).getTime()
  if (!Number.isFinite(renewedAt)) return false

  const frequency = listing.use_global_renewal === false
    ? listing.renewal_frequency || 'weekly'
    : globalFrequency
  const cycleDays = frequency === 'daily' ? 1 : frequency === 'biweekly' ? 14 : frequency === 'monthly' ? 30 : 7
  const daysSinceRenewed = (now - renewedAt) / DAY_MS
  if (daysSinceRenewed >= cycleDays) return true

  if (listing.use_global_renewal !== false && (frequency === 'weekly' || frequency === 'biweekly')) {
    const targetDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(globalDay)
    const currentDay = new Date(now).getDay()
    const renewedDay = new Date(renewedAt).getDay()
    if (daysSinceRenewed >= 1 && currentDay === targetDay && renewedDay !== targetDay) return true
  }

  return false
}
