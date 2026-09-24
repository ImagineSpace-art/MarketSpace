import type { Listing, BusinessProfile } from '../types'
import { formatZMWPrice } from '../utils/formatPrice'

type ListingCardProps = {
  listing: Listing
  saved?: boolean
  onOpen: (listing: Listing) => void
  onToggleSave?: (listingId: number) => void
  onAddToCart?: (listing: Listing) => void
  onQuickPeek?: (listing: Listing) => void
  allBusinesses?: Record<string, BusinessProfile>
  onVisitStore?: (storeUserId: string) => void
}

const categoryIcons: Record<string, string> = {
  Electronics: 'devices',
  Furniture: 'chair',
  Fashion: 'checkroom',
  Vehicles: 'directions_car',
  'Home & Garden': 'yard',
  Sports: 'sports_soccer',
  Accessories: 'watch',
  Beauty: 'spa',
  Toys: 'smart_toy',
}

export function ListingCard({ listing, saved = false, onOpen, onToggleSave, onAddToCart, onQuickPeek, allBusinesses, onVisitStore }: ListingCardProps) {
  const hasImage = Boolean(listing.images && listing.images.length > 0)
  const mainImage = hasImage ? listing.images![0] : null

  // Check if seller owns a registered business store
  const sellerStore: BusinessProfile | null = (() => {
    if (listing.user_id && allBusinesses?.[listing.user_id]?.shopName) {
      return allBusinesses[listing.user_id]
    }
    try {
      const cached = localStorage.getItem('marketspace-all-businesses')
      if (cached && listing.user_id) {
        const parsed = JSON.parse(cached)
        if (parsed[listing.user_id]?.shopName) {
          return parsed[listing.user_id]
        }
      }
    } catch {
      // fallback
    }
    return null
  })()

  // Determine badges to display
  const isSold = listing.status?.toLowerCase() === 'sold' || listing.status?.toLowerCase() === 'out of stock'
  const isNew = listing.condition?.toLowerCase().includes('new') ||
    (listing.created_at && (Date.now() - new Date(listing.created_at).getTime()) < 14 * 24 * 60 * 60 * 1000)
  const isBestSeller = Boolean(listing.sponsored) || (listing.rating !== undefined && listing.rating >= 4.5)

  // Calculate discount percentage if lowest_acceptable_price or original price is available
  const hasDiscount = Boolean(
    listing.lowest_acceptable_price &&
    listing.lowest_acceptable_price > listing.price
  )
  const discountPercent = hasDiscount
    ? Math.round(((listing.lowest_acceptable_price! - listing.price) / listing.lowest_acceptable_price!) * 100)
    : 0

  // Color swatches from available_colors (can be more than one)
  const swatches = listing.available_colors && listing.available_colors.length > 0
    ? listing.available_colors
    : []

  return (
    <article
      className={`listing-card marketplace-listing-card modern-listing-card ${listing.sponsored ? 'sponsored' : ''}`}
      onClick={() => onOpen(listing)}
      style={{ cursor: 'pointer' }}
    >
      {/* 1. TOP IMAGE CONTAINER */}
      <div className="modern-card-image-box">
        {/* Top-Left Pill Badges */}
        <div className="modern-card-badges">
          {isBestSeller && (
            <span className="modern-pill-badge black-pill">
              Best Seller
            </span>
          )}
          {isNew && (
            <span className="modern-pill-badge black-pill">
              <span className="badge-dot green-dot" />
              New
            </span>
          )}
          {isSold && (
            <span className="modern-pill-badge muted-pill">
              Sold out
            </span>
          )}
          {hasDiscount && discountPercent > 0 && (
            <span className="modern-pill-badge black-pill">
              <span className="badge-dot orange-dot" />
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Top-Right Bookmark Button */}
        <div className="modern-card-actions">
          <button
            type="button"
            className="modern-bookmark-btn"
            onClick={(e) => {
              e.stopPropagation()
              onToggleSave?.(Number(listing.id))
            }}
            title={saved ? 'Remove Bookmark' : 'Bookmark Listing'}
            aria-label={saved ? 'Remove Bookmark' : 'Bookmark Listing'}
          >
            <span
              className="material-icons"
              style={{
                fontSize: '16px',
                color: saved ? '#ef4444' : 'var(--text-muted, #71717a)'
              }}
            >
              {saved ? 'bookmark' : 'bookmark_border'}
            </span>
          </button>
        </div>

        {/* Product Silhouette Image or Fallback */}
        {mainImage ? (
          <img
            src={mainImage}
            alt={listing.title}
            className="modern-card-img"
            loading="lazy"
          />
        ) : (
          <div className="modern-card-img-placeholder">
            <span className="material-icons" style={{ fontSize: '36px', color: 'var(--text-muted, #94a3b8)', opacity: 0.7 }}>
              {categoryIcons[listing.category] || 'local_mall'}
            </span>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted, #94a3b8)', fontWeight: 600 }}>
              {listing.category}
            </span>
          </div>
        )}
      </div>

      {/* 2. BOTTOM INFO PANEL */}
      <div className="modern-card-info">
        {/* Category & Seller Identity Distinction */}
        {sellerStore ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#2563eb',
              backgroundColor: 'rgba(37, 99, 235, 0.08)',
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(37, 99, 235, 0.2)'
            }}>
              <span className="material-icons" style={{ fontSize: '13px', color: '#2563eb' }}>storefront</span>
              <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {sellerStore.shopName}
              </span>
              <span className="material-icons" style={{ fontSize: '12px', color: '#3b82f6' }} title="Verified Store">verified</span>
            </span>
            <span className="modern-card-category" style={{ margin: 0 }}>
              {listing.category || 'General'}
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              color: 'var(--text-muted, #71717a)',
              backgroundColor: 'var(--surface, rgba(0,0,0,0.04))',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              Individual Seller
            </span>
            <span className="modern-card-category" style={{ margin: 0 }}>
              {listing.category || 'General'}
            </span>
          </div>
        )}

        {/* Product Title (Refined lightweight font) */}
        <h3 className="modern-card-title" title={listing.title}>
          {listing.title}
        </h3>

        {/* Centered Refined Price Display */}
        <div className="modern-card-price-row">
          <span className="modern-card-price">
            {formatZMWPrice(listing.price)}
          </span>
          {hasDiscount && (
            <span className="modern-card-original-price">
              {formatZMWPrice(listing.lowest_acceptable_price!)}
            </span>
          )}
        </div>

        {/* Centered Color Swatches (Supports multiple available colors) */}
        {swatches.length > 0 ? (
          <div className="modern-card-swatches" onClick={(e) => e.stopPropagation()}>
            {swatches.map((color, idx) => (
              <span
                key={idx}
                className="modern-color-dot"
                style={{ backgroundColor: color }}
                title={`Available in ${color}`}
              />
            ))}
          </div>
        ) : null}

        {/* Add to Cart, Visit Store & Quick Peek Actions Row */}
        <div className="modern-card-actions-group" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
          <button
            type="button"
            className="modern-card-cart-btn"
            onClick={(e) => {
              e.stopPropagation()
              if (onAddToCart) {
                onAddToCart(listing)
              } else {
                onOpen(listing)
              }
            }}
            title={`Add ${listing.title} to Cart`}
            aria-label={`Add ${listing.title} to Cart`}
            style={{ flex: sellerStore ? '1 1 50%' : '1 1 100%' }}
          >
            <span className="material-icons" style={{ fontSize: '13.5px' }}>shopping_bag</span>
            <span>Add to Cart</span>
          </button>

          {sellerStore && (
            <button
              type="button"
              className="modern-card-visit-store-btn"
              onClick={(e) => {
                e.stopPropagation()
                if (onVisitStore) {
                  onVisitStore(sellerStore.userId)
                } else {
                  window.location.href = `/store/${sellerStore.userId}`
                }
              }}
              title={`Visit ${sellerStore.shopName}'s official storefront`}
              aria-label={`Visit ${sellerStore.shopName}'s official storefront`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(37, 99, 235, 0.35)',
                background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(59, 130, 246, 0.15))',
                color: '#2563eb',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                flex: '1 1 auto',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2563eb'
                e.currentTarget.style.color = '#ffffff'
                e.currentTarget.style.borderColor = '#2563eb'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(59, 130, 246, 0.15))'
                e.currentTarget.style.color = '#2563eb'
                e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.35)'
              }}
            >
              <span className="material-icons" style={{ fontSize: '15px' }}>storefront</span>
              <span>Visit Store</span>
            </button>
          )}

          {onQuickPeek && (
            <button
              type="button"
              className="modern-card-peek-btn"
              onClick={(e) => {
                e.stopPropagation()
                onQuickPeek(listing)
              }}
              title={`Quick Peek: ${listing.title}`}
              aria-label={`Quick Peek: ${listing.title}`}
            >
              <span className="material-icons" style={{ fontSize: '14px' }}>visibility</span>
              <span>Quick Peek</span>
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
