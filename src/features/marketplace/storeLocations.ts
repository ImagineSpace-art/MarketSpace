export const STORE_MARKET_LOCATIONS = [
  'Cairo Road', 'Chachacha Road', 'Lumumba Road', 'Dongwe Road', 'Tokyo Market', 'City Market',
  'Lima Tower', 'Independence Avenue', 'Downtown Mall', 'Cosmopolitan Mall', 'Iringa Mall',
  'Makeni Mall', 'Cairo Mall', 'East Park Mall', 'Novare Mall'
] as const

export const MARKETPLACE_LOCATIONS = [
  { id: 'cairo-road', name: 'Cairo Road' },
  { id: 'chachacha-road', name: 'Chachacha Road' },
  { id: 'lumumba-road', name: 'Lumumba Road' },
  { id: 'dongwe-road', name: 'Dongwe Road' },
  { id: 'tokyo-market', name: 'Tokyo Market' },
  { id: 'city-market', name: 'City Market' },
  { id: 'lima-tower', name: 'Lima Tower' },
  { id: 'independence-avenue', name: 'Independence Avenue' },
  { id: 'downtown-mall', name: 'Downtown Mall' },
  { id: 'cosmopolitan-mall', name: 'Cosmopolitan Mall' },
  { id: 'iringa-mall', name: 'Iringa Mall' },
  { id: 'makeni-mall', name: 'Makeni Mall' },
  { id: 'cairo-mall', name: 'Cairo Mall' },
  { id: 'east-park-mall', name: 'East Park Mall' },
  { id: 'novare-mall', name: 'Novare Mall' },
] as const

export function getMarketplaceLocationName(locationId?: string | null) {
  return MARKETPLACE_LOCATIONS.find((location) => location.id === locationId)?.name
}

export type StoreMarketLocation = typeof STORE_MARKET_LOCATIONS[number]

export function isStoreMarketLocation(value: string | undefined): value is StoreMarketLocation {
  return STORE_MARKET_LOCATIONS.some(location => location === value)
}

export function groupStoreLocation(address?: string, locationName?: string) {
  if (locationName && locationName.trim()) return locationName.trim()
  const normalized = (address || '').trim()
  return STORE_MARKET_LOCATIONS.find(location => normalized.toLowerCase().includes(location.toLowerCase())) || 'Other locations'
}

/** The pilot is limited to one partner mall. */
export const PILOT_MALL = 'Iringa Mall'
export const STORE_REGISTRATION_LOCATIONS = [PILOT_MALL] as const

/** Shop or unit identifiers are alphanumeric, for example A12, G-07 or Shop 14B (1 to 20 characters). */
export function isValidUnitNumber(value: string) {
  return /^[A-Za-z0-9][A-Za-z0-9 /.-]{0,19}$/.test(value.trim())
}

export function formatStoreAddress(unit: string) {
  return `${unit.trim().replace(/\s+/g, ' ').toUpperCase()}, ${PILOT_MALL}`
}
