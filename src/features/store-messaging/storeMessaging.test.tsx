import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { GuestStoreMessaging } from './GuestStoreMessaging'
import { MessageContent } from '../../pages/MessagesPage'
import { getGuestMessagePreview, normalizeGuestMessageContent } from './guestMessageContent'

vi.mock('../../lib/supabaseClient', () => ({
  supabase: { rpc: vi.fn() },
}))

describe('guest store messaging', () => {
  it('lets a guest start an inquiry without a MarketSpace account', () => {
    const markup = renderToStaticMarkup(
      <GuestStoreMessaging
        isOpen
        storeId="store-1"
        storeName="Test store"
        onClose={() => undefined}
      />,
    )

    expect(markup).toContain('No MarketSpace account is needed.')
    expect(markup).toContain('Messages')
    expect(markup).toContain('Your chats')
    expect(markup).toContain('Your name')
    expect(markup).toContain('Email or phone number')
    expect(markup).toContain('Send inquiry')
    expect(markup).toContain('Have a recovery code?')
  })

  it('opens the saved-chat inbox when requested', () => {
    const markup = renderToStaticMarkup(
      <GuestStoreMessaging
        isOpen
        storeId="store-1"
        storeName="Test store"
        initialView="inbox"
        onClose={() => undefined}
      />,
    )

    expect(markup).toContain('No saved chats yet.')
    expect(markup).toContain('Resume chat')
    expect(markup).not.toContain('Your name')
  })

  it('renders inquiry messages with the Marketplace listing card', () => {
    const markup = renderToStaticMarkup(<MessageContent content={`[INQUIRY_CARD]${JSON.stringify({
      listingId: 13,
      title: 'HP 1030g2 Elitebook',
      price: 8000,
      quantity: 1,
      phone: '0777999888',
      message: 'Is this available?',
    })}`} />)

    expect(markup).toContain('Listing Inquiry')
    expect(markup).toContain('HP 1030g2 Elitebook')
    expect(markup).toContain('ZMW 8,000')
    expect(markup).toContain('Is this available?')
  })

  it('renders older plain-text listing inquiries as Marketplace cards', () => {
    const legacy = 'Inquiry about HP 1030g2 Elitebook (ZMW 8,000).\nQuantity: 1.\nPhone: 0777999888.\nIs this available?'
    const content = normalizeGuestMessageContent(legacy, 13)
    const markup = renderToStaticMarkup(<MessageContent content={content} />)

    expect(content).toContain('[INQUIRY_CARD]')
    expect(getGuestMessagePreview(legacy)).toBe('Inquiry about HP 1030g2 Elitebook')
    expect(markup).toContain('Listing Inquiry')
    expect(markup).toContain('HP 1030g2 Elitebook')
    expect(markup).toContain('0777999888')
    expect(markup).toContain('Is this available?')
  })

  it('does not render a messaging dialog while closed', () => {
    const markup = renderToStaticMarkup(
      <GuestStoreMessaging
        isOpen={false}
        storeId="store-1"
        storeName="Test store"
        onClose={() => undefined}
      />,
    )

    expect(markup).toBe('')
  })
})
