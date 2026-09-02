import { useState, useEffect } from 'react'
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
  allBusinesses,
  clearAllFilters: globalClearAllFilters
}: Omit<HomePageProps, 'setSearchQuery'>) {
  const [currentSlide, setCurrentSlide] = useState(0)

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
      id: 'electronics',
      image: '/banners/banner_electronics.png',
      badge: 'Local Electronics',
      title: 'Find computers, audio systems, and gaming gear in Lusaka.',
      cat: 'Electronics',
    },
    {
      id: 'fashion',
      image: '/banners/banner_fashion.png',
      badge: 'Fashion & Trends',
      title: 'Update your wardrobe with sneakers and stylish wear.',
      cat: 'Fashion',
    },
    {
      id: 'stores',
      image: '/banners/banner_community.png',
      badge: 'Verified Local Stores',
      title: 'Support local Zambian merchants and browse full shop catalogs.',
      link: '/stores',
    },
    {
      id: 'sell',
      image: '/banners/banner_electronics.png',
      badge: 'Sell on MarketSpace',
      title: 'List your goods instantly and get messages directly from buyers.',
      link: '/onboarding',
    },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % promoSlides.length)
    }, 4500)
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
    (!includeItems || !includeServices || !includeSellers ? 1 : 0)

  const clearAllFilters = () => {
    setPriceMax(3000)
    setMinRating(0)
    setTypeFilter('all')
    setDateFilter('anytime')
    setSelectedSellers([])
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

  const latestListings = displayListings
  const electronicsListings = displayListings.filter(l => l.category === 'Electronics' || l.category === 'Gaming')
  const fashionListings = displayListings.filter(l => l.category === 'Fashion')
  const vehiclesListings = displayListings.filter(l => l.category === 'Vehicles')
  const trendingListings = displayListings.filter(l => l.sponsored || (l.status ?? 'Available') === 'Available').slice(0, 8)

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
                            fontSize: '0.86rem'
                          }}
                        >
                          <span className="material-icons" style={{ fontSize: '16px', color: '#f59e0b' }}>star</span>
                          <span>{star === 0 ? 'Any Rating' : `${star}+ Stars`}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Date Listed Pill Dropdown */}
                <div className="filter-popover-wrapper" style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className={`filter-pill-btn ${dateFilter !== 'anytime' ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActivePopover(activePopover === 'date' ? null : 'date')
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '20px',
                      border: dateFilter !== 'anytime' ? '2px solid #2563eb' : '1px solid var(--border)',
                      background: dateFilter !== 'anytime' ? 'rgba(37, 99, 235, 0.12)' : 'var(--surface)',
                      color: 'var(--text)',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Date Listed {dateFilter !== 'anytime' ? `(${dateFilter})` : ''}
                    <span className="material-icons" style={{ fontSize: '16px' }}>{activePopover === 'date' ? 'expand_less' : 'expand_more'}</span>
                  </button>

                  {activePopover === 'date' && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '6px', width: '200px', background: '#181818', border: '1px solid #333', borderRadius: '10px', padding: '8px', zIndex: 99, boxShadow: '0 10px 25px rgba(0,0,0,0.7)', color: '#fff' }}>
                      {[
                        { label: 'Anytime', val: 'anytime' },
                        { label: 'Past 24 Hours', val: '24h' },
                        { label: 'Past 7 Days', val: '7d' },
                        { label: 'Past 30 Days', val: '30d' },
                      ].map((d) => (
                        <button
                          key={d.val}
                          type="button"
                          onClick={() => {
                            setDateFilter(d.val as any)
                            setActivePopover(null)
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '8px 10px',
                            background: dateFilter === d.val ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
                            border: 'none',
                            color: '#fff',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.86rem'
                          }}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Specific Sellers & Stores Pill Dropdown */}
                {sellersList.length > 0 && (
                  <div className="filter-popover-wrapper" style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className={`filter-pill-btn ${selectedSellers.length > 0 ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setActivePopover(activePopover === 'seller' ? null : 'seller')
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '20px',
                        border: selectedSellers.length > 0 ? '2px solid #2563eb' : '1px solid var(--border)',
                        background: selectedSellers.length > 0 ? 'rgba(37, 99, 235, 0.12)' : 'var(--surface)',
                        color: 'var(--text)',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Sellers & Stores {selectedSellers.length > 0 ? `(${selectedSellers.length})` : ''}
                      <span className="material-icons" style={{ fontSize: '16px' }}>{activePopover === 'seller' ? 'expand_less' : 'expand_more'}</span>
                    </button>

                    {activePopover === 'seller' && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '6px', width: '240px', background: '#181818', border: '1px solid #333', borderRadius: '10px', padding: '10px', zIndex: 99, boxShadow: '0 10px 25px rgba(0,0,0,0.7)', color: '#fff', maxHeight: '240px', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #333', paddingBottom: '6px' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#aaa' }}>Select Sellers/Stores</span>
                          {selectedSellers.length > 0 && (
                            <button type="button" onClick={() => setSelectedSellers([])} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.74rem', cursor: 'pointer' }}>Clear</button>
                          )}
                        </div>
                        {sellersList.map((s) => {
                          const checked = selectedSellers.includes(s.id)
                          return (
                            <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 4px', cursor: 'pointer', fontSize: '0.84rem' }}>
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
                    )}
                  </div>
                )}
              </div>

              {/* Right: Sort By Dropdown */}
              <div className="filter-popover-wrapper" style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActivePopover(activePopover === 'sort' ? null : 'sort')
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Sort by: {sortOption}
                  <span className="material-icons" style={{ fontSize: '16px' }}>{activePopover === 'sort' ? 'expand_less' : 'expand_more'}</span>
                </button>

                {activePopover === 'sort' && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '6px', width: '200px', background: '#181818', border: '1px solid #333', borderRadius: '10px', padding: '8px', zIndex: 99, boxShadow: '0 10px 25px rgba(0,0,0,0.7)', color: '#fff' }}>
                    {['Relevance', 'Price: Low to High', 'Price: High to Low', 'Latest'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setSortOption(opt)
                          setActivePopover(null)
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 10px',
                          background: sortOption === opt ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
                          border: 'none',
                          color: '#fff',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.86rem'
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* APPLIED FILTERS TAGS ROW (Visible whenever activeFiltersCount > 0) */}
          {activeFiltersCount > 0 && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px', padding: '10px 14px', background: 'var(--panel)', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Filters:</span>

              {priceMax < 3000 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '16px', background: 'var(--surface)', border: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text)' }}>
                  Under ZMW {priceMax}
                  <button type="button" onClick={() => setPriceMax(3000)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}>×</button>
                </span>
              )}

              {minRating > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '16px', background: 'var(--surface)', border: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text)' }}>
                  {minRating}+ Stars
                  <button type="button" onClick={() => setMinRating(0)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}>×</button>
                </span>
              )}

              {dateFilter !== 'anytime' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '16px', background: 'var(--surface)', border: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text)' }}>
                  Date: {dateFilter}
                  <button type="button" onClick={() => setDateFilter('anytime')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}>×</button>
                </span>
              )}

              {selectedSellers.length > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '16px', background: 'var(--surface)', border: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text)' }}>
                  Sellers: {selectedSellers.length} selected
                  <button type="button" onClick={() => setSelectedSellers([])} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}>×</button>
                </span>
              )}

              <button
                type="button"
                onClick={clearAllFilters}
                style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, marginLeft: 'auto' }}
              >
                Clear
              </button>
            </div>
          )}

          {/* Search Grid Layout (Left Sidebar on Desktop + Results Grid) */}
          <div className="search-grid-layout" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px' }}>
            {/* Left Sidebar (Desktop Only) */}
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

                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '0.84rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input type="checkbox" checked={includeSellers} onChange={(e) => setIncludeSellers(e.target.checked)} />
                        <span>Sellers</span>
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
                  <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)' }}>Try broadening your search term or clearing filters.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                  {displayListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      saved={savedIds.includes(String(listing.id))}
                      onOpen={openListing}
                      onToggleSave={toggleSave}
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
            top: '105px',
            marginLeft: 'calc(-50vw + 50%)',
            marginRight: 'calc(-50vw + 50%)',
            overflow: 'hidden',
            height: '400px',
            marginTop: '-24px',
            zIndex: 1,
          }}>
            {/* Gradient */}
            <div style={{ position: 'absolute', bottom: '0', left: 0, width: '100%', height: '100px', background: 'linear-gradient(to bottom, transparent 0%, rgba(11, 15, 23, 0.4) 40%, var(--bg) 100%)', pointerEvents: 'none', zIndex: 4 }} />
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
                    padding: '0 max(28px, calc((100vw - 1200px) / 2))',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Left Side Contrast Overlay */}
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.5) 55%, rgba(15, 23, 42, 0.15) 100%)' }} />

                  {/* Banner Content */}
                  <div style={{ position: 'relative', zIndex: 5, maxWidth: '560px', color: '#ffffff', marginBottom: '80px' }}>
                    <span style={{ display: 'inline-block', padding: '5px 14px', backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '14px', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                      {slide.badge}
                    </span>
                    <h2 style={{ fontFamily: 'Times New Roman', fontSize: '2.1rem', fontWeight: 600, margin: '0 0 16px 0', lineHeight: 1.25, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                      {slide.title}
                    </h2>
                  </div>
                </div>
              ))}
            </div>

            {/* Carousel Navigation Indicator Dots */}
            <div style={{ position: 'absolute', bottom: '150px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 10 }}>
              {promoSlides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  style={{
                    width: idx === currentSlide ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    backgroundColor: idx === currentSlide ? '#2563eb' : 'rgba(255, 255, 255, 0.5)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Overlapping Elevated Content Sheet (Scrolls Over Faded Hero Background) */}
          <div style={{
            position: 'relative',
            zIndex: 10,
            marginTop: '-100px',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            marginLeft: 'calc(-50vw + 50%)',
            marginRight: 'calc(-50vw + 50%)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '36px',
            backgroundColor: 'var(--bg, #ffffff)',
            //background: 'linear-gradient(to bottom, transparent 0%, var(--bg) 10%)'
          }}>
            {/* SECTION 1: TODAY'S PICKS */}
            {latestListings.length > 0 && (
              <section className="marketplace-feed">
                <div className="marketplace-feed-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Latest Picks</h2>
                    <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                      Lusaka, Zambia • {distanceFilter === 100 ? 'Any distance' : `Within ${distanceFilter} km`} • Latest
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
                    <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>Most viewed & featured listings in your region</p>
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

            {/* SECTION 3: ELECTRONICS & TECH */}
            {electronicsListings.length > 0 && (
              <section className="marketplace-feed">
                <div className="marketplace-feed-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Electronics & Tech</h2>
                    <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>Computers, mobile phones, audio gear & accessories</p>
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
                    <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>Clothing, sneakers, watches & boutique collections</p>
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
          </div>
        </div>
      )}

      {/* MOBILE SORT AND FILTER SLIDE-OVER BOTTOM SHEET */}
      {isMobileFilterOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', boxSizing: 'border-box' }}>
          <div style={{ width: '100%', maxWidth: '440px', background: '#181818', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', border: '1px solid #333', padding: '16px 16px 24px 16px', color: '#fff', maxHeight: '88vh', overflowY: 'auto', boxSizing: 'border-box', margin: '0 auto' }}>
            {/* Drag handle indicator */}
            <div style={{ width: '36px', height: '4px', background: '#444', borderRadius: '2px', margin: '0 auto 12px auto' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, letterSpacing: '0.04em' }}>SORT AND FILTER</h3>
              <button type="button" onClick={() => setIsMobileFilterOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}>
                <span className="material-icons" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', boxSizing: 'border-box' }}>
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
