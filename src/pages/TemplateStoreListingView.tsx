import { useMemo, useState, type CSSProperties } from 'react'
import type { BusinessProfile, Listing } from '../types'
import { formatZMWPrice } from '../utils/formatPrice'
import { formatServicePriceUnit } from '../features/marketplace/serviceListings'
import { getMarketplaceLocationName } from '../features/marketplace/storeLocations'
import './TemplateStoreListingView.css'

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
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedSize, setSelectedSize] = useState('')
  const [phone, setPhone] = useState('')
  const [offer, setOffer] = useState('')
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState('')
  const [copied, setCopied] = useState(false)
  const isService = listing.listing_type === 'service'
  const images = listing.images?.length ? listing.images : ['/illustrations/store_banner_electronics.png']
  const availableSizes = listing.available_sizes
    || (['Fashion & Apparel', 'Footwear'].includes(listing.category) ? ['S', 'M', 'L', 'XL'] : [])
  const acceptsOffers = !isService && Number(listing.lowest_acceptable_price) > 0
  const isSold = ['sold', 'sold out', 'out of stock'].includes((listing.status || '').toLowerCase())
  const related = useMemo(() => storeListings
    .filter(item => item.id !== listing.id && (item.listing_type === 'service') === isService)
    .slice(0, 6), [isService, listing.id, storeListings])

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch { /* Clipboard permission is optional. */ }
  }

  const inquiry = () => {
    setFormError('')
    if (!phone.trim()) {
      setFormError('Enter your phone number so the store can contact you.')
      return
    }
    if (!isService && listing.available_colors?.length && selectedColors.length === 0) {
      setFormError('Select at least one available colour.')
      return
    }
    if (!isService && availableSizes.length > 0 && !selectedSize) {
      setFormError('Select a size before sending your inquiry.')
      return
    }

    const numericOffer = offer ? Number(offer) : null
    if (numericOffer != null && (!Number.isFinite(numericOffer) || numericOffer < Number(listing.lowest_acceptable_price))) {
      setFormError(`Your offer must be at least ZMW ${Number(listing.lowest_acceptable_price).toLocaleString()}.`)
      return
    }

    onMessageSeller(`[INQUIRY_CARD]${JSON.stringify({
      listingId: listing.id,
      title: listing.title,
      price: listing.price,
      priceUnit: isService ? listing.price_unit ?? 'fixed' : undefined,
      serviceArea: isService ? getMarketplaceLocationName(listing.service_area_id) || null : undefined,
      image: listing.images?.[0] || '',
      colors: selectedColors,
      size: selectedSize || null,
      quantity: isService ? 1 : quantity,
      phone: phone.trim(),
      message: message.trim() || null,
      offer: acceptsOffers && numericOffer ? numericOffer : null,
      isService,
    })}`)
  }

  const toggleColor = (color: string) => {
    setSelectedColors(colors => colors.includes(color)
      ? colors.filter(selected => selected !== color)
      : [...colors, color])
  }

  const listedDate = listing.created_at && Number.isFinite(Date.parse(listing.created_at))
    ? new Date(listing.created_at)
    : null
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
          <div className="template-product-kicker">{isService ? 'Service · ' : ''}{listing.category || shop.category || 'Store collection'}</div>
          <h1>{listing.title}</h1>
          <div className="template-product-price">
            {isService && listing.price_unit === 'from' ? 'From ' : ''}
            {formatZMWPrice(listing.price)} {isService && listing.price_unit !== 'from' ? formatServicePriceUnit(listing.price_unit) : ''}
          </div>
          <dl className="template-product-details">
            {listedDate && <div><dt>Date listed</dt><dd><time dateTime={listing.created_at}>{listedDate.toLocaleDateString()}</time></dd></div>}
            {!isService && listing.condition && <div><dt>Condition</dt><dd>{listing.condition}</dd></div>}
            <div><dt>Status</dt><dd>{listing.status || 'Available'}</dd></div>
            {!isService && listing.delivery_option && <div><dt>Delivery</dt><dd>{listing.delivery_option}</dd></div>}
            {!isService && listing.delivery_paid_by && <div><dt>Delivery paid by</dt><dd>{listing.delivery_paid_by}</dd></div>}
          </dl>
          {listing.description && <p className="template-product-description">{listing.description}</p>}
          {isService && listing.how_it_works && <p className="template-product-description">{listing.how_it_works}</p>}
          {isService && listing.service_area_id && <p className="template-product-description">
            Service area: {getMarketplaceLocationName(listing.service_area_id) || listing.service_area_id}
          </p>}
          {!isService && (listing.available_colors?.length || 0) > 0 && <div className="template-product-colors">
            <span>Colour{listing.available_colors!.length > 1 ? 's' : ''}</span>
            <div>{listing.available_colors?.map(color => <button key={color} type="button" className={selectedColors.includes(color) ? 'active' : ''} aria-pressed={selectedColors.includes(color)} style={{ '--swatch-color': color } as CSSProperties} onClick={() => toggleColor(color)} aria-label={`${selectedColors.includes(color) ? 'Remove' : 'Select'} ${color}`} title={color} />)}</div>
          </div>}
          {!isService && availableSizes.length > 0 && (
            <label className="template-product-field">
              Size
              <select value={selectedSize} onChange={event => setSelectedSize(event.target.value)}>
                <option value="">Select a size</option>
                {availableSizes.map(size => <option key={size} value={size}>{size}</option>)}
              </select>
            </label>
          )}
          {isOwner ? (
            <div className="template-owner-actions">
              <p>{isService ? 'This is your service. Customer messaging controls are hidden.' : 'This is your listing. Customer purchase and messaging controls are hidden.'}</p>
              <button type="button" onClick={() => onEditListing?.(listing)}>Edit listing</button>
              <button type="button" onClick={() => onRenewListing?.(listing.id)}>Renew listing</button>
              <span>{listing.status || 'Available'}</span>
            </div>
          ) : (
            <>
              {isService ? (
                <p className="template-product-contact-note">Send your phone number and a message to ask about this service or arrange an appointment.</p>
              ) : (
                <div className="template-product-actions-row">
                  <div className="template-product-quantity" aria-label="Quantity">
                    <button type="button" onClick={() => setQuantity(value => Math.max(1, value - 1))} aria-label="Decrease quantity">−</button>
                    <span>{quantity}</span>
                    <button type="button" onClick={() => setQuantity(value => Math.min(10, value + 1))} disabled={quantity >= 10} aria-label="Increase quantity">+</button>
                  </div>
                  <button className="template-product-cart" type="button" disabled={isSold} onClick={() => onAddToCart(listing, quantity)}>{isSold ? 'Sold out' : 'Add to cart'}</button>
                </div>
              )}
              {acceptsOffers && (
                <label className="template-product-field">
                  Offer (ZMW)
                  <input type="number" min={listing.lowest_acceptable_price} value={offer} onChange={event => setOffer(event.target.value)} placeholder={`Minimum ${Number(listing.lowest_acceptable_price).toLocaleString()}`} />
                </label>
              )}
              <label className="template-product-field">
                Your phone number <span>(required)</span>
                <input type="tel" autoComplete="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder="e.g. +260 977 123456" />
              </label>
              <label className="template-product-field">
                Message {isService ? 'for the provider' : 'for the seller'} <span>(optional)</span>
                <textarea value={message} onChange={event => setMessage(event.target.value)} rows={3} placeholder={isService ? 'Ask about availability, style, or appointment times…' : 'Ask a question or share delivery preferences…'} />
              </label>
              {formError && <p className="template-product-form-error" role="alert">{formError}</p>}
              <div className="template-product-secondary-actions">
                <button className="template-product-primary-contact" type="button" onClick={inquiry}>
                  <span className="material-icons">chat_bubble_outline</span>{isService ? 'Message provider' : 'Message seller'}
                </button>
                <button type="button" onClick={() => onToggleSave(listing.id)}><span className="material-icons">{isSaved ? 'favorite' : 'favorite_border'}</span>{isSaved ? 'Saved' : 'Save'}</button>
                <button type="button" onClick={share}><span className="material-icons">{copied ? 'check' : 'share'}</span>{copied ? 'Copied' : 'Share'}</button>
              </div>
            </>
          )}
        </section>
      </div>
      {related.length > 0 && <section className="template-related-products">
        <div><span>Continue browsing</span><h2>{isService ? 'More services' : 'Related items'}</h2></div>
        <div className="template-related-grid">
          {related.map(item => <button key={item.id} type="button" onClick={() => onSelectListing(item)}>
            <img src={item.images?.[0] || '/illustrations/store_banner_electronics.png'} alt={item.title} />
            <strong>{item.title}</strong>
            <span>
              {isService && item.price_unit === 'from' ? 'From ' : ''}
              {formatZMWPrice(item.price)} {isService && item.price_unit !== 'from' ? formatServicePriceUnit(item.price_unit) : ''}
            </span>
          </button>)}
        </div>
      </section>}
    </div>
  )
}
