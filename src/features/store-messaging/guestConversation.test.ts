import { describe, expect, it } from 'vitest'
import {
  createGuestResumeSecret,
  formatGuestResumeCode,
  guestConversationStorageKey,
  parseGuestResumeCode,
} from './guestConversation'

describe('guest conversation resume codes', () => {
  it('creates a high-entropy secret and round-trips the scoped resume code', () => {
    const secret = createGuestResumeSecret()
    const credentials = {
      conversationId: '4b9d1c48-6a11-48ca-8467-31940afcad12',
      secret,
    }

    expect(secret).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(parseGuestResumeCode(formatGuestResumeCode(credentials))).toEqual(credentials)
  })

  it('rejects malformed or incomplete codes', () => {
    expect(parseGuestResumeCode('ms1.not-a-uuid.secret')).toBeNull()
    expect(parseGuestResumeCode('')).toBeNull()
  })

  it('namespaces saved credentials by store', () => {
    expect(guestConversationStorageKey('store-a')).not.toBe(guestConversationStorageKey('store-b'))
  })
})
