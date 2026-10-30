import type { Listing, StoreCollection } from '../../types'

export type BoutiqueGridSortOrder = 'default' | 'price-asc' | 'price-desc'

export function listingDepartmentIds(listing: Listing) {
  const ids = Array.isArray(listing.collection_ids)
    ? listing.collection_ids.map(String)
    : []
  if (listing.collection_id && !ids.includes(String(listing.collection_id))) ids.push(String(listing.collection_id))
  return ids
}

export function getBoutiqueGridDepartments(collections: StoreCollection[], listings: Listing[]) {
  return collections.filter(department =>
    listings.some(listing => listingDepartmentIds(listing).includes(String(department.id))),
  )
}

export function getBoutiqueGridListings(
  listings: Listing[],
  departmentId: string,
  sortOrder: BoutiqueGridSortOrder,
) {
  const filtered = departmentId === 'all'
    ? [...listings]
    : listings.filter(listing => listingDepartmentIds(listing).includes(departmentId))

  if (sortOrder === 'price-asc') return filtered.sort((a, b) => a.price - b.price)
  if (sortOrder === 'price-desc') return filtered.sort((a, b) => b.price - a.price)
  return filtered.sort((a, b) =>
    (Date.parse(b.created_at || '') || 0) - (Date.parse(a.created_at || '') || 0),
  )
}

export function getBoutiqueDepartmentSectionListings(
  listings: Listing[],
  departmentId: string,
  sortOrder: BoutiqueGridSortOrder,
) {
  return getBoutiqueGridListings(listings, departmentId, sortOrder).slice(0, 10)
}

export function getBoutiqueDepartmentTargetId(departmentId: string) {
  const safeId = departmentId.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `boutique-department-${safeId || 'section'}`
}
