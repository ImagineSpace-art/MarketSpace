import type { Listing, StoreCollection } from '../../types'

export type BoutiqueGridSortOrder = 'default' | 'price-asc' | 'price-desc'

export function getBoutiqueGridDepartments(collections: StoreCollection[], listings: Listing[]) {
  return collections.filter(department =>
    listings.some(listing => String(listing.collection_id) === String(department.id)),
  )
}

export function getBoutiqueGridListings(
  listings: Listing[],
  departmentId: string,
  sortOrder: BoutiqueGridSortOrder,
) {
  const filtered = departmentId === 'all'
    ? [...listings]
    : listings.filter(listing => String(listing.collection_id) === departmentId)

  if (sortOrder === 'price-asc') return filtered.sort((a, b) => a.price - b.price)
  if (sortOrder === 'price-desc') return filtered.sort((a, b) => b.price - a.price)
  return filtered.sort((a, b) =>
    (Date.parse(b.created_at || '') || 0) - (Date.parse(a.created_at || '') || 0),
  )
}
