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
  const searchQuery = ''
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', boxSizing: 'border-box' }}>
      {/* Sliding Store Hero Banner */}
      <div style={{
        position: 'sticky',
        top: '105px',
        marginLeft: 'calc(-50vw + 50%)',
        marginRight: 'calc(-50vw + 50%)',
        overflow: 'hidden',
        height: '400px',
        marginTop: '-24px',
        boxSizing: 'border-box'
      }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '220px', background: 'linear-gradient(to bottom, transparent 0%, rgba(11, 15, 23, 0.4) 40%, var(--bg) 100%)', pointerEvents: 'none', zIndex: 4 }} />
        <div
          style={{
            display: 'flex',
            width: `${slides.length * 100}%`,
            transform: `translateX(-${(currentSlide * 100) / slides.length}%)`,
            transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
            height: '100%'
          }}
        >
          {slides.map((slide, idx) => (
            <div
              key={idx}
              style={{
                width: `${100 / slides.length}%`,
                position: 'relative',
                height: '100%',
                backgroundImage: `url(${slide})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                padding: '0 40px',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.55)' }} />
              <div style={{ position: 'relative', zIndex: 5, color: '#ffffff' }}>
                <span style={{ display: 'inline-block', padding: '4px 12px', backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                  Zambian Merchant Stores
                </span>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                  Discover Verified Shops & Local Businesses
                </h2>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="section-card"
        style={{
          position: 'relative',
          zIndex: 10,
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          marginTop: '-100px',
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)',
          padding: '20px',
          display: 'flex',
          overflow: 'hidden',
          flexDirection: 'column',
          gap: '36px',
          backgroundColor: 'var(--bg, #ffffff)',
          //background: 'linear-gradient(to bottom, transparent 0%, var(--bg) 10%)'
        }}>
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
      </div>
    </div>
  )
}
