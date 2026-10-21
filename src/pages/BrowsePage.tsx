import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { Listing, BusinessProfile } from '../types'
import { ListingCard } from '../components/ListingCard'
import { isBestSeller, isNewArrival } from '../utils/listingSections'

type BrowsePageProps = {
  listings: Listing[]
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  allBusinesses?: Record<string, BusinessProfile>
  savedIds: string[]
  onToggleSave: (id: number) => void
  onAddToCart: (item: { id: number | string; title: string; price: number; image?: string; sellerName?: string; sellerUserId?: string }) => void
  onOpenListing: (listing: Listing) => void
}

export function BrowsePage({
  listings,
  searchQuery,
  onSearchQueryChange,
  allBusinesses = {},
  savedIds,
  onToggleSave = () => {},
  onAddToCart,
  onOpenListing,
}: BrowsePageProps) {
  const [searchParams] = useSearchParams()
  const initialFilter = searchParams.get('category') || searchParams.get('filter')
  const initialCategory = initialFilter === 'new' || initialFilter === 'bestseller' ? 'All' : initialFilter || 'All'
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory)
  const [sortBy, setSortBy] = useState('featured')
  const [quickViewListing, setQuickViewListing] = useState<Listing | null>(null)

  // Countdown timer for Flash Sale (starts at 2d 15h 45m 30s)
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 15,
    mins: 45,
    secs: 30,
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 }
        if (prev.mins > 0) return { ...prev, mins: 59, secs: 59 }
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, mins: 59, secs: 59 }
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, mins: 59, secs: 59 }
        return prev
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const categories = [
    {
      id: 'fashion',
      name: 'Fashion',
      title: 'Fashion & Apparel',
      image: '/illustrations/cat_fashion.jpg',
      count: '1,240+ Items',
    },
    {
      id: 'electronics',
      name: 'Electronics',
      title: 'Audio & Tech',
      image: '/illustrations/cat_electronics.jpg',
      count: '820+ Items',
    },
    {
      id: 'beauty',
      name: 'Beauty',
      title: 'Beauty & Skincare',
      image: '/illustrations/cat_beauty.jpg',
      count: '340+ Items',
    },
    {
      id: 'fitness',
      name: 'Fitness',
      title: 'Fitness & Sports',
      image: '/illustrations/banner_summer_collection.jpg',
      count: '490+ Items',
    },
    {
      id: 'homedecor',
      name: 'Home Decor',
      title: 'Home & Living',
      image: '/illustrations/cat_homedecor.jpg',
      count: '610+ Items',
    },
    {
      id: 'accessories',
      name: 'Accessories',
      title: 'Watches & Accessories',
      image: '/illustrations/cat_accessories.jpg',
      count: '430+ Items',
    },
  ]

  const newArrivals = useMemo(
    () => listings
      .filter((listing) => isNewArrival(listing))
      .sort((a, b) => Date.parse(b.created_at!) - Date.parse(a.created_at!)),
    [listings]
  )

  const bestSellers = useMemo(
    () => listings
      .filter((listing) => isBestSeller(listing))
      .sort((a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0)),
    [listings]
  )

  const newArrivalCards = newArrivals.map((listing) => ({
    ...listing,
    image: listing.images?.[0],
    storeName: (listing.user_id && allBusinesses[listing.user_id]?.shopName) || listing.seller_name || 'Independent Seller',
  }))

  // Filter listings
  const filteredCatalog = useMemo(() => {
    let result = listings.length > 0 ? [...listings] : []

    if (selectedCategory && selectedCategory !== 'All') {
      result = result.filter((item) =>
        item.category?.toLowerCase().includes(selectedCategory.toLowerCase())
      )
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q)
      )
    }

    if (sortBy === 'price-low') {
      result.sort((a, b) => Number(a.price) - Number(b.price))
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => Number(b.price) - Number(a.price))
    } else if (sortBy === 'latest') {
      result.sort((a, b) => Number(b.id) - Number(a.id))
    }

    return result
  }, [listings, selectedCategory, searchQuery, sortBy])

  const scrollToCatalog = () => {
    const el = document.getElementById('marketplace-catalog')
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div
      className="browse-page-wrapper"
      style={{
        backgroundColor: '#ffffff',
        color: '#0f172a',
        minHeight: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {/* ---------------- 1. HERO SECTION (NovaTrend Style) ---------------- */}
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
        {/* Left Text & CTA */}
        <div>
          <span
            style={{
              display: 'inline-block',
              color: '#ea580c',
              fontWeight: 800,
              fontSize: '0.78rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            Trending Now
          </span>

          <h1
            style={{
              fontSize: 'clamp(2.4rem, 4.8vw, 3.8rem)',
              fontWeight: 900,
              lineHeight: 1.12,
              letterSpacing: '-0.03em',
              margin: '0 0 16px 0',
              color: '#0f172a',
            }}
          >
            Discover Products You'll Love
          </h1>

          <p
            style={{
              fontSize: '1rem',
              lineHeight: 1.6,
              color: '#64748b',
              margin: '0 0 32px 0',
              maxWidth: '460px',
            }}
          >
            Shop the latest trending products curated for modern lifestyles. Direct from verified independent merchants
            and boutique stores.
          </p>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '36px' }}>
            <button
              type="button"
              onClick={scrollToCatalog}
              style={{
                backgroundColor: '#ea580c',
                color: '#ffffff',
                border: 'none',
                borderRadius: '999px',
                padding: '13px 28px',
                fontSize: '0.94rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 8px 20px rgba(234, 88, 12, 0.3)',
                transition: 'transform 0.15s ease',
              }}
            >
              <span>Shop Now</span>
              <span className="material-icons" style={{ fontSize: '18px' }}>arrow_forward</span>
            </button>

            <Link
              to="/stores"
              style={{
                backgroundColor: '#ffffff',
                color: '#0f172a',
                border: '1px solid #e2e8f0',
                borderRadius: '999px',
                padding: '13px 26px',
                fontSize: '0.94rem',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              Explore Stores
            </Link>
          </div>

          {/* Social Proof */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', marginLeft: '6px' }}>
              {['#f59e0b', '#2563eb', '#10b981', '#0f172a'].map((bg, idx) => (
                <div
                  key={idx}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: bg,
                    border: '2px solid #ffffff',
                    marginLeft: idx > 0 ? '-10px' : '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                  }}
                >
                  {String.fromCharCode(65 + idx)}
                </div>
              ))}
            </div>
            <span style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: 600 }}>
              Loved by 50,000+ customers across Zambia
            </span>
          </div>
        </div>

        {/* Right Hero Visual */}
        <div style={{ position: 'relative', minHeight: '440px', display: 'flex', justifyContent: 'center' }}>
          {/* Main Lifestyle Model Image */}
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              height: '460px',
              borderRadius: '32px',
              overflow: 'hidden',
              backgroundColor: '#f8fafc',
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.08)',
              position: 'relative',
            }}
          >
            <img
              src="/illustrations/browse_hero_lifestyle.jpg"
              alt="Lifestyle Shopper"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

        </div>
      </section>

      {/* ---------------- 2. VALUE PROPOSITIONS BAR ---------------- */}
      <section style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', backgroundColor: '#fcfcfd', padding: '24px 0' }}>
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span className="material-icons" style={{ fontSize: '32px', color: '#0f172a' }}>local_shipping</span>
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem', color: '#0f172a' }}>Free Delivery</strong>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>On orders over K500</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span className="material-icons" style={{ fontSize: '32px', color: '#0f172a' }}>lock</span>
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem', color: '#0f172a' }}>Secure Payments</strong>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>100% verified checkout</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span className="material-icons" style={{ fontSize: '32px', color: '#0f172a' }}>restart_alt</span>
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem', color: '#0f172a' }}>Easy Returns</strong>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>14-day store exchange</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span className="material-icons" style={{ fontSize: '32px', color: '#0f172a' }}>support_agent</span>
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem', color: '#0f172a' }}>24/7 Verified Support</strong>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Direct merchant chat</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 3. SHOP BY CATEGORIES ---------------- */}
      <section style={{ maxWidth: '1280px', margin: '54px auto 40px', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Shop by Categories
          </h2>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All')
              scrollToCatalog()
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#0f172a',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>View All Categories</span>
            <span className="material-icons" style={{ fontSize: '16px' }}>arrow_forward</span>
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '18px',
          }}
        >
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.name)
                scrollToCatalog()
              }}
              style={{
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ height: '170px', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
                <img
                  src={cat.image}
                  alt={cat.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ padding: '14px', textAlign: 'center' }}>
                <strong style={{ display: 'block', fontSize: '0.92rem', color: '#0f172a', marginBottom: '2px' }}>
                  {cat.name}
                </strong>
                <span style={{ fontSize: '0.76rem', color: '#ea580c', fontWeight: 700 }}>Shop Now →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {newArrivals.length > 0 && <section id="new-arrivals" style={{ maxWidth: '1280px', margin: '54px auto 40px', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
            New Arrivals
          </h2>
          <button
            type="button"
            onClick={scrollToCatalog}
            style={{
              background: 'none',
              border: 'none',
              color: '#0f172a',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>View All New Arrivals</span>
            <span className="material-icons" style={{ fontSize: '16px' }}>arrow_forward</span>
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
          }}
        >
          {newArrivalCards.slice(0, 4).map((prod) => (
            <div
              key={prod.id}
              style={{
                borderRadius: '20px',
                border: '1px solid #f1f5f9',
                backgroundColor: '#ffffff',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Image & Badges */}
              <div style={{ height: '220px', position: 'relative', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
                {prod.image ? (
                  <img src={prod.image} alt={prod.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: '#94a3b8' }}>
                    <span className="material-icons" style={{ fontSize: '48px' }}>inventory_2</span>
                  </div>
                )}

                <span
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                  }}
                >
                  New
                </span>

                <button
                  type="button"
                  onClick={() => onToggleSave(Number(prod.id))}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: '#ffffff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    color: savedIds.includes(String(prod.id)) ? '#ef4444' : '#64748b',
                  }}
                  title="Save to Wishlist"
                >
                  <span className="material-icons" style={{ fontSize: '18px' }}>
                    {savedIds.includes(String(prod.id)) ? 'favorite' : 'favorite_border'}
                  </span>
                </button>
              </div>

              {/* Product Info */}
              <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>{prod.storeName}</span>
                  <h3
                    style={{
                      margin: '4px 0 8px',
                      fontSize: '0.94rem',
                      fontWeight: 800,
                      color: '#0f172a',
                      lineHeight: 1.35,
                    }}
                  >
                    {prod.title}
                  </h3>

                  {prod.rating !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                      <span style={{ color: '#f59e0b', fontSize: '0.85rem' }}>★ {prod.rating}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <div>
                    <strong style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                      K{prod.price.toFixed(2)}
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onAddToCart({
                        id: prod.id,
                        title: prod.title,
                        price: prod.price,
                        image: prod.image,
                        sellerName: prod.storeName,
                        sellerUserId: prod.user_id,
                      })
                    }
                    style={{
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(15, 23, 42, 0.2)',
                    }}
                    title="Add to Bag"
                  >
                    <span className="material-icons" style={{ fontSize: '18px' }}>shopping_bag</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>}

      {bestSellers.length > 0 && (
        <section id="best-sellers" style={{ maxWidth: '1280px', margin: '54px auto 40px', padding: '0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>Best Sellers</h2>
              <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '0.86rem' }}>Popular listings from verified sellers.</p>
            </div>
            <button
              type="button"
              onClick={scrollToCatalog}
              style={{ background: 'none', border: 'none', color: '#0f172a', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Explore all listings <span className="material-icons" style={{ fontSize: '16px' }}>arrow_forward</span>
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '20px' }}>
            {bestSellers.slice(0, 4).map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                saved={savedIds.includes(String(listing.id))}
                onOpen={onOpenListing}
                onToggleSave={(id) => onToggleSave(id)}
                allBusinesses={allBusinesses}
              />
            ))}
          </div>
        </section>
      )}

      {/* ---------------- 5. DUAL PROMO FLASH BANNERS (NovaTrend Style) ---------------- */}
      <section style={{ maxWidth: '1280px', margin: '48px auto', padding: '0 24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
          }}
        >
          {/* Left Flash Sale Banner with Live Timer */}
          <div
            style={{
              borderRadius: '28px',
              padding: '36px 32px',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 16px 36px rgba(234, 88, 12, 0.25)',
            }}
          >
            <div style={{ position: 'relative', zIndex: 2, maxWidth: '280px' }}>
              <span
                style={{
                  display: 'inline-block',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                }}
              >
                Flash Sale
              </span>
              <h3 style={{ fontSize: '2rem', fontWeight: 900, margin: '0 0 16px', lineHeight: 1.15 }}>
                Up To 70% Off
              </h3>

              {/* Countdown Ticker */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '22px' }}>
                <div style={{ backgroundColor: 'rgba(0,0,0,0.25)', padding: '6px 10px', borderRadius: '10px', textAlign: 'center', minWidth: '40px' }}>
                  <strong style={{ display: 'block', fontSize: '1.1rem' }}>{String(timeLeft.days).padStart(2, '0')}</strong>
                  <span style={{ fontSize: '0.62rem', opacity: 0.8 }}>Days</span>
                </div>
                <div style={{ backgroundColor: 'rgba(0,0,0,0.25)', padding: '6px 10px', borderRadius: '10px', textAlign: 'center', minWidth: '40px' }}>
                  <strong style={{ display: 'block', fontSize: '1.1rem' }}>{String(timeLeft.hours).padStart(2, '0')}</strong>
                  <span style={{ fontSize: '0.62rem', opacity: 0.8 }}>Hours</span>
                </div>
                <div style={{ backgroundColor: 'rgba(0,0,0,0.25)', padding: '6px 10px', borderRadius: '10px', textAlign: 'center', minWidth: '40px' }}>
                  <strong style={{ display: 'block', fontSize: '1.1rem' }}>{String(timeLeft.mins).padStart(2, '0')}</strong>
                  <span style={{ fontSize: '0.62rem', opacity: 0.8 }}>Mins</span>
                </div>
                <div style={{ backgroundColor: 'rgba(0,0,0,0.25)', padding: '6px 10px', borderRadius: '10px', textAlign: 'center', minWidth: '40px' }}>
                  <strong style={{ display: 'block', fontSize: '1.1rem' }}>{String(timeLeft.secs).padStart(2, '0')}</strong>
                  <span style={{ fontSize: '0.62rem', opacity: 0.8 }}>Secs</span>
                </div>
              </div>

              <button
                type="button"
                onClick={scrollToCatalog}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#ea580c',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '11px 24px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              >
                Shop Sale Now
              </button>
            </div>

            {/* Sneaker Graphic */}
            <div style={{ width: '220px', height: '180px', position: 'relative', zIndex: 1 }}>
              <img
                src="/illustrations/banner_flash_sale.jpg"
                alt="Flash Sale Sneaker"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
          </div>

          {/* Right Summer Collection Banner */}
          <div
            style={{
              borderRadius: '28px',
              padding: '36px 32px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 16px 36px rgba(15, 23, 42, 0.2)',
            }}
          >
            <div style={{ position: 'relative', zIndex: 2, maxWidth: '260px' }}>
              <span
                style={{
                  display: 'inline-block',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                }}
              >
                New Collection
              </span>
              <h3 style={{ fontSize: '2rem', fontWeight: 900, margin: '0 0 10px', lineHeight: 1.15 }}>
                Summer 2026
              </h3>
              <p style={{ margin: '0 0 24px', fontSize: '0.86rem', color: '#94a3b8', lineHeight: 1.5 }}>
                Discover the latest trending athletic wear and fresh creator styles.
              </p>

              <button
                type="button"
                onClick={scrollToCatalog}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '11px 24px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                }}
              >
                Shop Collection
              </button>
            </div>

            {/* Model Graphic */}
            <div style={{ width: '220px', height: '220px', position: 'relative', zIndex: 1 }}>
              <img
                src="/illustrations/banner_summer_collection.jpg"
                alt="Summer Collection"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '18px' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 6. COMPLETE MARKETPLACE CATALOG (Filterable) ---------------- */}
      <section id="marketplace-catalog" style={{ maxWidth: '1280px', margin: '60px auto 60px', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0 0 4px 0', color: '#0f172a' }}>
              Explore All Marketplace Listings
            </h2>
            <span style={{ fontSize: '0.86rem', color: '#64748b' }}>
              Showing {filteredCatalog.length} active items & services across stores
            </span>
          </div>

          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '8px 14px',
                borderRadius: '999px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <option value="featured">Sort: Featured</option>
              <option value="latest">Sort: Latest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '32px' }}>
          {['All', 'Fashion', 'Electronics', 'Home Decor', 'Beauty', 'Fitness', 'Accessories'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 16px',
                borderRadius: '999px',
                border: '1px solid',
                borderColor: selectedCategory.toLowerCase() === cat.toLowerCase() ? '#0f172a' : '#e2e8f0',
                backgroundColor: selectedCategory.toLowerCase() === cat.toLowerCase() ? '#0f172a' : '#ffffff',
                color: selectedCategory.toLowerCase() === cat.toLowerCase() ? '#ffffff' : '#475569',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Listings Grid */}
        {filteredCatalog.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#f8fafc', borderRadius: '24px' }}>
            <span className="material-icons" style={{ fontSize: '48px', color: '#94a3b8', marginBottom: '12px' }}>
              search_off
            </span>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem' }}>No listings matched your filters</h3>
            <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '0.88rem' }}>
              Try clearing search terms or selecting a different category.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All')
                onSearchQueryChange('')
              }}
              style={{
                padding: '8px 20px',
                borderRadius: '999px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
              gap: '20px',
            }}
          >
            {filteredCatalog.map((item) => {
              return (
                <ListingCard
                  key={item.id}
                  listing={item}
                  saved={savedIds.includes(String(item.id))}
                  onOpen={onOpenListing}
                  onToggleSave={onToggleSave}
                  allBusinesses={allBusinesses}
                />
              )
            })}
          </div>
        )}
      </section>

      {/* ---------------- 7. BOTTOM TRUST & QUALITY BAR ---------------- */}
      <section style={{ backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '36px 0' }}>
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
            textAlign: 'center',
          }}
        >
          <div>
            <span className="material-icons" style={{ fontSize: '32px', color: '#2563eb', marginBottom: '8px' }}>
              verified
            </span>
            <strong style={{ display: 'block', fontSize: '0.9rem', color: '#0f172a' }}>Premium Quality</strong>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Curated merchant products</span>
          </div>

          <div>
            <span className="material-icons" style={{ fontSize: '32px', color: '#2563eb', marginBottom: '8px' }}>
              speed
            </span>
            <strong style={{ display: 'block', fontSize: '0.9rem', color: '#0f172a' }}>Fast Dispatch</strong>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Under 24hr local dispatch</span>
          </div>

          <div>
            <span className="material-icons" style={{ fontSize: '32px', color: '#2563eb', marginBottom: '8px' }}>
              security
            </span>
            <strong style={{ display: 'block', fontSize: '0.9rem', color: '#0f172a' }}>Direct Merchant Chat</strong>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Direct WhatsApp inquiry</span>
          </div>

          <div>
            <span className="material-icons" style={{ fontSize: '32px', color: '#2563eb', marginBottom: '8px' }}>
              sentiment_satisfied_alt
            </span>
            <strong style={{ display: 'block', fontSize: '0.9rem', color: '#0f172a' }}>Customer Satisfaction</strong>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>100% verified stores</span>
          </div>
        </div>
      </section>

      {/* Quick View Modal */}
      {quickViewListing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setQuickViewListing(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '28px',
              padding: '28px',
              maxWidth: '680px',
              width: '100%',
              boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '24px',
              color: '#0f172a',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Image */}
            <div style={{ height: '300px', borderRadius: '18px', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
              <img
                src={
                  quickViewListing.images?.[0] ||
                  '/banners/banner_fashion.png'
                }
                alt={quickViewListing.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Modal Info */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 800 }}>
                    {quickViewListing.category}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuickViewListing(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                  >
                    <span className="material-icons">close</span>
                  </button>
                </div>

                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 900 }}>
                  {quickViewListing.title}
                </h3>

                <strong style={{ display: 'block', fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', marginBottom: '14px' }}>
                  K{Number(quickViewListing.price).toFixed(2)}
                </strong>

                <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.5, margin: '0 0 16px' }}>
                  {quickViewListing.description || 'Verified product listing on MarketSpace.'}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    onAddToCart({
                      id: quickViewListing.id,
                      title: quickViewListing.title,
                      price: Number(quickViewListing.price),
                      image: quickViewListing.images?.[0],
                      sellerName: quickViewListing.seller_name,
                      sellerUserId: quickViewListing.user_id,
                    })
                    setQuickViewListing(null)
                  }}
                  style={{
                    width: '100%',
                    height: '44px',
                    borderRadius: '999px',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '18px' }}>shopping_bag</span>
                  <span>Add to Bag</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQuickViewListing(null)
                    onOpenListing(quickViewListing)
                  }}
                  style={{
                    width: '100%',
                    height: '42px',
                    borderRadius: '999px',
                    backgroundColor: '#f1f5f9',
                    color: '#0f172a',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  View Full Product Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
