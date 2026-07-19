import { useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { CATEGORY_OPTIONS } from '../features/marketplace/constants'
import type { View } from '../types'

type ShellProps = {
  children: ReactNode
  view: View
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
  onNavigate: (nextView: View) => void
}

const navItems: Array<{ label: string; view: View }> = [
  { label: 'Home', view: 'home' },
  { label: 'Stores', view: 'stores' },
  { label: 'Inbox', view: 'inbox' },
  { label: 'Notifications', view: 'notifications' },
  { label: 'Settings', view: 'settings' },
  { label: 'Profile', view: 'profile' },
]

const navIcons: Record<string, string> = {
  home: 'home',
  stores: 'storefront',
  inbox: 'chat',
  notifications: 'notifications',
  settings: 'settings',
  profile: 'account_circle'
}

export function Shell({
  children,
  view,
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
  onNavigate,
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
          
          <div
            className="brand-mark"
            onClick={() => onNavigate('home')}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="Home"
          >
            <span className="material-icons" style={{ color: 'white', fontSize: '24px' }}>shopping_bag</span>
          </div>
          <div onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>
            <h1>MarketSpace</h1>
          </div>
        </div>

        <nav className="top-nav" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', flexGrow: 1 }}>
          {visibleItems.map((item) => (
            <button
              key={item.view}
              className={`top-nav-btn ${view === item.view ? 'active' : ''}`}
              onClick={() => onNavigate(item.view)}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px', borderRadius: '50%', minWidth: '40px', height: '40px' }}
              title={item.label}
            >
              <span className="material-icons" style={{ fontSize: '22px' }}>{navIcons[item.view]}</span>
            </button>
          ))}
          {!session && (
            <button
              className={`top-nav-btn ${view === 'account' || view === 'login' || view === 'signup' ? 'active' : ''}`}
              onClick={() => onNavigate('account')}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px', borderRadius: '50%', minWidth: '40px', height: '40px' }}
              title="Sign in"
            >
              <span className="material-icons" style={{ fontSize: '22px' }}>login</span>
            </button>
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
            <button className="primary-btn" onClick={() => {
              setIsDrawerOpen(false)
              onNavigate('create')
            }}>Post a listing</button>
          </div>
        </div>
      </aside>

      <div className="content-grid full-width">
        <main className="main-panel">{children}</main>
      </div>
    </div>
  )
}