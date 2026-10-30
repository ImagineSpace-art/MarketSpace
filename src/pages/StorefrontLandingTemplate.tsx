import { useState, type CSSProperties } from 'react'
import type { BusinessProfile, Listing, StoreCartItem, StoreReview } from '../types'
import { Listing as ListingCard } from '../components/Listing'
import { StoreReportControl } from '../components/StoreReportControl'
import { StoreInfoPanel } from '../components/store-theme/StoreInfoPanel'
import { StoreCartDrawer } from '../components/store-theme/StoreCartDrawer'
import { getStoreTemplateImageUrl } from '../features/store-templates/storeTemplateAssets'
import { STORE_ACCENT_PALETTE } from '../features/store-templates/storeTemplateSchema'
import { getBoutiqueDepartmentSectionListings, getBoutiqueGridDepartments } from '../features/store-templates/boutiqueGridModel'

export type StorefrontLandingContent = Record<string, string | undefined>

const fallback = (value: string | undefined, path: string) => {
  if (!value) return path
  return /^(https?:\/\/|data:image\/)/i.test(value) ? value : getStoreTemplateImageUrl(value)
}

 type LandingProps = {
  shop: BusinessProfile
  listings: Listing[]
  content: StorefrontLandingContent
  preview?: boolean
  currentUserId?: string
  savedIds?: string[]
  storeReviews?: StoreReview[]
  cartCount?: number
  cartItems?: StoreCartItem[]
  onOpenListing?: (listing: Listing) => void
  onToggleSave?: (listingId: number) => void
  onMessageSeller?: () => void
  onOpenCart?: () => void
  onCloseCart?: () => void
  onUpdateCartQuantity?: (listingId: number, quantity: number) => void
  onRemoveCartItem?: (listingId: number) => void
  onClearCart?: () => void
  onRequireSignIn?: () => void
  isCartOpen?: boolean
}

