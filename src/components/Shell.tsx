import { useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { CATEGORY_OPTIONS } from '../features/marketplace/constants'
import type { View, Profile } from '../types'

type ShellProps = {
  children: ReactNode
  session: Session | null
  activeCategories: string[]
  priceRange: number
  distanceFilter: number
  sortBy: string
  showOnlyAvailable: boolean
  onCategoryToggle: (value: string) => void
  onPriceRangeChange: (value: number) => void
  onDistanceChange: (value: number) => void
  onSortChange: (value: string) => void
  onAvailableToggle: () => void
  profile: Profile | null
  listingKindFilter: 'all' | 'item' | 'service'
  onListingKindChange: (value: 'all' | 'item' | 'service') => void
}

const navItems: Array<{ label: string; view: View }> = [
  { label: 'Home', view: 'home' },
  { label: 'Stores', view: 'stores' },
  { label: 'Inbox', view: 'inbox' },
  { label: 'Profile', view: 'profile' },
]

const navIcons: Record<string, string> = {
  home: 'home',
  stores: 'storefront',
  inbox: 'chat',
  profile: 'account_circle',
}

export function Shell({
  children,
  session,
  activeCategories,
  priceRange,
  distanceFilter,
  sortBy,
  showOnlyAvailable,
  onCategoryToggle,
  onPriceRangeChange,
  onDistanceChange,
  onSortChange,
  onAvailableToggle,
  profile,
  listingKindFilter,
  onListingKindChange,
}: ShellProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const visibleItems = session
    ? navItems
    : navItems.filter((item) => item.view === 'home' || item.view === 'stores')

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="drawer-toggle-btn"
            onClick={() => setIsDrawerOpen(true)}
            style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}
            title="Open Filters"
          >
            <span className="material-icons">menu</span>
          </button>

          <Link
            to="/"
            className="brand-mark"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textDecoration: 'none' }}
            title="Home"
          >
            <span className="material-icons" style={{ color: 'white', fontSize: '24px' }}>shopping_bag</span>
          </Link>
          <Link to="/" style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
            <h1>MarketSpace</h1>
          </Link>
        </div>

        <nav className="top-nav" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', flexGrow: 1 }}>
          {visibleItems.map((item) => {
            if (item.view === 'profile') {
              return (
                <NavLink
                  key={item.view}
                  to="/profile"
                  className={({ isActive }) => `top-nav-btn ${isActive ? 'active' : ''}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    borderRadius: '50%',
                    minWidth: '40px',
                    height: '40px',
                    overflow: 'hidden',
                    textDecoration: 'none',
                  }}
                  title={item.label}
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }}
                    />
                  ) : (
                    <span className="material-icons" style={{ fontSize: '22px' }}>{navIcons[item.view]}</span>
                  )}
                </NavLink>
              )
            }
            return (
              <NavLink
                key={item.view}
                to={item.view === 'home' ? '/' : `/${item.view}`}
                className={({ isActive }) => `top-nav-btn ${isActive ? 'active' : ''}`}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px', borderRadius: '50%', minWidth: '40px', height: '40px' }}
                title={item.label}
              >
                <span className="material-icons" style={{ fontSize: '22px' }}>{navIcons[item.view]}</span>
              </NavLink>
            )
          })}
          {!session && (
            <NavLink
              to="/login"
              className={({ isActive }) => `top-nav-btn ${isActive ? 'active' : ''}`}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px', borderRadius: '50%', minWidth: '40px', height: '40px' }}
              title="Sign in"
            >
              <span className="material-icons" style={{ fontSize: '22px' }}>login</span>
            </NavLink>
          )}
        </nav>
      </header>

      {/* Filter Drawer Slide-out overlay */}
      {isDrawerOpen && (
        <div className="drawer-backdrop" onClick={() => setIsDrawerOpen(false)} />
      )}

      <aside className={`filter-drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="drawer-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-icons">filter_list</span> Filters & Categories
          </h3>
          <button
            className="ghost-btn"
            onClick={() => setIsDrawerOpen(false)}
            style={{ padding: '4px', minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Close Drawer"
          >
            <span className="material-icons">close</span>
          </button>
        </div>
        <div className="drawer-content" style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="sidebar-card">
            <p className="eyebrow">Listing Kind</p>
            <button
              className={`nav-btn ${listingKindFilter === 'all' ? 'active' : ''}`}
              onClick={() => onListingKindChange('all')}
            >
              All Types
            </button>
            <button
              className={`nav-btn ${listingKindFilter === 'item' ? 'active' : ''}`}
              onClick={() => onListingKindChange('item')}
            >
              Items Only
            </button>
            <button
              className={`nav-btn ${listingKindFilter === 'service' ? 'active' : ''}`}
              onClick={() => onListingKindChange('service')}
            >
              Services Only
            </button>
          </div>

          <div className="sidebar-card">
            <p className="eyebrow">Categories</p>
            {CATEGORY_OPTIONS.map((categoryValue) => (
              <button
                key={categoryValue}
                className={`nav-btn ${activeCategories.includes(categoryValue) ? 'active' : ''}`}
                onClick={() => onCategoryToggle(categoryValue)}
              >
                {categoryValue}
              </button>
            ))}
          </div>

          <div className="sidebar-card">
            <p className="eyebrow">Price Limit</p>
            <div className="slider-container" style={{ padding: '8px 0' }}>
              <input
                type="range"
                min="100"
                max="3000"
                step="100"
                value={priceRange}
                onChange={(event) => onPriceRangeChange(Number(event.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div style={{ marginTop: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                {priceRange === 3000 ? 'Any price' : `Under ZMW ${priceRange}`}
              </div>
            </div>
            <button className={`nav-btn ${sortBy === 'Price: Low to High' ? 'active' : ''}`} onClick={() => onSortChange('Price: Low to High')}>Price asc</button>
            <button className={`nav-btn ${sortBy === 'Price: High to Low' ? 'active' : ''}`} onClick={() => onSortChange('Price: High to Low')}>Price desc</button>
            <button className={`nav-btn ${showOnlyAvailable ? 'active' : ''}`} onClick={onAvailableToggle}>Available only</button>
          </div>

          <div className="sidebar-card">
            <p className="eyebrow">Distance Limit</p>
            <div className="slider-container" style={{ padding: '8px 0' }}>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={distanceFilter}
                onChange={(event) => onDistanceChange(Number(event.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div style={{ marginTop: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                {distanceFilter === 100 ? 'Any distance' : `Within ${distanceFilter} km`}
              </div>
            </div>
          </div>

          <div className="sidebar-card compact-card">
            <p className="eyebrow">Quick action</p>
            <Link
              to="/profile/create"
              className="primary-btn"
              style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}
              onClick={() => setIsDrawerOpen(false)}
            >
              Post a listing
            </Link>
          </div>
        </div>
      </aside>

      <div className="content-grid full-width">
        <main className="main-panel">{children}</main>
      </div>

      {/* Amazon-style Footer */}
      <footer className="amazon-footer" style={{ marginTop: '40px', fontFamily: 'inherit', clear: 'both' }}>
        {/* Back to top bar */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            width: '100%',
            background: '#37475a',
            color: '#fff',
            border: 'none',
            padding: '15px 0',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'background 0.2s',
          }}
          className="back-to-top-btn"
        >
          Back to top
        </button>

        {/* Directory links */}
        <div
          style={{
            background: '#232f3e',
            color: '#ddd',
            padding: '40px 20px',
            fontSize: '0.85rem',
          }}
        >
          <div
            style={{
              maxWidth: '1000px',
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '30px',
            }}
          >
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '14px', fontWeight: 700 }}>Get to Know Us</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>Careers</span></li>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>Blog</span></li>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>About MarketSpace</span></li>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>Investor Relations</span></li>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>MarketSpace Devices</span></li>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>MarketSpace Science</span></li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '14px', fontWeight: 700 }}>Make Money with Us</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>Sell products on MarketSpace</span></li>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>Sell apps on MarketSpace</span></li>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>Become an Affiliate</span></li>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>Advertise Your Products</span></li>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>Self-Publish with Us</span></li>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>Host an MarketSpace Hub</span></li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '14px', fontWeight: 700 }}>MarketSpace Payment Products</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>MarketSpace Business Card</span></li>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>Shop with Points</span></li>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>Reload Your Balance</span></li>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>MarketSpace Currency Converter</span></li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '14px', fontWeight: 700 }}>Let Us Help You</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>MarketSpace and COVID-19</span></li>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>Your Account</span></li>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>Your Orders</span></li>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>Shipping Rates & Policies</span></li>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>Returns & Replacements</span></li>
                <li><span style={{ cursor: 'pointer', color: '#ccc' }}>Help</span></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Developer info bottom bar */}
        <div
          style={{
            background: '#19222d',
            color: '#aaa',
            padding: '24px 20px',
            textAlign: 'center',
            fontSize: '0.8rem',
            borderTop: '1px solid #2a3644',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span className="material-icons" style={{ color: '#fff', fontSize: '20px' }}>shopping_bag</span>
            <span style={{ color: '#fff', fontWeight: 700, letterSpacing: '0.5px' }}>MarketSpace</span>
          </div>
          <p style={{ margin: 0 }}>© 2026, MarketSpace. Developed by ImagineSpace Technologies</p>
        </div>
      </footer>
    </div>
  )
}