import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { BusinessProfile } from '../types'

type DiscoveryPageProps = {
  allBusinesses?: Record<string, BusinessProfile>
  onOpenCart?: () => void
  cartCount?: number
  savedCount?: number
}

export function DiscoveryPage({
  allBusinesses = {},
  onOpenCart,
  cartCount = 0,
  savedCount = 0,
}: DiscoveryPageProps) {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('All Stores')
  const [emailInput, setEmailInput] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const partnerStores = Object.values(allBusinesses).filter((b) => Boolean(b && b.shopName)).slice(0, 4)

  const filterTabs = [
    'All Stores',
    'Fashion & Apparel',
    'Tech & Audio',
    'Home & Decor',
    'Beauty & Care',
    'Verified Merchants',
  ]

  const topStorefronts = [
    {
      id: 1,
      title: 'Lusaka Apparel House',
      category: 'Fashion & Streetwear',
      badge: 'Verified Merchant',
      rating: '4.9 ★',
      itemsCount: '450+ items',
      image: '/illustrations/cat_fashion.jpg',
      link: '/stores',
    },
    {
      id: 2,
      title: 'Pulse Audio & Tech Lab',
      category: 'Smart Audio & Gadgets',
      badge: 'Top Rated Store',
      rating: '5.0 ★',
      itemsCount: '180+ items',
      image: '/illustrations/cat_electronics.jpg',
      link: '/stores',
    },
    {
      id: 3,
      title: 'Aethel Botanical Beauty',
      category: 'Organic Skincare & Oils',
      badge: 'Artisan Crafted',
      rating: '4.8 ★',
      itemsCount: '95+ items',
      image: '/illustrations/cat_beauty.jpg',
      link: '/stores',
    },
    {
      id: 4,
      title: 'Nordic Living Studio',
      category: 'Modern Furniture & Crafts',
      badge: 'Direct Maker',
      rating: '4.9 ★',
      itemsCount: '120+ items',
      image: '/illustrations/cat_homedecor.jpg',
      link: '/stores',
    },
  ]

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
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {/* ----------------- TOP ANNOUNCEMENT BANNER ----------------- */}
      <div
        style={{
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          padding: '8px 16px',
          textAlign: 'center',
          fontSize: '0.78rem',
          fontWeight: 600,
          letterSpacing: '0.02em',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap',
        }}
      >
        <span>⚡ Free Nationwide Delivery On Orders Over K500</span>
        <span style={{ opacity: 0.4 }}>|</span>
        <span>Summer Flash Sale Up To 70% Off</span>
        <span style={{ opacity: 0.4 }}>|</span>
        <Link to="/stores" style={{ color: '#fab829', textDecoration: 'none', fontWeight: 700 }}>
          Explore Verified Storefronts →
        </Link>
      </div>

      {/* ----------------- EDITORIAL NAVBAR ----------------- */}
      <header
        className="discovery-header"
        style={{
          borderBottom: '1px solid #e5e7eb',
          padding: '14px 28px',
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link
            to="/"
            style={{
              textDecoration: 'none',
              color: '#111827',
              fontWeight: 900,
              fontSize: '1.25rem',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '1.3rem', color: '#2563eb' }}>❖</span>
            <span>MarketSpace</span>
          </Link>

          <nav
            className="desktop-nav-links"
            style={{
              display: 'flex',
              gap: '22px',
              fontSize: '0.86rem',
              fontWeight: 600,
              color: '#4b5563',
            }}
          >
            <Link to="/" style={{ textDecoration: 'none', color: '#111827', fontWeight: 700 }}>
              Discovery
            </Link>
            <Link to="/browse" style={{ textDecoration: 'none', color: '#4b5563' }}>
              Browse & Shop
            </Link>
            <Link to="/stores" style={{ textDecoration: 'none', color: '#4b5563' }}>
              Stores Directory
            </Link>
            <Link to="/browse?filter=new" style={{ textDecoration: 'none', color: '#4b5563' }}>
              New Arrivals
            </Link>
            <Link to="/browse?filter=bestseller" style={{ textDecoration: 'none', color: '#4b5563' }}>
              Best Sellers
            </Link>
            <Link to="/onboarding" style={{ textDecoration: 'none', color: '#2563eb', fontWeight: 700 }}>
              Open a Store
            </Link>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Search Trigger */}
          <button
            type="button"
            onClick={() => navigate('/browse')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#4b5563',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Search Products & Stores"
          >
            <span className="material-icons" style={{ fontSize: '20px' }}>search</span>
          </button>

          {/* Wishlist Link */}
          <Link
            to="/saved"
            style={{
              color: '#4b5563',
              textDecoration: 'none',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              padding: '6px',
            }}
            title="Saved Wishlist"
          >
            <span className="material-icons" style={{ fontSize: '20px' }}>favorite_border</span>
            {savedCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '0',
                  right: '0',
                  background: '#ef4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: '15px',
                  height: '15px',
                  fontSize: '0.68rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}
              >
                {savedCount}
              </span>
            )}
          </Link>

          {/* Shopping Bag Trigger */}
          <button
            type="button"
            onClick={onOpenCart}
            style={{
              background: 'none',
              border: 'none',
              color: '#4b5563',
              cursor: 'pointer',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              padding: '6px',
            }}
            title="Shopping Bag"
          >
            <span className="material-icons" style={{ fontSize: '20px' }}>shopping_bag</span>
            {cartCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '0',
                  right: '0',
                  background: '#0f172a',
                  color: 'white',
                  borderRadius: '50%',
                  width: '15px',
                  height: '15px',
                  fontSize: '0.68rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}
              >
                {cartCount}
              </span>
            )}
          </button>

          {/* Sign In / Profile */}
          <Link
            to="/login"
            style={{
              background: '#111827',
              color: '#ffffff',
              padding: '7px 18px',
              borderRadius: '20px',
              fontWeight: 700,
              fontSize: '0.84rem',
              textDecoration: 'none',
              transition: 'background 0.2s ease',
            }}
          >
            Sign in
          </Link>
        </div>
      </header>

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
              Discover Handcrafted Goods & Modern Stores
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr',
              gap: '16px',
              height: '420px',
            }}
          >
            {/* 1. Tall Left Feature Card */}
            <div
              onClick={() => navigate('/browse?filter=fashion')}
              style={{
                borderRadius: '24px',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
                cursor: 'pointer',
                backgroundColor: '#f1f5f9',
              }}
            >
              <img
                src="/illustrations/cat_fashion.jpg"
                alt="Urban Bloom Boutique"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(17, 24, 39, 0.85) 0%, transparent 60%)',
                }}
              />
              <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', color: '#ffffff' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: '#fab829',
                    letterSpacing: '0.05em',
                  }}
                >
                  Featured Boutique
                </span>
                <h3 style={{ margin: '4px 0 2px 0', fontSize: '1.15rem', fontWeight: 800 }}>
                  Urban Bloom Lusaka
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#e5e7eb' }}>
                  Handcrafted Streetwear & Apparel
                </p>
              </div>
            </div>

            {/* 2 & 3. Right Stacked 2 Cards */}
            <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '16px' }}>
              {/* Card Top */}
              <div
                onClick={() => navigate('/browse?filter=electronics')}
                style={{
                  borderRadius: '24px',
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  backgroundColor: '#f1f5f9',
                }}
              >
                <img
                  src="/illustrations/cat_electronics.jpg"
                  alt="Pulse Audio Lab"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(17, 24, 39, 0.8) 0%, transparent 65%)',
                  }}
                />
                <div style={{ position: 'absolute', bottom: '14px', left: '16px', right: '16px', color: '#ffffff' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase' }}>
                    Tech Showcase
                  </span>
                  <h4 style={{ margin: '2px 0', fontSize: '0.96rem', fontWeight: 800 }}>Pulse Audio Lab</h4>
                </div>
              </div>

              {/* Card Bottom */}
              <div
                onClick={() => navigate('/browse?filter=homedecor')}
                style={{
                  borderRadius: '24px',
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  backgroundColor: '#f1f5f9',
                }}
              >
                <img
                  src="/illustrations/cat_homedecor.jpg"
                  alt="Nordic Living Studio"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(17, 24, 39, 0.8) 0%, transparent 65%)',
                  }}
                />
                <div style={{ position: 'absolute', bottom: '14px', left: '16px', right: '16px', color: '#ffffff' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase' }}>
                    Home Living
                  </span>
                  <h4 style={{ margin: '2px 0', fontSize: '0.96rem', fontWeight: 800 }}>Nordic Living Studio</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- 2. TOP STOREFRONTS & BOUTIQUES ----------------- */}
      <section id="stores-section" style={{ maxWidth: '1240px', margin: '60px auto 40px', padding: '0 24px' }}>
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
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
          }}
        >
          {topStorefronts.map((store) => (
            <div
              key={store.id}
              onClick={() => navigate(store.link)}
              style={{
                borderRadius: '24px',
                overflow: 'hidden',
                border: '1px solid #e5e7eb',
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ height: '220px', overflow: 'hidden', position: 'relative', backgroundColor: '#f1f5f9' }}>
                <img
                  src={store.image}
                  alt={store.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    color: '#ffffff',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  {store.badge}
                </span>
                <span
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                  }}
                >
                  {store.rating}
                </span>
              </div>

              <div style={{ padding: '16px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 800, color: '#111827' }}>
                  {store.title}
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#6b7280' }}>
                  <span>{store.category}</span>
                  <span style={{ fontWeight: 600 }}>{store.itemsCount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------- 3. MERCHANT STORIES & GUIDES ----------------- */}
      <section style={{ maxWidth: '1240px', margin: '60px auto 40px', padding: '0 24px' }}>
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
      <section style={{ maxWidth: '1240px', margin: '60px auto 40px', padding: '0 24px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0 0 24px 0', letterSpacing: '-0.02em', color: '#111827' }}>
          Customer & Storefront Highlights
        </h2>

        <div
          className="discovery-trekkers-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            alignItems: 'stretch',
          }}
        >
          {/* Review Card */}
          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '24px',
              padding: '28px',
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1rem',
                }}
              >
                CM
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.96rem', fontWeight: 800, color: '#111827' }}>
                  Chipo Mwamba
                </strong>
                <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Verified Buyer • Lusaka, Zambia</span>
              </div>
            </div>

            <div style={{ color: '#f59e0b', display: 'flex', gap: '2px', fontSize: '1.1rem' }}>
              {'★'.repeat(5)}
            </div>

            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#111827' }}>
              "Exceptional Quality & Instant WhatsApp Dispatch"
            </h3>

            <p style={{ margin: 0, fontSize: '0.88rem', color: '#4b5563', lineHeight: 1.6 }}>
              Found an incredible bespoke leather backpack and custom handmade coffee table on MarketSpace. Delivery
              took under 24 hours in Lusaka, and communicating with the store owner was seamless. Easily the best
              shopping experience in Zambia!
            </p>
          </div>

          {/* Photo Media Card */}
          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '24px',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ flex: 1, minHeight: '220px', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
              <img
                src="/illustrations/cat_sneaker.jpg"
                alt="Sneaker Showcase"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                Unboxing: Aurora Performance Runners
              </span>
              <span style={{ fontSize: '0.76rem', color: '#10b981', fontWeight: 700 }}>Verified Purchase</span>
            </div>
          </div>

          {/* Video / Lookbook Showcase Card */}
          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '24px',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ flex: 1, minHeight: '220px', backgroundColor: '#1e293b', position: 'relative', overflow: 'hidden' }}>
              <img
                src="/illustrations/banner_summer_collection.jpg"
                alt="Activewear Showcase"
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.8)' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '28px', color: '#111827', marginLeft: '3px' }}>
                    play_arrow
                  </span>
                </div>
              </div>
            </div>
            <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                Store Spotlight: Performance Lab
              </span>
              <Link to="/stores" style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}>
                View Store →
              </Link>
            </div>
          </div>
        </div>
      </section>

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
              <Link to="/browse?filter=new" style={{ textDecoration: 'none', color: '#6b7280' }}>New Arrivals</Link>
              <Link to="/browse?filter=bestseller" style={{ textDecoration: 'none', color: '#6b7280' }}>Best Sellers</Link>
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
              {partnerStores.length > 0 ? (
                partnerStores.map((s) => (
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
