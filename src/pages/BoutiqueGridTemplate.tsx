import { useState, type CSSProperties } from 'react'
import type { BusinessProfile, Listing, StoreReview, StoreCartItem } from '../types'
import { Listing as ListingCard } from '../components/Listing'
import { StoreReportControl } from '../components/StoreReportControl'
import { StoreInfoPanel } from '../components/store-theme/StoreInfoPanel'
import { StoreCartDrawer } from '../components/store-theme/StoreCartDrawer'
import { getStoreTemplateImageUrl } from '../features/store-templates/storeTemplateAssets'
import { STORE_ACCENT_PALETTE } from '../features/store-templates/storeTemplateSchema'
import {
  getBoutiqueGridDepartments,
  getBoutiqueGridListings,
  type BoutiqueGridSortOrder,
} from '../features/store-templates/boutiqueGridModel'

export type BoutiqueGridContent = Record<string, string | undefined>

const SHOW_POWERED_BY_MARKETSPACE = true
const DEFAULT_BANNER_IMAGE = '/illustrations/banner_summer_collection.jpg'
const DEFAULT_LOGO_IMAGE = '/favicon.svg'

type Props = {
  shop: BusinessProfile
  listings: Listing[]
  content: BoutiqueGridContent
  preview?: boolean
  currentUserId?: string
  savedIds?: string[]
  storeReviews?: StoreReview[]
  isFollowing?: boolean
  isNotified?: boolean
  followerCount?: number
  cartCount?: number
  cartItems?: StoreCartItem[]
  onOpenListing?: (listing: Listing) => void
  onToggleSave?: (listingId: number) => void
  onMessageSeller?: () => void
  onToggleFollow?: () => void
  onToggleNotify?: () => void
  onAddReview?: (storeId: string, rating: number, comment: string) => void
  onReplyToReview?: (reviewId: string, replyText: string) => void
  onUpdateCartQuantity?: (listingId: number, quantity: number) => void
  onRemoveCartItem?: (listingId: number) => void
  onClearCart?: () => void
  onOpenCart?: () => void
  onCloseCart?: () => void
  onOpenInfo?: () => void
  onCloseInfo?: () => void
  isCartOpen?: boolean
  isInfoOpen?: boolean
  onRequireSignIn?: () => void
}

function safeImageUrl(value: string | undefined, fallback: string) {
  if (!value) return fallback
  if (/^(https?:\/\/|data:image\/)/i.test(value)) return value
  return getStoreTemplateImageUrl(value)
}

function WhatsAppLink({ shop, number, onMessageSeller }: { shop: BusinessProfile; number?: string; onMessageSeller?: () => void }) {
  const cleanNumber = (number || shop.whatsapp || '').replace(/\D/g, '')
  if (!cleanNumber) {
    return (
      <button className="boutique-contact-button" type="button" onClick={onMessageSeller}>
        Contact store
      </button>
    )
  }
  return (
    <a
      className="boutique-contact-button"
      href={`https://wa.me/${cleanNumber}`}
      target="_blank"
      rel="noreferrer"
      onClick={event => {
        event.stopPropagation()
        if (!number && shop.whatsapp) return
        if (!shop.whatsapp) onMessageSeller?.()
      }}
    >
      WhatsApp
    </a>
  )
}

