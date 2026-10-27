async function hmacSha256(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function normalizeIdNumber(value: string) {
  const normalized = value.trim().toUpperCase()
  if (!normalized) throw new Error('Enter your government ID number.')
  return normalized
}

export function normalizePhoneE164(value: string) {
  const compact = value.trim().replace(/[\s().-]/g, '')
  const normalized = compact.startsWith('+')
    ? compact
    : compact.startsWith('260') ? `+${compact}` : ''
  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
    throw new Error('The verified phone number is not in a valid international format.')
  }
  return normalized
}

export async function hashSensitiveIdentifier(
  value: string,
  kind: 'id' | 'phone',
  secret: string,
) {
  if (!secret) throw new Error('STORE_ID_HASH_SECRET must be configured in Supabase Edge Function secrets.')
  const normalized = kind === 'id' ? normalizeIdNumber(value) : normalizePhoneE164(value)
  return hmacSha256(normalized, secret)
}
