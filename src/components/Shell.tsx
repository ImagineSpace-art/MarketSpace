import { useState, useRef, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import type { Profile, NotificationItem } from '../types'

type ShellProps = {
  children: ReactNode
  session: Session | null
  activeCategories: string[]
  priceRange: number
  distanceFilter: number
  sortBy: string
  showOnlyAvailable: boolean
  onCategoryToggle: (value: string) => void
  onPriceRangeChange: (value: number) => void
  onDistanceChange: (value: number) => void
  onSortChange: (value: string) => void
  onAvailableToggle: () => void
  profile: Profile | null
  listingKindFilter: 'all' | 'item' | 'service'
  onListingKindChange: (value: 'all' | 'item' | 'service') => void
  notifications?: NotificationItem[]
  onMarkAllRead?: () => void
  savedCount?: number
  unreadChatCount?: number
  searchQuery: string
  onSearchQueryChange: (query: string) => void
}

const MEGA_CATEGORIES: Record<string, { label: string; subcats: string[]; featured: string[]; bannerTitle: string; bannerGradient: string }> = {
  'Electronics': {
    label: 'Electronics',
    subcats: ['Laptops & Computers', 'Phones & Tablets', 'Audio & Headphones', 'VR & Gaming', 'Smart Home & Wearables'],
    featured: ['Top New Tech', 'Bestselling Electronics', 'Verified Stores', 'Special Deals'],
    bannerTitle: 'Up to 50% off on new release electronics',
    bannerGradient: 'linear-gradient(135deg, #1d4ed8, #9333ea)'
  },
  'Fashion': {
    label: 'Fashion',
    subcats: ['Apparel & Suits', 'Footwear & Sneakers', 'Watches & Jewelry', 'Bags & Accessories', 'Handcrafted Wear'],
    featured: ['New Styles', 'Trending Apparel', 'Boutique Sellers', 'Discounted Items'],
    bannerTitle: 'Up to 40% off on designer fashion',
    bannerGradient: 'linear-gradient(135deg, #db2777, #7c3aed)'
  },
  'Home & Garden': {
    label: 'Home & Garden',
    subcats: ['Furniture & Living', 'Kitchen & Dining', 'Home Decor & Lighting', 'Lawn & Outdoor', 'Tools & Hardware'],
    featured: ['Best Deals', 'Handmade Craft', 'Top Stores', 'Home Makeover'],
    bannerTitle: 'Transform your home with verified local crafts',
    bannerGradient: 'linear-gradient(135deg, #059669, #0d9488)'
  },
  'Vehicles': {
    label: 'Vehicles',
    subcats: ['Cars & Trucks', 'Motorcycles & Scooters', 'Auto Parts & Tires', 'Boats & Watercraft', 'Commercial Vehicles'],
    featured: ['Low Mileage', 'Dealer Stores', 'Recent Imports', 'Instant Deals'],
    bannerTitle: 'Drive your dream vehicle today',
    bannerGradient: 'linear-gradient(135deg, #374151, #111827)'
  },
  'Sports': {
    label: 'Sports',
    subcats: ['Fitness & Gym Equipment', 'Outdoor & Camping', 'Bicycles & Helmets', 'Team Sports Gear', 'Water Sports'],
    featured: ['Pro Gear', 'Gym Setup', 'Outdoor Travel', 'Top Rated'],
    bannerTitle: 'Gear up for your next adventure',
    bannerGradient: 'linear-gradient(135deg, #ea580c, #c2410c)'
  },
  'Services': {
    label: 'Services',
    subcats: ['Home Repair & Plumbing', 'IT & Tech Support', 'Event Planning & Catering', 'Tutoring & Lessons', 'Transport & Delivery'],
    featured: ['Verified Pros', 'Same-Day Pickup', 'High Rated', 'Top Agencies'],
    bannerTitle: 'Hire top local service professionals',
    bannerGradient: 'linear-gradient(135deg, #4f46e5, #0284c7)'
  }
}

export function Shell({
  children,
  session,
  activeCategories,
  onCategoryToggle,
  profile,
  notifications = [],
  onMarkAllRead,
  savedCount = 0,
  unreadChatCount = 0,
  searchQuery,
  onSearchQueryChange,
}: ShellProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [mobileCatExpanded, setMobileCatExpanded] = useState<string | null>(null)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navigate = useNavigate()

  const userNotifications = notifications.filter(
    (n) => !n.user_id || n.user_id === 'all' || (session?.user?.id && n.user_id === session.user.id)
  )
  const unreadCount = userNotifications.filter((n) => n.unread).length

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearchQueryChange(searchQuery.trim())
    navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`)
  }

  const handleMouseEnterNotif = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    setIsNotificationsOpen(true)
  }

  const handleMouseLeaveNotif = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsNotificationsOpen(false)
    }, 250)
  }

  return (
    <div className="app-shell">
      {/* 2. Top Header Navigation Bar */}
      <header className="site-header-bar" onMouseLeave={() => setHoveredCategory(null)}>
        {/* Row 1: Brand Logo, Integrated Search, Action Icons */}
        <div className="header-top-row">
          <div className="header-brand-group">
            <Link to="/" className="header-brand-logo">
              <span className="header-brand-icon">❖</span>
              <span className="header-brand-name">MarketSpace</span>
            </Link>
            <Link
              to="/stores"
              className="header-stores-btn"
              title="Stores Directory"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#1967d2',
                color: '#ffffff',
                border: '1.5px solid #ffffff',
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '0.82rem',
                fontWeight: 700,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                marginLeft: 'auto',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease'
              }}
            >
              <span className="material-icons" style={{ fontSize: '16px' }}>storefront</span>
              <span>Browse Stores</span>
            </Link>
          </div>

          <form
            className="header-search-container"
            onSubmit={handleSearchSubmit}
          >
            <input
              type="text"
              placeholder="Search for items, categories, or stores"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="header-search-input"
            />
            <button type="submit" className="header-search-btn" title="Search">
              <span className="material-icons">search</span>
            </button>
          </form>

          <div className="header-actions-group">
            {/* Notifications Floating Popover Dropdown */}
            <div
              className="header-notifications-wrapper"
              style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
              onMouseEnter={handleMouseEnterNotif}
              onMouseLeave={handleMouseLeaveNotif}
            >
              <button
                className="header-icon-link"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                title="Notifications"
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', position: 'relative' }}
              >
                <span className="material-icons">notifications</span>
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div
                  className="notifications-popover-card"
                  onMouseEnter={handleMouseEnterNotif}
                  onMouseLeave={handleMouseLeaveNotif}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    transform: 'translateY(8px)',
                    width: '320px',
                    backgroundColor: '#181818',
                    border: '1px solid #2e2e2e',
                    borderRadius: '8px',
                    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.85)',
                    zIndex: 9999,
                    color: '#ffffff',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #2e2e2e', backgroundColor: '#1f1f1f' }}>
                    <strong style={{ fontSize: '0.92rem', color: '#ffffff' }}>Notifications ({unreadCount} new)</strong>
                    <button onClick={onMarkAllRead} style={{ fontSize: '0.78rem', padding: '2px 8px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>Mark all read</button>
                  </div>
                  <div style={{ maxHeight: '280px', overflowY: 'auto', padding: '8px 12px' }}>
                    {userNotifications.length === 0 ? (
                      <p style={{ color: '#888888', fontSize: '0.84rem', padding: '16px', textAlign: 'center', margin: 0 }}>No notifications</p>
                    ) : (
                      userNotifications.map((notif) => (
                        <div key={notif.id} style={{ padding: '10px', borderBottom: '1px solid #282828', fontSize: '0.84rem', backgroundColor: notif.unread ? 'rgba(59, 130, 246, 0.08)' : 'transparent', borderRadius: '4px', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <strong style={{ color: '#ffffff' }}>{notif.title}</strong>
                            <span style={{ fontSize: '0.74rem', color: '#888888' }}>{notif.time}</span>
                          </div>
                          <span style={{ color: '#aaaaaa', display: 'block', lineHeight: '1.35' }}>{notif.body}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link to="/profile/saved-listings" className="header-icon-link" title="Favorites" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <span className="material-icons">bookmark_border</span>
              {savedCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {savedCount}
                </span>
              )}
            </Link>
            <Link to="/inbox" className="header-icon-link" title="Inbox Messages" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <span className="material-icons">chat_bubble_outline</span>
              {unreadChatCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {unreadChatCount}
                </span>
              )}
            </Link>

            <Link to="/settings" className="header-icon-link" title="Settings">
              <span className="material-icons">settings</span>
            </Link>

            {/* Direct Profile Link */}
            {session ? (
              <Link to="/profile" className="header-avatar-bubble" title="My Account & Dashboard">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="header-avatar-img" />
                ) : (
                  <span>{(profile?.username || session.user.email || 'MS').slice(0, 2).toUpperCase()}</span>
                )}
              </Link>
            ) : (
              <Link to="/login" className="header-icon-link" title="Sign In">
                <span className="material-icons">account_circle</span>
              </Link>
            )}
          </div>
        </div>

        {/* Row 2: Search bar on small screens (<768px) */}
        <div className="header-mobile-search-row">
          <form onSubmit={handleSearchSubmit} className="header-search-container">
            <input
              type="text"
              placeholder="Search for items, categories, or stores"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="header-search-input"
            />
            <button type="submit" className="header-search-btn" title="Search">
              <span className="material-icons">search</span>
            </button>
          </form>
        </div>

        {/* Row 3: Hover Expandable Category Bar (With Dropdown Arrow Chevrons on Mobile) */}
        <nav className="category-mega-bar">
          {Object.entries(MEGA_CATEGORIES).map(([catKey, catData]) => (
            <button
              key={catKey}
              className={`category-bar-link ${activeCategories.includes(catKey) || hoveredCategory === catKey || mobileCatExpanded === catKey ? 'active' : ''}`}
              onMouseEnter={() => {
                if (window.innerWidth > 1024) setHoveredCategory(catKey)
              }}
              onClick={() => {
                if (window.innerWidth <= 1024) {
                  setMobileCatExpanded(mobileCatExpanded === catKey ? null : catKey)
                } else {
                  onCategoryToggle(catKey)
                }
              }}
            >
              <span>{catData.label}</span>
              <span className="category-arrow-icon material-icons" style={{ fontSize: '15px', marginLeft: '3px' }}>
                {mobileCatExpanded === catKey || hoveredCategory === catKey ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          ))}
        </nav>

        {/* Mobile Expandable Category Sub-menu Drawer */}
        {mobileCatExpanded && MEGA_CATEGORIES[mobileCatExpanded] && (
          <div className="mobile-category-drawer" style={{ background: '#0a0a0a', borderBottom: '1px solid #333', padding: '16px 20px' }}>
            <h4 style={{ color: '#888', fontSize: '0.75rem', letterSpacing: '1px', margin: '0 0 10px 0' }}>
              {MEGA_CATEGORIES[mobileCatExpanded].label.toUpperCase()} SUBCATEGORIES
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
              {MEGA_CATEGORIES[mobileCatExpanded].subcats.map((sub) => (
                <button
                  key={sub}
                  onClick={() => {
                    onCategoryToggle(mobileCatExpanded)
                    setMobileCatExpanded(null)
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    color: '#e5e7eb',
                    padding: '8px 10px',
                    fontSize: '0.82rem',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Fixed Full-Width Mega-Menu Dropdown */}
        {hoveredCategory && MEGA_CATEGORIES[hoveredCategory] && (
          <div
            className="mega-dropdown"
            onMouseEnter={() => setHoveredCategory(hoveredCategory)}
            onMouseLeave={() => setHoveredCategory(null)}
          >
            <div className="mega-dropdown-inner">
              <div className="mega-dropdown-col">
                <h4>{MEGA_CATEGORIES[hoveredCategory].label.toUpperCase()}</h4>
                {MEGA_CATEGORIES[hoveredCategory].subcats.map((sub) => (
                  <a
                    key={sub}
                    href="#category"
                    onClick={(e) => {
                      e.preventDefault()
                      onCategoryToggle(hoveredCategory)
                      setHoveredCategory(null)
                    }}
                  >
                    {sub}
                  </a>
                ))}
              </div>
              <div className="mega-dropdown-col">
                <h4>FEATURED</h4>
                {MEGA_CATEGORIES[hoveredCategory].featured.map((feat) => (
                  <a
                    key={feat}
                    href="#featured"
                    onClick={(e) => {
                      e.preventDefault()
                      setHoveredCategory(null)
                    }}
                  >
                    {feat}
                  </a>
                ))}
              </div>
              <div
                className="mega-dropdown-card"
                style={{ background: MEGA_CATEGORIES[hoveredCategory].bannerGradient }}
              >
                <div>
                  <h3>{MEGA_CATEGORIES[hoveredCategory].bannerTitle}</h3>
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.84rem', opacity: 0.9 }}>
                    Upgraded marketplace offerings with verified seller reviews.
                  </p>
                </div>
                <span className="mega-card-badge">Explore Special Offers</span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 3. Sub-header Trust Badge Bar */}
      <div className="trust-stats-bar">
        <div className="trust-stat-item">
          <span className="material-icons" style={{ fontSize: '18px', color: '#1967d2' }}>star_outline</span>
          <span>Over <strong>13,000</strong> top-rated assets</span>
        </div>
        <div className="trust-stat-item">
          <span className="material-icons" style={{ fontSize: '18px', color: '#10b981' }}>thumb_up_off_alt</span>
          <span>Rated by <strong>85,000+</strong> customers</span>
        </div>
        <div className="trust-stat-item">
          <span className="material-icons" style={{ fontSize: '18px', color: '#8b5cf6' }}>forum</span>
          <span>Supported by <strong>100,000+</strong> members</span>
        </div>
        <div className="trust-stat-item">
          <span className="material-icons" style={{ fontSize: '18px', color: '#3b82f6' }}>verified</span>
          <span>Every item <strong>moderated by MarketSpace</strong></span>
        </div>
      </div>

      {/* Main Content Pane with Push Sidebar */}
      <div className={`content-grid full-width`}>
        <main className="main-panel">{children}</main>
      </div>

      {/* Footer */}
      <footer className="amazon-footer" style={{ marginTop: '40px', fontFamily: 'inherit', clear: 'both' }}>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            width: '100%',
            background: '#19222d',
            color: '#fff',
            border: 'none',
            padding: '15px 0',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            textAlign: 'center',
          }}
          className="back-to-top-btn"
        >
          Back to top
        </button>

        <div
          style={{
            background: '#0d131a',
            color: '#ddd',
            padding: '40px 20px',
            fontSize: '0.85rem',
          }}
        >
          <div
            style={{
              maxWidth: '1280px',
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '30px',
            }}
          >
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '14px', fontWeight: 700 }}>Get to Know Us</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>Careers</span></li>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>Blog</span></li>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>About MarketSpace</span></li>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>Marketplace Guidelines</span></li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '14px', fontWeight: 700 }}>Sell & Publish</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>Sell Products on MarketSpace</span></li>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>Seller Portal</span></li>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>Affiliate Program</span></li>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>Submission Guidelines</span></li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '14px', fontWeight: 700 }}>Payments & Licensing</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>MarketSpace Pay</span></li>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>Multi-Item Licensing</span></li>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>Currency Settings</span></li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '14px', fontWeight: 700 }}>Support & Legal</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>Help Center</span></li>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>Community Forums</span></li>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>Terms of Service</span></li>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>Privacy Policy</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div
          style={{
            background: '#05080c',
            color: '#aaa',
            padding: '24px 20px',
            textAlign: 'center',
            fontSize: '0.8rem',
            borderTop: '1px solid #1a232e',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ color: '#fff', fontSize: '20px' }}>❖</span>
            <span style={{ color: '#fff', fontWeight: 700, letterSpacing: '0.5px' }}>MarketSpace</span>
          </div>
          <p style={{ margin: 0 }}>© 2026, MarketSpace. Developed by ImagineSpace Technologies</p>
        </div>
      </footer>
    </div>
  )
}