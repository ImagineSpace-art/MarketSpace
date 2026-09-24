import type { BusinessProfile, StoreThemeConfig } from '../../types'

interface StoreFooterProps {
  shop: BusinessProfile
  themeConfig?: StoreThemeConfig
  onNavigateTarget?: (target: string) => void
}

export function StoreFooter({ shop, themeConfig, onNavigateTarget }: StoreFooterProps) {
  const brandColor = themeConfig?.primaryColor || shop.accentColor || '#2563eb'
  const navLinks = themeConfig?.navigation?.links || [
    { id: 'f_1', label: 'Home', url: '#top' },
    { id: 'f_2', label: 'All Products', url: '#products' },
    { id: 'f_3', label: 'Departments', url: '#departments' },
    { id: 'f_4', label: 'Our Story', url: '#story' },
    { id: 'f_5', label: 'Customer Reviews', url: '#testimonials' },
    { id: 'f_6', label: 'FAQ', url: '#faq' },
  ]

  const handleLinkClick = (url: string, e: React.MouseEvent) => {
    e.preventDefault()
    if (onNavigateTarget) {
      onNavigateTarget(url)
    } else if (url.startsWith('#')) {
      const el = document.querySelector(url)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else if (url.startsWith('http')) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const currentYear = new Date().getFullYear()
  const isHyper = themeConfig?.presetName === 'hyper'

  if (isHyper) {
    return (
      <footer
        style={{
          background: '#f7f7f7',
          color: '#555555',
          borderTop: '1px solid #e5e5e5',
          marginTop: '60px',
          fontSize: '0.8rem',
          lineHeight: '1.4',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '36px 20px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '28px',
          }}
        >
          {/* Col 1: Buy */}
          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.86rem', fontWeight: 700, color: '#191919' }}>Buy</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><a href="#products" onClick={e => handleLinkClick('#products', e)} style={{ color: '#555', textDecoration: 'none' }}>Registration</a></li>
              <li><a href="#products" onClick={e => handleLinkClick('#products', e)} style={{ color: '#555', textDecoration: 'none' }}>Bidding & buying help</a></li>
              <li><a href="#departments" onClick={e => handleLinkClick('#departments', e)} style={{ color: '#555', textDecoration: 'none' }}>Stores</a></li>
              <li><a href="#products" onClick={e => handleLinkClick('#products', e)} style={{ color: '#555', textDecoration: 'none' }}>Creator Collections</a></li>
              <li><a href="#products" onClick={e => handleLinkClick('#products', e)} style={{ color: '#555', textDecoration: 'none' }}>Store for Charity</a></li>
              <li><a href="#products" onClick={e => handleLinkClick('#products', e)} style={{ color: '#555', textDecoration: 'none' }}>Charity Shop</a></li>
              <li><a href="#products" onClick={e => handleLinkClick('#products', e)} style={{ color: '#555', textDecoration: 'none' }}>Seasonal Sales and events</a></li>
            </ul>
          </div>

          {/* Col 2: Sell */}
          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.86rem', fontWeight: 700, color: '#191919' }}>Sell</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><a href="/profile/create" style={{ color: '#555', textDecoration: 'none' }}>Start selling</a></li>
              <li><a href="#care" onClick={e => handleLinkClick('#care', e)} style={{ color: '#555', textDecoration: 'none' }}>How to sell</a></li>
              <li><a href="/profile/store-dashboard" style={{ color: '#555', textDecoration: 'none' }}>Business sellers</a></li>
              <li><a href="#care" onClick={e => handleLinkClick('#care', e)} style={{ color: '#555', textDecoration: 'none' }}>Affiliates</a></li>
            </ul>
            <h4 style={{ margin: '16px 0 10px 0', fontSize: '0.86rem', fontWeight: 700, color: '#191919' }}>Tools & apps</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><a href="/profile" style={{ color: '#555', textDecoration: 'none' }}>Developers</a></li>
              <li><a href="#care" onClick={e => handleLinkClick('#care', e)} style={{ color: '#555', textDecoration: 'none' }}>Security center</a></li>
              <li><a href="#products" onClick={e => handleLinkClick('#products', e)} style={{ color: '#555', textDecoration: 'none' }}>Site map</a></li>
            </ul>
          </div>

          {/* Col 3: Companies & Social */}
          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.86rem', fontWeight: 700, color: '#191919' }}>MarketSpace companies</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><a href="#products" onClick={e => handleLinkClick('#products', e)} style={{ color: '#555', textDecoration: 'none' }}>TCGplayer</a></li>
            </ul>
            <h4 style={{ margin: '16px 0 10px 0', fontSize: '0.86rem', fontWeight: 700, color: '#191919' }}>Stay connected</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" style={{ color: '#555', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-icons" style={{ fontSize: '16px', color: '#1877f2' }}>public</span>
                  <span>Facebook</span>
                </a>
              </li>
              <li>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" style={{ color: '#555', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-icons" style={{ fontSize: '16px', color: '#1da1f2' }}>tag</span>
                  <span>X (Twitter)</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: About Store */}
          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.86rem', fontWeight: 700, color: '#191919' }}>About {shop.shopName}</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><a href="#story" onClick={e => handleLinkClick('#story', e)} style={{ color: '#555', textDecoration: 'none' }}>Company info</a></li>
              <li><a href="#story" onClick={e => handleLinkClick('#story', e)} style={{ color: '#555', textDecoration: 'none' }}>News</a></li>
              <li><a href="#care" onClick={e => handleLinkClick('#care', e)} style={{ color: '#555', textDecoration: 'none' }}>Investors</a></li>
              <li><a href="#care" onClick={e => handleLinkClick('#care', e)} style={{ color: '#555', textDecoration: 'none' }}>Careers</a></li>
              <li><a href="#care" onClick={e => handleLinkClick('#care', e)} style={{ color: '#555', textDecoration: 'none' }}>Diversity & Inclusion</a></li>
              <li><a href="#care" onClick={e => handleLinkClick('#care', e)} style={{ color: '#555', textDecoration: 'none' }}>Global Impact</a></li>
              <li><a href="#care" onClick={e => handleLinkClick('#care', e)} style={{ color: '#555', textDecoration: 'none' }}>Government relations</a></li>
              <li><a href="#care" onClick={e => handleLinkClick('#care', e)} style={{ color: '#555', textDecoration: 'none' }}>Advertise with us</a></li>
              <li><a href="#care" onClick={e => handleLinkClick('#care', e)} style={{ color: '#555', textDecoration: 'none' }}>Policies</a></li>
              <li><a href="#care" onClick={e => handleLinkClick('#care', e)} style={{ color: '#555', textDecoration: 'none' }}>Verified Rights Owner (VeRO) Program</a></li>
            </ul>
          </div>

          {/* Col 5: Help, Contact & Sites */}
          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.86rem', fontWeight: 700, color: '#191919' }}>Help & Contact</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><a href="#care" onClick={e => handleLinkClick('#care', e)} style={{ color: '#555', textDecoration: 'none' }}>Seller Center</a></li>
              <li><a href="#care" onClick={e => handleLinkClick('#care', e)} style={{ color: '#555', textDecoration: 'none' }}>Contact Us</a></li>
              <li><a href="#care" onClick={e => handleLinkClick('#care', e)} style={{ color: '#555', textDecoration: 'none' }}>Returns</a></li>
              <li><a href="#care" onClick={e => handleLinkClick('#care', e)} style={{ color: '#555', textDecoration: 'none' }}>Money Back Guarantee</a></li>
            </ul>

            <h4 style={{ margin: '16px 0 10px 0', fontSize: '0.86rem', fontWeight: 700, color: '#191919' }}>Community</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><a href="#reviews" onClick={e => handleLinkClick('#reviews', e)} style={{ color: '#555', textDecoration: 'none' }}>Announcements</a></li>
              <li><a href="#reviews" onClick={e => handleLinkClick('#reviews', e)} style={{ color: '#555', textDecoration: 'none' }}>Community Forums</a></li>
            </ul>

            <h4 style={{ margin: '16px 0 10px 0', fontSize: '0.86rem', fontWeight: 700, color: '#191919' }}>Regional Store</h4>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: '6px', background: '#ffffff' }}>
              <span className="material-icons" style={{ fontSize: '16px', color: '#10b981' }}>flag</span>
              <span style={{ fontWeight: 600, color: '#191919', fontSize: '0.8rem' }}>Zambia / Global</span>
              <span className="material-icons" style={{ fontSize: '14px', color: '#6b7280' }}>expand_more</span>
            </div>
          </div>
        </div>

        {/* Legal notice strip */}
        <div style={{ borderTop: '1px solid #e5e5e5', padding: '16px 20px', maxWidth: '1280px', margin: '0 auto', color: '#707070', fontSize: '0.74rem' }}>
          <p style={{ margin: '0 0 6px 0' }}>
            Copyright © 1995-{currentYear} MarketSpace Inc. All Rights Reserved.{' '}
            <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Accessibility</span>,{' '}
            <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>User Agreement</span>,{' '}
            <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Privacy</span>,{' '}
            <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Payments Terms of Use</span>,{' '}
            <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Cookies</span>,{' '}
            <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>CA Privacy Notice</span>,{' '}
            <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Your Privacy Choices</span>, and{' '}
            <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>AdChoice</span>.
          </p>
        </div>
      </footer>
    )
  }

  return (
    <footer
      style={{
        background: '#0f172a',
        color: '#f8fafc',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        marginTop: '60px',
        position: 'relative',
        zIndex: 20,
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '48px 24px 28px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '36px',
        }}
      >
        {/* Column 1: Store Brand Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {shop.logo ? (
              <img
                src={shop.logo}
                alt={shop.shopName}
                style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover', border: `2px solid ${brandColor}` }}
              />
            ) : (
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: brandColor,
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 800,
                  fontSize: '18px',
                }}
              >
                {shop.shopName.charAt(0)}
              </div>
            )}
            <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              {shop.shopName}
            </span>
          </div>

          <p style={{ margin: 0, fontSize: '0.86rem', color: '#94a3b8', lineHeight: 1.5 }}>
            {shop.description || 'Welcome to our official online store. Offering verified quality products, transparent customer service, and fast delivery.'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#38bdf8' }}>
            <span className="material-icons" style={{ fontSize: '16px' }}>verified</span>
            <span>Verified MarketSpace Merchant Store</span>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '0.92rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#e2e8f0' }}>
            Quick Links
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {navLinks.slice(0, 6).map(l => (
              <li key={l.id}>
                <a
                  href={l.url}
                  onClick={e => handleLinkClick(l.url, e)}
                  style={{
                    color: '#94a3b8',
                    textDecoration: 'none',
                    fontSize: '0.88rem',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Customer Care & Contact */}
        <div>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '0.92rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#e2e8f0' }}>
            Customer Care
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: '#94a3b8' }}>
            {shop.address && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span className="material-icons" style={{ fontSize: '18px', color: brandColor, flexShrink: 0 }}>place</span>
                <span>{shop.address}</span>
              </div>
            )}
            {shop.whatsapp && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="material-icons" style={{ fontSize: '18px', color: '#22c55e', flexShrink: 0 }}>chat</span>
                <a
                  href={`https://wa.me/${shop.whatsapp.replace(/[^\d]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 600 }}
                >
                  WhatsApp: {shop.whatsapp}
                </a>
              </div>
            )}
            {shop.customerCare?.hours && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="material-icons" style={{ fontSize: '18px', color: '#eab308', flexShrink: 0 }}>schedule</span>
                <span>Hours: {shop.customerCare.hours}</span>
              </div>
            )}
            {shop.customerCare?.delivery && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="material-icons" style={{ fontSize: '18px', color: '#a855f7', flexShrink: 0 }}>local_shipping</span>
                <span>{shop.customerCare.delivery}</span>
              </div>
            )}
          </div>
        </div>

        {/* Column 4: Trust & Policies */}
        <div>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '0.92rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#e2e8f0' }}>
            Store Policy
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.5 }}>
            <p style={{ margin: 0 }}>
              {shop.customerCare?.returns || 'Inspection and verification welcome before completing order.'}
            </p>
            <div style={{ marginTop: '8px', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600 }}>Payment Options:</span>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                {shop.customerCare?.payment || 'Cash on delivery, Mobile Money, and In-Person pickup.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sub-footer */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '16px 24px',
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '0.8rem',
          color: '#64748b',
        }}
      >
        <div>
          © {currentYear} {shop.shopName}. All rights reserved.
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Powered by</span>
          <a
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              color: '#94a3b8',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
            title="Visit MarketSpace Marketplace"
          >
            <span>❖ MarketSpace</span>
          </a>
        </div>
      </div>
    </footer>
  )
}
