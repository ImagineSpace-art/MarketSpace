import { useMemo, useState } from 'react'
import type { BusinessProfile, Listing, StoreCartItem } from '../../types'
import { formatZMWPrice } from '../../utils/formatPrice'

export interface StoreCartDrawerProps {
  isOpen: boolean
  onClose: () => void
  shop: BusinessProfile
  cartItems: StoreCartItem[]
  onUpdateQuantity: (listingId: number, quantity: number) => void
  onRemoveItem: (listingId: number) => void
  onClearCart?: () => void
  onOpenListing?: (listing: Listing) => void
}

export function StoreCartDrawer({
  isOpen,
  onClose,
  shop,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenListing,
}: StoreCartDrawerProps) {
  const [orderNote, setOrderNote] = useState('')
  const [isCopiedOrder, setIsCopiedOrder] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const items = useMemo(
    () => cartItems.filter(item => item.listing.listing_type !== 'service'),
    [cartItems],
  )
  const totalCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  )
  const subtotal = useMemo(
    () => items.reduce((total, item) => total + (Number(item.listing.price) || 0) * item.quantity, 0),
    [items],
  )

  if (!isOpen) return null

  const handleWhatsAppCheckout = async () => {
    const cleanNumber = (shop.whatsapp || '').replace(/\D/g, '')
    const itemsSummary = items
      .map(item => `- ${item.listing.title} x${item.quantity} (${formatZMWPrice(Number(item.listing.price) * item.quantity)})`)
      .join('\n')
    const message = `Hello ${shop.shopName}, I would like to place an order:\n\n${itemsSummary}\n\nSubtotal: ${formatZMWPrice(subtotal)}${orderNote ? `\nNote: ${orderNote}` : ''}\n\nPlease confirm availability and delivery details.`

    setCheckoutError('')
    if (cleanNumber) {
      window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
      return
    }

    try {
      await navigator.clipboard.writeText(message)
      setIsCopiedOrder(true)
      window.setTimeout(() => setIsCopiedOrder(false), 2500)
    } catch {
      setCheckoutError('Could not copy the order message. Please select and copy it manually.')
    }
  }

  const accentColor = shop.accentColor || '#2563eb'

  return (
    <div className="store-cart-overlay" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <button className="store-cart-backdrop" type="button" onClick={onClose} aria-label="Close cart" />
      <section className="store-cart-drawer">
        <header className="store-cart-header">
          <div>
            <h2>Your cart <span>{totalCount}</span></h2>
            <p>{shop.shopName}</p>
          </div>
          <div className="store-cart-header-actions">
            {items.length > 0 && onClearCart && (
              <button type="button" onClick={onClearCart}>Clear</button>
            )}
            <button type="button" onClick={onClose} aria-label="Close cart">
              <span className="material-icons">close</span>
            </button>
          </div>
        </header>

        <div className="store-cart-content">
          {items.length === 0 ? (
            <div className="store-cart-empty">
              <span className="material-icons">remove_shopping_cart</span>
              <h3>Your cart is empty</h3>
              <p>Browse this store and add items to your cart.</p>
            </div>
          ) : (
            <div className="store-cart-items">
              {items.map(item => (
                <article className="store-cart-item" key={item.listing.id}>
                  <button
                    className="store-cart-item-image"
                    type="button"
                    onClick={() => onOpenListing?.(item.listing)}
                    aria-label={`View ${item.listing.title}`}
                  >
                    <img src={item.listing.images?.[0] || '/illustrations/store_banner_electronics.png'} alt="" />
                  </button>
                  <div className="store-cart-item-details">
                    <button className="store-cart-item-title" type="button" onClick={() => onOpenListing?.(item.listing)}>
                      {item.listing.title}
                    </button>
                    <strong>{formatZMWPrice(item.listing.price)}</strong>
                    <div className="store-cart-item-actions">
                      <div className="store-cart-quantity" aria-label={`Quantity for ${item.listing.title}`}>
                        <button type="button" onClick={() => onUpdateQuantity(item.listing.id, item.quantity - 1)} aria-label="Decrease quantity">−</button>
                        <span>{item.quantity}</span>
                        <button type="button" onClick={() => onUpdateQuantity(item.listing.id, item.quantity + 1)} aria-label="Increase quantity">+</button>
                      </div>
                      <button className="store-cart-remove" type="button" onClick={() => onRemoveItem(item.listing.id)}>Remove</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <footer className="store-cart-footer">
            <label htmlFor="store-cart-note">Order note (optional)</label>
            <textarea id="store-cart-note" value={orderNote} onChange={event => setOrderNote(event.target.value)} rows={2} />
            <div className="store-cart-subtotal"><span>Subtotal</span><strong>{formatZMWPrice(subtotal)}</strong></div>
            <button className="store-cart-checkout" type="button" onClick={() => void handleWhatsAppCheckout()} style={{ backgroundColor: accentColor }}>
              {isCopiedOrder ? 'Order copied' : shop.whatsapp ? 'Continue with WhatsApp' : 'Copy order message'}
            </button>
            {checkoutError && <p className="store-cart-error" role="alert">{checkoutError}</p>}
          </footer>
        )}
      </section>
    </div>
  )
}
