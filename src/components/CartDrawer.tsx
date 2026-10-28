import { useState } from 'react'
import { Link } from 'react-router-dom'

export type CartItem = {
  id: number | string
  title: string
  price: number
  image?: string
  sellerName?: string
  sellerUserId?: string
  sellerPhone?: string
  quantity: number
}

type CartDrawerProps = {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  onUpdateQuantity: (id: number | string, qty: number) => void
  onRemoveItem: (id: number | string) => void
  onClearCart: () => void
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: CartDrawerProps) {
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState('Lusaka Central, Zambia')
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'card' | 'cod'>('momo')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [orderComplete, setOrderComplete] = useState(false)

  if (!isOpen) return null

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const shippingFee = subtotal >= 500 || items.length === 0 ? 0 : 45
  const total = subtotal + shippingFee

  const handleWhatsAppCheckout = () => {
    if (items.length === 0) return
    const orderLines = items
      .map((it, idx) => `${idx + 1}. ${it.title} (Qty: ${it.quantity}) - K${(it.price * it.quantity).toFixed(2)}`)
      .join('%0A')
    const msg = `Hello MarketSpace Merchant! I would like to place an order:%0A%0A${orderLines}%0A%0ASubtotal: K${subtotal.toFixed(
      2
    )}%0ADelivery Fee: K${shippingFee.toFixed(2)}%0ATotal: K${total.toFixed(
      2
    )}%0A%0APlease confirm availability and payment details.`
    
    // Find first seller's phone or default support
    const targetPhone = items[0]?.sellerPhone || '260970000000'
    const cleanPhone = targetPhone.replace(/[^0-9]/g, '')
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank')
  }

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault()
    setOrderComplete(true)
    setTimeout(() => {
      onClearCart()
      setOrderComplete(false)
      setCheckoutModalOpen(false)
      onClose()
    }, 2500)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(3px)',
          zIndex: 99990,
          transition: 'opacity 0.25s ease',
        }}
        onClick={onClose}
      />

      {/* Slide-out Drawer */}
      <div
        className="cart-drawer-panel"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#ffffff',
          boxShadow: '-8px 0 32px rgba(15, 23, 42, 0.15)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          animation: 'slideInCart 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <style>{`
          @keyframes slideInCart {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        {/* Drawer Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="material-icons" style={{ color: '#0f172a', fontSize: '24px' }}>
              shopping_bag
            </span>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              Shopping Bag ({items.reduce((s, it) => s + it.quantity, 0)})
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#475569',
            }}
          >
            <span className="material-icons" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div style={{ padding: '12px 24px', backgroundColor: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
            <span>
              {subtotal >= 500
                ? '🎉 You unlocked Free Nationwide Delivery!'
                : `Add K${(500 - subtotal).toFixed(2)} more for Free Delivery`}
            </span>
            <span>{Math.min(100, Math.round((subtotal / 500) * 100))}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, (subtotal / 500) * 100)}%`,
                height: '100%',
                backgroundColor: subtotal >= 500 ? '#10b981' : '#f97316',
                borderRadius: '999px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <span className="material-icons" style={{ fontSize: '64px', color: '#cbd5e1', marginBottom: '12px' }}>
                remove_shopping_cart
              </span>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: '#1e293b', fontWeight: 700 }}>
                Your bag is empty
              </h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '0.86rem' }}>
                Discover trending products and handcrafted items from verified stores.
              </p>
              <Link
                to="/browse"
                onClick={onClose}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  padding: '10px 20px',
                  borderRadius: '999px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  textDecoration: 'none',
                }}
              >
                <span>Browse Products</span>
                <span className="material-icons" style={{ fontSize: '16px' }}>arrow_forward</span>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    gap: '14px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid #f1f5f9',
                    alignItems: 'center',
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: '68px',
                      height: '68px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      backgroundColor: '#f1f5f9',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={item.image || '/banners/banner_fashion.png'}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4
                      style={{
                        margin: '0 0 3px 0',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: '#0f172a',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={item.title}
                    >
                      {item.title}
                    </h4>
                    {item.sellerName && (
                      <span
                        style={{
                          fontSize: '0.76rem',
                          color: '#64748b',
                          display: 'block',
                          marginBottom: '6px',
                        }}
                      >
                        by {item.sellerName}
                      </span>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: 800 }}>
                        K{(item.price * item.quantity).toFixed(2)}
                      </strong>

                      {/* Quantity Selector */}
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          border: '1px solid #e2e8f0',
                          borderRadius: '999px',
                          padding: '2px 6px',
                          gap: '6px',
                          backgroundColor: '#f8fafc',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px 4px',
                            color: '#475569',
                            fontWeight: 700,
                          }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, minWidth: '16px', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px 4px',
                            color: '#475569',
                            fontWeight: 700,
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                    }}
                    title="Remove item"
                  >
                    <span className="material-icons" style={{ fontSize: '18px' }}>delete_outline</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer & Checkout */}
        {items.length > 0 && (
          <div
            style={{
              padding: '20px 24px',
              borderTop: '1px solid #f1f5f9',
              backgroundColor: '#ffffff',
              boxShadow: '0 -4px 16px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: '#64748b' }}>
                <span>Subtotal</span>
                <span>K{subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: '#64748b' }}>
                <span>Delivery</span>
                <span>{shippingFee === 0 ? 'FREE' : `K${shippingFee.toFixed(2)}`}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1.1rem',
                  fontWeight: 900,
                  color: '#0f172a',
                  borderTop: '1px dashed #e2e8f0',
                  paddingTop: '8px',
                  marginTop: '4px',
                }}
              >
                <span>Total</span>
                <span>K{total.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setCheckoutModalOpen(true)}
                style={{
                  width: '100%',
                  height: '46px',
                  borderRadius: '999px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.96rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)',
                }}
              >
                <span>Proceed to Checkout</span>
                <span className="material-icons" style={{ fontSize: '18px' }}>arrow_forward</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsAppCheckout}
                style={{
                  width: '100%',
                  height: '42px',
                  borderRadius: '999px',
                  backgroundColor: '#22c55e',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span>Order via WhatsApp</span>
                <span className="material-icons" style={{ fontSize: '18px' }}>chat</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {checkoutModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setCheckoutModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '32px 28px',
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
              color: '#0f172a',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {orderComplete ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <span className="material-icons" style={{ fontSize: '64px', color: '#10b981', marginBottom: '12px' }}>
                  check_circle
                </span>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.3rem', fontWeight: 800 }}>
                  Order Confirmed!
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  Thank you for shopping on MarketSpace. The merchant has received your order and will contact you via WhatsApp / SMS for dispatch.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePlaceOrder}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Instant Checkout</h3>
                  <button
                    type="button"
                    onClick={() => setCheckoutModalOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                  >
                    <span className="material-icons">close</span>
                  </button>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px' }}>
                    Delivery Address
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px' }}>
                    Contact Phone Number (for dispatch)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +260 97 1234567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '8px' }}>
                    Payment Method
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('momo')}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '12px',
                        border: paymentMethod === 'momo' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        backgroundColor: paymentMethod === 'momo' ? '#eff6ff' : '#ffffff',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span className="material-icons" style={{ fontSize: '20px', color: '#2563eb' }}>phone_iphone</span>
                      <span>Mobile Money</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '12px',
                        border: paymentMethod === 'card' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        backgroundColor: paymentMethod === 'card' ? '#eff6ff' : '#ffffff',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span className="material-icons" style={{ fontSize: '20px', color: '#2563eb' }}>credit_card</span>
                      <span>Card / Debit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '12px',
                        border: paymentMethod === 'cod' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        backgroundColor: paymentMethod === 'cod' ? '#eff6ff' : '#ffffff',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span className="material-icons" style={{ fontSize: '20px', color: '#2563eb' }}>local_shipping</span>
                      <span>Pay on Delivery</span>
                    </button>
                  </div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '12px 14px', borderRadius: '12px', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 800 }}>
                    <span>Amount Payable:</span>
                    <span style={{ color: '#0f172a' }}>K{total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    height: '46px',
                    borderRadius: '999px',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.96rem',
                    cursor: 'pointer',
                  }}
                >
                  Confirm & Place Order
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