export function BoutiqueGridTemplate({
  shop,
  listings,
  content,
  preview = false,
  currentUserId = '',
  savedIds = [],
  storeReviews = [],
  isFollowing = false,
  isNotified = false,
  followerCount = 0,
  cartCount = 0,
  cartItems = [],
  onOpenListing,
  onToggleSave,
  onMessageSeller,
  onToggleFollow,
  onToggleNotify,
  onAddReview,
  onReplyToReview,
  onUpdateCartQuantity = () => {},
  onRemoveCartItem = () => {},
  onClearCart,
  onOpenCart,
  onCloseCart = () => {},
  onOpenInfo,
  onCloseInfo = () => {},
  isCartOpen = false,
  isInfoOpen = false,
  onRequireSignIn = () => {},
}: Props) {
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [sortOrder, setSortOrder] = useState<BoutiqueGridSortOrder>('default')
  const [catalogPage, setCatalogPage] = useState(1)
  const [rating, setRating] = useState(0)
  const reviews = storeReviews.filter(review => review.storeId === shop.userId)
  const isOwner = currentUserId === shop.userId && Boolean(currentUserId)

  const departments = getBoutiqueGridDepartments(shop.collections || [], listings)
  const visibleDepartments = departments.slice(0, 1)
  const overflowDepartments = departments.slice(visibleDepartments.length)
  const allCatalogListings = getBoutiqueGridListings(listings, selectedDepartment, sortOrder).slice(0, 40)
  const catalogPageSize = 12
  const catalogPageCount = Math.max(1, Math.ceil(allCatalogListings.length / catalogPageSize))
  const catalogListings = allCatalogListings.slice((catalogPage - 1) * catalogPageSize, catalogPage * catalogPageSize)

  const bannerImage = safeImageUrl(content.bannerImage, DEFAULT_BANNER_IMAGE)
  const logoImage = content.logoImage
    ? safeImageUrl(content.logoImage, DEFAULT_LOGO_IMAGE)
    : shop.logo || DEFAULT_LOGO_IMAGE
  const accent = content.accentColor || STORE_ACCENT_PALETTE[0]
  const whatsappNumber = content.whatsappNumber
  const averageRating = reviews.length
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : null

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className={`boutique-store${preview ? ' boutique-store-preview' : ''}`} style={{ '--boutique-accent': accent } as CSSProperties}>
      <header className="boutique-header">
        <a className="boutique-brand" href="#boutique-top" onClick={event => { event.preventDefault(); scrollTo('boutique-top') }}>
          <img src={logoImage} alt="" />
          <span>{shop.shopName}</span>
        </a>
        <nav className="boutique-nav" aria-label="Store navigation">
          <button type="button" onClick={() => scrollTo('boutique-top')}>Home</button>
          <button type="button" onClick={() => scrollTo('boutique-products')}>Shop</button>
          <button type="button" onClick={() => scrollTo('boutique-about')}>About</button>
          {visibleDepartments.map(department => (
            <button key={department.id} type="button" onClick={() => { setSelectedDepartment(department.id); setCatalogPage(1); scrollTo('boutique-products') }}>{department.name}</button>
          ))}
          {overflowDepartments.length > 0 && (
            <details className="boutique-nav-dropdown">
              <summary>More departments <span aria-hidden="true">⌄</span></summary>
              <div>
                {overflowDepartments.map(department => (
                  <button key={department.id} type="button" onClick={() => { setSelectedDepartment(department.id); setCatalogPage(1); scrollTo('boutique-products') }}>{department.name}</button>
                ))}
              </div>
            </details>
          )}
        </nav>
        {!preview && currentUserId !== shop.userId && (
          <div className="boutique-actions">
            <button type="button" onClick={onToggleFollow} aria-pressed={isFollowing} title={isFollowing ? 'Unfollow store' : 'Follow store'}>
              <span className="material-icons">{isFollowing ? 'favorite' : 'favorite_border'}</span>
              <span className="boutique-action-label">{isFollowing ? 'Following' : 'Follow'}</span>
            </button>
            <button type="button" onClick={onToggleNotify} aria-pressed={isNotified} title={isNotified ? 'Turn off store notifications' : 'Notify me'}>
              <span className="material-icons">{isNotified ? 'notifications_active' : 'notifications_none'}</span>
            </button>
            <button type="button" onClick={onOpenInfo} title="Store information">
              <span className="material-icons">info_outline</span>
            </button>
            <button type="button" onClick={onOpenCart} title="Open cart">
              <span className="material-icons">shopping_bag</span>
              <span>{cartCount}</span>
            </button>
          </div>
        )}
        {preview && <span className="boutique-preview-label">Live preview</span>}
      </header>

      <main id="boutique-top">
        {content.announcementBar && <div className="boutique-announcement">{content.announcementBar}</div>}
        <section className="boutique-hero boutique-catalog-banner" style={{ backgroundImage: `url("${bannerImage}")` }}>
          <div className="boutique-catalog-title">
            <h1>{content.shopHeading || 'Shop'}</h1>
            <p><button type="button" onClick={() => scrollTo('boutique-top')}>Home</button><span>/</span> {content.shopHeading || 'Shop'}</p>
          </div>
          <div className="boutique-store-status">
            {shop.verifiedId && <span><span className="material-icons">verified</span> Identity verified</span>}
            {shop.verifiedLocation && <span><span className="material-icons">location_on</span> Location checked</span>}
            {shop.registeredBusiness && <span><span className="material-icons">workspace_premium</span> Registered business</span>}
            {shop.probationState === 'probation' && <span className="boutique-new-seller">New seller</span>}
          </div>
        </section>

        <section id="boutique-products" className="boutique-products-section">
          <div className="boutique-catalog-toolbar">
            <div className="boutique-filter-dropdowns">
              <label>
                <span>Filter by</span>
                <select value={selectedDepartment} onChange={event => { setSelectedDepartment(event.target.value); setCatalogPage(1) }}>
                  <option value="all">Categories</option>
                  {departments.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}
                </select>
              </label>
              <span className="boutique-filter-static">Color</span>
              <span className="boutique-filter-static">Size</span>
              <span className="boutique-filter-static">Brand</span>
              <label className="boutique-price-filter">
                <span className="visually-hidden">Price order</span>
                <select value={sortOrder} onChange={event => { setSortOrder(event.target.value as BoutiqueGridSortOrder); setCatalogPage(1) }}>
                  <option value="default">Price</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                </select>
              </label>
            </div>
            <label className="boutique-sort">
              <span className="visually-hidden">Sort products</span>
              <select value={sortOrder} onChange={event => { setSortOrder(event.target.value as BoutiqueGridSortOrder); setCatalogPage(1) }}>
                <option value="default">Default sorting</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
            </label>
            <div className="boutique-view-controls" aria-hidden="true"><span className="active">▥</span><span>▦</span></div>
          </div>

          <div className="boutique-catalog-grid">
            {catalogListings.map(listing => (
              <ListingCard
                key={`catalog-${listing.id}`}
                listing={listing}
                saved={savedIds.includes(String(listing.id))}
                onOpen={onOpenListing || (() => {})}
                onToggleSave={preview ? undefined : onToggleSave}
              />
            ))}
          </div>

          {!catalogListings.length && (
            <div className="boutique-empty-state">
              <span className="material-icons">storefront</span>
              <p>New items will appear here soon.</p>
            </div>
          )}

          {allCatalogListings.length > catalogPageSize && (
            <nav className="boutique-pagination" aria-label="Catalog pagination">
              {Array.from({ length: catalogPageCount }, (_, index) => index + 1).map(page => (
                <button
                  key={page}
                  type="button"
                  className={page === catalogPage ? 'active' : ''}
                  aria-current={page === catalogPage ? 'page' : undefined}
                  onClick={() => { setCatalogPage(page); scrollTo('boutique-products') }}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                aria-label="Next page"
                disabled={catalogPage >= catalogPageCount}
                onClick={() => { setCatalogPage(page => Math.min(catalogPageCount, page + 1)); scrollTo('boutique-products') }}
              >→</button>
            </nav>
          )}
        </section>

        <section id="boutique-about" className="boutique-about">
          <div>
            <p className="boutique-kicker">A note from the shop</p>
            <h2>Chosen with intention.</h2>
          </div>
          <p>{content.aboutText || shop.description || 'We bring together practical finds and distinctive pieces, with thoughtful service from first question to delivery.'}</p>
        </section>

        <section id="boutique-reviews" className="boutique-reviews">
          <div className="boutique-section-heading">
            <div>
              <p className="boutique-kicker">From the community</p>
              <h2>Shopper reviews</h2>
            </div>
            <span>{averageRating ? `${averageRating} / 5 · ${reviews.length} reviews` : 'No reviews yet'}</span>
          </div>
          {!preview && !isOwner && currentUserId && onAddReview && (
            <form
              className="boutique-review-form"
              onSubmit={event => {
                event.preventDefault()
                const form = event.currentTarget
                const comment = new FormData(form).get('comment')?.toString().trim() || ''
                if (rating > 0 && comment) {
                  onAddReview(shop.userId, rating, comment)
                  form.reset()
                  setRating(0)
                }
              }}
            >
              <strong>Share your experience</strong>
              <div className="boutique-rating-picker" aria-label="Choose a rating">
                {[1, 2, 3, 4, 5].map(star => (
                  <button type="button" key={star} onClick={() => setRating(star)} aria-label={`${star} stars`}>
                    <span className="material-icons">{star <= rating ? 'star' : 'star_border'}</span>
                  </button>
                ))}
              </div>
              <textarea name="comment" rows={3} maxLength={1000} placeholder="What should other shoppers know?" required />
              <button type="submit" className="boutique-primary-button">Post review</button>
            </form>
          )}
          {reviews.length ? (
            <div className="boutique-review-list">
              {reviews.map(review => (
                <article key={review.id} className="boutique-review-card">
                  <div className="boutique-review-meta">
                    <strong>{review.reviewerName}</strong>
                    <span className="boutique-review-stars" aria-label={`${review.rating} out of 5 stars`}>
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </span>
                  </div>
                  <p>{review.comment}</p>
                  {review.reply && <div className="boutique-review-reply"><strong>Store reply</strong><p>{review.reply}</p></div>}
                  {!preview && isOwner && !review.reply && onReplyToReview && (
                    <form
                      onSubmit={event => {
                        event.preventDefault()
                        const reply = new FormData(event.currentTarget).get('reply')?.toString().trim() || ''
                        if (reply) onReplyToReview(review.id, reply)
                      }}
                      className="boutique-reply-form"
                    >
                      <input name="reply" aria-label="Reply to review" placeholder="Reply to this review" required />
                      <button type="submit">Reply</button>
                    </form>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="boutique-no-reviews">Reviews from shoppers will appear here.</p>
          )}
        </section>
      </main>

      <footer id="boutique-contact" className="boutique-footer">
        <div className="boutique-footer-main">
          <div>
            <p className="boutique-kicker">Stay in touch</p>
            <h2>{content.footerTagline || 'Good finds, shared thoughtfully.'}</h2>
            <WhatsAppLink shop={shop} number={whatsappNumber} onMessageSeller={onMessageSeller} />
          </div>
          <div className="boutique-footer-links">
            <strong>Explore</strong>
            <button type="button" onClick={() => scrollTo('boutique-products')}>Shop all</button>
            <button type="button" onClick={() => scrollTo('boutique-about')}>Our story</button>
            <button type="button" onClick={() => scrollTo('boutique-reviews')}>Shopper reviews</button>
            {!preview && shop.storeId && currentUserId !== shop.userId && (
              <StoreReportControl
                storeId={shop.storeId}
                currentUserId={currentUserId}
                onRequireSignIn={onRequireSignIn}
              />
            )}
          </div>
          <div className="boutique-footer-links">
            <strong>Follow</strong>
            {content.instagramUrl && <a href={content.instagramUrl} target="_blank" rel="noreferrer">Instagram</a>}
            {content.facebookUrl && <a href={content.facebookUrl} target="_blank" rel="noreferrer">Facebook</a>}
            {content.tiktokUrl && <a href={content.tiktokUrl} target="_blank" rel="noreferrer">TikTok</a>}
            {!content.instagramUrl && !content.facebookUrl && !content.tiktokUrl && <span>Social links coming soon</span>}
          </div>
        </div>
        <div className="boutique-footer-bottom">
          <span>{shop.shopName}</span>
          {SHOW_POWERED_BY_MARKETSPACE && <span>Powered by MarketSpace</span>}
        </div>
      </footer>

      {!preview && (
        <>
          <StoreInfoPanel
            isOpen={isInfoOpen}
            onClose={onCloseInfo}
            shop={shop}
            isFollowing={isFollowing}
            followerCount={followerCount}
            onToggleFollow={onToggleFollow}
            isNotified={isNotified}
            onToggleNotify={onToggleNotify}
            onMessageSeller={onMessageSeller}
          />
          <StoreCartDrawer
            isOpen={isCartOpen}
            onClose={onCloseCart}
            shop={shop}
            cartItems={cartItems}
            onUpdateQuantity={onUpdateCartQuantity}
            onRemoveItem={onRemoveCartItem}
            onClearCart={onClearCart}
            onOpenListing={onOpenListing}
          />
        </>
      )}
    </div>
  )
}
