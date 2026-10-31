import { Listing as ListingView } from '../components/Listing'
import type { Listing } from '../types'
import type { NotificationItem } from '../features/marketplace/useMarketplaceApp'

type SavedItemsPageProps = {
  savedListings: Listing[]
  onOpenListing: (listing: Listing) => void
  onToggleSave: (listingId: number) => void
}

export function SavedItemsPage({ savedListings, onOpenListing, onToggleSave }: SavedItemsPageProps) {
  return (
    <section className="section-card">
      <div className="section-header">
        <div>
          <p className="eyebrow">Saved items</p>
          <h2>Your wishlist</h2>
        </div>
      </div>
      {savedListings.length === 0 ? <p>No saved items yet. Tap save on a listing to keep it here.</p> : (
        <div className="listing-grid">
          {savedListings.map((listing) => (
            <ListingView key={listing.id} listing={listing} saved onOpen={onOpenListing} onToggleSave={onToggleSave} />
          ))}
        </div>
      )}
    </section>
  )
}

type NotificationsPageProps = {
  notifications: NotificationItem[]
  onMarkAllRead: () => void
  onMarkRead: (notificationId: string | number, unread: boolean) => void
  onTogglePin: (notificationId: string | number) => void
  onDelete: (notificationId: string | number) => void
}

export function NotificationsPage({ notifications, onMarkAllRead, onMarkRead, onTogglePin, onDelete }: NotificationsPageProps) {
  const unreadCount = notifications.filter((item) => item.unread).length
  const sortedNotifications = [...notifications].sort((a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)))

  return (
    <section className="section-card notifications-page">
      <div className="section-header">
        <div>
          <p className="eyebrow">Notifications</p>
          <h2>Alerts and activity</h2>
          <p>{unreadCount} unread updates</p>
        </div>
        <button className="ghost-btn notification-bulk-action" type="button" onClick={onMarkAllRead}>
          <span className="material-icons" aria-hidden="true">done_all</span>
          <span>Mark all read</span>
        </button>
      </div>
      <div className="notification-summary">
        <div><strong>{notifications.length}</strong><span>Total</span></div>
        <div><strong>{unreadCount}</strong><span>Unread</span></div>
        <div><strong>{notifications.length - unreadCount}</strong><span>Read</span></div>
      </div>
      <div className="stack-list notification-list">
        {sortedNotifications.length === 0 ? (
          <p className="notifications-empty-state">No notifications to display.</p>
        ) : sortedNotifications.map((item) => (
          <article key={item.id} className={`stack-item notification-item ${item.unread ? 'unread' : ''}`}>
            <div className="notification-content">
              <div className="notification-title-line">
                <strong>{item.title}</strong>
                {item.isPinned && <span className="material-icons notification-pinned-icon" aria-label="Pinned">push_pin</span>}
                {item.unread && <span className="badge">New</span>}
              </div>
              <p>{item.body}</p>
              {item.link_url && <a className="notification-link" href={item.link_url}>Open related page</a>}
            </div>
            <div className="notification-controls">
              <time>{item.time}</time>
              <div className="notification-action-buttons">
                <button
                  className="notification-action-btn"
                  type="button"
                  aria-label={item.unread ? 'Mark notification as read' : 'Mark notification as unread'}
                  title={item.unread ? 'Mark as read' : 'Mark as unread'}
                  onClick={() => onMarkRead(item.id, !item.unread)}
                >
                  <span className="material-icons" aria-hidden="true">{item.unread ? 'mark_email_read' : 'mark_email_unread'}</span>
                </button>
                <button
                  className="notification-action-btn"
                  type="button"
                  aria-label={item.isPinned ? 'Unpin notification' : 'Pin notification'}
                  title={item.isPinned ? 'Unpin notification' : 'Pin notification'}
                  onClick={() => onTogglePin(item.id)}
                >
                  <span className="material-icons" aria-hidden="true">{item.isPinned ? 'push_pin' : 'pin_invoke'}</span>
                </button>
                <button
                  className="notification-action-btn delete-notification-btn"
                  type="button"
                  aria-label={item.isPinned ? 'Unpin this notification before deleting' : 'Delete notification'}
                  title={item.isPinned ? 'Unpin before deleting' : 'Delete notification'}
                  disabled={Boolean(item.isPinned)}
                  onClick={() => onDelete(item.id)}
                >
                  <span className="material-icons" aria-hidden="true">delete_outline</span>
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
