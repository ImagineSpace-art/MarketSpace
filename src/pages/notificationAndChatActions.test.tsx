import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { MessagesPage } from './MessagesPage'
import { NotificationsPage } from './SavedNotificationsPage'
import type { ChatThread, NotificationItem } from '../features/marketplace/useMarketplaceApp'

const notificationActions = {
  onMarkAllRead: vi.fn(),
  onMarkRead: vi.fn(),
  onTogglePin: vi.fn(),
  onDelete: vi.fn(),
}

const chatActions = {
  onSelectThread: vi.fn(),
  onToggleMute: vi.fn(),
  onDraftChange: vi.fn(),
  onSendMessage: vi.fn(),
  onTogglePinChat: vi.fn(),
  onToggleFavoriteChat: vi.fn(),
  onToggleArchiveChat: vi.fn(),
  onDeleteChat: vi.fn(),
  onToggleUnreadChat: vi.fn(),
}

const notification: NotificationItem = {
  id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  user_id: 'user-1',
  title: 'Test alert',
  body: 'Notification controls test fixture.',
  time: 'Just now',
  unread: true,
}

const thread: ChatThread = {
  id: 17,
  title: 'Test listing',
  participant: 'Test seller',
  listingTitle: 'Test listing',
  unread: true,
  messages: [],
}

describe('notification and chat actions', () => {
  it('renders no seeded notifications when the database has none', () => {
    const markup = renderToStaticMarkup(
      <NotificationsPage notifications={[]} {...notificationActions} />,
    )

    expect(markup).toContain('No notifications to display.')
    expect(markup).not.toContain('Welcome to MarketSpace')
    expect(markup).not.toContain('System Currency Update')
  })

  it('renders icon buttons and prevents deletion of a pinned notification', () => {
    const markup = renderToStaticMarkup(
      <NotificationsPage
        notifications={[{ ...notification, isPinned: true }]}
        {...notificationActions}
      />,
    )

    expect(markup).toContain('mark_email_read')
    expect(markup).toContain('push_pin')
    expect(markup).toContain('delete_outline')
    expect(markup).toContain('aria-label="Mark notification as read"')
    expect(markup).toContain('aria-label="Unpin notification"')
    expect(markup).toContain('disabled=""')
    expect(markup).toContain('Unpin this notification before deleting')
  })

  it('orders pinned notifications before unpinned notifications', () => {
    const markup = renderToStaticMarkup(
      <NotificationsPage
        notifications={[
          { ...notification, id: 'later', title: 'Unpinned alert', isPinned: false },
          { ...notification, id: 'first', title: 'Pinned alert', isPinned: true },
        ]}
        {...notificationActions}
      />,
    )

    expect(markup.indexOf('Pinned alert')).toBeLessThan(markup.indexOf('Unpinned alert'))
    expect(markup).toContain('aria-label="Mark notification as read"')
    expect(markup).toContain('aria-label="Unpin notification"')
    expect(markup).toContain('aria-label="Delete notification"')
  })

  it('renders every inbox action and blocks deleting a pinned chat', () => {
    const markup = renderToStaticMarkup(
      <MessagesPage
        chatThreads={[{ ...thread, isPinned: true, isFavorite: true, isArchived: false }]}
        activeChatId={null}
        canMessage
        chatDraft=""
        {...chatActions}
      />,
    )

    expect(markup).toContain('mark_email_read')
    expect(markup).toContain('push_pin')
    expect(markup).toContain('star')
    expect(markup).toContain('archive')
    expect(markup).toContain('delete_outline')
    expect(markup).toContain('aria-label="Mark chat as read"')
    expect(markup).toContain('aria-label="Unpin chat"')
    expect(markup).toContain('aria-label="Remove chat from favorites"')
    expect(markup).toContain('aria-label="Archive chat"')
    expect(markup).toContain('disabled=""')
    expect(markup).toContain('Unpin chat before deleting')
  })
})
