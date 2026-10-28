import { useState, useMemo } from 'react'
import type { BusinessProfile, StoreThemeConfig, StoreCartItem } from '../../types'

export interface StoreCartDrawerProps {
  isOpen: boolean
  onClose: () => void
  shop: BusinessProfile
  themeConfig?: StoreThemeConfig
  cartItems: StoreCartItem[]
  onUpdateQuantity: (listingId: number, quantity: number) => void
  onRemoveItem: (listingId: number) => void
  onClearCart?: () => void
  onOpenListing?: (listing: any) => void
}

export function StoreCartDrawer({
  isOpen,
  onClose,
  shop,
  themeConfig,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenListing,
}: StoreCartDrawerProps) {
  const [orderNote, setOrderNote] = useState('')
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [isCopiedOrder, setIsCopiedOrder] = useState(false)

  const preset = themeConfig?.presetName || 'hyper'
  const brandColor = themeConfig?.primaryColor || shop.accentColor || '#2563eb'

  // Cart calculations
  const totalCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0)
  }, [cartItems])

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const price = Number(item.listing.price) || 0
      return acc + price * item.quantity
    }, 0)
  }, [cartItems])

  // Free shipping threshold logic (e.g. 500 for local currency)
  const freeShippingThreshold = themeConfig?.cartDrawer?.freeShippingThreshold ?? (preset === 'xtra' ? 300 : 500)
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100))
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal)

  // Format currency
  const currencySymbol = 'K'

  // Handle WhatsApp Checkout
  const handleWhatsAppCheckout = () => {
    const rawNumber = shop.whatsapp || ''
    const cleanNumber = rawNumber.replace(/\D/g, '')

    const itemsSummary = cartItems
      .map(item => `• ${item.listing.title} x${item.quantity} (${currencySymbol}${Number(item.listing.price) * item.quantity})`)
      .join('\n')

    const message = `Hello ${shop.shopName}!\n\nI would like to place an order from your MarketSpace Storefront:\n\n${itemsSummary}\n\n*Subtotal:* ${currencySymbol}${subtotal.toLocaleString()}${orderNote ? `\n*Note:* ${orderNote}` : ''}\n\nPlease confirm availability and delivery details.`

    if (cleanNumber) {
      const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`
      window.open(url, '_blank')
    } else {
      navigator.clipboard.writeText(message)
      setIsCopiedOrder(true)
      setTimeout(() => setIsCopiedOrder(false), 2500)
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Cart Drawer"
    >
      {/* BACKDROP */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* DRAWER CONTAINER */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          background: preset === 'xtra' ? '#1e1b4b' : '#ffffff',
          color: preset === 'xtra' ? '#ffffff' : '#0f172a',
          boxShadow: '-10px 0 35px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10,
          animation: 'slideInRight 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* 1. DRAWER HEADER */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: preset === 'xtra' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: preset === 'xtra' ? '#272365' : '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: `${brandColor}18`,
                color: brandColor,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <span className="material-icons" style={{ fontSize: '20px' }}>shopping_bag</span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  {preset === 'arctos' ? 'Shopping Bag' : preset === 'hyper' ? 'Shopping Cart' : 'Your Cart'}
                </h2>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: brandColor,
                    color: '#ffffff',
                  }}
                >
                  {totalCount}
                </span>
              </div>
              <span style={{ fontSize: '0.74rem', opacity: 0.7 }}>
                {shop.shopName} Official Store
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {cartItems.length > 0 && onClearCart && (
              <button
                type="button"
                onClick={onClearCart}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.76rem',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontWeight: 600,
                  padding: '4px 8px',
                }}
                title="Empty shopping cart"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: preset === 'hyper' ? '1px solid #334155' : '1px solid #e2e8f0',
                background: 'transparent',
                color: 'inherit',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
                transition: 'background-color 0.15s',
              }}
              aria-label="Close cart drawer"
            >
              <span className="material-icons" style={{ fontSize: '18px' }}>close</span>
            </button>
          </div>
        </div>

        {/* 2. THEME-SPECIFIC PERK / SHIPPING PROGRESS BAR */}
        {cartItems.length > 0 && (
          <div
            style={{
              padding: '12px 24px',
              background: preset === 'hyper' ? '#0f172a' : preset === 'xtra' ? '#fff1f2' : '#f8fafc',
              borderBottom: preset === 'hyper' ? '1px solid #1e293b' : '1px solid #f1f5f9',
            }}
          >
            {/* Arctos: Complimentary Packaging & White-Glove note */}
            {preset === 'arctos' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                <span className="material-icons" style={{ fontSize: '16px', color: '#0ea5e9' }}>verified</span>
                <span>Includes complimentary brand packaging & white-glove dispatch.</span>
              </div>
            )}

            {/* Hyper: MarketSpace Money Back Guarantee reassurance */}
            {preset === 'hyper' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#1e40af' }}>
                <span className="material-icons" style={{ fontSize: '16px', color: '#3665f3' }}>verified_user</span>
                <span><strong>MarketSpace Money Back Guarantee</strong> • Get the item you ordered or your money back.</span>
              </div>
            )}

            {/* Xtra: Free Shipping Goal Progress Bar */}
            {preset === 'xtra' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                  <span>
                    {remainingForFreeShipping > 0
                      ? `Add ${currencySymbol}${remainingForFreeShipping.toLocaleString()} more for Free Express Courier!`
                      : 'You unlocked Free Express Courier!'}
                  </span>
                  <span style={{ fontSize: '0.76rem', color: '#f43f5e' }}>{progressPercent}%</span>
                </div>
                <div style={{ height: '6px', width: '100%', background: '#ffe4e6', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${progressPercent}%`,
                      background: 'linear-gradient(90deg, #f43f5e, #fb7185)',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. CART ITEMS LIST OR EMPTY STATE */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: cartItems.length === 0 ? '40px 24px' : '16px 24px',
          }}
        >
          {cartItems.length === 0 ? (
            /* EMPTY CART STATE */
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: '50%',
                  background: preset === 'xtra' ? '#272365' : '#f1f5f9',
                  color: brandColor,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <span className="material-icons" style={{ fontSize: '36px' }}>remove_shopping_cart</span>
              </div>
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', fontWeight: 800 }}>
                  Your cart is empty
                </h3>
                <p style={{ margin: 0, fontSize: '0.86rem', opacity: 0.7, maxWidth: '280px', lineHeight: 1.45 }}>
                  Explore {shop.shopName}'s curated catalog and add items directly to your cart.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose()
                  const el = document.getElementById('products') || document.getElementById('store-content-area')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
                style={{
                  marginTop: '8px',
                  padding: '10px 22px',
                  borderRadius: '10px',
                  background: brandColor,
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                }}
              >
                Explore Products
              </button>
            </div>
          ) : (
            /* POPULATED ITEMS LIST */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {cartItems.map(item => {
                const priceNum = Number(item.listing.price) || 0
                const itemTotal = priceNum * item.quantity
                const imgUrl = item.listing.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'

                return (
                  <div
                    key={item.listing.id}
                    style={{
                      display: 'flex',
                      gap: '14px',
                      padding: '12px',
                      borderRadius: '12px',
                      background: preset === 'xtra' ? '#272365' : '#f8fafc',
                      border: preset === 'xtra' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                      transition: 'border-color 0.15s',
                    }}
                  >
                    {/* Item Thumbnail */}
                    <div
                      onClick={() => onOpenListing && onOpenListing(item.listing)}
                      style={{
                        width: '76px',
                        height: '76px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: '#e2e8f0',
                        flexShrink: 0,
                        cursor: onOpenListing ? 'pointer' : 'default',
                      }}
                    >
                      <img
                        src={imgUrl}
                        alt={item.listing.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>

                    {/* Item Details */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                          <h4
                            onClick={() => onOpenListing && onOpenListing(item.listing)}
                            style={{
                              margin: 0,
                              fontSize: '0.9rem',
                              fontWeight: 700,
                              lineHeight: 1.25,
                              cursor: onOpenListing ? 'pointer' : 'default',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={item.listing.title}
                          >
                            {item.listing.title}
                          </h4>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.listing.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'grid',
                              placeItems: 'center',
                            }}
                            title="Remove from cart"
                          >
                            <span className="material-icons" style={{ fontSize: '16px' }}>delete_outline</span>
                          </button>
                        </div>
                        <span style={{ fontSize: '0.74rem', opacity: 0.65 }}>
                          {item.listing.category || 'General'}
                        </span>
                      </div>

                      {/* Quantity Selector & Price */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                        {/* Stepper */}
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            border: preset === 'hyper' ? '1px solid #334155' : '1px solid #cbd5e1',
                            borderRadius: '6px',
                            background: preset === 'hyper' ? '#1e293b' : '#ffffff',
                            overflow: 'hidden',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.listing.id, item.quantity - 1)}
                            style={{
                              width: '26px',
                              height: '26px',
                              border: 'none',
                              background: 'transparent',
                              color: 'inherit',
                              cursor: 'pointer',
                              display: 'grid',
                              placeItems: 'center',
                            }}
                            aria-label="Decrease quantity"
                          >
                            <span className="material-icons" style={{ fontSize: '14px' }}>remove</span>
                          </button>
                          <span
                            style={{
                              width: '28px',
                              textAlign: 'center',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              fontFamily: 'monospace',
                            }}
                          >
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.listing.id, item.quantity + 1)}
                            style={{
                              width: '26px',
                              height: '26px',
                              border: 'none',
                              background: 'transparent',
                              color: 'inherit',
                              cursor: 'pointer',
                              display: 'grid',
                              placeItems: 'center',
                            }}
                            aria-label="Increase quantity"
                          >
                            <span className="material-icons" style={{ fontSize: '14px' }}>add</span>
                          </button>
                        </div>

                        {/* Price */}
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.92rem', fontWeight: 800, color: brandColor }}>
                            {currencySymbol}{itemTotal.toLocaleString()}
                          </span>
                          {item.quantity > 1 && (
                            <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                              {currencySymbol}{priceNum.toLocaleString()} each
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 4. DRAWER FOOTER: SUB-TOTAL & CHECKOUT ACTIONS */}
        {cartItems.length > 0 && (
          <div
            style={{
              padding: '18px 24px',
              borderTop: preset === 'hyper' ? '1px solid #1e293b' : '1px solid #e2e8f0',
              background: preset === 'hyper' ? '#0f172a' : '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* Special Instructions / Note toggle */}
            <div>
              {!showNoteInput ? (
                <button
                  type="button"
                  onClick={() => setShowNoteInput(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: brandColor,
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '15px' }}>edit_note</span>
                  <span>{orderNote ? 'Edit Order Instructions' : '+ Add Note / Instructions for Seller'}</span>
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <textarea
                    rows={2}
                    value={orderNote}
                    onChange={e => setOrderNote(e.target.value)}
                    placeholder="Specify sizes, colors, preferred delivery time or directions..."
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: preset === 'hyper' ? '1px solid #334155' : '1px solid #cbd5e1',
                      background: preset === 'hyper' ? '#1e293b' : '#f8fafc',
                      color: 'inherit',
                      fontSize: '0.8rem',
                      outline: 'none',
                      resize: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setShowNoteInput(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '0.75rem',
                        color: brandColor,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Subtotal & Delivery Line */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ opacity: 0.75 }}>Subtotal ({totalCount} items)</span>
                <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>
                  {currencySymbol}{subtotal.toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', opacity: 0.7 }}>
                <span>Delivery & Courier</span>
                <span>Calculated with merchant at confirmation</span>
              </div>
            </div>

            {/* PRIMARY CHECKOUT ACTION: WHATSAPP DIRECT ORDER */}
            <button
              type="button"
              onClick={handleWhatsAppCheckout}
              style={{
                width: '100%',
                padding: '13px 18px',
                borderRadius: '10px',
                border: 'none',
                background: preset === 'hyper' ? '#3665f3' : preset === 'xtra' ? '#f43f5e' : '#0f172a',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.94rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                transition: 'transform 0.15s, opacity 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.92' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              <span className="material-icons" style={{ fontSize: '18px' }}>
                {shop.whatsapp ? 'chat' : 'shopping_bag'}
              </span>
              <span>
                {isCopiedOrder
                  ? 'Order Details Copied to Clipboard!'
                  : shop.whatsapp
                  ? `Order via WhatsApp (${currencySymbol}${subtotal.toLocaleString()})`
                  : `Proceed to Order (${currencySymbol}${subtotal.toLocaleString()})`}
              </span>
            </button>

            {/* Trust footer note */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '0.74rem',
                opacity: 0.65,
                textAlign: 'center',
              }}
            >
              <span className="material-icons" style={{ fontSize: '14px', color: '#10b981' }}>verified_user</span>
              <span>Pre-inspection allowed upon door delivery • MarketSpace Buyer Protection</span>
            </div>
          </div>
        )}
      </div>

      {/* Slide and fade keyframe animation styling */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
