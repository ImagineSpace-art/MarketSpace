import type { ReactNode } from 'react'
import { CATEGORY_OPTIONS } from '../features/marketplace/constants'
import type { View } from '../types'

type ShellProps = {
  children: ReactNode
  view: View
  activeCategories: string[]
  priceRange: number       // Changed from string to number
  distanceFilter: number   // Changed from string to number
  sortBy: string
  showOnlyAvailable: boolean
  onCategoryToggle: (value: string) => void
  onPriceRangeChange: (value: number) => void // Accepts a number now
  onDistanceChange: (value: number) => void    // Accepts a number now
  onSortChange: (value: string) => void
  onAvailableToggle: () => void
  onNavigate: (nextView: View) => void
}

const navItems: Array<{ label: string; view: View }> = [
  { label: 'Home', view: 'home' },
  { label: 'Stores', view: 'stores' },
  { label: 'Inbox', view: 'inbox' },
  { label: 'Notifications', view: 'notifications' },
  { label: 'Profile', view: 'profile' },
  { label: 'Settings', view: 'settings' },

]

export function Shell({
  children,
  view,
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
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block" onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>
          <div className="brand-mark">M</div>
          <div>
            <h1>MarketSpace</h1>
          </div>
        </div>

        <nav className="top-nav">
          {navItems.map((item) => (
            <button key={item.view} className={`top-nav-btn ${view === item.view ? 'active' : ''}`} onClick={() => onNavigate(item.view)}>
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <div className={`content-grid ${view === 'home' ? 'has-sidebar' : 'full-width'}`}>
        {view === 'home' && (
          <aside className="sidebar">
            <div className="sidebar-card">
              <p className="eyebrow">Categories</p>
              {CATEGORY_OPTIONS.map((categoryValue) => (
                <button key={categoryValue} className={`nav-btn ${activeCategories.includes(categoryValue) ? 'active' : ''}`} onClick={() => onCategoryToggle(categoryValue)}>
                  {categoryValue}
                </button>
              ))}
            </div>

            {/* UPGRADED PRICE SECTION */}
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

            {/* UPGRADED DISTANCE SECTION */}
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
              <button className="primary-btn" onClick={() => onNavigate('create')}>Post a listing</button>
            </div>
          </aside>
        )}

        <main className="main-panel">{children}</main>
      </div>
    </div>
  )
}