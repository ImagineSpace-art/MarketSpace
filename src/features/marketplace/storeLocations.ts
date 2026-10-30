export const STORE_MARKET_LOCATIONS = [
  'Cairo Road', 'Chachacha Road', 'Lumumba Road', 'Dongwe Road', 'Tokyo Market', 'City Market',
  'Lima Tower', 'Independence Avenue', 'Downtown Mall', 'Cosmopolitan Mall', 'Iringa Mall',
  'Makeni Mall', 'Cairo Mall', 'East Park Mall', 'Novare Mall'
] as const

export type StoreMarketLocation = typeof STORE_MARKET_LOCATIONS[number]

export function isStoreMarketLocation(value: string | undefined): value is StoreMarketLocation {
  return STORE_MARKET_LOCATIONS.some(location => location === value)
}

export function groupStoreLocation(address?: string, locationName?: string) {
  if (locationName && locationName.trim()) return locationName.trim()
  const normalized = (address || '').trim()
  return STORE_MARKET_LOCATIONS.find(location => normalized.toLowerCase().includes(location.toLowerCase())) || 'Other locations'
}
