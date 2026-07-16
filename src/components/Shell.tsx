import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { CATEGORY_OPTIONS } from '../features/marketplace/constants'
import type { View } from '../types'

type ShellProps = {
  children: ReactNode
  view: View
  session: Session | null
  searchQuery: string
  activeCategories: string[]
  priceRange: string
  distanceFilter: string
  sortBy: string
  showOnlyAvailable: boolean
  onSearchChange: (value: string) => void
  onSubmitSearch: () => void
  onCategoryToggle: (value: string) => void
  onPriceRangeChange: (value: string) => void
  onDistanceChange: (value: string) => void
  onSortChange: (value: string) => void
  onAvailableToggle: () => void
  onNavigate: (nextView: View) => void
}

const priceRanges = ['Any price', 'Under ZMW500', 'ZMW500 - ZMW1,500', 'ZMW1,500+']
const distanceRanges = ['Nearby', 'Within 10 km', 'Within 25 km', 'Within 65 km', 'Any distance']

const navItems: Array<{ label: string; view: View }> = [
  { label: 'Home', view: 'home' },
  { label: 'Stores', view: 'stores' },
  { label: 'Profile', view: 'profile' },
  { label: 'Messages', view: 'messages' },
  { label: 'Notifications', view: 'notifications' },
  { label: 'Settings', view: 'settings' },
  { label: 'Account', view: 'account' },
]

export function Shell({
  children,
  view,
  session,
  searchQuery,
  activeCategories,
  priceRange,
  distanceFilter,
  sortBy,
  showOnlyAvailable,
  onSearchChange,
  onSubmitSearch,
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
        <div className="brand-block">
          <div className="brand-mark">M</div>
          <div>
            <h1>MarketSpace</h1>
            <p>Modern marketplace</p>
          </div>
        </div>

        <form className="topbar-search" onSubmit={(event) => {
          event.preventDefault()
          onSubmitSearch()
        }}>
          <input value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search Marketplace" />
          <button className="primary-btn" type="submit">Search</button>
        </form>

        <button className="profile-chip" onClick={() => onNavigate(session ? 'profile' : 'account')}>
          {session ? 'Profile' : 'Sign in'}
        </button>
      </header>

      <div className="content-grid">
        <aside className="sidebar">
          <div className="sidebar-card">
            <p className="eyebrow">Navigation</p>
            {navItems.map((item) => (
              <button key={item.view} className={`nav-btn ${view === item.view ? 'active' : ''}`} onClick={() => onNavigate(item.view)}>
                {item.label}
              </button>
            ))}
          </div>

          <div className="sidebar-card">
            <p className="eyebrow">Categories</p>
            {CATEGORY_OPTIONS.map((categoryValue) => (
              <button key={categoryValue} className={`nav-btn ${activeCategories.includes(categoryValue) ? 'active' : ''}`} onClick={() => onCategoryToggle(categoryValue)}>
                {categoryValue}
              </button>
            ))}
          </div>

          <div className="sidebar-card">
            <p className="eyebrow">Price</p>
            {priceRanges.map((range) => (
              <button key={range} className={`nav-btn ${priceRange === range ? 'active' : ''}`} onClick={() => onPriceRangeChange(range)}>
                {range}
              </button>
            ))}
            <button className={`nav-btn ${sortBy === 'Price: Low to High' ? 'active' : ''}`} onClick={() => onSortChange('Price: Low to High')}>Price asc</button>
            <button className={`nav-btn ${sortBy === 'Price: High to Low' ? 'active' : ''}`} onClick={() => onSortChange('Price: High to Low')}>Price desc</button>
            <button className={`nav-btn ${showOnlyAvailable ? 'active' : ''}`} onClick={onAvailableToggle}>Available only</button>
          </div>

          <div className="sidebar-card">
            <p className="eyebrow">Distance</p>
            {distanceRanges.map((range) => (
              <button key={range} className={`nav-btn ${distanceFilter === range ? 'active' : ''}`} onClick={() => onDistanceChange(range)}>
                {range}
              </button>
            ))}
          </div>

          <div className="sidebar-card compact-card">
            <p className="eyebrow">Quick action</p>
            <button className="primary-btn" onClick={() => onNavigate('create')}>Post a listing</button>
          </div>
        </aside>

        <main className="main-panel">{children}</main>
      </div>
    </div>
  )
}
