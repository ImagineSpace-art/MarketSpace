export const RESERVED_SUBDOMAINS = new Set([
  'www', 'admin', 'api', 'support', 'mail', 'help', 'root', 'billing', 'marketspace',
  'login', 'signup', 'auth', 'account', 'accounts', 'store', 'stores', 'market', 'checkout',
  'dashboard', 'status', 'static', 'assets', 'cdn', 'dev', 'test', 'ftp', 'app', 'blog',
])

export const PROTECTED_BRANDS = [
  'adidas', 'aliexpress', 'amazon', 'apple', 'balenciaga', 'chanel', 'cocacola', 'disney',
  'ebay', 'facebook', 'google', 'gucci', 'instagram', 'louisvuitton', 'lululemon', 'meta',
  'microsoft', 'netflix', 'nike', 'porsche', 'puma', 'rolex', 'samsung', 'shein', 'tesla',
  'tiktok', 'toyota', 'whatsapp', 'youtube', 'zara',
]

export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  '10minutemail.com', 'burnermail.io', 'crazymailing.com', 'discard.email', 'dispostable.com',
  'emailondeck.com', 'fakeinbox.com', 'fakemail.net', 'getairmail.com', 'getnada.com',
  'guerrillamail.com', 'guerrillamailblock.com', 'inboxkitten.com', 'mail-temporaire.fr',
  'mailcatch.com', 'maildrop.cc', 'mailinator.com', 'mailnesia.com', 'mintemail.com',
  'mohmal.com', 'mytemp.email', 'sharklasers.com', 'spambog.com', 'spamgourmet.com',
  'tempmail.com', 'tempmail.net', 'tempmailo.com', 'tempr.email', 'tempail.com',
  'temp-mail.org', 'tempinbox.com', 'tmail.com', 'trashmail.com', 'trashmail.net',
  'throwawaymail.com', 'yopmail.com',
])

function normalizedName(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
}

function editDistance(left: string, right: string) {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index)
  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = row[0]
    row[0] = i
    for (let j = 1; j <= right.length; j += 1) {
      const above = row[j]
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (left[i - 1] === right[j - 1] ? 0 : 1))
      diagonal = above
    }
  }
  return row[right.length]
}

export function looksLikeProtectedBrand(value: string) {
  const candidate = normalizedName(value)
  return PROTECTED_BRANDS.some((brand) =>
    candidate.includes(brand) || (brand.length >= 4 && editDistance(candidate, brand) <= 1)
  )
}

export function validateStoreSubdomain(value: string) {
  if (value.length < 3) return 'Store addresses must contain at least 3 characters.'
  if (!/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/.test(value)) {
    return 'Use 3–63 lowercase letters, numbers, or hyphens.'
  }
  if (RESERVED_SUBDOMAINS.has(value)) return 'That store address is reserved.'
  if (looksLikeProtectedBrand(value)) return 'That store address is too similar to a protected brand.'
  return ''
}

export function isDisposableEmailDomain(email: string) {
  const domain = email.split('@').at(-1)?.trim().toLowerCase() || ''
  return [...DISPOSABLE_EMAIL_DOMAINS].some((blocked) => domain === blocked || domain.endsWith(`.${blocked}`))
}

export function isAtLeast18(dateOfBirth: string, today = new Date()) {
  const birthDate = new Date(`${dateOfBirth}T00:00:00Z`)
  if (Number.isNaN(birthDate.getTime())) return false
  const cutoff = new Date(Date.UTC(today.getUTCFullYear() - 18, today.getUTCMonth(), today.getUTCDate()))
  return birthDate <= cutoff
}

export function fuzzyNameSimilarity(left: string, right: string) {
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean)
  const a = normalize(left)
  const b = normalize(right)
  if (!a.length || !b.length) return 0
  const rightSet = new Set(b)
  const leftSet = new Set(a)
  const overlap = [...leftSet].filter((part) => rightSet.has(part)).length
  return (2 * overlap) / (leftSet.size + rightSet.size)
}
