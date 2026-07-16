import type { Listing, Profile } from '../types'

type StoresPageProps = {
  stores: Profile[]
  onOpenProfile: () => void
}

export function StoresPage({ stores, onOpenProfile }: StoresPageProps) {
  return (
    <section className="section-card">
      <div className="section-header">
        <div>
          <p className="eyebrow">Stores</p>
          <h2>Featured sellers</h2>
        </div>
      </div>
      <div className="listing-grid">
        {stores.map((store) => (
          <article key={store.user_id} className="listing-card">
            <h3>{store.username || 'Store owner'}</h3>
            <p>{store.email || 'Contact available through profile'}</p>
            <button className="secondary-btn" onClick={onOpenProfile}>View profile</button>
          </article>
        ))}
      </div>
    </section>
  )
}

type ProfilePageProps = {
  profile: Profile | null
  userEmail: string
  myListings: Listing[]
  listings: Listing[]
  savedListings: Listing[]
  onOpenSettings: () => void
  onCreateListing: () => void
  onEditListing: (listing: Listing) => void
  onLogout: () => void
}

export function ProfilePage({ profile, userEmail, myListings, listings, savedListings, onOpenSettings, onCreateListing, onEditListing, onLogout }: ProfilePageProps) {
  const displayName = profile?.username || 'Your profile'

  return (
    <section className="section-card profile-card">
      <div className="profile-hero">
        <div className="profile-avatar">{displayName.slice(0, 1).toUpperCase()}</div>
        <div className="profile-identity">
          <p className="eyebrow">Profile</p>
          <h2>{displayName}</h2>
          <p>{userEmail}</p>
        </div>
        <div className="profile-actions">
          <button className="secondary-btn" onClick={onOpenSettings}>Account settings</button>
          <button className="ghost-btn" onClick={onLogout}>Log out</button>
        </div>
      </div>
      <div className="profile-stats">
        <div><strong>{myListings.length}</strong><span>My listings</span></div>
        <div><strong>{listings.length}</strong><span>Marketplace listings</span></div>
        <div><strong>{savedListings.length}</strong><span>Saved</span></div>
      </div>
      <div className="section-header">
        <div>
          <h3>Your listings</h3>
          <p className="subtitle">Manage the items you have posted.</p>
        </div>
        <button className="primary-btn" onClick={onCreateListing}>New listing</button>
      </div>
      <div className="profile-listings">
        {myListings.length === 0 ? <p>No listings yet. Create your first one.</p> : myListings.map((listing) => (
          <div key={listing.id} className="mini-card">
            <strong>{listing.title}</strong>
            <span>{listing.price}</span>
            <button className="ghost-btn" onClick={() => onEditListing(listing)}>Edit</button>
          </div>
        ))}
      </div>
    </section>
  )
}

type SettingsPageProps = {
  theme: 'light' | 'dark'
  location: string
  onToggleTheme: () => void
  onGoHome: () => void
}

export function SettingsPage({ theme, location, onToggleTheme, onGoHome }: SettingsPageProps) {
  return (
    <section className="section-card settings-card">
      <div className="section-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h2>Control the experience</h2>
        </div>
      </div>
      <div className="setting-row">
        <div>
          <h3>Theme</h3>
          <p>Switch between light and dark mode.</p>
        </div>
        <button className="secondary-btn" onClick={onToggleTheme}>
          {theme === 'light' ? 'Dark mode' : 'Light mode'}
        </button>
      </div>
      <div className="setting-row">
        <div>
          <h3>Location</h3>
          <p>Currently browsing around {location}.</p>
        </div>
        <button className="secondary-btn" onClick={onGoHome}>Update</button>
      </div>
    </section>
  )
}
