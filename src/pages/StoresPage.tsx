import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { BusinessProfile, Listing } from '../types'
import { STORE_MARKET_LOCATIONS, groupStoreLocation } from '../features/marketplace/storeLocations'

// ---------------- STORES & STORE LISTINGS PAGE ----------------
type StoresPageProps = {
  allBusinesses: Record<string, BusinessProfile>
  onVisitShop: (shop: BusinessProfile) => void
  listingKindFilter: 'all' | 'item' | 'service'
  listings: Listing[]
  searchQuery: string
  onSearchQueryChange: (query: string) => void
}

export function StoresPage({
  allBusinesses,
  onVisitShop,
  listingKindFilter,
  listings,
  searchQuery,
  onSearchQueryChange,
}: StoresPageProps) {
  const activeShops = Object.values(allBusinesses || {}).filter(b => Boolean(b && b.shopName))
  const [currentSlide, setCurrentSlide] = useState(0)
  const [selectedStoreCategory, setSelectedStoreCategory] = useState('All')
  const [selectedLocation, setSelectedLocation] = useState('All')
  const normalizedSearchQuery = searchQuery.trim().toLowerCase()

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

  // Filter storefronts based on search query
  const filteredShops = activeShops.filter((shop) => {
    const matchesSearch = shop.shopName.toLowerCase().includes(normalizedSearchQuery) ||
      (shop.description || '').toLowerCase().includes(normalizedSearchQuery) ||
      (shop.category || '').toLowerCase().includes(normalizedSearchQuery) ||
      (shop.address || '').toLowerCase().includes(normalizedSearchQuery)

    if (!matchesSearch) return false
    const shopLocation = groupStoreLocation(shop.address, shop.locationName)
    if (selectedLocation !== 'All' && shopLocation !== selectedLocation) return false
    if (selectedStoreCategory !== 'All' && shop.category !== selectedStoreCategory) return false

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
  }).sort((a, b) => groupStoreLocation(a.address, a.locationName).localeCompare(groupStoreLocation(b.address, b.locationName)))

  const storeCategories = [
    { name: 'Electronics', image: slides[2], description: 'Tech and accessories' },
    { name: 'Home & Garden', image: '/illustrations/cat_homedecor.jpg', description: 'Make yourself at home' },
    { name: 'Fashion', image: slides[1], description: 'Style from local boutiques' },
    { name: 'Sports', image: '/illustrations/banner_summer_collection.jpg', description: 'Gear for active days' },
  ]

  const scrollToCatalog = () => {
    document.getElementById('stores-catalog')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div
      className="stores-page-wrapper"
      style={{
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: 'inherit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <section
        style={{
          maxWidth: '1280px',
          margin: '24px auto 48px',
          padding: '0 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '40px',
          alignItems: 'center',
        }}
      >
        <div>
          <span style={{ display: 'inline-block', color: '#ea580c', fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Shop Local, Shop Verified
          </span>
          <h1 style={{ fontSize: 'clamp(2.4rem, 4.8vw, 3.8rem)', fontWeight: 900, lineHeight: 1.12, letterSpacing: '-0.03em', margin: '0 0 16px', color: '#0f172a' }}>
            Discover Stores You’ll Love
          </h1>
          <p style={{ fontSize: '1rem', lineHeight: 1.6, color: '#64748b', margin: '0 0 28px', maxWidth: '480px' }}>
            Explore Zambia’s independent businesses, browse their latest products, and shop directly from verified local merchants.
          </p>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '32px' }}>
            <button
              type="button"
              onClick={() => { setSelectedStoreCategory('All'); scrollToCatalog() }}
              style={{ backgroundColor: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '999px', padding: '13px 26px', fontSize: '0.94rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              Explore Stores
              <span className="material-icons" style={{ fontSize: '18px' }}>arrow_forward</span>
            </button>
            <Link
              to="/browse#browse-store-listings"
              style={{ backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '999px', padding: '12px 24px', fontSize: '0.94rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Shop Store Products
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '0.84rem', fontWeight: 600 }}>
            <span className="material-icons" style={{ color: '#2563eb', fontSize: '20px' }}>verified</span>
            Trusted local businesses, all in one place
          </div>
        </div>

        <div style={{ position: 'relative', minHeight: '360px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '560px', height: '380px', borderRadius: '32px', overflow: 'hidden', backgroundColor: '#f8fafc', boxShadow: '0 20px 50px rgba(15, 23, 42, 0.08)' }}>
            <img src={slides[currentSlide]} alt="Local stores and their products" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.4s ease' }} />
          </div>
          <div style={{ position: 'absolute', left: '8px', bottom: '28px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
            <span className="material-icons" style={{ color: '#2563eb', fontSize: '24px' }}>storefront</span>
            <div>
              <strong style={{ display: 'block', fontSize: '0.84rem', color: '#0f172a' }}>Made for local shopping</strong>
              <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Discover independent merchants</span>
            </div>
          </div>
          <div style={{ position: 'absolute', right: '8px', top: '24px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
            <span className="material-icons" style={{ color: '#16a34a', fontSize: '20px' }}>verified</span>
            <strong style={{ fontSize: '0.8rem', color: '#0f172a' }}>Verified stores</strong>
          </div>
        </div>
      </section>

      <section style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', backgroundColor: '#fcfcfd', padding: '22px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
          {[
            { icon: 'verified_user', title: 'Verified merchants', detail: 'Shop with local businesses' },
            { icon: 'storefront', title: 'Unique storefronts', detail: 'Discover independent brands' },
            { icon: 'local_shipping', title: 'Local convenience', detail: 'Find shops across Zambia' },
            { icon: 'support_agent', title: 'Direct merchant chat', detail: 'Connect with sellers' },
          ].map((benefit) => (
            <div key={benefit.title} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="material-icons" style={{ fontSize: '28px', color: '#0f172a' }}>{benefit.icon}</span>
              <div>
                <strong style={{ display: 'block', fontSize: '0.88rem', color: '#0f172a' }}>{benefit.title}</strong>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{benefit.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="shop-category-section" style={{ maxWidth: '1280px', margin: '48px auto 40px', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>Shop by Category</h2>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '0.88rem' }}>Find a local store for whatever you need.</p>
          </div>
          <button type="button" onClick={() => { onSearchQueryChange(''); setSelectedStoreCategory('All'); scrollToCatalog() }} style={{ background: 'none', border: 'none', color: '#0f172a', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            View all stores <span className="material-icons" style={{ fontSize: '16px' }}>arrow_forward</span>
          </button>
        </div>
        <div className="shop-category-rail">
          {storeCategories.map((category) => (
            <button
              key={category.name}
              type="button"
              className="shop-category-card"
              onClick={() => { onSearchQueryChange(''); setSelectedStoreCategory(category.name); scrollToCatalog() }}
              style={{ padding: 0, cursor: 'pointer', textAlign: 'center' }}
            >
              <div className="shop-category-image">
                <img src={category.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span className="shop-category-title">{category.name}</span>
              <span className="shop-category-description">{category.description}</span>
            </button>
          ))}
        </div>
      </section>

      <section id="stores-catalog" style={{ maxWidth: '1280px', margin: '48px auto 64px', padding: '0 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Directory search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', paddingBottom: '18px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Merchant Directory ({filteredShops.length})</h2>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <select aria-label="Filter stores by location" value={selectedLocation} onChange={event => setSelectedLocation(event.target.value)} style={{ minWidth: 190, borderRadius: 999, border: '1px solid #e2e8f0', padding: '9px 14px', background: '#fff' }}>
                <option value="All">All locations</option>
                {STORE_MARKET_LOCATIONS.map(location => <option key={location} value={location}>{location}</option>)}
                <option value="Other locations">Other locations</option>
              </select>
              <select aria-label="Filter stores by category" value={selectedStoreCategory} onChange={event => setSelectedStoreCategory(event.target.value)} style={{ minWidth: 160, borderRadius: 999, border: '1px solid #e2e8f0', padding: '9px 14px', background: '#fff' }}>
                <option value="All">All categories</option>
                {storeCategories.map(category => <option key={category.name} value={category.name}>{category.name}</option>)}
              </select>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* REGISTERED STOREFRONTS DIRECTORY                                         */}
          {/* ========================================================================= */}
          <div>
              {filteredShops.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                  <span className="material-icons" style={{ fontSize: '48px', color: '#94a3b8' }}>search_off</span>
                  <h3 style={{ margin: '12px 0 6px', fontSize: '1.2rem', fontWeight: 800 }}>No Stores Match Your Search</h3>
                  <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '0.88rem' }}>Try clearing the search query to view all merchant shops.</p>
                  <button type="button" onClick={() => onSearchQueryChange('')} className="primary-btn compact-btn">Clear Search</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                  {filteredShops.map((shop, index) => {
                    const shopListingsCount = listings.filter(l => l.user_id === shop.userId).length
                    const shopLocation = groupStoreLocation(shop.address, shop.locationName)
                    const previousLocation = index > 0 ? groupStoreLocation(filteredShops[index - 1].address, filteredShops[index - 1].locationName) : null
                    return (
                      <>
                        {shopLocation !== previousLocation && <h3 style={{ gridColumn: '1 / -1', margin: '8px 0 0', paddingTop: 12, fontSize: '1rem', color: '#334155', borderTop: index ? '1px solid #e2e8f0' : undefined }}>{shopLocation}</h3>}
                        <article
                        key={shop.userId}
                        style={{
                          borderRadius: '20px',
                          border: '1px solid #f1f5f9',
                          background: '#ffffff',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
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
                                style={{ width: '56px', height: '56px', borderRadius: '14px', objectFit: 'cover', border: '3px solid #ffffff', boxShadow: '0 2px 10px rgba(0,0,0,0.12)', backgroundColor: '#fff' }}
                              />
                            ) : (
                              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: '1.3rem', border: '3px solid #ffffff', boxShadow: '0 2px 10px rgba(0,0,0,0.12)' }}>
                                {shop.shopName.slice(0, 1).toUpperCase()}
                              </div>
                            )}
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <strong style={{ fontSize: '1.08rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {shop.shopName}
                                </strong>
                                {shop.verifiedId && <span className="material-icons" style={{ fontSize: '16px', color: '#2563eb' }} title="Verified ID">verified</span>}
                              </div>
                              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                {shopListingsCount} product{shopListingsCount !== 1 ? 's' : ''} in catalog
                              </span>
                            </div>
                          </div>

                          {shop.description && (
                            <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {shop.description}
                            </p>
                          )}

                          <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                      </>
                    )
                  })}
                </div>
              )}
            </div>

        </div>
      </section>
    </div>
  )
}
