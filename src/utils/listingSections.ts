import type { Listing } from '../types'

const NEW_ARRIVAL_WINDOW_MS = 14 * 24 * 60 * 60 * 1000

export function isNewArrival(listing: Listing, now = Date.now()): boolean {
  if (!listing.created_at) return false

  const createdAt = Date.parse(listing.created_at)
  const age = now - createdAt
  return Number.isFinite(createdAt) && age >= 0 && age <= NEW_ARRIVAL_WINDOW_MS
}

export function isBestSeller(listing: Listing): boolean {
  return Boolean(listing.sponsored) || (listing.rating !== undefined && listing.rating >= 4.5)
}
