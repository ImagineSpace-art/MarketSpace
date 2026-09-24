import { useState } from 'react'
import type { BusinessProfile, StoreThemeConfig, StoreNavConfig } from '../../types'
import { DEFAULT_NAVIGATION_CONFIG } from './defaultSections'

export interface StoreNavbarProps {
  shop: BusinessProfile
  themeConfig?: StoreThemeConfig
  currentUserId?: string
  isFollowing?: boolean
  followerCount?: number
  onToggleFollow?: () => void
  onMessageSeller?: () => void
  onSearchChange?: (query: string) => void
  onNavigateTarget?: (target: string) => void
  isOwner?: boolean
  onOpenCustomizer?: () => void
  isLiveCanvas?: boolean
  isNotified?: boolean
  onToggleNotify?: () => void
  onOpenPanel?: () => void
  cartCount?: number
  onOpenCart?: () => void
}

export function StoreNavbar({
  shop,
  themeConfig,
  currentUserId = '',
  isFollowing = false,
  followerCount = 0,
  onToggleFollow,
  onMessageSeller,
  onSearchChange,
  onNavigateTarget,
  isOwner = false,
  onOpenCustomizer,
  isLiveCanvas: _isLiveCanvas = false,
  isNotified = false,
  onToggleNotify,
  onOpenPanel,
  cartCount = 0,
  onOpenCart,
}: StoreNavbarProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [storeSearchInput, setStoreSearchInput] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const navConfig: StoreNavConfig = themeConfig?.navigation || DEFAULT_NAVIGATION_CONFIG
  const isSuperstore = themeConfig?.presetName === 'hyper' || themeConfig?.presetName === 'xtra' || navConfig.showCategorySelector
  const bg = navConfig.backgroundColor || '#ffffff'
  const text = navConfig.textColor || '#0f172a'
  const accent = navConfig.accentColor || themeConfig?.primaryColor || shop.accentColor || '#2563eb'
  const isSticky = navConfig.isSticky !== false
  const layout = navConfig.layout || 'logo-left'
  const logoStyle = navConfig.logoStyle || 'both'
  const showSearch = navConfig.showSearch !== false
  const showContact = navConfig.showContactBtn !== false
  const showFollow = navConfig.showFollowBtn !== false
  const showNotifications = navConfig.showNotificationsBtn !== false
  const showPanel = navConfig.showPanelBtn !== false
  const showCart = navConfig.showCartBtn !== false
  const links = navConfig.links || []

  const logoImage = shop.logo || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=120&auto=format&fit=crop&q=60'

  const handleLinkClick = (url: string, e: React.MouseEvent) => {
    e.preventDefault()
    setMobileDrawerOpen(false)
    if (onNavigateTarget) {
      onNavigateTarget(url)
    } else if (url.startsWith('#')) {
      const el = document.querySelector(url)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else if (url.startsWith('http')) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearchChange) {
      onSearchChange(storeSearchInput.trim())
    }
  }

  return (
    <header
      style={{
        position: isSticky ? 'sticky' : 'relative',
        top: 0,
        zIndex: 90,
        backgroundColor: bg,
        color: text,
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        boxShadow: isSticky ? '0 2px 10px rgba(0,0,0,0.05)' : 'none',
        transition: 'background-color 0.2s, box-shadow 0.2s',
        width: '100%',
      }}
    >
      {/* 1. HYPER TOP UTILITY STRIP (when preset is hyper) */}
      {themeConfig?.presetName === 'hyper' && (
        <div
          style={{
            borderBottom: '1px solid #e5e5e5',
            backgroundColor: '#ffffff',
            fontSize: '0.75rem',
            color: '#333333',
            lineHeight: 1,
          }}
        >
          <div
            style={{
              maxWidth: '1280px',
              margin: '0 auto',
              padding: '6px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            {/* Left Side: Auth & Utility Links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <span>
                Hi!{' '}
                <a
                  href="#login"
                  onClick={e => handleLinkClick('#login', e)}
                  style={{ color: '#3665f3', textDecoration: 'underline', fontWeight: 400 }}
                >
                  Sign in
                </a>{' '}
                or{' '}
                <a
                  href="#register"
                  onClick={e => handleLinkClick('#register', e)}
                  style={{ color: '#3665f3', textDecoration: 'underline', fontWeight: 400 }}
                >
                  register
                </a>
              </span>
              <a
                href="#deals"
                onClick={e => handleLinkClick('#deals', e)}
                style={{ color: '#333333', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#3665f3'; e.currentTarget.style.textDecoration = 'underline' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#333333'; e.currentTarget.style.textDecoration = 'none' }}
              >
                Deals
              </a>
              <a
                href="#outlet"
                onClick={e => handleLinkClick('#outlet', e)}
                style={{ color: '#333333', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#3665f3'; e.currentTarget.style.textDecoration = 'underline' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#333333'; e.currentTarget.style.textDecoration = 'none' }}
              >
                Brand Outlet
              </a>
              <a
                href="#help"
                onClick={e => {
                  e.preventDefault()
                  if (onOpenPanel) onOpenPanel()
                  else handleLinkClick('#help', e)
                }}
                style={{ color: '#333333', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#3665f3'; e.currentTarget.style.textDecoration = 'underline' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#333333'; e.currentTarget.style.textDecoration = 'none' }}
              >
                Help & Contact
              </a>
            </div>

            {/* Right Side: Ship to, Sell, Watchlist, My Store, Notifications, Cart, Owner customize */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <span
                style={{ cursor: 'pointer', color: '#333333' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#3665f3'; e.currentTarget.style.textDecoration = 'underline' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#333333'; e.currentTarget.style.textDecoration = 'none' }}
              >
                Ship to
              </span>
              <a
                href="#sell"
                onClick={e => handleLinkClick('#sell', e)}
                style={{ color: '#333333', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#3665f3'; e.currentTarget.style.textDecoration = 'underline' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#333333'; e.currentTarget.style.textDecoration = 'none' }}
              >
                Sell
              </a>
              <span
                style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', cursor: 'pointer', color: '#333333' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#3665f3' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#333333' }}
              >
                Watchlist <span className="material-icons" style={{ fontSize: '14px', color: '#707070' }}>expand_more</span>
              </span>
              <span
                style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', cursor: 'pointer', color: '#333333' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#3665f3' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#333333' }}
              >
                My Store <span className="material-icons" style={{ fontSize: '14px', color: '#707070' }}>expand_more</span>
              </span>
              <button
                type="button"
                onClick={onToggleNotify}
                title={isNotified ? 'Turn off notifications' : 'Get notifications'}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: isNotified ? '#3665f3' : '#333333',
                  display: 'grid',
                  placeItems: 'center',
                  padding: 0,
                  transition: 'color 0.15s',
                }}
              >
                <span className="material-icons" style={{ fontSize: '19px' }}>
                  {isNotified ? 'notifications_active' : 'notifications_none'}
                </span>
              </button>
              <button
                type="button"
                onClick={onOpenCart}
                title="View shopping cart"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#191919',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0,
                  position: 'relative',
                }}
              >
                <span className="material-icons" style={{ fontSize: '20px' }}>shopping_cart</span>
                {cartCount > 0 && (
                  <span
                    style={{
                      background: '#e53238',
                      color: '#ffffff',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      borderRadius: '10px',
                      padding: '1px 5px',
                      minWidth: '16px',
                      textAlign: 'center',
                      lineHeight: 1.2,
                    }}
                  >
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Discreet owner customizer trigger */}
              {isOwner && onOpenCustomizer && (
                <button
                  type="button"
                  onClick={onOpenCustomizer}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    border: '1px dashed #3665f3',
                    background: '#eff6ff',
                    color: '#254edb',
                    fontWeight: 700,
                    fontSize: '0.70rem',
                    cursor: 'pointer',
                    marginLeft: '6px',
                  }}
                  title="Open Theme Customizer"
                >
                  <span className="material-icons" style={{ fontSize: '12px' }}>tune</span>
                  <span>Customize</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN STORE NAVIGATION BAR */}
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: themeConfig?.presetName === 'hyper' ? '12px 20px' : '7px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: layout === 'logo-center' ? 'space-between' : 'flex-start',
          gap: '16px',
          position: 'relative',
        }}
      >
        {/* BRAND LOGO & STORE NAME */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
          <a
            href="#top"
            onClick={e => handleLinkClick('#top', e)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              color: 'inherit',
              cursor: 'pointer',
            }}
          >
            {themeConfig?.presetName === 'hyper' ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  fontWeight: 850,
                  fontSize: (shop.shopName || '').length > 14 ? '1.75rem' : '2.3rem',
                  letterSpacing: '-0.04em',
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  lineHeight: 1,
                }}
              >
                {(() => {
                  const colors = ['#e53238', '#0064d2', '#f5af02', '#86b817']
                  const name = shop.shopName || 'Store'
                  return name.split('').map((char, i) => (
                    <span key={i} style={{ color: colors[i % colors.length] }}>
                      {char}
                    </span>
                  ))
                })()}
              </div>
            ) : (
              <>
                {logoStyle !== 'name-only' && (
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: '#ffffff',
                      border: `1.5px solid ${accent}`,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <img src={logoImage} alt={shop.shopName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}

                {logoStyle !== 'logo-only' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 750, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                        {shop.shopName}
                      </span>
                      <span
                        className="material-icons"
                        style={{ fontSize: '14px', color: accent }}
                        title="Verified MarketSpace Merchant"
                      >
                        verified
                      </span>
                    </div>
                    <span style={{ fontSize: '0.68rem', opacity: 0.7, fontWeight: 500 }}>
                      {shop.category || 'Store'}
                    </span>
                  </div>
                )}
              </>
            )}
          </a>

          {/* Shop by category stacked 2-line dropdown trigger */}
          {themeConfig?.presetName === 'hyper' && (
            <button
              type="button"
              onClick={() => {
                const el = document.querySelector('#departments') || document.querySelector('#products')
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0 4px',
                lineHeight: 1.15,
                marginRight: '12px',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: '11px', color: '#707070', fontWeight: 400 }}>Shop by</span>
              <span style={{ fontSize: '12px', color: '#191919', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                category
                <span className="material-icons" style={{ fontSize: '15px', color: '#707070' }}>expand_more</span>
              </span>
            </button>
          )}
        </div>

        {/* FLASH CATALOG PILL FOR XTRA */}
        {themeConfig?.presetName === 'xtra' && (
          <button
            type="button"
            onClick={() => {
              const el = document.querySelector('#departments') || document.querySelector('#products')
              el?.scrollIntoView({ behavior: 'smooth' })
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              padding: '4px 10px',
              background: '#facc15',
              color: '#0f172a',
              borderRadius: '9999px',
              fontSize: '0.74rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(250,204,21,0.25)',
              marginLeft: '2px',
              flexShrink: 0,
            }}
          >
            <span>Flash catalog</span>
            <span className="material-icons" style={{ fontSize: '14px' }}>expand_more</span>
          </button>
        )}

        {/* DESKTOP NAV LINKS OR CENTER SUPERSTORE SEARCH */}
        {themeConfig?.presetName === 'hyper' ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '820px' }}>
            <form
              onSubmit={handleSearchSubmit}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  background: '#ffffff',
                  border: '2px solid #191919',
                  borderRadius: '9999px',
                  height: '42px',
                  padding: '0 14px 0 16px',
                  boxSizing: 'border-box',
                }}
              >
                <span className="material-icons" style={{ fontSize: '20px', color: '#707070', marginRight: '6px', flexShrink: 0 }}>
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search for anything"
                  value={storeSearchInput}
                  onChange={e => {
                    setStoreSearchInput(e.target.value)
                    if (onSearchChange) onSearchChange(e.target.value)
                  }}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: '0.9rem',
                    color: '#191919',
                    background: 'transparent',
                    minWidth: 0,
                  }}
                />
                <button
                  type="button"
                  title="Search with image"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    color: '#555555',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '19px' }}>photo_camera</span>
                </button>

                <div style={{ width: '1px', height: '22px', backgroundColor: '#d1d5db', margin: '0 8px', flexShrink: 0 }} />

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <select
                    value={selectedCategory}
                    onChange={e => {
                      setSelectedCategory(e.target.value)
                      if (e.target.value !== 'all') {
                        if (onNavigateTarget) onNavigateTarget(`category:${e.target.value}`)
                      }
                    }}
                    style={{
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      paddingRight: '18px',
                      paddingLeft: '2px',
                      background: 'transparent',
                      border: 'none',
                      fontSize: '0.82rem',
                      color: '#555555',
                      outline: 'none',
                      cursor: 'pointer',
                      fontWeight: 400,
                    }}
                  >
                    <option value="all">All Categories</option>
                    {(shop.collections || []).map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    {(!shop.collections || shop.collections.length === 0) && (
                      <>
                        <option value="Electronics">Electronics</option>
                        <option value="Motors">Motors</option>
                        <option value="Fashion">Fashion</option>
                        <option value="Collectibles">Collectibles</option>
                      </>
                    )}
                  </select>
                  <span
                    className="material-icons"
                    style={{
                      position: 'absolute',
                      right: 0,
                      pointerEvents: 'none',
                      fontSize: '15px',
                      color: '#707070',
                    }}
                  >
                    expand_more
                  </span>
                </div>
              </div>

              <button
                type="submit"
                style={{
                  background: '#3665f3',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '0 40px',
                  height: '42px',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#254edb' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#3665f3' }}
              >
                Search
              </button>
            </form>

            <a
              href="#advanced"
              onClick={e => {
                e.preventDefault()
                const el = document.querySelector('#products')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }}
              style={{
                fontSize: '0.74rem',
                color: '#555555',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                marginLeft: '4px',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#3665f3'; e.currentTarget.style.textDecoration = 'underline' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#555555'; e.currentTarget.style.textDecoration = 'none' }}
            >
              Advanced
            </a>
          </div>
        ) : isSuperstore ? (
          <div style={{ flex: 1, maxWidth: '480px', margin: '0 12px' }}>
            <form
              onSubmit={handleSearchSubmit}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#ffffff',
                border: '1px solid rgba(0,0,0,0.14)',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocusCapture={e => {
                e.currentTarget.style.borderColor = accent
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(24,24,27,0.08)'
              }}
              onBlurCapture={e => {
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.14)'
                e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.03)'
              }}
            >
              <select
                value={selectedCategory}
                onChange={e => {
                  setSelectedCategory(e.target.value)
                  if (e.target.value !== 'all') {
                    if (onNavigateTarget) onNavigateTarget(`category:${e.target.value}`)
                  }
                }}
                style={{
                  padding: '5px 8px',
                  background: '#f8fafc',
                  border: 'none',
                  borderRight: '1px solid rgba(0,0,0,0.1)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#334155',
                  outline: 'none',
                  cursor: 'pointer',
                  maxWidth: '120px',
                }}
              >
                <option value="all">All Categories</option>
                {(shop.collections || []).map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
                {(!shop.collections || shop.collections.length === 0) && (
                  <>
                    <option value="Living Room">Living Room</option>
                    <option value="Bedroom">Bedroom</option>
                    <option value="Interior Decor">Interior Decor</option>
                    <option value="Kitchen & Dining">Kitchen & Dining</option>
                  </>
                )}
              </select>
              <input
                type="text"
                placeholder={`Search in ${shop.shopName}...`}
                value={storeSearchInput}
                onChange={e => {
                  setStoreSearchInput(e.target.value)
                  if (onSearchChange) onSearchChange(e.target.value)
                }}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.8rem',
                  color: '#0f172a',
                  background: 'transparent',
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '0 12px',
                  color: '#0f172a',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  opacity: 0.8,
                }}
              >
                <span className="material-icons" style={{ fontSize: '17px' }}>search</span>
              </button>
            </form>
          </div>
        ) : (
          <nav
            className="store-nav-links-desktop"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              flex: layout === 'logo-left' ? 1 : 'none',
              marginLeft: layout === 'logo-left' ? '8px' : 0,
              flexWrap: 'wrap',
            }}
          >
            {links.map(link => (
              <a
                key={link.id}
                href={link.url}
                onClick={e => handleLinkClick(link.url, e)}
                style={{
                  color: 'inherit',
                  textDecoration: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: '6px',
                  transition: 'color 0.15s, background-color 0.15s',
                  opacity: 0.85,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.opacity = '1'
                  e.currentTarget.style.color = accent
                  e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.opacity = '0.85'
                  e.currentTarget.style.color = 'inherit'
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}

        {/* RIGHT SIDE ACTIONS: SEARCH, CONTACT, FOLLOW, OWNER CUSTOMIZER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: isSuperstore ? '0' : 'auto', flexShrink: 0 }}>
          {themeConfig?.presetName !== 'hyper' && (
            <>
              {/* COMPACT IN-STORE SEARCH (for non-superstore themes) */}
              {!isSuperstore && showSearch && (
                <form onSubmit={handleSearchSubmit} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder={`Search ${shop.shopName}...`}
                    value={storeSearchInput}
                    onChange={e => {
                      setStoreSearchInput(e.target.value)
                      if (onSearchChange) onSearchChange(e.target.value)
                    }}
                    style={{
                      padding: '5px 26px 5px 10px',
                      borderRadius: '18px',
                      border: '1px solid rgba(0,0,0,0.14)',
                      background: 'rgba(0,0,0,0.02)',
                      color: 'inherit',
                      fontSize: '0.78rem',
                      width: '130px',
                      outline: 'none',
                      transition: 'width 0.2s, border-color 0.2s, background-color 0.2s',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.width = '180px'
                      e.currentTarget.style.borderColor = accent
                      e.currentTarget.style.backgroundColor = '#ffffff'
                    }}
                    onBlur={e => {
                      if (!storeSearchInput) {
                        e.currentTarget.style.width = '130px'
                        e.currentTarget.style.borderColor = 'rgba(0,0,0,0.14)'
                        e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)'
                      }
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      position: 'absolute',
                      right: '5px',
                      background: 'transparent',
                      border: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                      display: 'grid',
                      placeItems: 'center',
                      opacity: 0.6,
                    }}
                  >
                    <span className="material-icons" style={{ fontSize: '15px' }}>search</span>
                  </button>
                </form>
              )}

              {/* FOLLOW BUTTON */}
              {showFollow && onToggleFollow && currentUserId !== shop.userId && (
                <button
                  type="button"
                  onClick={onToggleFollow}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: `1px solid ${accent}`,
                    background: isFollowing ? 'transparent' : accent,
                    color: isFollowing ? accent : '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '14px' }}>
                    {isFollowing ? 'check' : 'person_add'}
                  </span>
                  <span>{isFollowing ? 'Following' : 'Follow'}</span>
                  {followerCount > 0 && <span style={{ opacity: 0.8, fontSize: '0.72rem' }}>({followerCount})</span>}
                </button>
              )}

              {/* CONTACT / CHAT BUTTON */}
              {showContact && onMessageSeller && (
                <button
                  type="button"
                  onClick={onMessageSeller}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: accent,
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '14px' }}>chat</span>
                  <span>Chat</span>
                </button>
              )}

              {/* STORE NOTIFICATIONS TOGGLE BUTTON */}
              {showNotifications && onToggleNotify && (
                <button
                  type="button"
                  onClick={onToggleNotify}
                  title={isNotified ? 'Turn off store drop notifications' : 'Get notified when this store adds new drops & deals'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '30px',
                    height: '30px',
                    borderRadius: '6px',
                    border: isNotified ? `1.5px solid ${accent}` : '1px solid rgba(0,0,0,0.14)',
                    background: isNotified ? `${accent}18` : 'rgba(0,0,0,0.03)',
                    color: isNotified ? accent : 'inherit',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.15s',
                  }}
                  aria-label={isNotified ? 'Disable store drop notifications' : 'Enable store drop notifications'}
                >
                  <span className="material-icons" style={{ fontSize: '17px' }}>
                    {isNotified ? 'notifications_active' : 'notifications_none'}
                  </span>
                  {isNotified && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: accent,
                      }}
                    />
                  )}
                </button>
              )}

              {/* STORE INFO PANEL TRIGGER BUTTON */}
              {showPanel && onOpenPanel && (
                <button
                  type="button"
                  onClick={onOpenPanel}
                  title="View store concierge, policies & guarantees"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(0,0,0,0.14)',
                    background: 'rgba(0,0,0,0.03)',
                    color: 'inherit',
                    fontWeight: 600,
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '15px', opacity: 0.85 }}>info</span>
                  <span className="store-nav-info-label">Store Info</span>
                </button>
              )}

              {/* FREE OVER $50 PILL FOR XTRA */}
              {themeConfig?.presetName === 'xtra' && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '3px 8px',
                    background: '#15803d',
                    color: '#ffffff',
                    borderRadius: '9999px',
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '12px' }}>bolt</span>
                  <span>Free over $50</span>
                </div>
              )}

              {/* CART DRAWER BUTTON */}
              {showCart && onOpenCart && (
                <button
                  type="button"
                  onClick={onOpenCart}
                  title="Open Shopping Cart Drawer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: cartCount > 0 ? `1.5px solid ${accent}` : '1px solid rgba(0,0,0,0.14)',
                    background: cartCount > 0 ? `${accent}15` : 'rgba(0,0,0,0.03)',
                    color: cartCount > 0 ? accent : 'inherit',
                    fontWeight: 700,
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.15s',
                  }}
                  aria-label="Open Cart Drawer"
                >
                  <span className="material-icons" style={{ fontSize: '17px' }}>shopping_bag</span>
                  <span className="store-nav-cart-label">Cart</span>
                  {cartCount > 0 && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '15px',
                        height: '15px',
                        padding: '0 4px',
                        borderRadius: '8px',
                        backgroundColor: accent,
                        color: '#ffffff',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        lineHeight: 1,
                      }}
                    >
                      {cartCount}
                    </span>
                  )}
                </button>
              )}

              {/* STORE OWNER QUICK CUSTOMIZER BUTTON */}
              {isOwner && onOpenCustomizer && (
                <button
                  type="button"
                  onClick={onOpenCustomizer}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: '1px dashed #2563eb',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    fontWeight: 700,
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                  }}
                  title="Open Theme & Navigation Customizer"
                >
                  <span className="material-icons" style={{ fontSize: '14px' }}>tune</span>
                  <span>Customize</span>
                </button>
              )}
            </>
          )}

          {/* MOBILE HAMBURGER BUTTON */}
          <button
            type="button"
            className="store-nav-hamburger"
            onClick={() => setMobileDrawerOpen(prev => !prev)}
            style={{
              display: 'none',
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              padding: '4px',
            }}
            aria-label="Toggle Navigation Menu"
          >
            <span className="material-icons" style={{ fontSize: '20px' }}>
              {mobileDrawerOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* 2.5 SUPERSTORE SECONDARY SUBNAV BAR */}
      {isSuperstore && links.length > 0 && (
        <div
          style={{
            borderTop: themeConfig?.presetName === 'hyper' ? 'none' : '1px solid #e5e5e5',
            borderBottom: '1px solid #e5e5e5',
            backgroundColor: bg,
            padding: themeConfig?.presetName === 'hyper' ? '8px 20px' : '5px 20px',
          }}
        >
          <div
            style={{
              maxWidth: '1280px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              gap: themeConfig?.presetName === 'hyper' ? '26px' : '18px',
              overflowX: 'auto',
              scrollbarWidth: 'none',
            }}
          >
            {links.map(link => {
              const isSavedLink = link.label.toLowerCase().includes('saved')
              const isDealsLink = link.label.toLowerCase().includes('deal')
              const isHyper = themeConfig?.presetName === 'hyper'

              return (
                <a
                  key={link.id}
                  href={link.url}
                  onClick={e => handleLinkClick(link.url, e)}
                  style={{
                    color: isHyper ? '#333333' : 'inherit',
                    textDecoration: 'none',
                    fontSize: isHyper ? '0.78rem' : '0.78rem',
                    fontWeight: isHyper ? 400 : 600,
                    whiteSpace: 'nowrap',
                    padding: '2px 0',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#3665f3'
                    if (isHyper) e.currentTarget.style.textDecoration = 'underline'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = isHyper ? '#333333' : 'inherit'
                    if (isHyper) e.currentTarget.style.textDecoration = 'none'
                  }}
                >
                  {isSavedLink && !isHyper && (
                    <span className="material-icons" style={{ fontSize: '15px', color: '#707070' }}>
                      favorite_border
                    </span>
                  )}
                  <span>{link.label}</span>
                  {isDealsLink && !isHyper && (
                    <span style={{ fontSize: '0.62rem', background: '#fee2e2', color: '#dc2626', padding: '1px 5px', borderRadius: '8px', fontWeight: 700 }}>
                      Hot
                    </span>
                  )}
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* 3. MOBILE SLIDE-OUT DRAWER */}
      {mobileDrawerOpen && (
        <div
          style={{
            borderTop: '1px solid rgba(0,0,0,0.08)',
            background: bg,
            color: text,
            padding: '16px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {links.map(link => (
            <a
              key={link.id}
              href={link.url}
              onClick={e => handleLinkClick(link.url, e)}
              style={{
                color: 'inherit',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                padding: '8px 0',
                borderBottom: '1px solid rgba(0,0,0,0.04)',
              }}
            >
              {link.label}
            </a>
          ))}

          {/* MOBILE STORE INFO & NOTIFICATIONS ROW */}
          <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            {showNotifications && onToggleNotify && (
              <button
                type="button"
                onClick={() => {
                  onToggleNotify()
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: isNotified ? `1.5px solid ${accent}` : '1px solid rgba(0,0,0,0.14)',
                  background: isNotified ? `${accent}18` : 'transparent',
                  color: isNotified ? accent : 'inherit',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                <span className="material-icons" style={{ fontSize: '18px' }}>
                  {isNotified ? 'notifications_active' : 'notifications_none'}
                </span>
                <span>{isNotified ? 'Alerts On' : 'Notify Drops'}</span>
              </button>
            )}

            {showPanel && onOpenPanel && (
              <button
                type="button"
                onClick={() => {
                  setMobileDrawerOpen(false)
                  onOpenPanel()
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(0,0,0,0.14)',
                  background: 'transparent',
                  color: 'inherit',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                <span className="material-icons" style={{ fontSize: '18px' }}>info</span>
                <span>Store Info</span>
              </button>
            )}
          </div>

          {/* MOBILE CART BUTTON */}
          {showCart && onOpenCart && (
            <button
              type="button"
              onClick={() => {
                setMobileDrawerOpen(false)
                onOpenCart()
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: '8px',
                border: `1.5px solid ${accent}`,
                background: cartCount > 0 ? `${accent}18` : 'transparent',
                color: accent,
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                marginTop: '4px',
              }}
            >
              <span className="material-icons" style={{ fontSize: '19px' }}>shopping_bag</span>
              <span>View Bag {cartCount > 0 ? `(${cartCount} items)` : ''}</span>
            </button>
          )}

          {onMessageSeller && (
            <button
              type="button"
              onClick={() => {
                setMobileDrawerOpen(false)
                onMessageSeller()
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: accent,
                color: '#ffffff',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '4px',
              }}
            >
              <span className="material-icons" style={{ fontSize: '18px' }}>chat</span>
              <span>Message Seller</span>
            </button>
          )}
        </div>
      )}

      {/* Media query styling for responsive hamburger & labels */}
      <style>{`
        @media (max-width: 900px) {
          .store-nav-links-desktop {
            display: none !important;
          }
          .store-nav-hamburger {
            display: flex !important;
          }
        }
        @media (max-width: 640px) {
          .store-nav-info-label,
          .store-nav-cart-label {
            display: none !important;
          }
        }
      `}</style>
    </header>
  )
}
