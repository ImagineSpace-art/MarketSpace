import { useState, useEffect } from 'react'
import type { Profile, BusinessProfile, Listing } from '../types'
import { ListingCard } from '../components/ListingCard'

// ---------------- STORES & STORE LISTINGS PAGE ----------------
type StoresPageProps = {
  stores: Profile[]
  allBusinesses: Record<string, BusinessProfile>
  onVisitShop: (shop: BusinessProfile) => void
  onOpenProfile: (userId: string) => void
  listingKindFilter: 'all' | 'item' | 'service'
  listings: Listing[]
  openListing?: (listing: Listing) => void
  toggleSave?: (id: number) => void
  savedIds?: string[]
}

export function StoresPage({
  stores: _stores,
  allBusinesses,
  onVisitShop,
  onOpenProfile: _onOpenProfile,
  listingKindFilter,
  listings,
  openListing = () => {},
  toggleSave = () => {},
  savedIds = []
}: StoresPageProps) {
  const activeShops = Object.values(allBusinesses || {}).filter(b => Boolean(b && b.shopName))
  const [searchQuery, setSearchQuery] = useState('')
  const [currentSlide, setCurrentSlide] = useState(0)
  const [viewMode, setViewMode] = useState<'listings' | 'shops'>('listings')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

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

  // Filter listings to only items that belong to verified registered stores
  const storeOnlyListings = listings.filter((l) => {
    const isStoreOwner = Boolean(l.user_id && allBusinesses[l.user_id]?.shopName)
    if (!isStoreOwner) return false

    if (selectedCategory !== 'All' && l.category !== selectedCategory) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const titleMatch = l.title.toLowerCase().includes(q)
      const catMatch = (l.category || '').toLowerCase().includes(q)
      const storeName = allBusinesses[l.user_id!]?.shopName.toLowerCase() || ''
      const storeMatch = storeName.includes(q)
      if (!titleMatch && !catMatch && !storeMatch) return false
    }

    if (listingKindFilter === 'service') {
      return l.listing_type === 'service'
    } else if (listingKindFilter === 'item') {
      return l.listing_type !== 'service'
    }

    return true
  })

  // Filter storefronts based on search query
  const filteredShops = activeShops.filter((shop) => {
    const matchesSearch = shop.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (shop.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (shop.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (shop.address || '').toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    if (listingKindFilter === 'service') {
      const hasServiceListings = listings.some((l) => l.user_id === shop.userId && l.listing_type === 'service')
      const isServiceCategory = (shop.category || '').toLowerCase().includes('service') || (shop.category || '').toLowerCase().includes('professional')
      return isServiceCategory || hasServiceListings
    } else if (listingKindFilter === 'item') {
      const hasItemListings = listings.some((l) => l.user_id === shop.userId && l.listing_type !== 'service')
      const isServiceCategory = (shop.category || '').toLowerCase().includes('service') || (shop.category || '').toLowerCase().includes('professional')
      return !isServiceCategory || hasItemListings
    }

    return true
  })

  const categories = ['All', 'Electronics', 'Fashion', 'Home & Garden', 'Vehicles', 'Sports', 'Services']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', boxSizing: 'border-box' }}>
      {/* Sliding Store Hero Banner */}
      <div style={{
        position: 'sticky',
        top: '70px',
        marginLeft: 'calc(-50vw + 50%)',
        marginRight: 'calc(-50vw + 50%)',
        overflow: 'hidden',
        height: '380px',
        marginTop: '-24px',
        boxSizing: 'border-box',
        zIndex: 1
      }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '180px', background: 'linear-gradient(to bottom, transparent 0%, rgba(11, 15, 23, 0.6) 40%, var(--bg) 100%)', pointerEvents: 'none', zIndex: 4 }} />
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
                padding: '0 max(28px, calc((100vw - 1280px) / 2))',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.88) 0%, rgba(15, 23, 42, 0.5) 60%, rgba(15, 23, 42, 0.15) 100%)' }} />
              <div style={{ position: 'relative', zIndex: 5, color: '#ffffff', maxWidth: '640px' }}>
                <span style={{ display: 'inline-block', padding: '6px 14px', backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '16px', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                  Official Stores & Catalog
                </span>
                <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 900, margin: '0 0 10px 0', lineHeight: 1.2, textShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>
                  Verified Merchant Stores & Catalogs
                </h1>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                  Browse goods offered exclusively by registered businesses and explore their custom storefronts.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className="section-card"
        style={{
          position: 'relative',
          zIndex: 10,
          borderTopLeftRadius: '28px',
          borderTopRightRadius: '28px',
          marginTop: '-100px',
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)',
          padding: '28px 24px',
          display: 'flex',
          overflow: 'hidden',
          flexDirection: 'column',
          gap: '32px',
          backgroundColor: 'var(--bg, #ffffff)',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Header Controls: Switcher + Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', paddingBottom: '18px', borderBottom: '1px solid var(--border)' }}>
            
            {/* View Switcher: Store Listings vs Storefronts Directory */}
            <div style={{ display: 'flex', gap: '4px', background: 'var(--panel)', padding: '4px', borderRadius: '24px', border: '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={() => setViewMode('listings')}
                style={{
                  padding: '8px 18px',
                  borderRadius: '20px',
                  border: 'none',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: viewMode === 'listings' ? '#2563eb' : 'transparent',
                  color: viewMode === 'listings' ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                <span className="material-icons" style={{ fontSize: '16px' }}>inventory_2</span>
                <span>Store Listings ({storeOnlyListings.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('shops')}
                style={{
                  padding: '8px 18px',
                  borderRadius: '20px',
                  border: 'none',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: viewMode === 'shops' ? '#2563eb' : 'transparent',
                  color: viewMode === 'shops' ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                <span className="material-icons" style={{ fontSize: '16px' }}>storefront</span>
                <span>Merchant Directory ({filteredShops.length})</span>
              </button>
            </div>

            {/* Filter Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '24px', padding: '6px 14px', width: '280px', maxWidth: '100%' }}>
              <span className="material-icons" style={{ fontSize: '18px', color: 'var(--text-muted)', marginRight: '6px' }}>search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={viewMode === 'listings' ? 'Search store products...' : 'Search stores by name or type...'}
                style={{ border: 'none', outline: 'none', background: 'transparent', color: 'var(--text)', fontSize: '0.86rem', width: '100%' }}
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', display: 'flex' }}>
                  <span className="material-icons" style={{ fontSize: '16px' }}>close</span>
                </button>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* VIEW MODE 1: DEDICATED STORE LISTINGS FEED                                */}
          {/* ========================================================================= */}
          {viewMode === 'listings' && (
            <div>
              {/* Category Pills Bar */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '20px', WebkitOverflowScrolling: 'touch' }}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '16px',
                      border: selectedCategory === cat ? '1px solid #2563eb' : '1px solid var(--border)',
                      background: selectedCategory === cat ? 'rgba(37,99,235,0.12)' : 'var(--panel)',
                      color: selectedCategory === cat ? '#2563eb' : 'var(--text)',
                      fontWeight: selectedCategory === cat ? 700 : 500,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {storeOnlyListings.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--panel)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <span className="material-icons" style={{ fontSize: '48px', color: '#2563eb', opacity: 0.8 }}>storefront</span>
                  <h3 style={{ margin: '12px 0 6px', fontSize: '1.2rem', fontWeight: 800 }}>No Store Listings Found</h3>
                  <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    {searchQuery ? `No products match "${searchQuery}" in our verified stores.` : 'No store products in this category yet.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => { setSelectedCategory('All'); setSearchQuery('') }}
                    className="primary-btn compact-btn"
                  >
                    Reset Filter
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                  {storeOnlyListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      saved={savedIds.includes(String(listing.id))}
                      onOpen={openListing}
                      onToggleSave={toggleSave}
                      allBusinesses={allBusinesses}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW MODE 2: REGISTERED STOREFRONTS DIRECTORY                             */}
          {/* ========================================================================= */}
          {viewMode === 'shops' && (
            <div>
              {filteredShops.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--panel)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <span className="material-icons" style={{ fontSize: '48px', color: 'var(--text-muted)' }}>search_off</span>
                  <h3 style={{ margin: '12px 0 6px', fontSize: '1.2rem', fontWeight: 800 }}>No Stores Match Your Search</h3>
                  <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Try clearing the search query to view all merchant shops.</p>
                  <button type="button" onClick={() => setSearchQuery('')} className="primary-btn compact-btn">Clear Search</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                  {filteredShops.map((shop) => {
                    const shopListingsCount = listings.filter(l => l.user_id === shop.userId).length
                    return (
                      <article
                        key={shop.userId}
                        style={{
                          borderRadius: '16px',
                          border: '1px solid var(--border)',
                          background: 'var(--panel)',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
                        }}
                      >
                        {/* Cover Image */}
                        <div style={{
                          height: '110px',
                          position: 'relative',
                          backgroundColor: '#1e293b',
                          backgroundImage: shop.cover ? `url(${shop.cover})` : 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}>
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.6))' }} />
                          <span style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: 'rgba(0,0,0,0.65)',
                            color: '#ffffff',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '12px',
                            backdropFilter: 'blur(6px)'
                          }}>
                            {shop.category || 'Retail Store'}
                          </span>
                        </div>

                        {/* Store Body */}
                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '-36px', position: 'relative', zIndex: 2 }}>
                            {shop.logo ? (
                              <img
                                src={shop.logo}
                                alt={shop.shopName}
                                style={{ width: '56px', height: '56px', borderRadius: '14px', objectFit: 'cover', border: '3px solid var(--panel)', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', backgroundColor: '#fff' }}
                              />
                            ) : (
                              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: '1.3rem', border: '3px solid var(--panel)', boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                                {shop.shopName.slice(0, 1).toUpperCase()}
                              </div>
                            )}
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <strong style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {shop.shopName}
                                </strong>
                                <span className="material-icons" style={{ fontSize: '16px', color: '#2563eb' }} title="Verified Store">verified</span>
                              </div>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {shopListingsCount} product{shopListingsCount !== 1 ? 's' : ''} in catalog
                              </span>
                            </div>
                          </div>

                          {shop.description && (
                            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {shop.description}
                            </p>
                          )}

                          <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span className="material-icons" style={{ fontSize: '14px' }}>location_on</span>
                              <span>{shop.address || 'Zambia'}</span>
                            </div>
                            <button
                              type="button"
                              className="primary-btn compact-btn"
                              onClick={() => onVisitShop(shop)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <span>Visit Storefront</span>
                              <span className="material-icons" style={{ fontSize: '14px' }}>arrow_forward</span>
                            </button>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
