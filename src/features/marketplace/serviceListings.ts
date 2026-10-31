export const SERVICE_PRICE_UNITS = ['fixed', 'from', 'per_hour', 'per_day'] as const

export type ServicePriceUnit = typeof SERVICE_PRICE_UNITS[number]

export const PROHIBITED_LISTING_TERMS = [
  'counterfeit',
  'fake id',
  'stolen goods',
  'illegal drugs',
  'firearms',
  'weapon sales',
  'human trafficking',
  'child exploitation',
] as const

export function findProhibitedListingTerm(value: string) {
  const normalized = value.toLowerCase()
  return PROHIBITED_LISTING_TERMS.find((term) => normalized.includes(term))
}

export function formatServicePriceUnit(unit?: ServicePriceUnit | null) {
  switch (unit) {
    case 'from': return 'from'
    case 'per_hour': return '/ hour'
    case 'per_day': return '/ day'
    default: return ''
  }
}
