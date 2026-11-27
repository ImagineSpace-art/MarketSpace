export const PILOT_MALL = 'Iringa Mall'

/** Alphanumeric shop or unit identifier, for example A12, G-07 or Shop 14B (1 to 20 characters). */
export function isValidUnitNumber(value: string) {
  return /^[A-Za-z0-9][A-Za-z0-9 /.-]{0,19}$/.test(value.trim())
}

export function formatStoreAddress(unit: string) {
  return `${unit.trim().replace(/\s+/g, ' ').toUpperCase()}, ${PILOT_MALL}`
}