export function StorefrontLandingTemplate({
  shop, listings, content, preview = false, currentUserId = '', savedIds = [], storeReviews = [],
  cartCount = 0, cartItems = [], onOpenListing, onToggleSave, onMessageSeller, onOpenCart,
  onCloseCart = () => {}, onUpdateCartQuantity = () => {}, onRemoveCartItem = () => {},
  onClearCart, onRequireSignIn = () => {}, isCartOpen = false,
}: LandingProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const departments = getBoutiqueGridDepartments(shop.collections || [], listings)
  const visibleDepartments = departments.slice(0, 1)
  const overflowDepartments = departments.slice(visibleDepartments.length)
  const accent = content.accentColor || STORE_ACCENT_PALETTE[0]
  const heroImage = fallback(content.heroImage, '/illustrations/banner_summer_collection.jpg')
  const promoImage = fallback(content.promoImage, '/illustrations/banner_electronics.png')
  const storyImage = fallback(content.storyImage, '/illustrations/store_banner_electronics.png')
  const reviews = storeReviews.filter(review => review.storeId === shop.userId)
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className={`landing-store${preview ? ' landing-store-preview' : ''}`} style={{ '--landing-accent': accent } as CSSProperties}>
      {content.announcementText && <div className="landing-announcement">{content.announcementText}</div>}
      <header className="landing-header" id="landing-top">
        <button className="landing-mobile-menu" type="button" aria-label="Toggle departments" onClick={() => setMenuOpen(value => !value)}><span className="material-icons">menu</span></button>
        <button className="landing-brand" type="button" onClick={() => scrollTo('landing-top')}>{shop.shopName}</button>
        <nav className={menuOpen ? 'open' : ''} aria-label="Store navigation">
          <button type="button" onClick={() => scrollTo('landing-top')}>Home</button>
          <button type="button" onClick={() => scrollTo('landing-products')}>New arrivals</button>
          <button type="button" onClick={() => scrollTo('landing-story')}>About</button>
          {visibleDepartments.map(department => <button key={department.id} type="button" onClick={() => scrollTo(`landing-${department.id}`)}>{department.name}</button>)}
          {overflowDepartments.length > 0 && (
            <details className="landing-nav-dropdown">
              <summary>More <span aria-hidden="true">⌄</span></summary>
              <div>
                {overflowDepartments.map(department => <button key={department.id} type="button" onClick={() => scrollTo(`landing-${department.id}`)}>{department.name}</button>)}
              </div>
            </details>
          )}
        </nav>
        <div className="landing-header-actions">
          <span className="material-icons" aria-hidden="true">search</span>
          <button className="landing-cart" type="button" onClick={onOpenCart} aria-label="Open cart"><span className="material-icons">shopping_bag</span><span>{cartCount}</span></button>
        </div>
      </header>

      <main>
        <section className="landing-hero" style={{ backgroundImage: `linear-gradient(rgba(20,16,12,.22), rgba(20,16,12,.28)), url("${heroImage}")` }}>
          <div className="landing-hero-copy">
            <p>New season · MarketSpace store</p>
            <h1>{content.heroHeadline || 'Wear your confidence.'}</h1>
            <span>{content.heroSubheadline || shop.description || 'Discover considered pieces made for every day and every occasion.'}</span>
            <button type="button" onClick={() => scrollTo('landing-products')}>{content.heroButtonLabel || 'Explore collection'}</button>
          </div>
        </section>

        <section className="landing-benefits" aria-label="Store services">
          <div><span className="landing-benefit-icon" aria-hidden="true">↗</span><strong>Free shipping</strong><small>On orders above the store minimum</small></div>
          <div><span className="landing-benefit-icon" aria-hidden="true">24</span><strong>Support</strong><small>Friendly help when you need it</small></div>
          <div><span className="landing-benefit-icon" aria-hidden="true">↻</span><strong>Easy returns</strong><small>Simple, straightforward returns</small></div>
          <div><span className="landing-benefit-icon" aria-hidden="true">✓</span><strong>Secure checkout</strong><small>Protected marketplace payments</small></div>
        </section>

        <section className="landing-products" id="landing-products">
          <div className="landing-section-heading"><p>Curated for you</p><h2>Latest arrivals</h2></div>
          <div className="landing-product-row">
            {getBoutiqueDepartmentSectionListings(listings, 'all', 'default').map(listing => <ListingCard key={listing.id} listing={listing} saved={savedIds.includes(String(listing.id))} onOpen={onOpenListing || (() => {})} onToggleSave={preview ? undefined : onToggleSave} />)}
          </div>
        </section>

        {departments.length > 0 && (
          <section className="landing-categories">
            <div className="landing-section-heading"><p>Shop by department</p><h2>Find your style</h2></div>
            <div className="landing-category-row">
              {departments.map(department => {
                const departmentImage = fallback(department.bannerImage, '/illustrations/store_banner_electronics.png')
                return (
                  <button key={department.id} type="button" onClick={() => scrollTo(`landing-${department.id}`)}>
                    <img src={departmentImage} alt="" />
                    <strong>{department.name}</strong>
                    <span>Shop now</span>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        <section className="landing-promo" style={{ backgroundImage: `linear-gradient(90deg, rgba(18,18,18,.72), rgba(18,18,18,.05)), url("${promoImage}")` }}>
          <div><p>Featured edit</p><h2>{content.promoHeading || 'Make space for something special'}</h2><span>{content.promoText || 'A fresh selection chosen with style, function and lasting value in mind.'}</span><button type="button" onClick={() => scrollTo('landing-products')}>{content.promoButtonLabel || 'Explore now'}</button></div>
        </section>

        <section className="landing-products landing-featured">
          <div className="landing-section-heading"><p>Picked for you</p><h2>Featured products</h2></div>
          <div className="landing-product-row">
            {getBoutiqueDepartmentSectionListings([...listings].sort((a, b) => (Date.parse(b.created_at || '') || 0) - (Date.parse(a.created_at || '') || 0)), 'all', 'default').map(listing => <ListingCard key={`featured-${listing.id}`} listing={listing} saved={savedIds.includes(String(listing.id))} onOpen={onOpenListing || (() => {})} onToggleSave={preview ? undefined : onToggleSave} />)}
          </div>
        </section>

        {departments.map(department => {
          const departmentListings = getBoutiqueDepartmentSectionListings(listings, String(department.id), 'default')
          if (!departmentListings.length) return null
          return <section className="landing-department" id={`landing-${department.id}`} key={department.id}><div className="landing-section-heading"><p>Shop by department</p><h2>{department.name}</h2></div><div className="landing-product-row">{departmentListings.map(listing => <ListingCard key={listing.id} listing={listing} saved={savedIds.includes(String(listing.id))} onOpen={onOpenListing || (() => {})} onToggleSave={preview ? undefined : onToggleSave} />)}</div></section>
        })}

        <section className="landing-story" id="landing-story">
          <img src={storyImage} alt="" />
          <div><p>Our story</p><h2>{content.storyHeading || `The people behind ${shop.shopName}`}</h2><span>{content.storyText || shop.description || 'Independent sellers build distinctive collections and share personal service through MarketSpace.'}</span></div>
        </section>

        {reviews.length > 0 && <section className="landing-reviews"><div className="landing-section-heading"><p>Kind words</p><h2>Shopper reviews</h2></div><div>{reviews.slice(0, 4).map(review => <article key={review.id}><strong>{review.reviewerName}</strong><span>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span><p>{review.comment}</p></article>)}</div></section>}
      </main>

      <footer className="landing-footer">
        <div><button className="landing-brand" type="button" onClick={() => scrollTo('landing-top')}>{shop.shopName}</button><p>{content.footerTagline || 'Distinctive finds, thoughtfully delivered.'}</p></div>
        <div><strong>Social</strong>{content.instagramUrl && <a href={content.instagramUrl}>Instagram</a>}{content.facebookUrl && <a href={content.facebookUrl}>Facebook</a>}{content.tiktokUrl && <a href={content.tiktokUrl}>TikTok</a>}</div>
        <div>{content.whatsappNumber && <a href={`https://wa.me/${content.whatsappNumber.replace(/\D/g, '')}`}>WhatsApp</a>}<span>Powered by MarketSpace</span>{!preview && shop.storeId && currentUserId !== shop.userId && <StoreReportControl storeId={shop.storeId} currentUserId={currentUserId} onRequireSignIn={onRequireSignIn} />}</div>
      </footer>

      {!preview && <><StoreCartDrawer isOpen={isCartOpen} onClose={onCloseCart} shop={shop} cartItems={cartItems} onUpdateQuantity={onUpdateCartQuantity} onRemoveItem={onRemoveCartItem} onClearCart={onClearCart} onOpenListing={onOpenListing} /><StoreInfoPanel isOpen={false} onClose={() => {}} shop={shop} onMessageSeller={onMessageSeller} /></>}
    </div>
  )
}
