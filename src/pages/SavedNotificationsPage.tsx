import { ListingCard } from '../components/ListingCard'
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
          <h2>Your watchlist</h2>
        </div>
      </div>
      {savedListings.length === 0 ? <p>No saved items yet. Tap save on a listing to keep it here.</p> : (
        <div className="listing-grid">
          {savedListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} saved onOpen={onOpenListing} onToggleSave={onToggleSave} />
          ))}
        </div>
      )}
    </section>
  )
}

type NotificationsPageProps = {
  notifications: NotificationItem[]
  onMarkAllRead: () => void
}

export function NotificationsPage({ notifications, onMarkAllRead }: NotificationsPageProps) {
  const unreadCount = notifications.filter((item) => item.unread).length

  return (
    <section className="section-card notifications-page">
      <div className="section-header">
        <div>
          <p className="eyebrow">Notifications</p>
          <h2>Alerts and activity</h2>
          <p>{unreadCount} unread updates</p>
        </div>
        <button className="ghost-btn" onClick={onMarkAllRead}>Mark all read</button>
      </div>
      <div className="notification-summary">
        <div><strong>{notifications.length}</strong><span>Total</span></div>
        <div><strong>{unreadCount}</strong><span>Unread</span></div>
        <div><strong>{notifications.length - unreadCount}</strong><span>Read</span></div>
      </div>
      <div className="stack-list notification-list">
        {notifications.map((item) => (
          <div key={item.id} className={`stack-item notification-item ${item.unread ? 'unread' : ''}`}>
            <div>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </div>
            <div className="stack-meta">
              <span>{item.time}</span>
              {item.unread ? <span className="badge">New</span> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
