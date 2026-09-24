import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  'activeCategories' |
  'allBusinesses' |
  'clearAllFilters'
>

export function HomePage({
  loading,
  filteredListings,
  savedIds,
  openListing,
  toggleSave,
  distanceFilter,
  toggleCategory,
  searchQuery,
  activeCategories = ['All'],
  allBusinesses = {},
  clearAllFilters: globalClearAllFilters
}: Omit<HomePageProps, 'setSearchQuery'>) {
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0)

  // Marketplace Mode Switcher: All | Stores Only | Community Sellers
  const [storeVsSellerFilter, setStoreVsSellerFilter] = useState<'all' | 'stores' | 'sellers'>('all')

  // Quick Filter Popover States
  const [activePopover, setActivePopover] = useState<'price' | 'rating' | 'type' | 'date' | 'seller' | 'sort' | null>(null)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  // Local Filter States
  const [priceMax, setPriceMax] = useState<number>(3000)
  const [minRating, setMinRating] = useState<number>(0)
  const [typeFilter, setTypeFilter] = useState<'all' | 'item' | 'service' | 'seller'>('all')
  const [dateFilter, setDateFilter] = useState<'anytime' | '24h' | '7d' | '30d'>('anytime')
  const [selectedSellers, setSelectedSellers] = useState<string[]>([])
  const [sortOption, setSortOption] = useState<string>('Relevance')

  // Sidebar Checkbox States
  const [includeItems, setIncludeItems] = useState(true)
  const [includeServices, setIncludeServices] = useState(true)
  const [includeSellers, setIncludeSellers] = useState(true)

  // Close popover when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.filter-popover-wrapper')) {
        setActivePopover(null)
      }
    }
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  const promoSlides = [
    {
      id: 'discovery',
      image: '/illustrations/discovery_golden_bridge.jpg',
      badge: 'Editorial Discovery Feed',
      title: "Discover the world's hidden wonders, stories & local merchant crafts.",
      link: '/discovery',
    },
    {
      id: 'stores',
      image: '/banners/banner_community.png',
      badge: 'Official Merchant Stores',
      title: 'Explore curated collections and designer storefronts.',
      link: '/stores',
    },
    {
      id: 'electronics',
      image: '/banners/banner_electronics.png',
      badge: 'Tech & Electronics',
      title: 'Find computers, smartphones, audio systems & gaming gear.',
      cat: 'Electronics',
    },
    {
      id: 'fashion',
      image: '/banners/banner_fashion.png',
      badge: 'Fashion & Trends',
      title: 'Upgrade your look with sneakers, boutique wear & jewelry.',
      cat: 'Fashion',
    },
    {
      id: 'sell',
      image: '/banners/banner_electronics.png',
      badge: 'Sell on MarketSpace',
      title: 'Open your branded online store or sell goods directly to buyers.',
      link: '/onboarding',
    },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % promoSlides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [promoSlides.length])

  // Extract unique sellers & stores list directly from database records
  const uniqueSellersMap = new Map<string, string>()

  // 1. Add stores registered in database stores table
  Object.entries(allBusinesses || {}).forEach(([userId, biz]) => {
    if (userId && biz.shopName) {
      uniqueSellersMap.set(userId, biz.shopName)
    }
  })

  // 2. Add sellers from database listings table
  filteredListings.forEach((l) => {
    if (l.user_id && !uniqueSellersMap.has(l.user_id)) {
      uniqueSellersMap.set(l.user_id, l.seller_name || `Seller (${l.user_id.slice(0, 5)})`)
    }
  })
  const sellersList = Array.from(uniqueSellersMap.entries()).map(([id, name]) => ({ id, name }))

  // Registered business stores list
  const registeredStores = Object.values(allBusinesses || {}).filter(b => Boolean(b && b.shopName))

  const toggleSellerSelection = (sellerId: string) => {
    setSelectedSellers((prev) =>
      prev.includes(sellerId) ? prev.filter((id) => id !== sellerId) : [...prev, sellerId]
    )
  }

  const isSearchActive = Boolean(searchQuery && searchQuery.trim().length > 0)
  const isGlobalCatActive = !activeCategories.includes('All')
  const isGlobalSearchActive = Boolean(searchQuery && searchQuery.trim().length > 0)

  // Calculate active filter count tags
  const activeFiltersCount =
    (isGlobalCatActive ? 1 : 0) +
    (isGlobalSearchActive ? 1 : 0) +
    (priceMax < 3000 ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (typeFilter !== 'all' ? 1 : 0) +
    (dateFilter !== 'anytime' ? 1 : 0) +
    (selectedSellers.length > 0 ? 1 : 0) +
    (storeVsSellerFilter !== 'all' ? 1 : 0) +
    (!includeItems || !includeServices || !includeSellers ? 1 : 0)

  const clearAllFilters = () => {
    setPriceMax(3000)
    setMinRating(0)
    setTypeFilter('all')
    setDateFilter('anytime')
    setSelectedSellers([])
    setStoreVsSellerFilter('all')
    setIncludeItems(true)
    setIncludeServices(true)
    setIncludeSellers(true)
    setSortOption('Relevance')
    if (globalClearAllFilters) globalClearAllFilters()
  }

  // 1. Filtered Listings Evaluation
  const now = Date.now()
  const DAY_MS = 24 * 60 * 60 * 1000

  let displayListings = filteredListings.filter((l) => {
    // Mode Switcher: Stores vs Standalone Sellers
    const isStoreListing = Boolean(l.user_id && allBusinesses[l.user_id]?.shopName)
    if (storeVsSellerFilter === 'stores' && !isStoreListing) return false
    if (storeVsSellerFilter === 'sellers' && isStoreListing) return false

    const p = Number(String(l.price).replace(/[^\d.]/g, ''))
    if (priceMax < 3000 && p > priceMax) return false
    if (minRating > 0) {
      const sellerRating = l.user_id ? allBusinesses[l.user_id]?.rating : undefined
      const effectiveRating = Number(l.rating ?? sellerRating ?? 5)
      if (effectiveRating < minRating) return false
    }
    if (typeFilter === 'item' && l.listing_type === 'service') return false
    if (typeFilter === 'service' && l.listing_type !== 'service') return false
    if (!includeItems && l.listing_type !== 'service') return false
    if (!includeServices && l.listing_type === 'service') return false

    // Date Filter Evaluation
    if (dateFilter !== 'anytime') {
      const created = new Date(l.created_at || l.last_renewed_at || now).getTime()
      const ageMs = now - created
      if (dateFilter === '24h' && ageMs > DAY_MS) return false
      if (dateFilter === '7d' && ageMs > 7 * DAY_MS) return false
      if (dateFilter === '30d' && ageMs > 30 * DAY_MS) return false
    }

    // Specific Sellers & Stores Filter
    if (selectedSellers.length > 0) {
      const matchesSeller = selectedSellers.some((sId) => l.user_id === sId || l.seller_name === sId)
      if (!matchesSeller) return false
    }

    return true
  })

  if (sortOption === 'Price: Low to High') {
    displayListings = [...displayListings].sort((a, b) => Number(a.price) - Number(b.price))
  } else if (sortOption === 'Price: High to Low') {
    displayListings = [...displayListings].sort((a, b) => Number(b.price) - Number(a.price))
  } else if (sortOption === 'Latest') {
    displayListings = [...displayListings].sort((a, b) => Number(b.id) - Number(a.id))
  }

  // Counts for tabs
  const storeListingsTotal = filteredListings.filter(l => Boolean(l.user_id && allBusinesses[l.user_id]?.shopName)).length
  const sellerListingsTotal = filteredListings.filter(l => !Boolean(l.user_id && allBusinesses[l.user_id]?.shopName)).length

  // Curated category definitions with modern assets
  const categoryHighlights = [
    { name: 'Electronics', label: 'Electronics & Tech', icon: 'devices', img: '/banners/banner_electronics.png', desc: 'Computers, gaming & gadgets' },
    { name: 'Fashion', label: 'Fashion & Apparel', icon: 'checkroom', img: '/banners/banner_fashion.png', desc: 'Sneakers, apparel & watches' },
    { name: 'Home & Garden', label: 'Home & Living', icon: 'chair', img: '/banners/banner_community.png', desc: 'Furniture, decor & appliances' },
    { name: 'Vehicles', label: 'Motors & Vehicles', icon: 'directions_car', img: '/banners/banner_electronics.png', desc: 'Cars, bikes & accessories' },
    { name: 'Sports', label: 'Sports & Outdoors', icon: 'fitness_center', img: '/banners/banner_community.png', desc: 'Fitness equipment & gear' },
    { name: 'Services', label: 'Professional Services', icon: 'handshake', img: '/banners/banner_fashion.png', desc: 'Verified local pros & agencies' }
  ]

  return (
    <div className="marketplace-home">
      {/* ---------------- SEARCH MODE VIEW ---------------- */}
      {isSearchActive ? (
        <div>
          {/* Header Title & Result Counter */}
          <div style={{ marginBottom: '20px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text)' }}>
              Search results for "{searchQuery}"
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Results 1–{displayListings.length} of {displayListings.length}
            </p>
          </div>

          {/* MOBILE ONLY (< 768px): Full-Width SORT AND FILTER Button */}
          <div className="mobile-sort-filter-bar" style={{ marginBottom: '14px' }}>
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '24px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
                fontWeight: 700,
                fontSize: '0.9rem',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <span className="material-icons" style={{ fontSize: '18px' }}>tune</span>
              SORT AND FILTER
            </button>
          </div>

          {/* DESKTOP ONLY (>= 768px): Quick Filter Dropdown Pills Bar */}
          <div className="desktop-quick-filters-bar" style={{ marginBottom: '16px', background: 'var(--panel)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {/* Left: Quick Filter Pills */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Mode Switcher Filter inside Search */}
                <div style={{ display: 'flex', gap: '4px', background: 'var(--surface)', padding: '3px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    onClick={() => setStoreVsSellerFilter('all')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '16px',
                      border: 'none',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: storeVsSellerFilter === 'all' ? '#2563eb' : 'transparent',
                      color: storeVsSellerFilter === 'all' ? '#fff' : 'var(--text-secondary)'
                    }}
                  >
                    All ({filteredListings.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStoreVsSellerFilter('stores')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '16px',
                      border: 'none',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: storeVsSellerFilter === 'stores' ? '#2563eb' : 'transparent',
                      color: storeVsSellerFilter === 'stores' ? '#fff' : 'var(--text-secondary)'
                    }}
                  >
                    Stores ({storeListingsTotal})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStoreVsSellerFilter('sellers')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '16px',
                      border: 'none',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: storeVsSellerFilter === 'sellers' ? '#2563eb' : 'transparent',
                      color: storeVsSellerFilter === 'sellers' ? '#fff' : 'var(--text-secondary)'
                    }}
                  >
                    Sellers ({sellerListingsTotal})
                  </button>
                </div>

                {/* Price Pill Dropdown */}
                <div className="filter-popover-wrapper" style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className={`filter-pill-btn ${priceMax < 3000 ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActivePopover(activePopover === 'price' ? null : 'price')
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '20px',
                      border: priceMax < 3000 ? '2px solid #2563eb' : '1px solid var(--border)',
                      background: priceMax < 3000 ? 'rgba(37, 99, 235, 0.12)' : 'var(--surface)',
                      color: 'var(--text)',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Price {priceMax < 3000 ? `(Under ZMW ${priceMax})` : ''}
                    <span className="material-icons" style={{ fontSize: '16px' }}>{activePopover === 'price' ? 'expand_less' : 'expand_more'}</span>
                  </button>

                  {activePopover === 'price' && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '6px', width: '260px', background: '#181818', border: '1px solid #333', borderRadius: '10px', padding: '16px', zIndex: 99, boxShadow: '0 10px 25px rgba(0,0,0,0.7)', color: '#fff' }}>
                      <strong style={{ display: 'block', fontSize: '0.86rem', marginBottom: '10px' }}>Maximum Price</strong>
                      <input
                        type="range"
                        min="100"
                        max="3000"
                        step="100"
                        value={priceMax}
                        onChange={(e) => setPriceMax(Number(e.target.value))}
                        style={{ width: '100%', cursor: 'pointer' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginTop: '8px', color: '#aaa' }}>
                        <span>ZMW 100</span>
                        <strong style={{ color: '#2563eb' }}>{priceMax === 3000 ? 'Any' : `ZMW ${priceMax}`}</strong>
                        <span>ZMW 3000</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActivePopover(null)}
                        style={{ width: '100%', marginTop: '12px', padding: '6px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
                      >
                        Apply Filter
                      </button>
                    </div>
                  )}
                </div>

                {/* Rating Pill Dropdown */}
                <div className="filter-popover-wrapper" style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className={`filter-pill-btn ${minRating > 0 ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActivePopover(activePopover === 'rating' ? null : 'rating')
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '20px',
                      border: minRating > 0 ? '2px solid #2563eb' : '1px solid var(--border)',
                      background: minRating > 0 ? 'rgba(37, 99, 235, 0.12)' : 'var(--surface)',
                      color: 'var(--text)',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Rating {minRating > 0 ? `(${minRating}+ Stars)` : ''}
                    <span className="material-icons" style={{ fontSize: '16px' }}>{activePopover === 'rating' ? 'expand_less' : 'expand_more'}</span>
                  </button>

                  {activePopover === 'rating' && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '6px', width: '200px', background: '#181818', border: '1px solid #333', borderRadius: '10px', padding: '12px', zIndex: 99, boxShadow: '0 10px 25px rgba(0,0,0,0.7)', color: '#fff' }}>
                      {[4, 3, 2, 1, 0].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => {
                            setMinRating(star)
                            setActivePopover(null)
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '8px 10px',
                            background: minRating === star ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
                            border: 'none',
                            color: '#fff',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.82rem'
                          }}
                        >
                          <span className="material-icons" style={{ fontSize: '16px', color: '#f59e0b' }}>star</span>
                          {star === 0 ? 'Any Rating' : `${star}+ Stars`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 700 }}
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>

          {/* Search Grid Layout */}
          <div className="search-grid-layout" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px' }}>
            {/* Left Sidebar */}
            <aside className="search-left-sidebar" style={{ background: 'var(--panel)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', height: 'fit-content' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text)' }}>
                Filter Breakdown
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Specific Sellers Checkboxes */}
                {sellersList.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                      Sellers & Stores ({sellersList.length})
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                      {sellersList.map((s) => (
                        <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem' }}>
                          <input
                            type="checkbox"
                            checked={selectedSellers.includes(s.id)}
                            onChange={() => toggleSellerSelection(s.id)}
                          />
                          <span style={{ color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Listing Type</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '0.84rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input type="checkbox" checked={includeItems} onChange={(e) => setIncludeItems(e.target.checked)} />
                        <span>Items</span>
                      </div>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '0.84rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input type="checkbox" checked={includeServices} onChange={(e) => setIncludeServices(e.target.checked)} />
                        <span>Services</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Date Listed</span>
                  <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as any)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.82rem' }}>
                    <option value="anytime">Anytime</option>
                    <option value="24h">Past 24 Hours</option>
                    <option value="7d">Past 7 Days</option>
                    <option value="30d">Past 30 Days</option>
                  </select>
                </div>
              </div>
            </aside>

            {/* Results Cards Grid */}
            <div>
              {loading ? (
                <p>Searching marketplace...</p>
              ) : displayListings.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--panel)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <span className="material-icons" style={{ fontSize: '48px', color: 'var(--text-muted)' }}>search_off</span>
                  <h3 style={{ margin: '12px 0 6px 0', fontSize: '1.1rem' }}>No matching listings found</h3>
                  <p style={{ margin: '0 0 16px', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>Try broadening your search term or clearing filters.</p>
                  <button type="button" onClick={clearAllFilters} className="primary-btn compact-btn">Reset Filters</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '16px' }}>
                  {displayListings.map((listing) => (
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
          </div>
        </div>
      ) : (
        /* ---------------- NORMAL HOMEPAGE VIEW ---------------- */
        <div style={{ position: "relative" }}>
          {/* Full-Bleed Sticky Background Underlay Hero Banner */}
          <div style={{
            position: 'sticky',
            top: '70px',
            marginLeft: 'calc(-50vw + 50%)',
            marginRight: 'calc(-50vw + 50%)',
            overflow: 'hidden',
            height: '420px',
            marginTop: '-24px',
            zIndex: 1,
          }}>
            <div style={{ position: 'absolute', bottom: '0', left: 0, width: '100%', height: '140px', background: 'linear-gradient(to bottom, transparent 0%, rgba(11, 15, 23, 0.6) 40%, var(--bg) 100%)', pointerEvents: 'none', zIndex: 4 }} />
            <div
              style={{
                display: 'flex',
                width: `${promoSlides.length * 100}%`,
                height: '100%',
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
                    height: '100%',
                    backgroundImage: `url(${slide.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 max(28px, calc((100vw - 1280px) / 2))',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.90) 0%, rgba(15, 23, 42, 0.65) 50%, rgba(15, 23, 42, 0.2) 100%)' }} />

                  <div style={{ position: 'relative', zIndex: 5, maxWidth: '620px', color: '#ffffff', marginBottom: '60px' }}>
                    <span style={{ display: 'inline-block', padding: '6px 14px', backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px', boxShadow: '0 4px 12px rgba(37,99,235,0.4)' }}>
                      {slide.badge}
                    </span>
                    <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 18px 0', lineHeight: 1.15, textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
                      {slide.title}
                    </h2>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {slide.link ? (
                        <Link
                          to={slide.link}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#ffffff',
                            color: '#0f172a',
                            padding: '10px 20px',
                            borderRadius: '24px',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            textDecoration: 'none',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                            transition: 'transform 0.15s ease'
                          }}
                        >
                          <span>Explore Now</span>
                          <span className="material-icons" style={{ fontSize: '18px' }}>arrow_forward</span>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => slide.cat && toggleCategory(slide.cat)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#ffffff',
                            color: '#0f172a',
                            padding: '10px 20px',
                            borderRadius: '24px',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.3)'
                          }}
                        >
                          <span>Browse {slide.cat}</span>
                          <span className="material-icons" style={{ fontSize: '18px' }}>arrow_forward</span>
                        </button>
                      )}
                      <Link
                        to="/stores"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'rgba(255,255,255,0.15)',
                          color: '#ffffff',
                          padding: '10px 18px',
                          borderRadius: '24px',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          textDecoration: 'none',
                          border: '1px solid rgba(255,255,255,0.3)',
                          backdropFilter: 'blur(8px)'
                        }}
                      >
                        <span className="material-icons" style={{ fontSize: '18px' }}>storefront</span>
                        <span>Official Stores Directory</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Carousel Indicator Dots */}
            <div style={{ position: 'absolute', bottom: '130px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 10 }}>
              {promoSlides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  style={{
                    width: idx === currentSlide ? '28px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    backgroundColor: idx === currentSlide ? '#2563eb' : 'rgba(255, 255, 255, 0.45)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Elevated Content Sheet Overlapping Hero */}
          <div style={{
            position: 'relative',
            zIndex: 10,
            marginTop: '-110px',
            borderTopLeftRadius: '28px',
            borderTopRightRadius: '28px',
            marginLeft: 'calc(-50vw + 50%)',
            marginRight: 'calc(-50vw + 50%)',
            padding: '28px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '40px',
            backgroundColor: 'var(--bg, #ffffff)',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.1)'
          }}>

            {/* ========================================================================= */}
            {/* 1. DISCOVER OFFICIAL MERCHANT STORES SHOWCASE                             */}
            {/* ========================================================================= */}
            <section style={{ maxWidth: '1280px', width: '100%', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(37,99,235,0.08)', color: '#2563eb', padding: '4px 10px', borderRadius: '14px', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    <span className="material-icons" style={{ fontSize: '15px' }}>storefront</span>
                    <span>Merchant Ecosystem</span>
                  </div>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, color: 'var(--text)' }}>
                    Discover Official Merchant Stores
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    Explore verified branded storefronts powered by modern customizable templates.
                  </p>
                </div>
                <Link
                  to="/stores"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#2563eb',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    textDecoration: 'none',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'rgba(37,99,235,0.06)'
                  }}
                >
                  <span>View All Stores Directory</span>
                  <span className="material-icons" style={{ fontSize: '18px' }}>arrow_forward</span>
                </Link>
              </div>

              {registeredStores.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '16px' }}>
                  {registeredStores.slice(0, 4).map((shop) => {
                    const storeProductsCount = filteredListings.filter(l => l.user_id === shop.userId).length
                    return (
                      <div
                        key={shop.userId}
                        onClick={() => navigate(`/store/${shop.userId}`)}
                        style={{
                          borderRadius: '16px',
                          border: '1px solid var(--border)',
                          background: 'var(--panel)',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)'
                          e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.12)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'
                        }}
                      >
                        {/* Cover Image */}
                        <div style={{
                          height: '90px',
                          position: 'relative',
                          backgroundColor: '#1e293b',
                          backgroundImage: shop.cover ? `url(${shop.cover})` : 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}>
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.5))' }} />
                          <span style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'rgba(0,0,0,0.65)',
                            color: '#ffffff',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '12px',
                            backdropFilter: 'blur(6px)'
                          }}>
                            {shop.category || 'Retail Store'}
                          </span>
                        </div>

                        {/* Store Body */}
                        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '-30px', position: 'relative', zIndex: 2 }}>
                            {shop.logo ? (
                              <img
                                src={shop.logo}
                                alt={shop.shopName}
                                style={{ width: '52px', height: '52px', borderRadius: '12px', objectFit: 'cover', border: '3px solid var(--panel)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', backgroundColor: '#fff' }}
                              />
                            ) : (
                              <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: '1.2rem', border: '3px solid var(--panel)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                                {shop.shopName.slice(0, 1).toUpperCase()}
                              </div>
                            )}
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <strong style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {shop.shopName}
                                </strong>
                                <span className="material-icons" style={{ fontSize: '16px', color: '#2563eb' }} title="Verified Store">verified</span>
                              </div>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                {storeProductsCount} catalog listing{storeProductsCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>

                          {shop.description && (
                            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {shop.description}
                            </p>
                          )}

                          <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                              Template: {(shop as any).theme?.preset === 'xtra' ? 'Xtra' : 'Hyper'}
                            </span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                              Visit Store <span className="material-icons" style={{ fontSize: '14px' }}>arrow_forward</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--panel)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 800 }}>Be the First Store on MarketSpace</h3>
                    <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                      Launch your branded online storefront with our curated Hyper and Xtra templates.
                    </p>
                  </div>
                  <Link to="/onboarding" className="primary-btn" style={{ textDecoration: 'none', padding: '10px 20px', borderRadius: '20px' }}>
                    Open Your Store
                  </Link>
                </div>
              )}
            </section>

            {/* ========================================================================= */}
            {/* 2. CATEGORY DISCOVERY HUB                                                 */}
            {/* ========================================================================= */}
            <section style={{ maxWidth: '1280px', width: '100%', margin: '0 auto' }}>
              <div style={{ marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, color: 'var(--text)' }}>
                  Explore by Category
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                  Browse goods from merchant catalogs and local peer-to-peer sellers.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                {categoryHighlights.map((cat) => {
                  const isSelected = activeCategories.includes(cat.name)
                  const count = filteredListings.filter(l => l.category === cat.name).length
                  return (
                    <div
                      key={cat.name}
                      onClick={() => toggleCategory(cat.name)}
                      style={{
                        position: 'relative',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        height: '120px',
                        cursor: 'pointer',
                        border: isSelected ? '2px solid #2563eb' : '1px solid var(--border)',
                        boxShadow: isSelected ? '0 0 0 2px rgba(37,99,235,0.2)' : 'none',
                        transition: 'transform 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundImage: `url(${cat.img})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          filter: 'brightness(0.65)'
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.2) 100%)',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        color: '#ffffff'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <span className="material-icons" style={{ fontSize: '18px', color: '#60a5fa' }}>{cat.icon}</span>
                          <strong style={{ fontSize: '0.94rem', fontWeight: 800 }}>{cat.name}</strong>
                        </div>
                        <span style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>
                          {count} listing{count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* ========================================================================= */}
            {/* 3. MARKETPLACE FEED WITH MODE SWITCHER (ALL / STORES / STANDALONE SELLERS)*/}
            {/* ========================================================================= */}
            <section style={{ maxWidth: '1280px', width: '100%', margin: '0 auto' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '18px',
                paddingBottom: '14px',
                borderBottom: '1px solid var(--border)'
              }}>
                <div>
                  <h2 style={{ fontSize: '1.45rem', fontWeight: 900, margin: 0, color: 'var(--text)' }}>
                    Browse Marketplace
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                    Lusaka, Zambia • {distanceFilter === 100 ? 'Any distance' : `Within ${distanceFilter} km`} • Showing {displayListings.length} items
                  </p>
                </div>

                {/* Platform Identity Mode Filter Switcher */}
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  background: 'var(--panel)',
                  padding: '4px',
                  borderRadius: '24px',
                  border: '1px solid var(--border)'
                }}>
                  <button
                    type="button"
                    onClick={() => setStoreVsSellerFilter('all')}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '20px',
                      border: 'none',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: storeVsSellerFilter === 'all' ? '#2563eb' : 'transparent',
                      color: storeVsSellerFilter === 'all' ? '#ffffff' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span className="material-icons" style={{ fontSize: '15px' }}>grid_view</span>
                    <span>All Items ({filteredListings.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStoreVsSellerFilter('stores')}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '20px',
                      border: 'none',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: storeVsSellerFilter === 'stores' ? '#2563eb' : 'transparent',
                      color: storeVsSellerFilter === 'stores' ? '#ffffff' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease'
                    }}
                    title="Show listings from registered merchant stores only"
                  >
                    <span className="material-icons" style={{ fontSize: '15px' }}>storefront</span>
                    <span>Official Stores ({storeListingsTotal})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStoreVsSellerFilter('sellers')}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '20px',
                      border: 'none',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: storeVsSellerFilter === 'sellers' ? '#2563eb' : 'transparent',
                      color: storeVsSellerFilter === 'sellers' ? '#ffffff' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease'
                    }}
                    title="Show listings from independent community sellers"
                  >
                    <span className="material-icons" style={{ fontSize: '15px' }}>person</span>
                    <span>Community Sellers ({sellerListingsTotal})</span>
                  </button>
                </div>
              </div>

              {/* Feed Grid or Non-Empty Inspiring State */}
              {loading ? (
                <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <div className="skeleton-line" style={{ width: '200px', height: '20px', margin: '0 auto 12px' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>Loading marketplace inventory...</p>
                </div>
              ) : displayListings.length === 0 ? (
                /* INSPIRING NON-EMPTY FALLBACK STATE (NEVER AWKWARD BLANK GAP) */
                <div style={{
                  padding: '48px 24px',
                  borderRadius: '20px',
                  background: 'var(--panel)',
                  border: '1px solid var(--border)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(37,99,235,0.1)', color: '#2563eb', display: 'grid', placeItems: 'center' }}>
                    <span className="material-icons" style={{ fontSize: '32px' }}>
                      {storeVsSellerFilter === 'stores' ? 'storefront' : storeVsSellerFilter === 'sellers' ? 'person_search' : 'inventory_2'}
                    </span>
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 800 }}>
                      {storeVsSellerFilter === 'stores'
                        ? 'No official store products in this category yet'
                        : storeVsSellerFilter === 'sellers'
                          ? 'No community seller items in this view'
                          : 'No matching listings found'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '440px' }}>
                      Try selecting "All Items", clearing your active filters, or exploring our registered merchant storefronts.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="primary-btn"
                      style={{ padding: '10px 20px', borderRadius: '20px' }}
                    >
                      Clear All Filters
                    </button>
                    <Link
                      to="/stores"
                      className="outline-btn"
                      style={{ textDecoration: 'none', padding: '10px 20px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span className="material-icons" style={{ fontSize: '16px' }}>storefront</span>
                      Browse Store Directory
                    </Link>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                  {displayListings.map((listing) => (
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
            </section>

            {/* ========================================================================= */}
            {/* 4. SELL ON MARKETSPACE SPOTLIGHT (FOR STORES & COMMUNITY SELLERS)         */}
            {/* ========================================================================= */}
            <section style={{
              maxWidth: '1280px',
              width: '100%',
              margin: '10px auto 0',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #1d4ed8 100%)',
              padding: '36px 32px',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '24px',
              boxShadow: '0 12px 32px rgba(15,23,42,0.3)'
            }}>
              <div style={{ maxWidth: '640px' }}>
                <span style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(255,255,255,0.15)', borderRadius: '16px', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Platform Spotlight
                </span>
                <h3 style={{ margin: '0 0 10px', fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 900, lineHeight: 1.2 }}>
                  Start Selling on MarketSpace Today
                </h3>
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                  Whether you are an established business looking to launch a branded online store with customizable Hyper or Xtra templates, or a standalone seller with pre-owned items, MarketSpace connects you directly to buyers.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link
                  to="/onboarding"
                  style={{
                    background: '#ffffff',
                    color: '#0f172a',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    padding: '12px 22px',
                    borderRadius: '24px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '18px' }}>storefront</span>
                  <span>Launch an Online Store</span>
                </Link>

                <Link
                  to="/profile/create"
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    padding: '12px 20px',
                    borderRadius: '24px',
                    textDecoration: 'none',
                    border: '1px solid rgba(255,255,255,0.25)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backdropFilter: 'blur(8px)'
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '18px' }}>add_circle</span>
                  <span>List a Standalone Product</span>
                </Link>
              </div>
            </section>

          </div>
        </div>
      )}

      {/* MOBILE SORT AND FILTER SLIDE-OVER BOTTOM SHEET */}
      {isMobileFilterOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', boxSizing: 'border-box' }}>
          <div style={{ width: '100%', maxWidth: '440px', background: '#181818', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', border: '1px solid #333', padding: '16px 16px 24px 16px', color: '#fff', maxHeight: '88vh', overflowY: 'auto', boxSizing: 'border-box', margin: '0 auto' }}>
            <div style={{ width: '36px', height: '4px', background: '#444', borderRadius: '2px', margin: '0 auto 12px auto' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, letterSpacing: '0.04em' }}>SORT AND FILTER</h3>
              <button type="button" onClick={() => setIsMobileFilterOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}>
                <span className="material-icons" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', boxSizing: 'border-box' }}>
              {/* Marketplace Mode */}
              <div style={{ boxSizing: 'border-box' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px' }}>Seller Type</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setStoreVsSellerFilter('all')}
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', fontSize: '0.8rem', fontWeight: 700, background: storeVsSellerFilter === 'all' ? '#2563eb' : '#252525', color: '#fff', cursor: 'pointer' }}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setStoreVsSellerFilter('stores')}
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', fontSize: '0.8rem', fontWeight: 700, background: storeVsSellerFilter === 'stores' ? '#2563eb' : '#252525', color: '#fff', cursor: 'pointer' }}
                  >
                    Stores
                  </button>
                  <button
                    type="button"
                    onClick={() => setStoreVsSellerFilter('sellers')}
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', fontSize: '0.8rem', fontWeight: 700, background: storeVsSellerFilter === 'sellers' ? '#2563eb' : '#252525', color: '#fff', cursor: 'pointer' }}
                  >
                    Sellers
                  </button>
                </div>
              </div>

              {/* Sort Option */}
              <div style={{ boxSizing: 'border-box' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px' }}>Sort Results By</label>
                <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', background: '#252525', color: '#fff', border: '1px solid #444', fontSize: '0.88rem', boxSizing: 'border-box' }}>
                  <option>Relevance</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Latest</option>
                </select>
              </div>

              {/* Star Rating Picker */}
              <div style={{ boxSizing: 'border-box' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '8px' }}>Star Rating Filter</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[0, 4, 3, 2, 1].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setMinRating(star)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '16px',
                        border: minRating === star ? '2px solid #2563eb' : '1px solid #444',
                        background: minRating === star ? 'rgba(37, 99, 235, 0.2)' : '#252525',
                        color: '#fff',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span className="material-icons" style={{ fontSize: '14px', color: '#f59e0b' }}>star</span>
                      {star === 0 ? 'Any Rating' : `${star}+ Stars`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Listed */}
              <div style={{ boxSizing: 'border-box' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px' }}>Date Listed</label>
                <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as any)} style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', background: '#252525', color: '#fff', border: '1px solid #444', fontSize: '0.88rem', boxSizing: 'border-box' }}>
                  <option value="anytime">Anytime</option>
                  <option value="24h">Past 24 Hours</option>
                  <option value="7d">Past 7 Days</option>
                  <option value="30d">Past 30 Days</option>
                </select>
              </div>

              {/* Specific Sellers & Stores Multi-Select Filter */}
              {sellersList.length > 0 && (
                <div style={{ boxSizing: 'border-box' }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px' }}>
                    Select Specific Sellers & Stores {selectedSellers.length > 0 ? `(${selectedSellers.length} selected)` : ''}
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto', background: '#252525', padding: '10px', borderRadius: '8px', border: '1px solid #444' }}>
                    {sellersList.map((s) => {
                      const checked = selectedSellers.includes(s.id)
                      return (
                        <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.84rem' }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSellerSelection(s.id)}
                          />
                          <span style={{ color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Maximum Price Slider */}
              <div style={{ boxSizing: 'border-box' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px' }}>Maximum Price: ZMW {priceMax}</label>
                <input type="range" min="100" max="3000" step="100" value={priceMax} onChange={(e) => setPriceMax(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px', boxSizing: 'border-box' }}>
                <button type="button" onClick={clearAllFilters} style={{ flex: 1, padding: '12px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}>Clear All</button>
                <button type="button" onClick={() => setIsMobileFilterOpen(false)} style={{ flex: 1, padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}>Apply Filters</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
