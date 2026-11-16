import { describe, expect, it } from 'vitest'
import type { Listing } from '../types'
import { getBrowseListings, groupNewArrivalsIntoRows, isNewArrival } from './listingSections'

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

describe('groupNewArrivalsIntoRows', () => {
  it('starts a new row after each ten listings', () => {
    const listings = Array.from({ length: 21 }, (_, index) => makeListing(index + 1, now))

    expect(groupNewArrivalsIntoRows(listings).map(row => row.length)).toEqual([10, 10, 1])
  })

  it('returns no rows when there are no new arrivals', () => {
    expect(groupNewArrivalsIntoRows([])).toEqual([])
  })
})

describe('isNewArrival', () => {
  it('excludes a listing renewed after it was created', () => {
    const listing = {
      ...makeListing(1, now - 2 * 24 * 60 * 60 * 1000),
      last_renewed_at: new Date(now).toISOString(),
    }

    expect(isNewArrival(listing, now)).toBe(false)
  })

  it('excludes a listing whose creation timestamp was reset during renewal', () => {
    const renewedAt = now - 2 * 24 * 60 * 60 * 1000
    const listing = {
      ...makeListing(1, renewedAt),
      last_renewed_at: new Date(renewedAt).toISOString(),
    }

    expect(isNewArrival(listing, now)).toBe(false)
  })

  it('includes a recently created listing that has not been renewed', () => {
    const listing = makeListing(1, now - 2 * 24 * 60 * 60 * 1000)

    expect(isNewArrival(listing, now)).toBe(true)
  })
})

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
