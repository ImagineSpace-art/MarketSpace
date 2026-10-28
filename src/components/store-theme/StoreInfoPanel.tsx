import { useState } from 'react'
import type { BusinessProfile, StoreThemeConfig } from '../../types'

export interface StoreInfoPanelProps {
  isOpen: boolean
  onClose: () => void
  shop: BusinessProfile
  themeConfig?: StoreThemeConfig
  isFollowing?: boolean
  followerCount?: number
  onToggleFollow?: () => void
  isNotified?: boolean
  onToggleNotify?: () => void
  onMessageSeller?: () => void
}

export function StoreInfoPanel({
  isOpen,
  onClose,
  shop,
  themeConfig,
  isFollowing = false,
  followerCount = 0,
  onToggleFollow,
  isNotified = false,
  onToggleNotify,
  onMessageSeller,
}: StoreInfoPanelProps) {
  const [copiedLink, setCopiedLink] = useState(false)

  if (!isOpen) return null

  const brandColor = themeConfig?.primaryColor || shop.accentColor || '#2563eb'
  const panelConfig = themeConfig?.panel || themeConfig?.navigation?.panel || {
    enabled: true,
    title: 'Store Information & Guidelines',
    subtitle: 'Verified merchant standards, customer support, and delivery commitments.',
    badgeText: 'Verified MarketSpace Store',
    highlights: [
      { icon: 'verified', title: 'Authenticity Guarantee', desc: '100% genuine verified products directly from our inventory.' },
      { icon: 'local_shipping', title: 'Fast Courier Delivery', desc: 'Door-to-door delivery nationwide with tracking available.' },
      { icon: 'security', title: 'Buyer Protection', desc: 'Pre-purchase inspection allowed upon delivery.' },
      { icon: 'notifications_active', title: 'Drop & Restock Alerts', desc: 'Instant notification on new catalog additions and deals.' },
    ]
  }

  const logoImage = shop.logo || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=120&auto=format&fit=crop&q=60'
  const care = shop.customerCare || {}

  const handleShare = () => {
    const url = window.location.href
    void navigator.clipboard.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          backgroundColor: 'var(--panel)',
          color: 'var(--text)',
          boxShadow: '-10px 0 35px rgba(0,0,0,0.35)',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid var(--border)',
          overflowY: 'auto',
          animation: 'slideLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* PANEL HEADER */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                overflow: 'hidden',
                border: `2px solid ${brandColor}`,
                background: '#ffffff',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0
              }}
            >
              <img src={logoImage} alt={shop.shopName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>{shop.shopName}</span>
                <span className="material-icons" style={{ fontSize: '16px', color: brandColor }} title="Verified">verified</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{shop.category || 'Official Merchant'}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              transition: 'background-color 0.15s'
            }}
            title="Close Panel"
          >
            <span className="material-icons" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>

        {/* PANEL CONTENT BODY */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px', flex: 1 }}>
          {/* Badge & Subtitle */}
          <div>
            {panelConfig.badgeText && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  backgroundColor: `${brandColor}18`,
                  color: brandColor,
                  border: `1px solid ${brandColor}35`,
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                <span className="material-icons" style={{ fontSize: '14px' }}>shield</span>
                {panelConfig.badgeText}
              </span>
            )}
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{panelConfig.title || 'Store Concierge'}</h3>
            <p style={{ margin: '6px 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {panelConfig.subtitle || shop.description}
            </p>
          </div>

          {/* STORE NOTIFICATIONS TOGGLE CARD */}
          <div
            style={{
              padding: '16px',
              borderRadius: '14px',
              background: isNotified ? `${brandColor}12` : 'var(--surface)',
              border: isNotified ? `1.5px solid ${brandColor}` : '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: isNotified ? brandColor : 'var(--border)',
                  color: isNotified ? '#ffffff' : 'var(--text-secondary)',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0
                }}
              >
                <span className="material-icons" style={{ fontSize: '20px' }}>
                  {isNotified ? 'notifications_active' : 'notifications_none'}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                  Store Drop Alerts
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  {isNotified ? 'Active: You get alerts for new products' : 'Get notified of new items & restocks'}
                </div>
              </div>
            </div>

            {/* Custom Toggle Switch */}
            <button
              type="button"
              onClick={onToggleNotify}
              style={{
                width: '46px',
                height: '26px',
                borderRadius: '13px',
                backgroundColor: isNotified ? brandColor : '#cbd5e1',
                border: 'none',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                padding: '2px',
                flexShrink: 0
              }}
              title={isNotified ? 'Turn off store notifications' : 'Turn on store notifications'}
            >
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                  transform: isNotified ? 'translateX(20px)' : 'translateX(0)',
                  transition: 'transform 0.2s'
                }}
              />
            </button>
          </div>

          {/* HIGHLIGHTS LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(panelConfig.highlights || []).map((h, i) => (
              <div
                key={i}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start'
                }}
              >
                <span className="material-icons" style={{ fontSize: '20px', color: brandColor, marginTop: '1px' }}>
                  {h.icon}
                </span>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>{h.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                    {h.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* POLICIES & HOURS BRIEF */}
          <div
            style={{
              padding: '16px',
              borderRadius: '14px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              fontSize: '0.82rem'
            }}
          >
            <div style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', fontSize: '0.74rem' }}>
              Store Overview
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Location:</span>
              <span style={{ fontWeight: 600 }}>{shop.address || 'Lusaka, Zambia'}</span>
            </div>

            {care.hours && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Hours:</span>
                <span style={{ fontWeight: 600 }}>{care.hours}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Followers:</span>
              <span style={{ fontWeight: 600 }}>{followerCount} shoppers</span>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto', paddingTop: '16px' }}>
            {onMessageSeller && (
              <button
                type="button"
                className="primary-btn"
                onClick={() => {
                  onClose()
                  onMessageSeller()
                }}
                style={{
                  backgroundColor: brandColor,
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: 700,
                  fontSize: '0.9rem'
                }}
              >
                <span className="material-icons" style={{ fontSize: '18px' }}>chat</span>
                Message Seller Directly
              </button>
            )}

            {shop.whatsapp && (
              <a
                href={`https://wa.me/${shop.whatsapp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Hi ${shop.shopName}, I'm reaching out from your official store page.`)}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  backgroundColor: '#25D366',
                  color: '#ffffff',
                  padding: '12px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: 700,
                  fontSize: '0.9rem'
                }}
              >
                <span className="material-icons" style={{ fontSize: '18px' }}>chat</span>
                Chat on WhatsApp
              </a>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              {onToggleFollow && (
                <button
                  type="button"
                  onClick={onToggleFollow}
                  className="secondary-btn"
                  style={{
                    flex: 1,
                    padding: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontWeight: 600,
                    fontSize: '0.85rem'
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '16px', color: isFollowing ? '#ef4444' : 'inherit' }}>
                    {isFollowing ? 'favorite' : 'favorite_border'}
                  </span>
                  {isFollowing ? 'Following Store' : 'Follow Store'}
                </button>
              )}

              <button
                type="button"
                onClick={handleShare}
                className="secondary-btn"
                style={{
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
                title="Share Store Link"
              >
                <span className="material-icons" style={{ fontSize: '16px' }}>share</span>
                {copiedLink ? 'Copied!' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
