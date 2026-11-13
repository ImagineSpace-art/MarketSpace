import { useEffect, useState, useMemo, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import type { Listing, BusinessProfile, BusinessAd } from '../types'
import { Listing as ListingView } from '../components/Listing'
import { getBrowseListings, groupNewArrivalsIntoRows, isBestSeller, isNewArrival } from '../utils/listingSections'
import { supabase } from '../lib/supabaseClient'
import { recordBoostEvent } from '../utils/visibilityBoosts'
import { useTopScrollExpandableHero } from '../hooks/useTopScrollExpandableHero'
import { CATEGORY_OPTIONS, CONDITION_OPTIONS } from '../features/marketplace/constants'
import { filterBrowseListings, getBrowseListingLocation, getBrowseSellerOptions, type BrowseFilters } from '../utils/browseFilters'

type BrowsePageProps = {
  listings: Listing[]
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  allBusinesses?: Record<string, BusinessProfile>
  savedIds: string[]
  onToggleSave: (id: number) => void
  onAddToCart: (item: { id: number | string; title: string; price: number; image?: string; sellerName?: string; sellerUserId?: string }) => void
  onOpenListing: (listing: Listing) => void
  session?: Session | null
  globalRenewalFrequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  globalRenewalDay?: string
}

function MarketplaceAdCard({ ad, session }: { ad: BusinessAd & { sellerName: string; sellerUserId: string }, session?: Session | null }) {
  const navigate = useNavigate()
  const media = ad.media || []
  const mediaTypes = ad.mediaTypes || media.map(() => 'image' as const)
  const [activeMedia, setActiveMedia] = useState(0)
  const [userInterrupted, setUserInterrupted] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [liked, setLiked] = useState(false)
  const [comments, setComments] = useState<Array<{ id: string, user_id: string, content: string, created_at: string }>>([])
  const [comment, setComment] = useState('')
  const [engagementBusy, setEngagementBusy] = useState(false)

  const imagesOnly = media.length > 0 && mediaTypes.every(type => type === 'image')

  useEffect(() => {
    if (!ad.promoted || !ad.boost_id) return
    void recordBoostEvent(ad.boost_id, 'impression')
      .catch(error => console.warn(error instanceof Error ? error.message : 'Ad boost impression could not be recorded.'))
  }, [ad.promoted, ad.boost_id])

  useEffect(() => {
    if (!imagesOnly || userInterrupted || media.length < 2) return
    const timer = window.setInterval(() => setActiveMedia(index => (index + 1) % media.length), 2500)
    return () => window.clearInterval(timer)
  }, [imagesOnly, media.length, userInterrupted])

  useEffect(() => {
    let active = true
    const load = async () => {
      const [{ count }, { data: currentLike }, { data: commentRows }] = await Promise.all([
        supabase.from('ad_likes').select('user_id', { count: 'exact', head: true }).eq('ad_id', ad.id),
        session ? supabase.from('ad_likes').select('user_id').eq('ad_id', ad.id).eq('user_id', session.user.id).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from('ad_comments').select('id,user_id,content,created_at').eq('ad_id', ad.id).order('created_at', { ascending: false }).limit(20),
      ])
      if (!active) return
      setLikeCount(count || 0)
      setLiked(Boolean(currentLike))
      setComments(commentRows || [])
    }
    void load()
    return () => { active = false }
  }, [ad.id, session?.user?.id])

  const selectMedia = (index: number) => {
    setUserInterrupted(true)
    setActiveMedia(index)
  }

  const toggleLike = async () => {
    if (!session) { navigate('/login'); return }
    setEngagementBusy(true)
    if (liked) await supabase.from('ad_likes').delete().eq('ad_id', ad.id).eq('user_id', session.user.id)
    else await supabase.from('ad_likes').insert({ ad_id: ad.id, user_id: session.user.id })
    setLiked(!liked)
    setLikeCount(count => Math.max(0, count + (liked ? -1 : 1)))
    setEngagementBusy(false)
  }

  const submitComment = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!session) { navigate('/login'); return }
    if (!comment.trim()) return
    setEngagementBusy(true)
    const { data, error } = await supabase.from('ad_comments').insert({ ad_id: ad.id, user_id: session.user.id, content: comment.trim() }).select('id,user_id,content,created_at').single()
    if (!error && data) setComments(current => [data, ...current])
    setComment('')
    setEngagementBusy(false)
  }

  const destination = ad.destinationUrl || (ad.listingId ? `/listings/${ad.listingId}` : `/store/${ad.sellerUserId}`)
  const currentType = mediaTypes[activeMedia] || 'image'

  return (
    <article style={{ borderRadius: 24, overflow: 'hidden', minHeight: 280, background: '#0f172a', position: 'relative', color: '#fff' }}>
      <div style={{ height: 320, position: 'relative', overflow: 'hidden', background: '#111827' }}>
        {media[activeMedia] && currentType === 'video'
          ? <video key={media[activeMedia]} src={media[activeMedia]} controls muted preload="metadata" playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', background: '#111827' }} />
          : media[activeMedia] && <img src={media[activeMedia]} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(15,23,42,.92), rgba(15,23,42,.18))', pointerEvents: 'none' }} />
        <Link
          to={destination}
          aria-label={`View ${ad.headline || ad.adTitle || 'advertisement'}`}
          onClick={event => {
            if (!ad.promoted || !ad.boost_id) return
            event.preventDefault()
            void recordBoostEvent(ad.boost_id, 'click')
              .catch(error => console.warn(error instanceof Error ? error.message : 'Ad boost click could not be recorded.'))
              .finally(() => window.location.assign(destination))
          }}
          style={{ position: 'absolute', inset: 0, zIndex: 3, color: 'inherit', textDecoration: 'none', pointerEvents: 'none' }}
        >
          <div style={{ padding: '24px 28px 56px', maxWidth: 360, pointerEvents: 'none' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', opacity: .8 }}>Sponsored{ad.promoted ? ' · Promoted' : ''} · {ad.sellerName}</span>
            <h3 style={{ fontSize: 'clamp(1.35rem, 2vw, 1.75rem)', margin: '10px 0 8px', lineHeight: 1.05 }}>{ad.headline || ad.adTitle}</h3>
            <p style={{ margin: '0 0 18px', opacity: .88, lineHeight: 1.45, fontSize: '.88rem', maxHeight: 72, overflow: 'hidden' }}>{ad.adText}</p>
            <span style={{ display: 'inline-flex', pointerEvents: 'auto', borderRadius: 999, padding: '10px 18px', background: '#fff', color: '#0f172a', fontWeight: 800 }}>{ad.buttonLabel || 'View'}</span>
          </div>
        </Link>
      </div>
      {media.length > 1 && (
        <div style={{ position: 'absolute', zIndex: 5, right: 14, top: 286, display: 'flex', gap: 7 }}>
          {media.map((_, index) => <button key={index} type="button" aria-label={`Show ad media ${index + 1}`} onClick={() => selectMedia(index)} style={{ width: 8, height: 8, borderRadius: '50%', border: 0, padding: 0, cursor: 'pointer', background: index === activeMedia ? '#fff' : 'rgba(255,255,255,.45)' }} />)}
        </div>
      )}
      <div style={{ background: '#fff', color: '#0f172a', padding: '12px 16px', position: 'relative', zIndex: 4 }}>
        <button type="button" disabled={engagementBusy} onClick={toggleLike} style={{ border: 0, background: 'none', cursor: 'pointer', fontWeight: 800, color: liked ? '#ea580c' : '#334155' }}>♥ {likeCount}</button>
        <form onSubmit={submitComment} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input value={comment} onChange={event => setComment(event.target.value)} maxLength={1000} placeholder={session ? 'Write a comment…' : 'Sign in to comment…'} style={{ flex: 1, minWidth: 0, border: '1px solid #e2e8f0', borderRadius: 999, padding: '8px 12px' }} />
          <button type="submit" disabled={engagementBusy || !comment.trim()} style={{ borderRadius: 999, border: 0, padding: '8px 12px', background: '#ea580c', color: '#fff', fontWeight: 800 }}>Post</button>
        </form>
        {comments.slice(0, 3).map(item => <p key={item.id} style={{ margin: '8px 0 0', fontSize: '.86rem' }}><strong>{item.user_id === session?.user.id ? 'You' : 'MarketSpace user'}</strong> {item.content}</p>)}
      </div>
    </article>
  )
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
  session,
  globalRenewalFrequency = 'weekly',
  globalRenewalDay = 'Monday',
}: BrowsePageProps) {
  const [searchParams] = useSearchParams()
  const initialFilter = searchParams.get('category') || searchParams.get('filter')
  const initialCategory = initialFilter === 'new' || initialFilter === 'bestseller' ? 'All' : initialFilter || 'All'
  const [filters, setFilters] = useState<BrowseFilters>({
    categories: initialCategory === 'All' ? [] : [initialCategory],
    locations: [],
    conditions: [],
    sellers: [],
    ratings: [],
    minPrice: '',
    maxPrice: '',
  })
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [sortBy, setSortBy] = useState('featured')
  const [quickViewListing, setQuickViewListing] = useState<Listing | null>(null)
  const [categoryLoopCopies, setCategoryLoopCopies] = useState(2)
  const categoryRailRef = useRef<HTMLDivElement>(null)
  const { isExpanded: isHeroExpanded, setIsExpanded: setIsHeroExpanded, headerOffset } = useTopScrollExpandableHero()

  const categories = [
    {
      id: 'fashion',
      name: 'Fashion',
      filterCategory: 'Fashion',
      title: 'Fashion & Apparel',
      image: '/illustrations/cat_fashion.jpg',
      count: '1,240+ Items',
    },
    {
      id: 'electronics',
      name: 'Electronics',
      filterCategory: 'Electronics',
      title: 'Audio & Tech',
      image: '/illustrations/cat_electronics.jpg',
      count: '820+ Items',
    },
    {
      id: 'beauty',
      name: 'Beauty',
      filterCategory: 'Beauty',
      title: 'Beauty & Skincare',
      image: '/illustrations/cat_beauty.jpg',
      count: '340+ Items',
    },
    {
      id: 'fitness',
      name: 'Fitness',
      filterCategory: 'Sports',
      title: 'Fitness & Sports',
      image: '/illustrations/banner_summer_collection.jpg',
      count: '490+ Items',
    },
    {
      id: 'homedecor',
      name: 'Home Decor',
      filterCategory: 'Home & Garden',
      title: 'Home & Living',
      image: '/illustrations/cat_homedecor.jpg',
      count: '610+ Items',
    },
    {
      id: 'accessories',
      name: 'Accessories',
      filterCategory: 'Fashion',
      title: 'Watches & Accessories',
      image: '/illustrations/cat_accessories.jpg',
      count: '430+ Items',
    },
  ]

  useEffect(() => {
    const rail = categoryRailRef.current
    if (!rail) return
    const updateCopies = () => {
      const minimumGroupWidth = (190 + 14) * categories.length
      setCategoryLoopCopies(Math.max(2, Math.ceil(rail.clientWidth / minimumGroupWidth) + 1))
    }
    updateCopies()
    const observer = new ResizeObserver(updateCopies)
    observer.observe(rail)
    return () => observer.disconnect()
  }, [categories.length])

  const marketplaceAds = useMemo(() => {
    const now = Date.now()
    return Object.values(allBusinesses).flatMap((business): Array<BusinessAd & { sellerName: string; sellerUserId: string }> => {
      if (!business.userId) return []
      return (business.ads || []).filter((ad) => {
        if (ad.moderation_status !== 'approved' || ad.status !== 'Active') return false
        if (ad.placements && !ad.placements.includes('Marketplace') && !ad.placements.includes('Feed')) return false
        const start = ad.startDate ? new Date(`${ad.startDate}T00:00:00`).getTime() : 0
        if (start && start > now) return false
        if (ad.scheduleType === 'end_date' && ad.endDate && new Date(`${ad.endDate}T23:59:59`).getTime() < now) return false
        return true
      }).map((ad) => ({
        ...ad,
        destinationUrl: ad.listingId ? `/listings/${ad.listingId}` : `/store/${business.userId}`,
        sellerName: business.shopName || 'MarketSpace Seller',
        sellerUserId: business.userId,
      }))
    }).sort((a, b) => Number(Boolean(b.promoted)) - Number(Boolean(a.promoted))).slice(0, 8)
  }, [allBusinesses])

  const browseListings = useMemo(
    () => getBrowseListings(listings, globalRenewalFrequency, globalRenewalDay),
    [globalRenewalDay, globalRenewalFrequency, listings]
  )

  useEffect(() => {
    if (!isFiltersOpen) return
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsFiltersOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [isFiltersOpen])

  const locationOptions = useMemo(
    () => [...new Set(browseListings.map(listing => getBrowseListingLocation(listing, allBusinesses)).filter((location): location is string => Boolean(location)))].sort(),
    [allBusinesses, browseListings]
  )

  const sellerOptions = useMemo(
    () => getBrowseSellerOptions(browseListings, allBusinesses),
    [allBusinesses, browseListings]
  )

  const filteredCatalog = useMemo(
    () => filterBrowseListings(browseListings, allBusinesses, filters, searchQuery),
    [allBusinesses, browseListings, filters, searchQuery]
  )

  const newArrivals = useMemo(
    () => filteredCatalog
      .filter((listing) => isNewArrival(listing))
      .sort((a, b) => Date.parse(b.created_at!) - Date.parse(a.created_at!)),
    [filteredCatalog]
  )

  const newArrivalRows = useMemo(() => groupNewArrivalsIntoRows(newArrivals), [newArrivals])

  const bestSellers = useMemo(
    () => filteredCatalog
      .filter((listing) => isBestSeller(listing))
      .sort((a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0)),
    [filteredCatalog]
  )

  const storeListings = useMemo(
    () => filteredCatalog.filter(listing => Boolean(listing.user_id && allBusinesses[listing.user_id]?.shopName)),
    [allBusinesses, filteredCatalog]
  )

  const sortedCatalog = useMemo(() => {
    return [...filteredCatalog].sort((a, b) => {
      const promotedOrder = Number(Boolean(b.promoted)) - Number(Boolean(a.promoted))
      if (promotedOrder) return promotedOrder
      if (sortBy === 'price-low') return Number(a.price) - Number(b.price)
      if (sortBy === 'price-high') return Number(b.price) - Number(a.price)
      if (sortBy === 'latest') return Number(b.id) - Number(a.id)
      return 0
    })
  }, [filteredCatalog, sortBy])

  const activeFilterCount = filters.categories.length
    + filters.locations.length
    + filters.conditions.length
    + filters.sellers.length
    + filters.ratings.length
    + Number(filters.minPrice !== '')
    + Number(filters.maxPrice !== '')

  const toggleFilterOption = (key: 'categories' | 'locations' | 'conditions' | 'sellers' | 'ratings', value: string) => {
    setFilters(current => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter(item => item !== value)
        : [...current[key], value],
    }))
  }

  const clearFilters = () => setFilters({
    categories: [],
    locations: [],
    conditions: [],
    sellers: [],
    ratings: [],
    minPrice: '',
    maxPrice: '',
  })

  const scrollToCatalog = () => {
    const el = document.getElementById('marketplace-catalog')
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div
      className="browse-page-wrapper"
      style={{
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
        minHeight: '100vh',
        fontFamily: 'inherit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <button
        type="button"
        className="browse-floating-filter-trigger"
        onClick={() => setIsFiltersOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isFiltersOpen}
        aria-label={`Open filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ''}`}
      >
        <span className="material-icons" aria-hidden="true">tune</span>
        <span>Filters</span>
        {activeFilterCount > 0 && <span className="browse-filter-count">{activeFilterCount}</span>}
      </button>

      {/* ---------------- 1. HERO SECTION (NovaTrend Style) ---------------- */}
      <section
        className={`browse-hero${isHeroExpanded ? ' is-expanded' : ' is-compact'}`}
        style={{ top: `${headerOffset}px` }}
        aria-label="Browse page introduction"
      >
        <div className="browse-hero-compact-bar">
          <strong>Discover Products You&apos;ll Love</strong>
          <button
            type="button"
            className="browse-hero-toggle"
            aria-expanded={isHeroExpanded}
            aria-controls="browse-hero-details"
            onClick={() => setIsHeroExpanded((expanded) => !expanded)}
          >
            <span>{isHeroExpanded ? 'Hide banner' : 'Show full banner'}</span>
            <span className="material-icons" aria-hidden="true">
              {isHeroExpanded ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>
        <div
          id="browse-hero-details"
          className="browse-hero-details"
          aria-hidden={!isHeroExpanded}
          inert={!isHeroExpanded}
        >
          <div className="browse-hero-details-inner">
        <div className="browse-hero-copy">
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
            and stores.
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
        <div className="browse-hero-visual" style={{ position: 'relative', minHeight: '440px', display: 'flex', justifyContent: 'center' }}>
          {/* Image */}
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
              src="/illustrations/cat_sneaker.jpg"
              alt="Lifestyle Shopper"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>
          <button
            type="button"
            className="browse-hero-toggle browse-hero-collapse"
            aria-expanded={isHeroExpanded}
            aria-controls="browse-hero-details"
            onClick={() => setIsHeroExpanded(false)}
          >
            <span>Collapse banner</span>
            <span className="material-icons" aria-hidden="true">expand_less</span>
          </button>
          </div>
        </div>
      </section>

      {/* ---------------- 2. VALUE PROPOSITIONS BAR ---------------- */}
      {/* <section style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', backgroundColor: '#fcfcfd', padding: '24px 0' }}>
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
      </section> */}

      <section id="browse-store-listings" className="browse-store-listings-section" style={{ maxWidth: '1280px', margin: '12px auto 40px', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>Store Listings</h2>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '0.88rem' }}>Products from MarketSpace storefronts.</p>
          </div>
          <button type="button" onClick={scrollToCatalog} className="secondary-btn">Browse all listings</button>
        </div>
        {storeListings.length === 0 ? (
          <div className="section-card" style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              {searchQuery ? `No store listings match "${searchQuery}" in this category.` : 'No store listings are available in this category yet.'}
            </p>
          </div>
        ) : (
          <div className="marketplace-listing-grid">
            {storeListings.map((listing) => (
              <ListingView
                key={listing.id}
                listing={listing}
                saved={savedIds.includes(String(listing.id))}
                onOpen={onOpenListing}
                onToggleSave={onToggleSave}
                allBusinesses={allBusinesses}
              />
            ))}
          </div>
        )}
      </section>

      {/* ---------------- 3. SHOP BY CATEGORIES ---------------- */}
      <section className="shop-category-section" style={{ maxWidth: '1280px', margin: '54px auto 40px', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Shop by Categories
          </h2>
          <button
            type="button"
            onClick={() => {
              setFilters(current => ({ ...current, categories: [] }))
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

        <div className="shop-category-rail" ref={categoryRailRef}>
          <div className="shop-category-track">
            {[0, 1].map(groupIndex => (
              <div
                key={groupIndex}
                className="shop-category-track-group"
                aria-hidden={groupIndex > 0}
                inert={groupIndex > 0}
              >
                {Array.from({ length: categoryLoopCopies }, (_, cycleIndex) => (
                  <div
                    key={cycleIndex}
                    className="shop-category-track-cycle"
                    aria-hidden={cycleIndex > 0}
                    inert={cycleIndex > 0}
                  >
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        className="shop-category-card"
                        onClick={() => {
                          setFilters(current => ({ ...current, categories: [cat.filterCategory] }))
                          scrollToCatalog()
                        }}
                        style={{ padding: 0, cursor: 'pointer', textAlign: 'left' }}
                      >
                        <div className="shop-category-image">
                          <img src={cat.image} alt={cat.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div className="shop-category-caption">
                          <strong style={{ display: 'block', fontSize: '0.92rem', color: '#0f172a', marginBottom: '2px' }}>
                            {cat.name}
                          </strong>
                          <span style={{ fontSize: '0.76rem', color: '#ea5808', fontWeight: 700 }}>Shop Now →</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {newArrivals.length > 0 && <section id="new-arrivals" className="new-arrivals-section" style={{ maxWidth: '1280px', margin: '54px auto 40px', padding: '0 24px' }}>
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

        <div className="new-arrivals-rows">
          {newArrivalRows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="new-arrivals-row"
              role="region"
              aria-label={`New arrivals, row ${rowIndex + 1}`}
              tabIndex={0}
            >
              {row.map((listing) => (
                <ListingView
                  key={listing.id}
                  listing={listing}
                  saved={savedIds.includes(String(listing.id))}
                  onOpen={onOpenListing}
                  onToggleSave={onToggleSave}
                  allBusinesses={allBusinesses}
                />
              ))}
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
          <div className="marketplace-listing-grid">
            {bestSellers.slice(0, 5).map((listing) => (
              <ListingView
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
      {marketplaceAds.length > 0 && (
        <section style={{ maxWidth: '1280px', margin: '48px auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>Sponsored</span>
              <h2 style={{ margin: '4px 0 0', fontSize: '1.55rem', color: '#0f172a' }}>Promoted on MarketSpace</h2>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 20 }}>
            {marketplaceAds.map((ad) => <MarketplaceAdCard key={ad.id} ad={ad} session={session} />)}
          </div>
        </section>
      )}

      {/* ---------------- 6. COMPLETE MARKETPLACE CATALOG (Filterable) ---------------- */}
      <section id="marketplace-catalog" style={{ maxWidth: '1280px', margin: '60px auto 60px', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0 0 4px 0', color: '#0f172a' }}>
              Explore All Marketplace Listings
            </h2>
            <span style={{ fontSize: '0.86rem', color: '#64748b' }}>
              Showing {sortedCatalog.length} active items & services across stores
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

        {/* Listings Grid */}
        {sortedCatalog.length === 0 ? (
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
                clearFilters()
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
          <div className="marketplace-listing-grid">
            {sortedCatalog.map((item) => {
              return (
                <ListingView
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

      {isFiltersOpen && (
        <div className="browse-filter-backdrop" onClick={() => setIsFiltersOpen(false)}>
          <aside
            className="browse-filter-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="browse-filter-title"
            onClick={event => event.stopPropagation()}
          >
            <header className="browse-filter-header">
              <div>
                <h2 id="browse-filter-title">Filter results</h2>
                <p>Filters apply to all listing sections.</p>
              </div>
              <button type="button" className="browse-filter-close" aria-label="Close filters" onClick={() => setIsFiltersOpen(false)}>
                <span className="material-icons" aria-hidden="true">close</span>
              </button>
            </header>

            <div className="browse-filter-content">
              <fieldset className="browse-filter-group">
                <legend>Categories</legend>
                <p className="browse-filter-hint">Choose one or more. Leave all unchecked to search every category.</p>
                {CATEGORY_OPTIONS.filter(category => category !== 'All').map(category => (
                  <label className="browse-filter-option" key={category}>
                    <input type="checkbox" checked={filters.categories.includes(category)} onChange={() => toggleFilterOption('categories', category)} />
                    <span>{category}</span>
                  </label>
                ))}
              </fieldset>

              <fieldset className="browse-filter-group">
                <legend>Location</legend>
                {locationOptions.length > 0
                  ? locationOptions.map(location => (
                    <label className="browse-filter-option" key={location}>
                      <input type="checkbox" checked={filters.locations.includes(location)} onChange={() => toggleFilterOption('locations', location)} />
                      <span>{location}</span>
                    </label>
                  ))
                  : <p className="browse-filter-hint">No listing locations are currently available.</p>}
              </fieldset>

              <fieldset className="browse-filter-group">
                <legend>Condition</legend>
                {CONDITION_OPTIONS.map(condition => (
                  <label className="browse-filter-option" key={condition}>
                    <input type="checkbox" checked={filters.conditions.includes(condition)} onChange={() => toggleFilterOption('conditions', condition)} />
                    <span>{condition}</span>
                  </label>
                ))}
              </fieldset>

              <fieldset className="browse-filter-group">
                <legend>Seller / Store</legend>
                {sellerOptions.map(seller => (
                  <label className="browse-filter-option" key={seller.id}>
                    <input type="checkbox" checked={filters.sellers.includes(seller.id)} onChange={() => toggleFilterOption('sellers', seller.id)} />
                    <span>{seller.label}</span>
                  </label>
                ))}
              </fieldset>

              <fieldset className="browse-filter-group">
                <legend>Price</legend>
                <div className="browse-filter-price-fields">
                  <label>
                    <span>Minimum</span>
                    <input type="number" min="0" step="any" value={filters.minPrice} onChange={event => setFilters(current => ({ ...current, minPrice: event.target.value }))} placeholder="No minimum" />
                  </label>
                  <label>
                    <span>Maximum</span>
                    <input type="number" min="0" step="any" value={filters.maxPrice} onChange={event => setFilters(current => ({ ...current, maxPrice: event.target.value }))} placeholder="No maximum" />
                  </label>
                </div>
              </fieldset>

              <fieldset className="browse-filter-group">
                <legend>Rating</legend>
                <p className="browse-filter-hint">If multiple ratings are checked, the highest minimum applies.</p>
                {[
                  { value: '3', label: '3 stars & up' },
                  { value: '4', label: '4 stars & up' },
                  { value: '4.5', label: '4.5 stars & up' },
                ].map(rating => (
                  <label className="browse-filter-option" key={rating.value}>
                    <input type="checkbox" checked={filters.ratings.includes(rating.value)} onChange={() => toggleFilterOption('ratings', rating.value)} />
                    <span>{rating.label}</span>
                  </label>
                ))}
              </fieldset>
            </div>

            <footer className="browse-filter-footer">
              <button type="button" className="browse-filter-reset" onClick={clearFilters}>Reset filters</button>
              <button type="button" className="browse-filter-show" onClick={() => setIsFiltersOpen(false)}>Show {sortedCatalog.length} results</button>
            </footer>
          </aside>
        </div>
      )}

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
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>In-app seller messaging</span>
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
