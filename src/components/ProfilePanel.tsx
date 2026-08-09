import type { Profile, Listing, BusinessProfile } from '../types'

type ProfilePanelProps = {
  isOpen: boolean
  onClose: () => void
  profile: Profile | null
  userEmail: string
  myListings: Listing[]
  businessProfile: BusinessProfile | null
}

export function ProfilePanel({
  isOpen,
  onClose,
  profile,
  userEmail,
  myListings,
  businessProfile,
}: ProfilePanelProps) {
  const displayName = profile?.username || (userEmail && userEmail !== 'Guest' ? userEmail.split('@')[0] : 'User Profile')

  // Calculate stats dynamically
  const activeListingsCount = myListings.filter((l) => l.status !== 'Sold').length
  const soldListingsCount = myListings.filter((l) => l.status === 'Sold').length
  const draftsCount = 0


  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 990,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}

      {/* Main sliding side panel */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '380px',
          maxWidth: '100%',
          height: '100vh',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.4)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        }}
      >
        {/* Panel Header block */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 16px 8px' }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              transition: 'background 0.2s'
            }}
            title="Close"
          >
            <span className="material-icons" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>

        {/* User profile Identity Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                style={{ width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #2563eb' }}
              />
            ) : (
              <div
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontSize: '2.2rem',
                  fontWeight: 'bold',
                  display: 'grid',
                  placeItems: 'center',
                  border: '3px solid #1e293b'
                }}
              >
                {displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#10b981', border: '2.5px solid #0f172a' }} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 4px 0', color: '#f8fafc' }}>{displayName}</h2>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{userEmail}</span>
        </div>

        {/* Content list body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Shop Status banner card */}
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '14px 16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-icons" style={{ fontSize: '16px', color: businessProfile ? '#10b981' : '#94a3b8' }}>
                  {businessProfile ? 'verified' : 'account_circle'}
                </span>
                Shop Status
              </span>
              <a href="#" style={{ fontSize: '0.78rem', color: '#3b82f6', textDecoration: 'none' }}>Learn more</a>
            </div>
            <p style={{ fontSize: '0.86rem', margin: 0, color: '#e2e8f0' }}>
              {businessProfile ? (
                <><strong>{businessProfile.shopName}</strong>: <span style={{ color: '#10b981' }}>Verified Seller, Good standing</span></>
              ) : (
                <span style={{ color: '#94a3b8' }}>Standard Profile</span>
              )}
            </p>
          </div>

          {/* Account alert warning block */}
          <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.08)', border: '1px dashed rgba(234, 179, 8, 0.3)', borderRadius: '12px', padding: '12px 14px', display: 'flex', gap: '10px' }}>
            <span className="material-icons" style={{ color: '#eab308', fontSize: '18px', marginTop: '2px' }}>warning</span>
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', fontSize: '0.84rem', color: '#fef08a' }}>Your profile may have some issues</strong>
              <span style={{ fontSize: '0.78rem', color: '#ca8a04' }}>Review status checks. </span>
              <a href="#" style={{ fontSize: '0.78rem', color: '#38bdf8', textDecoration: 'none' }}>View details</a>
            </div>
          </div>

          {/* Content summary stats */}
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 12px 0', color: '#f8fafc' }}>Content</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 8px', borderRadius: '8px' }}>
                <span style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8' }}>Active Listings</span>
                <strong style={{ display: 'block', fontSize: '1.15rem', marginTop: '2px', color: '#f8fafc' }}>{activeListingsCount}</strong>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 8px', borderRadius: '8px' }}>
                <span style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8' }}>Sold Out</span>
                <strong style={{ display: 'block', fontSize: '1.15rem', marginTop: '2px', color: '#f8fafc' }}>{soldListingsCount}</strong>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 8px', borderRadius: '8px' }}>
                <span style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8' }}>Drafts</span>
                <strong style={{ display: 'block', fontSize: '1.15rem', marginTop: '2px', color: '#f8fafc' }}>{draftsCount}</strong>
              </div>
            </div>
          </div>

          {/* Monetization & Engagement lists */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '12px 14px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h4 style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', margin: '0 0 8px 0' }}>Monetization</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>
                  <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#38bdf8', textDecoration: 'none' }}>
                    <span className="material-icons" style={{ fontSize: '14px' }}>storefront</span> MarketSpace Shop Hub
                  </a>
                </li>
                <li>
                  <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#38bdf8', textDecoration: 'none' }}>
                    <span className="material-icons" style={{ fontSize: '14px' }}>inventory_2</span> Create your Catalog
                  </a>
                </li>
              </ul>
            </div>

            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '12px 14px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h4 style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', margin: '0 0 8px 0' }}>Engagement</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>
                  <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#38bdf8', textDecoration: 'none' }}>
                    <span className="material-icons" style={{ fontSize: '14px' }}>forum</span> Recent Messages
                  </a>
                </li>
                <li>
                  <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#38bdf8', textDecoration: 'none' }}>
                    <span className="material-icons" style={{ fontSize: '14px' }}>reviews</span> Mentions in Reviews
                  </a>
                </li>
              </ul>
            </div>
          </div>
          {/* Feedback footer */}
          <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
              <span>Feedback</span>
              <a href="#" style={{ display: 'block', color: '#38bdf8', textDecoration: 'none', marginTop: '2px' }}>
                Want to help improve the dashboard? Get started
              </a>
            </div>
            <button
              style={{
                fontSize: '0.75rem',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.15)',
                backgroundColor: 'transparent',
                color: '#e2e8f0',
                cursor: 'pointer'
              }}
            >
              Choose File
            </button>
          </div>

        </div>
      </aside>
    </>
  )
}
