import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { BusinessProfile, Listing } from '../types'
import { formatZMWPrice } from '../utils/formatPrice'

interface Props {
  templateId: 'boutique-grid' | 'storefront-landing'
  listing: Listing
  shop: BusinessProfile
  storeListings: Listing[]
  isSaved: boolean
  onBack: () => void
  onAddToCart: (listing: Listing, quantity: number) => void
  onToggleSave: (listingId: number) => void
  onSelectListing: (listing: Listing) => void
  onMessageSeller: (customMessage?: string) => void
  isOwner?: boolean
  onEditListing?: (listing: Listing) => void
  onRenewListing?: (listingId: number) => void
}

export function TemplateStoreListingView({ templateId, listing, shop, storeListings, isSaved, onBack, onAddToCart, onToggleSave, onSelectListing, onMessageSeller, isOwner = false, onEditListing, onRenewListing }: Props) {
  const [activeImage, setActiveImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedColor, setSelectedColor] = useState(listing.available_colors?.[0] || '')
  const [copied, setCopied] = useState(false)
  const images = listing.images?.length ? listing.images : ['/illustrations/store_banner_electronics.png']
  const related = useMemo(() => storeListings.filter(item => item.id !== listing.id).slice(0, 6), [listing.id, storeListings])

  useEffect(() => {
    setActiveImage(0)
    setQuantity(1)
    setSelectedColor(listing.available_colors?.[0] || '')
    window.scrollTo({ top: 0 })
  }, [listing.id])

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch { /* Clipboard permission is optional. */ }
  }

  const inquiry = () => onMessageSeller(`Hello ${shop.shopName}, I'm interested in ${listing.title}.`)
  const css = templateId === 'boutique-grid' ? 'boutique-product-view' : 'landing-product-view'
  const accent = templateId === 'boutique-grid' ? '#be9b5a' : '#d2a679'

  return (
    <div className={`template-product-view ${css}`} style={{ '--template-accent': accent } as CSSProperties}>
      <button className="template-product-back" type="button" onClick={onBack}><span className="material-icons">arrow_back</span> Back to store</button>
      <div className="template-product-grid">
        <section className="template-product-gallery" aria-label="Listing images">
          <div className="template-product-main-image"><img src={images[activeImage]} alt={listing.title} /></div>
          {images.length > 1 && <div className="template-product-thumbs">
            {images.map((image, index) => <button className={index === activeImage ? 'active' : ''} key={`${image}-${index}`} type="button" onClick={() => setActiveImage(index)}><img src={image} alt={`${listing.title} ${index + 1}`} /></button>)}
          </div>}
        </section>
        <section className="template-product-info">
          <div className="template-product-kicker">{listing.category || shop.category || 'Store collection'}</div>
          <h1>{listing.title}</h1>
          <div className="template-product-price">{formatZMWPrice(listing.price)}</div>
          {listing.description && <p className="template-product-description">{listing.description}</p>}
          {(listing.available_colors?.length || 0) > 0 && <div className="template-product-colors">
            <span>Colour</span>
            <div>{listing.available_colors?.map(color => <button key={color} type="button" className={selectedColor === color ? 'active' : ''} style={{ '--swatch-color': color } as CSSProperties} onClick={() => setSelectedColor(color)} aria-label={`Select ${color}`} />)}</div>
          </div>}
          {isOwner ? (
            <div className="template-owner-actions">
              <p>This is your listing. Customer purchase and messaging controls are hidden.</p>
              <button type="button" onClick={() => onEditListing?.(listing)}>Edit listing</button>
              <button type="button" onClick={() => onRenewListing?.(listing.id)}>Renew listing</button>
              <span>{listing.status || 'Available'}</span>
            </div>
          ) : (
            <>
              <div className="template-product-actions-row">
                <div className="template-product-quantity" aria-label="Quantity">
                  <button type="button" onClick={() => setQuantity(value => Math.max(1, value - 1))} aria-label="Decrease quantity">−</button>
                  <span>{quantity}</span>
                  <button type="button" onClick={() => setQuantity(value => value + 1)} aria-label="Increase quantity">+</button>
                </div>
                <button className="template-product-cart" type="button" onClick={() => onAddToCart(listing, quantity)}>Add to cart</button>
              </div>
              <div className="template-product-secondary-actions">
                <button type="button" onClick={() => onToggleSave(listing.id)}><span className="material-icons">{isSaved ? 'favorite' : 'favorite_border'}</span>{isSaved ? 'Saved' : 'Save'}</button>
                <button type="button" onClick={share}><span className="material-icons">{copied ? 'check' : 'share'}</span>{copied ? 'Copied' : 'Share'}</button>
                <button type="button" onClick={inquiry}><span className="material-icons">chat_bubble_outline</span>Message seller</button>
              </div>
            </>
          )}
        </section>
      </div>
      {related.length > 0 && <section className="template-related-products">
        <div><span>Continue shopping</span><h2>Related items</h2></div>
        <div className="template-related-grid">
          {related.map(item => <button key={item.id} type="button" onClick={() => onSelectListing(item)}>
            <img src={item.images?.[0] || '/illustrations/store_banner_electronics.png'} alt={item.title} />
            <strong>{item.title}</strong>
            <span>{formatZMWPrice(item.price)}</span>
          </button>)}
        </div>
      </section>}
    </div>
  )
}
