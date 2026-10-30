import { describe, expect, it } from 'vitest'
import type { Listing, StoreCollection } from '../../types'
import {
  getBoutiqueDepartmentSectionListings,
  getBoutiqueDepartmentTargetId,
  getBoutiqueGridDepartments,
  getBoutiqueGridListings,
} from './boutiqueGridModel'

const departments: StoreCollection[] = [
  { id: 'one', name: 'Clothing' },
  { id: 'two', name: 'Accessories' },
]

const listings: Listing[] = [
  { id: 1, title: 'Recent', description: '', price: 20, category: 'Fashion', collection_id: 'one', created_at: '2026-10-28T10:00:00Z' },
  { id: 2, title: 'Earlier', description: '', price: 10, category: 'Fashion', collection_id: 'one', created_at: '2026-10-27T10:00:00Z' },
  { id: 3, title: 'Other', description: '', price: 30, category: 'Accessories', collection_id: 'two', created_at: '2026-10-26T10:00:00Z' },
]

describe('Boutique Grid catalog behavior', () => {
  it('only shows this store’s departments that have listings', () => {
    expect(getBoutiqueGridDepartments([...departments, { id: 'empty', name: 'Empty' }], listings))
      .toEqual(departments)
  })

  it('filters listings by department and preserves all items for All', () => {
    expect(getBoutiqueGridListings(listings, 'one', 'default').map(listing => listing.id)).toEqual([1, 2])
    expect(getBoutiqueGridListings(listings, 'all', 'default')).toHaveLength(3)
  })

  it('supports listings assigned to multiple departments', () => {
    const multiDepartmentListing = { ...listings[0], collection_id: undefined, collection_ids: ['one', 'two'] }
    expect(getBoutiqueGridListings([multiDepartmentListing, listings[2]], 'two', 'default').map(listing => listing.id)).toEqual([1, 3])
  })

  it('limits department sections to ten listings and produces stable scroll targets', () => {
    const manyListings = Array.from({ length: 12 }, (_, index) => ({
      ...listings[0],
      id: index + 20,
    }))
    expect(getBoutiqueDepartmentSectionListings(manyListings, 'one', 'default')).toHaveLength(10)
    expect(getBoutiqueDepartmentTargetId('Seasonal Wear')).toBe('boutique-department-seasonal-wear')
  })

  it('supports ascending and descending price sorting', () => {
    expect(getBoutiqueGridListings(listings, 'all', 'price-asc').map(listing => listing.price)).toEqual([10, 20, 30])
    expect(getBoutiqueGridListings(listings, 'all', 'price-desc').map(listing => listing.price)).toEqual([30, 20, 10])
  })
})
