import { describe, expect, it } from 'vitest'
import type { BusinessProfile, Listing } from '../types'
import { filterBrowseListings, getBrowseListingLocation, getBrowseSellerOptions } from './browseFilters'

const businesses: Record<string, BusinessProfile> = {
  storeOwner: {
    userId: 'storeOwner',
    shopName: 'City Electronics',
    description: '',
    category: 'Electronics',
    address: 'Cairo Road',
    locationName: 'Cairo Road',
    logo: '',
    cover: '',
    catalog: [],
    ads: [],
    rating: 4.5,
    storeId: 'store-1',
  },
}

const listings: Listing[] = [
  {
    id: 1,
    title: 'Phone',
    description: 'Android phone',
    price: 250,
    category: 'Electronics',
    condition: 'Used - Good',
    user_id: 'storeOwner',
    store_id: 'store-1',
    rating: 4,
  },
  {
    id: 2,
    title: 'Gaming chair',
    description: 'Comfortable chair',
    price: 500,
    category: 'Furniture',
    condition: 'New',
    seller_name: 'Alex Seller',
    user_id: 'individual-1',
    rating: 3,
  },
  {
    id: 3,
    title: 'Headphones',
    description: 'Wireless headphones',
    price: 100,
    category: 'Electronics',
    condition: 'New',
    user_id: 'storeOwner',
    store_id: 'store-1',
  },
]

describe('filterBrowseListings', () => {
  it('matches any checked category and applies the other facets to those matches', () => {
    const results = filterBrowseListings(listings, businesses, {
      categories: ['Electronics', 'Furniture'],
      locations: ['Cairo Road'],
      conditions: ['New', 'Used - Good'],
      sellers: ['storeOwner'],
      ratings: ['4'],
      minPrice: '100',
      maxPrice: '300',
    })

    expect(results.map(listing => listing.id)).toEqual([1, 3])
  })

  it('uses the entire listing feed when no categories are selected', () => {
    const results = filterBrowseListings(listings, businesses, {
      categories: [],
      locations: [],
      conditions: [],
      sellers: [],
      ratings: [],
      minPrice: '',
      maxPrice: '',
    })

    expect(results).toHaveLength(3)
  })

  it('treats a missing legacy condition as new', () => {
    const listingWithoutCondition = { ...listings[0], id: 4, condition: undefined }
    const results = filterBrowseListings([listingWithoutCondition], businesses, {
      categories: [],
      locations: [],
      conditions: ['New'],
      sellers: [],
      ratings: [],
      minPrice: '',
      maxPrice: '',
    })

    expect(results.map(listing => listing.id)).toEqual([4])
  })

  it('applies seller rating and text search using available store data', () => {
    const results = filterBrowseListings(listings, businesses, {
      categories: [],
      locations: [],
      conditions: [],
      sellers: [],
      ratings: ['4'],
      minPrice: '',
      maxPrice: '',
    }, 'city')

    expect(results.map(listing => listing.id)).toEqual([1, 3])
  })
})

describe('browse filter options', () => {
  it('resolves listing locations and seller names from stores', () => {
    expect(getBrowseListingLocation(listings[0], businesses)).toBe('Cairo Road')
    expect(getBrowseSellerOptions(listings, businesses)).toEqual([
      { id: 'individual-1', label: 'Alex Seller' },
      { id: 'storeOwner', label: 'City Electronics' },
    ])
  })
})
