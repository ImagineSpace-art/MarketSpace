import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ListingCard } from '../components/ListingCard'
import type { MarketplaceAppModel } from '../features/marketplace/useMarketplaceApp'


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
  toggleCategory
}: Omit<HomePageProps, 'searchQuery' | 'setSearchQuery' | 'activeCategories'>) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const promoSlides = [
    {
      id: 'electronics',
      image: '/banners/banner_electronics.png',
      badge: 'Local Electronics',
      title: 'Find computers, audio systems, and gaming gear in Lusaka.',
      buttonText: 'Explore Electronics',
      cat: 'Electronics',
    },
    {
      id: 'fashion',
      image: '/banners/banner_fashion.png',
      badge: 'Fashion & Trends',
      title: 'Update your wardrobe with sneakers and stylish wear.',
      buttonText: 'Shop Fashion',
      cat: 'Fashion',
    },
    {
      id: 'stores',
      image: '/banners/banner_community.png',
      badge: 'Verified Local Stores',
      title: 'Support local Zambian merchants and browse full shop catalogs.',
      buttonText: 'Browse Stores',
      link: '/stores',
    },
    {
      id: 'sell',
      image: '/banners/banner_electronics.png',
      badge: 'Sell on MarketSpace',
      title: 'List your goods instantly and get messages directly from buyers.',
      buttonText: 'Start Selling',
      link: '/onboarding',
    },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % promoSlides.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [promoSlides.length])

  // 1. Today's Picks: Sorted strictly by id/created_at descending for real-time latest listings
  const latestListings = [...filteredListings].sort((a, b) => Number(b.id) - Number(a.id))

  // 2. Category / Section groupings (only rendered if length > 0)
  const electronicsListings = filteredListings.filter(l => l.category === 'Electronics' || l.category === 'Gaming')
  const fashionListings = filteredListings.filter(l => l.category === 'Fashion')
  const vehiclesListings = filteredListings.filter(l => l.category === 'Vehicles')
  const trendingListings = filteredListings.filter(l => l.sponsored || (l.status ?? 'Available') === 'Available').slice(0, 8)

  return (
    <div className="marketplace-home">
      {/* Sliding Left-to-Right Advertising Hero Carousel */}
      <div style={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '32px', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)' }}>
        <div
          style={{
            display: 'flex',
            width: `${promoSlides.length * 100}%`,
            transform: `translateX(-${(currentSlide * 100) / promoSlides.length}%)`,
            transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          {promoSlides.map((slide) => (
            <div
              key={slide.id}
              style={{
                width: `${100 / promoSlides.length}%`,
                position: 'relative',
                height: '320px',
                backgroundImage: `url(${slide.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                padding: '0 48px',
                boxSizing: 'border-box',
              }}
            >
              {/* Gradient Dark Tint */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.55) 60%, rgba(15, 23, 42, 0.2) 100%)' }} />

              {/* Advertising Content Overlay */}
              <div style={{ position: 'relative', zIndex: 5, maxWidth: '520px', color: '#ffffff' }}>
                <span style={{ display: 'inline-block', padding: '4px 12px', backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                  {slide.badge}
                </span>
                <h2 style={{ fontSize: '1.9rem', fontWeight: 800, margin: '0 0 16px 0', lineHeight: 1.3, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                  {slide.title}
                </h2>
                {slide.cat ? (
                  <button
                    type="button"
                    onClick={() => toggleCategory(slide.cat!)}
                    className="primary-btn"
                    style={{ padding: '12px 24px', fontSize: '0.92rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {slide.buttonText}
                  </button>
                ) : (
                  <Link
                    to={slide.link!}
                    className="primary-btn"
                    style={{ padding: '12px 24px', fontSize: '0.92rem', fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}
                  >
                    {slide.buttonText}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Prev/Next Arrow Navigation Controls */}
        <button
          type="button"
          onClick={() => setCurrentSlide((prev) => (prev === 0 ? promoSlides.length - 1 : prev - 1))}
          style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <span className="material-icons">chevron_left</span>
        </button>
        <button
          type="button"
          onClick={() => setCurrentSlide((prev) => (prev + 1) % promoSlides.length)}
          style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <span className="material-icons">chevron_right</span>
        </button>

        {/* Indicator Dots */}
        <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 10 }}>
          {promoSlides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              style={{
                width: idx === currentSlide ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: idx === currentSlide ? '#2563eb' : 'rgba(255, 255, 255, 0.4)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
        {/* SECTION 1: TODAY'S PICKS (LATEST REALTIME ADDITIONS) */}
        {latestListings.length > 0 && (
          <section className="marketplace-feed">
            <div className="marketplace-feed-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Today's picks (Latest)</h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                  Lusaka, Zambia • {distanceFilter === 100 ? 'Any distance' : `Within ${distanceFilter} km`} • Realtime Latest
                </p>
              </div>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => toggleCategory('All')}
                style={{ fontSize: '0.88rem', fontWeight: 600 }}
              >
                See all
              </button>
            </div>
            {loading ? (
              <p>Loading latest listings...</p>
            ) : (
              <div className="horizontal-scroll-feed-container">
                <div className="horizontal-scroll-rail">
                  {latestListings.slice(0, 10).map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      saved={savedIds.includes(String(listing.id))}
                      onOpen={openListing}
                      onToggleSave={toggleSave}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* SECTION 2: TRENDING & POPULAR */}
        {trendingListings.length > 0 && (
          <section className="marketplace-feed">
            <div className="marketplace-feed-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Trending & Popular</h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>Top sponsored and active marketplace items</p>
              </div>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => toggleCategory('All')}
                style={{ fontSize: '0.88rem', fontWeight: 600 }}
              >
                See all
              </button>
            </div>
            <div className="horizontal-scroll-feed-container">
              <div className="horizontal-scroll-rail">
                {trendingListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    saved={savedIds.includes(String(listing.id))}
                    onOpen={openListing}
                    onToggleSave={toggleSave}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SECTION 3: LOCAL ELECTRONICS */}
        {electronicsListings.length > 0 && (
          <section className="marketplace-feed">
            <div className="marketplace-feed-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Local Electronics & Tech</h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>Computers, phones, audio gear, and gaming hardware</p>
              </div>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => toggleCategory('Electronics')}
                style={{ fontSize: '0.88rem', fontWeight: 600 }}
              >
                See all Electronics
              </button>
            </div>
            <div className="horizontal-scroll-feed-container">
              <div className="horizontal-scroll-rail">
                {electronicsListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    saved={savedIds.includes(String(listing.id))}
                    onOpen={openListing}
                    onToggleSave={toggleSave}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SECTION 4: FASHION & APPAREL */}
        {fashionListings.length > 0 && (
          <section className="marketplace-feed">
            <div className="marketplace-feed-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Fashion & Apparel</h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>Sneakers, watches, clothing, and stylish accessories</p>
              </div>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => toggleCategory('Fashion')}
                style={{ fontSize: '0.88rem', fontWeight: 600 }}
              >
                See all Fashion
              </button>
            </div>
            <div className="horizontal-scroll-feed-container">
              <div className="horizontal-scroll-rail">
                {fashionListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    saved={savedIds.includes(String(listing.id))}
                    onOpen={openListing}
                    onToggleSave={toggleSave}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SECTION 5: VEHICLES & MOTORS */}
        {vehiclesListings.length > 0 && (
          <section className="marketplace-feed">
            <div className="marketplace-feed-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Vehicles & Motors</h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>Cars, motorbikes, trucks, and genuine spare parts</p>
              </div>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => toggleCategory('Vehicles')}
                style={{ fontSize: '0.88rem', fontWeight: 600 }}
              >
                See all Vehicles
              </button>
            </div>
            <div className="horizontal-scroll-feed-container">
              <div className="horizontal-scroll-rail">
                {vehiclesListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    saved={savedIds.includes(String(listing.id))}
                    onOpen={openListing}
                    onToggleSave={toggleSave}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {filteredListings.length === 0 && !loading && (
          <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            No listings match your current filters.
          </p>
        )}
      </div>
    </div>
  )
}
