import { describe, expect, it } from 'vitest'
import type { Listing } from '../types'
import { getBrowseListings } from './listingSections'

const now = Date.UTC(2026, 0, 10, 12)

function makeListing(id: number, createdAt: number, status?: string): Listing {
  return {
    id,
    title: `Listing ${id}`,
    description: '',
    price: 100,
    category: 'Electronics',
    status,
    created_at: new Date(createdAt).toISOString(),
  }
}

describe('getBrowseListings', () => {
  it('excludes expired and inactive listings while retaining active and legacy listings', () => {
    const listings = [
      makeListing(1, now - 2 * 24 * 60 * 60 * 1000, 'active'),
      makeListing(2, now - 9 * 24 * 60 * 60 * 1000, 'available'),
      makeListing(3, now - 2 * 24 * 60 * 60 * 1000, 'paused'),
      makeListing(4, now - 2 * 24 * 60 * 60 * 1000),
    ]

    expect(getBrowseListings(listings, 'weekly', 'Monday', now).map(listing => listing.id))
      .toEqual([1, 4])
  })

  it('uses the configured global renewal frequency', () => {
    const listing = makeListing(1, now - 2 * 24 * 60 * 60 * 1000, 'active')

    expect(getBrowseListings([listing], 'daily', 'Monday', now)).toEqual([])
  })
})
