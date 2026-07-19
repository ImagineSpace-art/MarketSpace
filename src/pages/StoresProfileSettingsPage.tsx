import { type ChangeEvent } from 'react'
import type { Listing, Profile, BusinessProfile } from '../types'
import { ListingCard } from '../components/ListingCard'
import { fileToBase64Compressed } from '../features/marketplace/FileToBase64'

// ---------------- STORES PAGE ----------------
type StoresPageProps = {
  stores: Profile[]
  allBusinesses: Record<string, BusinessProfile>
  onVisitShop: (shop: BusinessProfile) => void
  onOpenProfile: () => void
}

export function StoresPage({ stores, allBusinesses, onVisitShop, onOpenProfile }: StoresPageProps) {
  const activeShops = Object.values(allBusinesses)

  return (
    <section className="section-card">
      <div className="section-header">
        <div>
          <h2>Featured Sellers & Stores</h2>
        </div>
      </div>

      {activeShops.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <p className="eyebrow" style={{ color: '#2563eb' }}>Registered Stores</p>
          <div className="listing-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
            {activeShops.map((shop) => (
              <article key={shop.userId} className="listing-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {shop.logo ? (
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <img src={shop.logo} alt={shop.shopName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div className="brand-mark" style={{ width: '48px', height: '48px', borderRadius: '12px', fontSize: '1.2rem' }}>
                      {shop.shopName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{shop.shopName}</h3>
                    <span className="badge" style={{ marginTop: '2px', fontSize: '0.7rem' }}>{shop.category}</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', flexGrow: 1, margin: '8px 0', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {shop.description}
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-icons" style={{ fontSize: '14px' }}>location_on</span> {shop.address}
                </div>
                <button className="primary-btn compact-btn" style={{ marginTop: '8px' }} onClick={() => onVisitShop(shop)}>Visit Shop</button>
              </article>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="eyebrow">All MarketSpace Sellers</p>
        <div className="listing-grid">
          {stores.map((store) => (
            <article key={store.user_id} className="listing-card">
              <h3>{store.username || 'Store owner'}</h3>
              <p>{store.email || 'Contact available through profile'}</p>
              <button className="secondary-btn" onClick={onOpenProfile}>View profile</button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------- PROFILE PAGE ----------------
type ProfilePageProps = {
  profile: Profile | null
  userEmail: string
  myListings: Listing[]
  listings: Listing[]
  savedListings: Listing[]
  savedIds: string[]
  businessProfile: BusinessProfile | null
  onOpenSettings: () => void
  onCreateListing: () => void
  onEditListing: (listing: Listing) => void
  onRenewListing: (listingId: number) => void
  onDeleteListing: (listingId: number) => void
  onUpdateStatus: (listingId: number, status: string) => void
  onOpenStoreSetup: () => void
  onOpenStoreHub: () => void
  onUploadAvatar: (base64: string) => void
  onOpenListing: (listing: Listing) => void
  onToggleSave: (listingId: number) => void
  onLogout: () => void
}

export function ProfilePage({
  profile,
  userEmail,
  myListings,
  listings,
  savedListings,
  savedIds,
  businessProfile,
  onOpenSettings,
  onCreateListing,
  onEditListing,
  onRenewListing,
  onDeleteListing,
  onUpdateStatus,
  onOpenStoreSetup,
  onOpenStoreHub,
  onUploadAvatar,
  onOpenListing,
  onToggleSave,
  onLogout,
}: ProfilePageProps) {
  const displayName = profile?.username || 'Your profile'

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64Compressed(e.target.files[0], 200, 200)
        onUploadAvatar(base64)
      } catch (err) {
        console.error('Error uploading avatar:', err)
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <section className="section-card profile-card">
        <div className="profile-hero">
          <label style={{ position: 'relative', cursor: 'pointer' }}>
            <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={displayName} style={{ width: '72px', height: '72px', borderRadius: '22px', objectFit: 'cover', border: '1px solid var(--border)' }} />
            ) : (
              <div className="profile-avatar">{displayName.slice(0, 1).toUpperCase()}</div>
            )}
            <div style={{ position: 'absolute', bottom: -2, right: -2, background: 'rgba(15,23,42,0.7)', color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'grid', placeItems: 'center' }}>
              <span className="material-icons" style={{ fontSize: '12px' }}>photo_camera</span>
            </div>
          </label>
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
      </section>

      {/* BUSINESS OPT-IN CARD */}
      <section className="section-card" style={{
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(15, 118, 110, 0.08))',
        border: '1px dashed var(--border)'
      }}>
        {businessProfile ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-icons" style={{ fontSize: '20px', color: '#2563eb' }}>storefront</span> {businessProfile.shopName} <span className="badge" style={{ background: '#10b981', color: 'white' }}>Verified Store</span>
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Business tools, product catalogs, and advertising active.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="secondary-btn compact-btn" onClick={onOpenStoreSetup}>Edit Store Info</button>
              <button className="primary-btn compact-btn" onClick={onOpenStoreHub}>Manage Store (Hub)</button>
            </div>
          </div>
        ) : (
          <div>
            <h3 style={{ margin: 0 }}>Boost sales with an online shop here on MarketSpace!</h3>
            <p style={{ margin: '6px 0 12px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Open a shop on MarketSpace to unlock premium features: catalog managers, advertising, customer lead analytics, and a custom public store view.
            </p>
            <button className="primary-btn" onClick={onOpenStoreSetup}>Open Store</button>
          </div>
        )}
      </section>

      <section className="section-card">
        <div className="section-header">
          <div>
            <h3>Your listings</h3>
            <p className="subtitle">Manage the items you have posted.</p>
          </div>
          <button className="primary-btn" onClick={onCreateListing}>New listing</button>
        </div>

        <div className="marketplace-listing-grid" style={{ marginTop: '14px' }}>
          {myListings.length === 0 ? (
            <p>No listings yet. Create your first one.</p>
          ) : (
            myListings.map((listing) => (
              <div key={listing.id} className="profile-listing-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <ListingCard
                  listing={listing}
                  saved={savedIds.includes(String(listing.id))}
                  onOpen={onOpenListing}
                  onToggleSave={onToggleSave}
                  compact
                />
                <div className="listing-management-actions">
                  <button className="secondary-btn compact-btn" onClick={() => onEditListing(listing)}>Edit</button>
                  <button className="secondary-btn compact-btn" onClick={() => onRenewListing(listing.id)}>Renew</button>
                  <button className="secondary-btn compact-btn" onClick={() => onUpdateStatus(listing.id, listing.status === 'Sold' ? 'Available' : 'Sold')}>
                    {listing.status === 'Sold' ? 'In stock' : 'Mark sold'}
                  </button>
                  <button className="ghost-btn compact-btn delete-btn" onClick={() => onDeleteListing(listing.id)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}





