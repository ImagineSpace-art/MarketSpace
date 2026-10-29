export const STORE_TEMPLATE_IDS = ['boutique-grid', 'storefront-landing'] as const
export type StoreTemplateId = (typeof STORE_TEMPLATE_IDS)[number]

export const STORE_ASSETS_BUCKET = 'store-assets'
export const MAX_STORE_ASSET_BYTES = 5 * 1024 * 1024
export const STORE_ASSET_MAX_DIMENSION = 1600

export const STORE_ACCENT_PALETTE = [
  '#1d4ed8',
  '#0f766e',
  '#6d28d9',
  '#be123c',
  '#c2410c',
  '#3f6212',
  '#334155',
  '#854d0e',
] as const

export type StoreTemplateSlot = {
  type: 'text' | 'image' | 'link' | 'phone' | 'color'
  maxLength?: number
  prohibitedWords?: boolean
}

export const STORE_TEMPLATE_SLOT_SCHEMAS = {
  'boutique-grid': {
    logoImage: { type: 'image' },
    bannerImage: { type: 'image' },
    bannerTitle: { type: 'text', maxLength: 40, prohibitedWords: true },
    bannerSubtitle: { type: 'text', maxLength: 100, prohibitedWords: true },
    shopHeading: { type: 'text', maxLength: 40 },
    aboutText: { type: 'text', maxLength: 500 },
    footerTagline: { type: 'text', maxLength: 80, prohibitedWords: true },
    instagramUrl: { type: 'link', maxLength: 500 },
    facebookUrl: { type: 'link', maxLength: 500 },
    tiktokUrl: { type: 'link', maxLength: 500 },
    whatsappNumber: { type: 'phone', maxLength: 20 },
    accentColor: { type: 'color' },
  },
  'storefront-landing': {
    announcementText: { type: 'text', maxLength: 80, prohibitedWords: true },
    heroImage: { type: 'image' },
    heroHeadline: { type: 'text', maxLength: 50, prohibitedWords: true },
    heroSubheadline: { type: 'text', maxLength: 120, prohibitedWords: true },
    heroButtonLabel: { type: 'text', maxLength: 20 },
    promoImage: { type: 'image' },
    promoHeading: { type: 'text', maxLength: 40, prohibitedWords: true },
    promoText: { type: 'text', maxLength: 200 },
    promoButtonLabel: { type: 'text', maxLength: 20 },
    storyHeading: { type: 'text', maxLength: 40 },
    storyText: { type: 'text', maxLength: 500 },
    storyImage: { type: 'image' },
    footerTagline: { type: 'text', maxLength: 80, prohibitedWords: true },
    instagramUrl: { type: 'link', maxLength: 500 },
    facebookUrl: { type: 'link', maxLength: 500 },
    tiktokUrl: { type: 'link', maxLength: 500 },
    whatsappNumber: { type: 'phone', maxLength: 20 },
    accentColor: { type: 'color' },
  },
} as const satisfies Record<StoreTemplateId, Record<string, StoreTemplateSlot>>

export const STORE_PROHIBITED_TERMS = [
  'counterfeit',
  'fake id',
  'stolen goods',
  'illegal drugs',
  'firearms',
  'weapon sales',
  'human trafficking',
  'child exploitation',
] as const

export type StoreTemplateContent = Record<string, string>

export function getStoreTemplateId(value: unknown): StoreTemplateId | null {
  return typeof value === 'string' && STORE_TEMPLATE_IDS.includes(value as StoreTemplateId)
    ? value as StoreTemplateId
    : null
}

function findProhibitedTerm(value: string) {
  const normalized = value.toLowerCase()
  return STORE_PROHIBITED_TERMS.find((term) => normalized.includes(term))
}

function isOwnedImagePath(value: string, userId: string) {
  if (!value.startsWith(`${userId}/`) || value.length > 512 || value.includes('\\') || /[%?#]/.test(value)) {
    return false
  }
  const segments = value.split('/')
  if (segments.length < 2 || segments.slice(1).some((segment) => !segment || segment === '.' || segment === '..')) {
    return false
  }
  if (segments.some((segment) => !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(segment))) return false
  return /\.(?:jpe?g|png|webp)$/i.test(value)
}

export function validateStoreTemplateContent(
  templateId: StoreTemplateId,
  input: unknown,
  userId: string,
  storeName = '',
) {
  const errors: string[] = []
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { errors: ['Template content must be an object.'], content: {} as StoreTemplateContent }
  }

  const source = input as Record<string, unknown>
  const schema = STORE_TEMPLATE_SLOT_SCHEMAS[templateId]
  const content: StoreTemplateContent = {}

  for (const key of Object.keys(source)) {
    if (!Object.hasOwn(schema, key)) errors.push(`Unknown slot: ${key}.`)
  }

  for (const [key, slot] of Object.entries(schema)) {
    const rawValue = source[key]
    if (rawValue === undefined || rawValue === null) continue
    if (typeof rawValue !== 'string') {
      errors.push(`${key} must be a string.`)
      continue
    }

    const value = rawValue.trim()
    if (slot.maxLength && value.length > slot.maxLength) {
      errors.push(`${key} must be ${slot.maxLength} characters or fewer.`)
      continue
    }

    if (slot.type === 'image' && value && !isOwnedImagePath(value, userId)) {
      errors.push(`${key} must be an image path inside your own storage folder.`)
      continue
    }
    if (slot.type === 'link' && value) {
      try {
        const url = new URL(value)
        if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) {
          errors.push(`${key} must be a valid HTTPS URL.`)
          continue
        }
      } catch {
        errors.push(`${key} must be a valid HTTPS URL.`)
        continue
      }
    }
    if (slot.type === 'phone' && value && !/^\+?[0-9][0-9 ()-]{6,18}$/.test(value)) {
      errors.push(`${key} must be a phone number, not a URL.`)
      continue
    }
    if (slot.type === 'color' && value && !STORE_ACCENT_PALETTE.includes(value as (typeof STORE_ACCENT_PALETTE)[number])) {
      errors.push(`${key} must be selected from the approved accent palette.`)
      continue
    }
    if (slot.prohibitedWords && value && findProhibitedTerm(value)) {
      errors.push(`${key} contains prohibited content.`)
      continue
    }

    content[key] = value
  }

  if (findProhibitedTerm(storeName)) errors.push('The store name contains prohibited content.')
  return { errors, content }
}

export function validateDepartmentNames(input: unknown) {
  const errors: string[] = []
  if (!Array.isArray(input)) return { errors: ['Departments must be a list of names.'], names: [] as string[] }
  if (input.length > 30) errors.push('A store can have no more than 30 departments.')

  const names: string[] = []
  const seen = new Set<string>()
  for (const value of input) {
    if (typeof value !== 'string') {
      errors.push('Department names must be text.')
      continue
    }
    const name = value.trim()
    if (!name || name.length > 30) {
      errors.push('Department names must contain 1 to 30 characters.')
      continue
    }
    const normalized = name.toLocaleLowerCase()
    if (seen.has(normalized)) {
      errors.push('Department names must be unique within a store.')
      continue
    }
    if (findProhibitedTerm(name)) {
      errors.push('Department names cannot contain prohibited content.')
      continue
    }
    seen.add(normalized)
    names.push(name)
  }
  return { errors, names }
}
