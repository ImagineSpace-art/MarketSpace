import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './DiscoveryPage.css'
import type { BusinessProfile, Listing, StoreReview } from '../types'
import { Listing as ListingView } from '../components/Listing'

type DiscoveryPageProps = {
  allBusinesses?: Record<string, BusinessProfile>
  listings?: Listing[]
  storeReviews?: StoreReview[]
  addStoreReview?: (storeId: string | null, rating: number, comment: string, targetUserId?: string | null) => void
  isSignedIn?: boolean
}

export function DiscoveryPage({
  allBusinesses = {},
  listings = [],
  storeReviews = [],
  addStoreReview,
  isSignedIn = false,
}: DiscoveryPageProps) {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('All Stores')
  const [emailInput, setEmailInput] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, string>>({})
  const [reviewRatings, setReviewRatings] = useState<Record<string, number>>({})

  const storefronts = Object.values(allBusinesses).filter((business) => Boolean(business?.shopName))
  const availableListings = listings.filter((listing) =>
    (!listing.status || listing.status.toLowerCase() === 'available') && listing.listing_type !== 'service'
  )
  const filterTabs = ['All Stores', ...new Set(storefronts.map((store) => store.category).filter(Boolean))]
  const visibleStorefronts = activeFilter === 'All Stores'
    ? storefronts
    : storefronts.filter((store) => store.category === activeFilter)
  const featuredStores = storefronts.slice(0, 3)
  const highlightStores = storefronts
    .map((store) => {
      const listing = availableListings.find((item) => item.user_id === store.userId)
      const reviews = storeReviews.filter((review) =>
        review.targetUserId === store.userId || review.storeId === store.userId
      )
      return listing ? { store, listing, review: reviews[0] } : null
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  const sideStories = [
    {
      id: 1,
      tag: 'Merchant Growth',
      title: 'How Independent Creators Scale Their Stores on MarketSpace',
      date: 'Aug 24, 2026 • 5 min read',
      image: '/banners/banner_community.png',
    },
    {
      id: 2,
      tag: 'Tech & Living',
      title: 'Summer Tech & Audio Essentials for Modern Creators',
      date: 'Aug 18, 2026 • 4 min read',
      image: '/illustrations/cat_accessories.jpg',
    },
    {
      id: 3,
      tag: 'Handmade Crafts',
      title: 'Handmade & Verified: The Rise of Artisan Interior Decor in Zambia',
      date: 'Aug 10, 2026 • 6 min read',
      image: '/illustrations/cat_homedecor.jpg',
    },
  ]

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailInput.trim()) return
    setSubscribed(true)
    setEmailInput('')
    setTimeout(() => setSubscribed(false), 4000)
  }

  return (
    <div
      className="discovery-page-wrapper"
      style={{
        backgroundColor: '#ffffff',
        color: '#111827',
        minHeight: '100vh',
        fontFamily: 'inherit ,-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {/* ----------------- 1. HERO SECTION ----------------- */}
      <section
        className="discovery-hero-section"
        style={{ maxWidth: '1240px', margin: '32px auto', padding: '0 24px', position: 'relative' }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-10px',
            right: '5%',
            width: '580px',
            height: '380px',
            opacity: 0.04,
            pointerEvents: 'none',
            backgroundImage: 'radial-gradient(#111827 1.5px, transparent 1.5px)',
            backgroundSize: '16px 16px',
            zIndex: 0,
          }}
        />

        <div
          className="discovery-hero-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '48px',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Left Hero Text */}
          <div style={{ maxWidth: '520px' }}>
            <span
              style={{
                display: 'inline-block',
                background: '#fef3c7',
                color: '#b45309',
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '0.78rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: '14px',
              }}
            >
              Independent Merchant Discovery
            </span>
            <h1
              style={{
                fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)',
                fontWeight: 900,
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
                margin: '0 0 18px 0',
                color: '#111827',
              }}
            >
              Discover Quality Goods & Modern Stores
            </h1>
            <p style={{ fontSize: '0.96rem', lineHeight: 1.6, color: '#4b5563', margin: '0 0 28px 0' }}>
              Explore verified digital storefronts, boutique creators, and high-quality products across Zambia. From
              bespoke fashion and natural skincare to next-gen audio, find pieces that elevate your daily lifestyle.
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <Link
                to="/browse"
                style={{
                  background: '#0f172a',
                  color: '#ffffff',
                  padding: '12px 26px',
                  borderRadius: '24px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)',
                }}
              >
                <span>Browse Products</span>
                <span className="material-icons" style={{ fontSize: '18px' }}>arrow_forward</span>
              </Link>

              <Link
                to="/stores"
                style={{
                  background: '#ffffff',
                  color: '#111827',
                  border: '1px solid #d1d5db',
                  padding: '12px 24px',
                  borderRadius: '24px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span className="material-icons" style={{ fontSize: '18px', color: '#2563eb' }}>storefront</span>
                <span>Explore Stores</span>
              </Link>
            </div>
          </div>

          {/* Right Asymmetrical 3-Card Cluster */}
          {featuredStores.length > 0 && <div
            className="discovery-featured-stores"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr',
              gap: '16px',
              minHeight: '420px',
            }}
          >
            {featuredStores.map((store, index) => (
              <Link
                key={store.userId}
                to={`/store/${store.userId}`}
                className={`discovery-featured-store discovery-featured-store-${index}`}
              >
                {store.cover || store.logo ? <img src={store.cover || store.logo} alt="" /> : null}
                <span>{store.category || 'Independent storefront'}</span>
                <strong>{store.shopName}</strong>
              </Link>
            ))}
          </div>}
        </div>
      </section>

      {/* ----------------- 2. TOP STOREFRONTS & BOUTIQUES ----------------- */}
      {storefronts.length > 0 && <section id="stores-section" className="discovery-content-section" style={{ maxWidth: '1240px', margin: '60px auto 40px', padding: '0 24px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0 0 18px 0', letterSpacing: '-0.02em', color: '#111827' }}>
          Top Storefronts & Boutiques
        </h2>

        {/* Filter Pills */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {filterTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFilter(tab)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: activeFilter === tab ? '#111827' : '#e5e7eb',
                  backgroundColor: activeFilter === tab ? '#111827' : '#ffffff',
                  color: activeFilter === tab ? '#ffffff' : '#4b5563',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <Link
            to="/stores"
            style={{
              color: '#111827',
              fontSize: '0.86rem',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>Explore all stores</span>
            <span className="material-icons" style={{ fontSize: '16px' }}>arrow_forward</span>
          </Link>
        </div>

        {/* 4 Storefront Cards */}
        <div
          className="discovery-store-rail"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
          }}
        >
          {visibleStorefronts.map((store) => {
            const reviews = storeReviews.filter((review) =>
              review.targetUserId === store.userId || review.storeId === store.userId
            )
            const rating = reviews.length
              ? (reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(1)
              : null
            const itemCount = availableListings.filter((listing) => listing.user_id === store.userId).length
            return (
              <Link key={store.userId} to={`/store/${store.userId}`} className="discovery-store-card">
                <div className="discovery-store-image">
                  {store.cover || store.logo ? <img src={store.cover || store.logo} alt="" /> : <span>{store.shopName}</span>}
                  {rating && <span className="discovery-store-rating">{rating} ★</span>}
                </div>
                <div className="discovery-store-details">
                  <h3>{store.shopName}</h3>
                  <div><span>{store.category || 'Independent store'}</span><span>{itemCount} items</span></div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>}

      {availableListings.length > 0 && <section className="discovery-content-section discovery-products-section" style={{ maxWidth: '1240px', margin: '60px auto 40px', padding: '0 24px' }}>
        <div className="discovery-section-heading">
          <h2>Products to Discover</h2>
          <Link to="/browse">Browse all products <span className="material-icons">arrow_forward</span></Link>
        </div>
        <div className="marketplace-listing-grid">
          {availableListings.map((listing) => {
            return <ListingView
              key={listing.id}
              listing={listing}
              onOpen={() => navigate(`/listings/${listing.id}`)}
              allBusinesses={allBusinesses}
            />
          })}
        </div>
      </section>}

      {/* ----------------- 3. MERCHANT STORIES & GUIDES ----------------- */}
      <section className="discovery-content-section" style={{ maxWidth: '1240px', margin: '60px auto 40px', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: '#111827' }}>
            Merchant Stories & Shopping Guides
          </h2>
          <Link
            to="/browse"
            style={{
              color: '#111827',
              fontSize: '0.86rem',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>Read more articles</span>
            <span className="material-icons" style={{ fontSize: '16px' }}>arrow_forward</span>
          </Link>
        </div>

        <div
          className="discovery-stories-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '28px',
            alignItems: 'stretch',
          }}
        >
          {/* Left Hero Story */}
          <article
            style={{
              borderRadius: '24px',
              border: '1px solid #e5e7eb',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ height: '240px', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
              <img
                src="/banners/banner_fashion.png"
                alt="Merchant Craft in Lusaka"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: '#6b7280', fontWeight: 800, textTransform: 'uppercase' }}>
                  Spotlight Story
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '6px 0 10px', color: '#111827', lineHeight: 1.3 }}>
                  Behind The Craft: Inside Lusaka's Handcrafted Leather & Boutique Scene
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#4b5563', lineHeight: 1.5, margin: 0 }}>
                  Meet the local artisans blending generational craftsmanship with modern streetwear aesthetics. How
                  custom storefronts are empowering Zambia's next generation of makers.
                </p>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '16px' }}>
                Aug 24, 2026 • 6 min read
              </span>
            </div>
          </article>

          {/* Right Stacked 3 Stories */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {sideStories.map((story) => (
              <article
                key={story.id}
                onClick={() => navigate('/browse')}
                style={{
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'center',
                  padding: '14px',
                  borderRadius: '18px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
              >
                <div
                  style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    backgroundColor: '#e5e7eb',
                  }}
                >
                  <img src={story.image} alt={story.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 800, textTransform: 'uppercase' }}>
                    {story.tag}
                  </span>
                  <h4 style={{ fontSize: '0.94rem', fontWeight: 800, margin: '4px 0', lineHeight: 1.3, color: '#111827' }}>
                    {story.title}
                  </h4>
                  <span style={{ fontSize: '0.76rem', color: '#9ca3af' }}>{story.date}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------- 4. VERIFIED BUYER HIGHLIGHTS ----------------- */}
      {highlightStores.length > 0 && <section className="discovery-content-section" style={{ maxWidth: '1240px', margin: '60px auto 40px', padding: '0 24px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0 0 24px 0', letterSpacing: '-0.02em', color: '#111827' }}>
          Customer & Storefront Highlights
        </h2>

        <div className="discovery-highlight-rail">
          {highlightStores.map(({ store, listing, review }) => (
            <article className="discovery-highlight-card" key={`${store.userId}-${listing.id}`}>
              <div className="discovery-highlight-review">
                {review ? (
                  <>
                    <div className="discovery-review-author">
                      <strong>{review.reviewerName}</strong>
                      <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="discovery-review-rating" aria-label={`${review.rating} out of 5 stars`}>
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                    <p>{review.comment}</p>
                  </>
                ) : (
                  <form onSubmit={(event) => {
                    event.preventDefault()
                    const comment = reviewDrafts[store.userId]?.trim()
                    if (!comment) return
                    if (!isSignedIn) {
                      navigate('/login')
                      return
                    }
                    addStoreReview?.(null, reviewRatings[store.userId] || 5, comment, store.userId)
                    setReviewDrafts((drafts) => ({ ...drafts, [store.userId]: '' }))
                  }}>
                    <strong>Review this storefront</strong>
                    <label>
                      Rating
                      <select
                        aria-label={`Rating for ${store.shopName}`}
                        value={reviewRatings[store.userId] || 5}
                        onChange={(event) => setReviewRatings((ratings) => ({ ...ratings, [store.userId]: Number(event.target.value) }))}
                      >
                        {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
                      </select>
                    </label>
                    <textarea
                      aria-label={`Write a review for ${store.shopName}`}
                      placeholder="Share your experience"
                      value={reviewDrafts[store.userId] || ''}
                      onChange={(event) => setReviewDrafts((drafts) => ({ ...drafts, [store.userId]: event.target.value }))}
                      required
                      rows={3}
                    />
                    <button type="submit">Submit review</button>
                  </form>
                )}
              </div>
              <Link to={`/listings/${listing.id}`} className="discovery-highlight-product">
                <div className="discovery-highlight-product-image">
                  {listing.images?.[0] ? <img src={listing.images[0]} alt={listing.title} /> : <span>No image</span>}
                </div>
                <strong>{listing.title}</strong>
                <span>K{listing.price.toLocaleString()}</span>
              </Link>
              <Link to={`/store/${store.userId}`} className="discovery-highlight-store">
                {store.cover || store.logo ? <img src={store.cover || store.logo} alt="" /> : <span className="discovery-store-initial">{store.shopName.slice(0, 1)}</span>}
                <strong>{store.shopName}</strong>
                <span>{store.category || 'Independent store'}</span>
                <span>Visit storefront <span className="material-icons">arrow_forward</span></span>
              </Link>
            </article>
          ))}
        </div>
      </section>}

      {/* ----------------- 5. NEWSLETTER BANNER ----------------- */}
      <section style={{ maxWidth: '1240px', margin: '60px auto', padding: '0 24px' }}>
        <div
          style={{
            backgroundColor: '#0f172a',
            color: '#ffffff',
            borderRadius: '28px',
            padding: '48px 32px',
            textAlign: 'center',
            boxShadow: '0 16px 36px rgba(15, 23, 42, 0.15)',
          }}
        >
          <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 900, margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>
            Get New Store Drops & Deals Straight to Your Inbox
          </h2>
          <p style={{ margin: '0 auto 28px auto', fontSize: '0.92rem', color: '#94a3b8', maxWidth: '520px', lineHeight: 1.5 }}>
            Subscribe to receive curated weekly product discoveries, limited flash sales, and exclusive merchant discounts.
          </p>

          {subscribed ? (
            <div
              style={{
                backgroundColor: '#10b981',
                color: '#ffffff',
                display: 'inline-block',
                padding: '10px 24px',
                borderRadius: '999px',
                fontWeight: 700,
                fontSize: '0.9rem',
              }}
            >
              ✓ Thank you for subscribing to MarketSpace!
            </div>
          ) : (
            <form
              className="discovery-subscribe-form"
              onSubmit={handleSubscribe}
              style={{
                maxWidth: '480px',
                margin: '0 auto',
                display: 'flex',
                gap: '8px',
                backgroundColor: '#ffffff',
                padding: '4px',
                borderRadius: '999px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              }}
            >
              <input
                type="email"
                placeholder="Enter your email address"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                style={{
                  flex: 1,
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '999px',
                  outline: 'none',
                  fontSize: '0.9rem',
                  color: '#111827',
                }}
              />
              <button
                type="submit"
                style={{
                  backgroundColor: '#fab829',
                  color: '#0f172a',
                  border: 'none',
                  padding: '10px 22px',
                  borderRadius: '999px',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                }}
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ----------------- 6. EDITORIAL FOOTER ----------------- */}
      <footer
        style={{
          borderTop: '1px solid #e5e7eb',
          padding: '48px 24px 32px',
          maxWidth: '1240px',
          margin: '0 auto',
          fontSize: '0.84rem',
          color: '#6b7280',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '32px',
            marginBottom: '36px',
          }}
        >
          <div>
            <strong style={{ display: 'block', fontSize: '1.05rem', color: '#111827', marginBottom: '12px', fontWeight: 900 }}>
              MarketSpace
            </strong>
            <p style={{ margin: '0 0 16px 0', lineHeight: 1.5, fontSize: '0.82rem' }}>
              The multi-store commerce platform empowering independent merchants, boutique creators, and shoppers worldwide.
            </p>
            <div style={{ display: 'flex', gap: '8px', color: '#111827' }}>
              <span className="material-icons" style={{ fontSize: '20px', cursor: 'pointer' }}>public</span>
              <span className="material-icons" style={{ fontSize: '20px', cursor: 'pointer' }}>share</span>
              <span className="material-icons" style={{ fontSize: '20px', cursor: 'pointer' }}>email</span>
            </div>
          </div>

          <div>
            <strong style={{ display: 'block', color: '#111827', marginBottom: '10px' }}>Marketplace</strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link to="/browse" style={{ textDecoration: 'none', color: '#6b7280' }}>Browse Catalog</Link>
              <Link to="/stores" style={{ textDecoration: 'none', color: '#6b7280' }}>Verified Stores</Link>
            </div>
          </div>

          <div>
            <strong style={{ display: 'block', color: '#111827', marginBottom: '10px' }}>Categories</strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link to="/browse?filter=fashion" style={{ textDecoration: 'none', color: '#6b7280' }}>Fashion & Apparel</Link>
              <Link to="/browse?filter=electronics" style={{ textDecoration: 'none', color: '#6b7280' }}>Tech & Electronics</Link>
              <Link to="/browse?filter=beauty" style={{ textDecoration: 'none', color: '#6b7280' }}>Beauty & Skincare</Link>
              <Link to="/browse?filter=homedecor" style={{ textDecoration: 'none', color: '#6b7280' }}>Home Living & Crafts</Link>
            </div>
          </div>

          <div>
            <strong style={{ display: 'block', color: '#111827', marginBottom: '10px' }}>Merchant Stores</strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {storefronts.length > 0 ? (
                storefronts.slice(0, 4).map((s) => (
                  <Link key={s.userId} to={`/store/${s.userId}`} style={{ textDecoration: 'none', color: '#6b7280' }}>
                    {s.shopName}
                  </Link>
                ))
              ) : (
                <>
                  <Link to="/stores" style={{ textDecoration: 'none', color: '#6b7280' }}>Official Stores</Link>
                  <Link to="/onboarding" style={{ textDecoration: 'none', color: '#2563eb', fontWeight: 600 }}>Create Your Store</Link>
                </>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid #f3f4f6',
            paddingTop: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <span>© 2026 MarketSpace Inc. All rights reserved.</span>
          <span>Made for modern shoppers, creators, and merchants.</span>
        </div>
      </footer>
    </div>
  )
}
