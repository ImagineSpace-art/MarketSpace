import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import type { Profile } from '../types'
import { CartDrawer, type CartItem } from './CartDrawer'

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
  savedCount?: number
  unreadChatCount?: number
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  hasNewArrivals: boolean
  hasBestSellers: boolean
  storeContext?: { userId: string; shopName: string; collections: import('../types').StoreCollection[] } | null
  cartItems?: CartItem[]
  isCartOpen?: boolean
  onToggleCart?: () => void
  onUpdateCartQty?: (id: number | string, qty: number) => void
  onRemoveCartItem?: (id: number | string) => void
  onClearCart?: () => void
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
  savedCount = 0,
  unreadChatCount = 0,
  searchQuery,
  onSearchQueryChange,
  hasNewArrivals,
  hasBestSellers,
  storeContext,
  cartItems = [],
  isCartOpen = false,
  onToggleCart,
  onUpdateCartQty,
  onRemoveCartItem,
  onClearCart,
}: ShellProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [mobileCatExpanded, setMobileCatExpanded] = useState<string | null>(null)
  const [isMobileCategoryDrawerOpen, setIsMobileCategoryDrawerOpen] = useState(false)
  const [selectedDrawerCategory, setSelectedDrawerCategory] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  const isCategoryPage = location.pathname === '/' || location.pathname === '/discovery' || location.pathname === '/browse'
  const isDiscoveryPage = location.pathname === '/' || location.pathname === '/discovery'

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const query = searchQuery.trim()
    const targetPath = location.pathname === '/stores' ? '/stores' : '/browse'
    onSearchQueryChange(query)
    navigate(`${targetPath}${query ? `?search=${encodeURIComponent(query)}` : ''}`)
  }

  const handleSearchClear = () => {
    onSearchQueryChange('')
    const searchParams = new URLSearchParams(location.search)
    searchParams.delete('search')
    const remainingSearch = searchParams.toString()
    navigate(`${location.pathname}${remainingSearch ? `?${remainingSearch}` : ''}`, { replace: true })
  }

  const cartCount = cartItems.reduce((acc, it) => acc + it.quantity, 0)

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

            <nav className="desktop-header-links" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
              <Link
                to="/"
                className="header-nav-pill"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  color: location.pathname === '/' || location.pathname === '/discovery' ? '#111827' : '#4b5563',
                  background: location.pathname === '/' || location.pathname === '/discovery' ? '#f3f4f6' : 'transparent',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Discovery
              </Link>
              <Link
                to="/browse"
                className="header-nav-pill"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  color: location.pathname === '/browse' ? '#111827' : '#4b5563',
                  background: location.pathname === '/browse' ? '#f3f4f6' : 'transparent',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Browse & Shop
              </Link>
              <Link
                to="/stores"
                className="header-nav-pill"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  color: location.pathname === '/stores' ? '#111827' : '#4b5563',
                  background: location.pathname === '/stores' ? '#f3f4f6' : 'transparent',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Stores Directory
              </Link>
              {location.pathname === '/browse' && hasNewArrivals && (
                <button
                  type="button"
                  className="header-nav-pill"
                  onClick={() => document.getElementById('new-arrivals')?.scrollIntoView({ behavior: 'smooth' })}
                  style={{ display: 'inline-flex', alignItems: 'center', color: '#4b5563', padding: '5px 12px', border: 'none', borderRadius: '20px', background: 'transparent', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, transition: 'all 0.15s ease' }}
                >
                  New Arrivals
                </button>
              )}
              {location.pathname === '/browse' && hasBestSellers && (
                <button
                  type="button"
                  className="header-nav-pill"
                  onClick={() => document.getElementById('best-sellers')?.scrollIntoView({ behavior: 'smooth' })}
                  style={{ display: 'inline-flex', alignItems: 'center', color: '#4b5563', padding: '5px 12px', border: 'none', borderRadius: '20px', background: 'transparent', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, transition: 'all 0.15s ease' }}
                >
                  Best Sellers
                </button>
              )}
              <Link
                to="/onboarding"
                className="header-nav-pill header-open-store-link"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  color: '#2563eb',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Open a Store
              </Link>
            </nav>
          </div>

          <form
            className="header-search-container"
            onSubmit={handleSearchSubmit}
          >
              <input
                type="text"
                placeholder={location.pathname === '/stores' ? 'Search for stores' : 'Search for listings'}
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                className="header-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleSearchClear}
                  title="Clear search"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '4px'
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '18px' }}>close</span>
                </button>
              )}
              <button type="submit" className="header-search-btn" title="Search">
                <span className="material-icons">search</span>
              </button>
          </form>

          <div className="header-actions-group">
            {/* Mobile Categories & Filters Button */}
            {isCategoryPage && (
              <button
                type="button"
                className="header-mobile-filters-btn"
                onClick={() => setIsMobileCategoryDrawerOpen(true)}
                title="Categories & Filters"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#4b5563',
                  padding: '6px',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span className="material-icons" style={{ fontSize: '24px' }}>tune</span>
              </button>
            )}

            <Link to="/profile/saved-listings" className="header-icon-link" title="Favorites" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <span className="material-icons">favorite_border</span>
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
            <Link to="/inbox" className="header-icon-link" title="Inbox & Messages">
              <span className="material-icons">chat</span>
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

            {/* Shopping Bag Trigger */}
            <button
              type="button"
              className="header-icon-link"
              onClick={onToggleCart}
              title="Shopping Bag"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                color: '#ffffff',
                padding: '6px',
              }}
            >
              <span className="material-icons">shopping_bag</span>
              {cartCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    backgroundColor: '#ea580c',
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {cartCount}
                </span>
              )}
            </button>

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
                placeholder={location.pathname === '/stores' ? 'Search for stores' : 'Search for listings'}
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                className="header-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleSearchClear}
                  title="Clear search"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '4px'
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '18px' }}>close</span>
                </button>
              )}
              <button type="submit" className="header-search-btn" title="Search">
                <span className="material-icons">search</span>
              </button>
            </form>
        </div>

        {/* Row 3: Center-Aligned Category & Store Department Bar with Highlights */}
        {isCategoryPage && (
          <>
            <nav className="category-mega-bar" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '8px', padding: '6px 16px' }}>
          {storeContext ? (() => {
            const currentTab = (new URLSearchParams(location.search).get('tab') || 'catalog')
            return (
              <>
                <button
                  type="button"
                  className={`category-bar-link ${currentTab === 'catalog' ? 'active' : ''}`}
                  onClick={() => navigate(`/store/${storeContext.userId}?tab=catalog`)}
                  style={{
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    backgroundColor: currentTab === 'catalog' ? '#2563eb' : 'transparent',
                    color: currentTab === 'catalog' ? '#ffffff' : '#60a5fa',
                    border: currentTab === 'catalog' ? '1px solid #3b82f6' : '1px solid transparent'
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '16px' }}>storefront</span>
                  <span>{storeContext.shopName}</span>
                </button>

                <button
                  type="button"
                  className={`category-bar-link ${currentTab === 'listings' ? 'active' : ''}`}
                  onClick={() => navigate(`/store/${storeContext.userId}?tab=listings`)}
                  style={{
                    fontWeight: 600,
                    padding: '6px 14px',
                    borderRadius: '20px',
                    backgroundColor: currentTab === 'listings' ? '#2563eb' : 'transparent',
                    color: currentTab === 'listings' ? '#ffffff' : 'inherit',
                    border: currentTab === 'listings' ? '1px solid #3b82f6' : '1px solid transparent'
                  }}
                >
                  All Listings
                </button>

                {(storeContext.collections || []).map((col) => {
                  const isColActive = currentTab === `col-${col.id}`
                  return (
                    <button
                      key={col.id}
                      type="button"
                      className={`category-bar-link ${isColActive ? 'active' : ''}`}
                      onClick={() => navigate(`/store/${storeContext.userId}?tab=col-${col.id}`)}
                      style={{
                        fontWeight: 600,
                        padding: '6px 14px',
                        borderRadius: '20px',
                        backgroundColor: isColActive ? '#2563eb' : 'transparent',
                        color: isColActive ? '#ffffff' : 'inherit',
                        border: isColActive ? '1px solid #3b82f6' : '1px solid transparent'
                      }}
                    >
                      {col.name}
                    </button>
                  )
                })}

                <button
                  type="button"
                  className={`category-bar-link ${currentTab === 'care' ? 'active' : ''}`}
                  onClick={() => navigate(`/store/${storeContext.userId}?tab=care`)}
                  style={{
                    fontWeight: 600,
                    padding: '6px 14px',
                    borderRadius: '20px',
                    backgroundColor: currentTab === 'care' ? '#2563eb' : 'transparent',
                    color: currentTab === 'care' ? '#ffffff' : 'inherit',
                    border: currentTab === 'care' ? '1px solid #3b82f6' : '1px solid transparent'
                  }}
                >
                  Customer Care & Policies
                </button>

                <button
                  type="button"
                  className={`category-bar-link ${currentTab === 'reviews' ? 'active' : ''}`}
                  onClick={() => navigate(`/store/${storeContext.userId}?tab=reviews`)}
                  style={{
                    fontWeight: 600,
                    padding: '6px 14px',
                    borderRadius: '20px',
                    backgroundColor: currentTab === 'reviews' ? '#2563eb' : 'transparent',
                    color: currentTab === 'reviews' ? '#ffffff' : 'inherit',
                    border: currentTab === 'reviews' ? '1px solid #3b82f6' : '1px solid transparent'
                  }}
                >
                  Reviews
                </button>
              </>
            )
          })() : (
            Object.entries(MEGA_CATEGORIES).map(([catKey, catData]) => {
              const isSelected = activeCategories.includes(catKey)
              return (
                <button
                  key={catKey}
                  className={`category-bar-link ${isSelected || hoveredCategory === catKey || mobileCatExpanded === catKey ? 'active' : ''}`}
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
                  style={isSelected ? {
                    backgroundColor: 'rgba(37, 99, 235, 0.22)',
                    color: '#60a5fa',
                    border: '1px solid #2563eb',
                    borderRadius: '20px',
                    fontWeight: 700,
                    padding: '6px 14px'
                  } : { padding: '6px 14px' }}
                >
                  <span>{catData.label}</span>
                  <span className="category-arrow-icon material-icons" style={{ fontSize: '15px', marginLeft: '3px' }}>
                    {mobileCatExpanded === catKey || hoveredCategory === catKey ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
              )
            })
          )}
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
      </>
    )}
      </header>

      {/* Main Content Pane with Push Sidebar */}
      <div className={`content-grid full-width`}>
        <main className="main-panel">{children}</main>
      </div>

      {/* Footer */}
      <footer
        className="market-footer"
        style={{
          marginTop: '40px',
          fontFamily: 'inherit',
          clear: 'both',
          display: isDiscoveryPage ? 'none' : undefined,
        }}
      >
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            width: '100%',
            background: '#19222d',
            color: '#fff',
            'borderRadius': '0px !important',
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

      {/* Mobile Category Drawer (<1024px) */}
      {isCategoryPage && isMobileCategoryDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 999999,
            display: 'flex',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => {
            setIsMobileCategoryDrawerOpen(false)
            setSelectedDrawerCategory(null)
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '340px',
              height: '100%',
              backgroundColor: '#050505',
              borderRight: '1px solid #222',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '10px 0 30px rgba(0,0,0,0.8)',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Level 1: Full Categories List */}
            {!selectedDrawerCategory ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '18px 20px', borderBottom: '1px solid #181818' }}>
                  <button
                    type="button"
                    onClick={() => setIsMobileCategoryDrawerOpen(false)}
                    style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <span className="material-icons" style={{ fontSize: '24px' }}>close</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {Object.entries(MEGA_CATEGORIES).map(([catKey, catData]) => (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setSelectedDrawerCategory(catKey)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid #141414',
                        color: '#ffffff',
                        fontSize: '1rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <span>{catData.label}</span>
                      <span className="material-icons" style={{ fontSize: '20px', color: '#64748b' }}>chevron_right</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              /* Level 2: Selected Category Subcategories Drilldown */
              (() => {
                const catData = MEGA_CATEGORIES[selectedDrawerCategory]
                if (!catData) return null
                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid #181818' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedDrawerCategory(null)}
                        style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <span className="material-icons" style={{ fontSize: '24px' }}>chevron_left</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileCategoryDrawerOpen(false)
                          setSelectedDrawerCategory(null)
                        }}
                        style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <span className="material-icons" style={{ fontSize: '24px' }}>close</span>
                      </button>
                    </div>

                    <div style={{ padding: '20px 20px 10px 20px' }}>
                      <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 16px 0', color: '#ffffff' }}>
                        {catData.label}
                      </h2>
                      <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                        {catData.label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {catData.subcats.map((subcat) => (
                        <button
                          key={subcat}
                          type="button"
                          onClick={() => {
                            onCategoryToggle(selectedDrawerCategory)
                            setIsMobileCategoryDrawerOpen(false)
                            setSelectedDrawerCategory(null)
                            navigate('/')
                          }}
                          style={{
                            display: 'block',
                            padding: '12px 20px',
                            background: 'transparent',
                            border: 'none',
                            color: '#e2e8f0',
                            fontSize: '0.94rem',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          {subcat}
                        </button>
                      ))}
                    </div>

                    {catData.featured && catData.featured.length > 0 && (
                      <div style={{ marginTop: '20px', borderTop: '1px solid #181818', paddingTop: '16px' }}>
                        <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, padding: '0 20px 10px 20px', display: 'block' }}>
                          FEATURED
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          {catData.featured.map((feat) => (
                            <button
                              key={feat}
                              type="button"
                              onClick={() => {
                                onCategoryToggle(selectedDrawerCategory)
                                setIsMobileCategoryDrawerOpen(false)
                                setSelectedDrawerCategory(null)
                                navigate('/')
                              }}
                              style={{
                                display: 'block',
                                padding: '12px 20px',
                                background: 'transparent',
                                border: 'none',
                                color: '#e2e8f0',
                                fontSize: '0.94rem',
                                cursor: 'pointer',
                                textAlign: 'left'
                              }}
                            >
                              {feat}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )
              })()
            )}
          </div>
        </div>
      )}

      {/* Global Slide-out Shopping Cart Drawer */}
      <CartDrawer
        isOpen={Boolean(isCartOpen)}
        onClose={onToggleCart || (() => {})}
        items={cartItems || []}
        onUpdateQuantity={onUpdateCartQty || (() => {})}
        onRemoveItem={onRemoveCartItem || (() => {})}
        onClearCart={onClearCart || (() => {})}
      />
    </div>
  )
}