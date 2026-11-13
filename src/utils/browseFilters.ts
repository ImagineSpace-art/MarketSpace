import type { BusinessProfile, Listing } from '../types'
import { getMarketplaceLocationName, groupStoreLocation } from '../features/marketplace/storeLocations'

export type BrowseFilters = {
  categories: string[]
  locations: string[]
  conditions: string[]
  sellers: string[]
  ratings: string[]
  minPrice: string
  maxPrice: string
}

export type BrowseSellerOption = {
  id: string
  label: string
}

function getListingBusiness(
  listing: Listing,
  businesses: Record<string, BusinessProfile>,
): BusinessProfile | undefined {
  return businesses[listing.user_id || '']
    || Object.values(businesses).find(business => business.storeId && business.storeId === listing.store_id)
}

export function getBrowseListingLocation(
  listing: Listing,
  businesses: Record<string, BusinessProfile>,
): string | undefined {
  const business = getListingBusiness(listing, businesses)
  const serviceArea = getMarketplaceLocationName(listing.service_area_id)
  if (serviceArea) return serviceArea
  if (business?.locationName?.trim()) return business.locationName.trim()
  if (business?.locationId) {
    const businessLocation = getMarketplaceLocationName(business.locationId)
    if (businessLocation) return businessLocation
  }
  if (!business?.address) return undefined

  const location = groupStoreLocation(business.address)
  return location === 'Other locations' ? undefined : location
}

export function getBrowseSellerOptions(
  listings: Listing[],
  businesses: Record<string, BusinessProfile>,
): BrowseSellerOption[] {
  const options = new Map<string, string>()

  for (const listing of listings) {
    const business = getListingBusiness(listing, businesses)
    const id = listing.user_id || business?.userId || listing.store_id || `listing:${listing.id}`
    const label = business?.shopName || listing.seller_name || 'Individual seller'
    options.set(id, label)
  }

  return [...options].map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label))
}

export function filterBrowseListings(
  listings: Listing[],
  businesses: Record<string, BusinessProfile>,
  filters: BrowseFilters,
  query = '',
): Listing[] {
  const normalizedQuery = query.trim().toLowerCase()
  const minimumRating = filters.ratings.reduce((highest, rating) => Math.max(highest, Number(rating)), 0)
  const minimumPrice = filters.minPrice === '' ? undefined : Number(filters.minPrice)
  const maximumPrice = filters.maxPrice === '' ? undefined : Number(filters.maxPrice)

  return listings.filter(listing => {
    const business = getListingBusiness(listing, businesses)
    const sellerId = listing.user_id || business?.userId || listing.store_id || `listing:${listing.id}`
    const location = getBrowseListingLocation(listing, businesses)
    const price = Number(String(listing.price).replace(/[^\d.]/g, ''))
    const rating = Number(listing.rating || business?.rating || 0)

    if (filters.categories.length && !filters.categories.includes(listing.category)) return false
    if (filters.locations.length && (!location || !filters.locations.includes(location))) return false
    if (filters.conditions.length && !filters.conditions.includes(listing.condition || 'New')) return false
    if (filters.sellers.length && !filters.sellers.includes(sellerId)) return false
    if (minimumPrice !== undefined && Number.isFinite(minimumPrice) && price < minimumPrice) return false
    if (maximumPrice !== undefined && Number.isFinite(maximumPrice) && price > maximumPrice) return false
    if (rating < minimumRating) return false

    if (normalizedQuery) {
      const searchableText = `${listing.title} ${listing.description} ${listing.category} ${listing.seller_name || ''} ${business?.shopName || ''}`.toLowerCase()
      if (!searchableText.includes(normalizedQuery)) return false
    }

    return true
  })
}
