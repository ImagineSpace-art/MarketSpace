import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { SettingsNavigationDrawer } from './SettingsNavigation'

const renderDrawer = (unreadNotificationCount: number) => renderToStaticMarkup(
  <MemoryRouter>
    <SettingsNavigationDrawer
      isOpen
      onClose={() => undefined}
      onLogout={() => undefined}
      unreadNotificationCount={unreadNotificationCount}
    />
  </MemoryRouter>,
)

describe('settings navigation notification badge', () => {
  it('shows the unread count only when notifications are unread', () => {
    const markupWithUnread = renderDrawer(3)

    expect(markupWithUnread).toContain('notification-count-badge profile-menu-notification-count')
    expect(markupWithUnread).toContain('aria-label="Notifications, 3 unread notifications"')
    expect(markupWithUnread).toContain('>3</span>')
    expect(renderDrawer(0)).not.toContain('notification-count-badge')
  })
})
