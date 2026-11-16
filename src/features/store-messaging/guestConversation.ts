export type GuestResumeCredentials = {
  conversationId: string
  secret: string
}

export function createGuestResumeSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function formatGuestResumeCode({ conversationId, secret }: GuestResumeCredentials) {
  return `ms1.${conversationId}.${secret}`
}

export function parseGuestResumeCode(value: string): GuestResumeCredentials | null {
  const match = /^ms1\.([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.([A-Za-z0-9_-]{43})$/i.exec(value.trim())
  if (!match) return null
  return { conversationId: match[1], secret: match[2] }
}

export function guestConversationStorageKey(storeId: string) {
  return `marketspace-guest-conversations:${storeId}`
}
