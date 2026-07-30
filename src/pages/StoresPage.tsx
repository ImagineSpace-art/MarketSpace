import { useState, useEffect } from 'react'
import type { Profile, BusinessProfile, Listing } from '../types'

// ---------------- STORES PAGE ----------------
type StoresPageProps = {
  stores: Profile[]
  allBusinesses: Record<string, BusinessProfile>
  onVisitShop: (shop: BusinessProfile) => void
  onOpenProfile: (userId: string) => void
  listingKindFilter: 'all' | 'item' | 'service'
  listings: Listing[]
}

export function StoresPage({ stores, allBusinesses, onVisitShop, onOpenProfile, listingKindFilter, listings }: StoresPageProps) {
  const activeShops = Object.values(allBusinesses)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    '/banners/store_banner_grocery.png',
    '/banners/store_banner_apparel.png',
    '/banners/store_banner_electronics.png'
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [slides.length])

  // Filter listings and stores based on search query and listing kind filter
  const filteredShops = activeShops.filter((shop) => {
    const matchesSearch = shop.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.address.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    if (listingKindFilter === 'service') {
      const hasServiceListings = listings.some((l) => l.user_id === shop.userId && l.listing_type === 'service')
      const isServiceCategory = shop.category.toLowerCase().includes('service') || shop.category.toLowerCase().includes('professional')
      return isServiceCategory || hasServiceListings
    } else if (listingKindFilter === 'item') {
      const hasItemListings = listings.some((l) => l.user_id === shop.userId && l.listing_type !== 'service')
      const isServiceCategory = shop.category.toLowerCase().includes('service') || shop.category.toLowerCase().includes('professional')
      return !isServiceCategory || hasItemListings
    }

    return true
  })

  const filteredStores = stores.filter((store) => {
    // Only identify as seller if they have at least one listing
    const hasListings = listings.some((l) => l.user_id === store.user_id)
    if (!hasListings) return false

    const matchesSearch = (store.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (store.email || '').toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    if (listingKindFilter === 'service') {
      return listings.some((l) => l.user_id === store.user_id && l.listing_type === 'service')
    } else if (listingKindFilter === 'item') {
      return listings.some((l) => l.user_id === store.user_id && l.listing_type !== 'service')
    }

    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Carousel Banner Slider */}
      <section className="hero-slider-section" style={{ position: 'relative', overflow: 'hidden', height: '280px', borderRadius: '12px', border: '1px solid var(--border)' }}>
        {slides.map((slide, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url(${slide})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: idx === currentSlide ? 1 : 0,
              transition: 'opacity 1s ease-in-out',
            }}
          />
        ))}
        {/* Dark Tint Overlay */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.45)' }} />

        {/* Small Search Bar overlay */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '420px',
          zIndex: 10,
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.5)', marginBottom: '16px', fontSize: '1.6rem', fontWeight: 700, fontFamily: 'sans-serif' }}>
            Find Local Stores on MarketSpace
          </h2>
          <div style={{ position: 'relative' }}>
            <span className="material-icons" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}>search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stores, categories, and locations..."
              style={{
                width: '100%',
                padding: '12px 16px 12px 48px',
                borderRadius: '24px',
                border: 'none',
                background: 'var(--surface, #ffffff)',
                color: 'var(--text, #1c1e21)',
                fontSize: '0.95rem',
                outline: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
            />
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="section-card" style={{ padding: '24px' }}>
        {filteredShops.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <p className="eyebrow" style={{ color: '#2563eb' }}>Registered Stores</p>
            <div className="listing-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {filteredShops.map((shop) => (
                <article
                  key={shop.userId}
                  className="listing-card"
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    padding: '16px',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: 'var(--surface)'
                  }}
                >
                  {/* Gradual Fade Store Cover Picture on the right */}
                  {shop.cover && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '60%',
                        height: '100%',
                        backgroundImage: `url(${shop.cover})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        zIndex: 1,
                        pointerEvents: 'none'
                      }}
                    >
                      {/* CSS Gradient Fade to the left */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(to right, var(--surface) 15%, rgba(0,0,0,0) 100%)'
                        }}
                      />
                    </div>
                  )}

                  <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {shop.logo ? (
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
                        <img src={shop.logo} alt={shop.shopName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <div className="brand-mark" style={{ width: '48px', height: '48px', borderRadius: '12px', fontSize: '1.2rem', flexShrink: 0 }}>
                        {shop.shopName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text)' }}>{shop.shopName}</h3>
                      <span className="badge" style={{ marginTop: '2px', fontSize: '0.7rem' }}>{shop.category}</span>
                    </div>
                  </div>
                  <p style={{ position: 'relative', zIndex: 2, fontSize: '0.86rem', color: 'var(--text-secondary)', flexGrow: 1, margin: '8px 0', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', maxWidth: '75%' }}>
                    {shop.description}
                  </p>
                  <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="material-icons" style={{ fontSize: '14px' }}>location_on</span> {shop.address}
                    </div>
                    <button className="primary-btn compact-btn" onClick={() => onVisitShop(shop)}>Visit Shop</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="eyebrow">All MarketSpace Sellers</p>
          {filteredStores.length === 0 && filteredShops.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No stores match your search query.</p>
          ) : (
            <div className="listing-grid">
              {filteredStores.map((store) => (
                <article key={store.user_id} className="listing-card">
                  <h3 style={{ color: 'var(--text)' }}>{store.username || 'Store owner'}</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>{store.email || 'Contact available through profile'}</p>
                  <button className="secondary-btn" onClick={() => onOpenProfile(store.user_id || '')}>View profile</button>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
