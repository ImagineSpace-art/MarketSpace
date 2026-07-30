import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ListingCard } from '../components/ListingCard'
import type { MarketplaceAppModel } from '../features/marketplace/useMarketplaceApp'
import type { Listing } from '../types'

type HomePageProps = Pick<MarketplaceAppModel,
  'loading' |
  'filteredListings' |
  'savedIds' |
  'openListing' |
  'toggleSave' |
  'distanceFilter' |
  'searchQuery' |
  'setSearchQuery' |
  'toggleCategory' |
  'activeCategories'
>

export function HomePage({
  loading,
  filteredListings,
  savedIds,
  openListing,
  toggleSave,
  distanceFilter,
  searchQuery,
  setSearchQuery,
  toggleCategory,
  activeCategories
}: HomePageProps) {
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

  // Group listings into horizontal scroll rails capped at 5 items per row
  const horizontalScrollGroups: Listing[][] = []
  for (let i = 0; i < filteredListings.length; i += 5) {
    horizontalScrollGroups.push(filteredListings.slice(i, i + 5))
  }

  return (
    <div className="marketplace-home">

      {/* Background Hero Banner Slider */}
      <div className="hero-slider-section" style={{ position: 'relative' }}>
        {slides.map((slide, index) => (
          <div
            key={slide}
            className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
            style={{ backgroundImage: `url(${slide})` }}
          />
        ))}
        <div className="hero-slider-fade" />

        {/* Dark Tint Overlay */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.45)' }} />

        {/* Search Bar overlay */}
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
            Find anything on MarketSpace
          </h2>
          <div style={{ position: 'relative' }}>
            <span className="material-icons" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}>search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search items, categories, and locations..."
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
              style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: '4px', border: '1px solid var(--border)', cursor: 'pointer', background: 'var(--panel)', color: 'var(--text)' }}
            >
              Electronics
            </button>
            <button
              className={`chip-btn ${activeCategories.includes('Gaming') ? 'active' : ''}`}
              onClick={() => toggleCategory('Gaming')}
              style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: '4px', border: '1px solid var(--border)', cursor: 'pointer', background: 'var(--panel)', color: 'var(--text)' }}
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
              style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: '4px', border: '1px solid var(--border)', cursor: 'pointer', background: 'var(--panel)', color: 'var(--text)' }}
            >
              Fashion & Apparel
            </button>
          </div>
        </div>

        <div className="featured-card">
          <h3>Verified Local Stores</h3>
          <p>Support local businesses, browse catalogs, and request direct pick-up.</p>
          <Link className="primary-btn" style={{ marginTop: '12px', textDecoration: 'none', display: 'inline-block', textAlign: 'center' }} to="/stores">
            Browse Stores
          </Link>
        </div>

        <div className="featured-card">
          <h3>Sell on MarketSpace</h3>
          <p>List your goods instantly and get messages from direct buyers.</p>
          <Link className="primary-btn" style={{ marginTop: '12px', textDecoration: 'none', display: 'inline-block', textAlign: 'center' }} to="/profile/create">
            Start Selling
          </Link>
        </div>
      </div>

      <section className="marketplace-feed">
        <div className="marketplace-feed-header">
          <div>
            <h2>Today's picks</h2>
            <p>Lusaka, Zambia - {distanceFilter === 100 ? 'Any distance' : `Within ${distanceFilter} km`}</p>
          </div>
          <Link className="ghost-btn" style={{ textDecoration: 'none' }} to="/stores">See all</Link>
        </div>
        {loading ? (
          <p>Loading listings...</p>
        ) : filteredListings.length === 0 ? (
          <p>No listings match your filters yet.</p>
        ) : (
          <div className="horizontal-scroll-feed-container">
            {horizontalScrollGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="horizontal-scroll-rail">
                {group.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    saved={savedIds.includes(String(listing.id))}
                    onOpen={openListing}
                    onToggleSave={toggleSave}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
