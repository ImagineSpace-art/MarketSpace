import { useState, useEffect, type CSSProperties } from 'react'
import { ListingCard } from '../components/ListingCard'
import type { MarketplaceAppModel } from '../features/marketplace/useMarketplaceApp'

type HomePageProps = Pick<MarketplaceAppModel,
  'loading' |
  'filteredListings' |
  'savedIds' |
  'openListing' |
  'toggleSave' |
  'setView' |
  'distanceFilter' |
  'searchQuery' |
  'setSearchQuery' |
  'cardSize' |
  'toggleCategory' |
  'activeCategories'
>

export function HomePage({
  loading,
  filteredListings,
  savedIds,
  openListing,
  toggleSave,
  setView,
  distanceFilter,
  searchQuery,
  setSearchQuery,
  cardSize,
  toggleCategory,
  activeCategories
}: HomePageProps) {
  const listingGridStyle = { '--card-size': `${cardSize}px` } as CSSProperties

  const [currentSlide, setCurrentSlide] = useState(0)
  const slides = [
    '/banners/banner_electronics.png',
    '/banners/banner_fashion.png',
    '/banners/banner_community.png'
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [slides.length])

  return (
    <div className="marketplace-home">
      
      {/* Background Hero Banner Slider */}
      <div className="hero-slider-section">
        {slides.map((slide, index) => (
          <div
            key={slide}
            className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
            style={{ backgroundImage: `url(${slide})` }}
          />
        ))}
        <div className="hero-slider-fade" />
      </div>

      {/* Overlapping Content Cards */}
      <div className="featured-overlay-grid">
        <div className="featured-card">
          <h3>Local Electronics</h3>
          <p>Find computers, audio systems, and gaming gear in Lusaka.</p>
          <div className="featured-card-links" style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              className={`chip-btn ${activeCategories.includes('Electronics') ? 'active' : ''}`}
              onClick={() => toggleCategory('Electronics')}
              style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: '16px', border: '1px solid var(--border)', cursor: 'pointer', background: 'var(--panel)', color: 'var(--text)' }}
            >
              Electronics
            </button>
            <button
              className={`chip-btn ${activeCategories.includes('Gaming') ? 'active' : ''}`}
              onClick={() => toggleCategory('Gaming')}
              style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: '16px', border: '1px solid var(--border)', cursor: 'pointer', background: 'var(--panel)', color: 'var(--text)' }}
            >
              Gaming
            </button>
          </div>
        </div>

        <div className="featured-card">
          <h3>Fashion & Trends</h3>
          <p>Update your wardrobe with sneakers and stylish wear.</p>
          <div style={{ marginTop: '12px' }}>
            <button
              className={`chip-btn ${activeCategories.includes('Fashion') ? 'active' : ''}`}
              onClick={() => toggleCategory('Fashion')}
              style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: '16px', border: '1px solid var(--border)', cursor: 'pointer', background: 'var(--panel)', color: 'var(--text)' }}
            >
              Fashion & Apparel
            </button>
          </div>
        </div>

        <div className="featured-card">
          <h3>Verified Local Stores</h3>
          <p>Support local businesses, browse catalogs, and request direct pick-up.</p>
          <button className="primary-btn compact-btn" style={{ marginTop: '12px' }} onClick={() => setView('stores')}>
            Browse Stores
          </button>
        </div>

        <div className="featured-card">
          <h3>Sell on MarketSpace</h3>
          <p>List your goods instantly and get messages from direct buyers.</p>
          <button className="primary-btn compact-btn" style={{ marginTop: '12px' }} onClick={() => setView('create')}>
            Start Selling
          </button>
        </div>
      </div>

      <section className="marketplace-toolbar" aria-label="Marketplace filters" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginTop: '24px' }}>
        <div>
          <p className="eyebrow">Browsing</p>
          <strong>Lusaka, Zambia</strong>
          <p className="subtitle">{distanceFilter === 100 ? 'Any distance' : `Within ${distanceFilter} km`}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexGrow: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <form className="topbar-search" onSubmit={(event) => event.preventDefault()} style={{ display: 'flex', gap: '8px', maxWidth: '360px', flexGrow: 1 }}>
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search Marketplace..." style={{ borderRadius: '999px', padding: '10px 16px', border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--text)', width: '100%' }} />
          </form>
          <button className="primary-btn" onClick={() => setView('create')}>+ Create new listing</button>
        </div>
      </section>

      <section className="marketplace-feed">
        <div className="marketplace-feed-header">
          <div>
            <h2>Today's picks</h2>
            <p>Lusaka, Zambia - {distanceFilter === 100 ? 'Any distance' : `Within ${distanceFilter} km`}</p>
          </div>
          <button className="ghost-btn" onClick={() => setView('stores')}>See all</button>
        </div>
        {loading ? (
          <p>Loading listings...</p>
        ) : filteredListings.length === 0 ? (
          <p>No listings match your filters yet.</p>
        ) : (
          <div className="marketplace-listing-grid" style={listingGridStyle}>
            {filteredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} saved={savedIds.includes(String(listing.id))} onOpen={openListing} onToggleSave={toggleSave} compact />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
