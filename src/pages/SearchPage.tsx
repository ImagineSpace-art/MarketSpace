import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { BusinessProfile, Listing } from '../types'
import { STORE_MARKET_LOCATIONS } from '../features/marketplace/storeLocations'
import { ListingCard } from '../components/Listing'

type SearchPageProps = {
  listings: Listing[]
  allBusinesses: Record<string, BusinessProfile>
  searchHistory: string[]
  clearSearchHistory: () => void
  savedIds: string[]
  onToggleSave: (listingId: number) => void
  onSearch: (query: string) => void
  onOpenListing: (listing: Listing) => void
  onVisitStore: (storeUserId: string) => void
  onAddToCart: (listing: Listing) => void
}

const POPULAR_KEYWORDS = ['Phone', 'Sneakers', 'Laptop', 'Furniture', 'Ladies shoes', 'Used cars']
const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Furniture', 'Vehicles', 'Sports', 'Home & Garden', 'Beauty', 'Services']

export function SearchPage({ listings, allBusinesses, searchHistory, clearSearchHistory, savedIds, onToggleSave, onSearch, onOpenListing, onVisitStore, onAddToCart }: SearchPageProps) {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const submittedQuery = params.get('q') || ''
  const resultType = params.get('type') === 'stores' ? 'stores' : 'listings'
  const location = params.get('location') || 'All'
  const condition = params.get('condition') || 'All'
  const storeId = params.get('store') || 'All'
  const minPrice = params.get('min') || ''
  const maxPrice = params.get('max') || ''
  const minRating = params.get('rating') || '0'
  const category = params.get('category') || 'All'

  const runSearch = (nextQuery: string) => {
    const clean = nextQuery.trim()
    onSearch(clean)
    const next = new URLSearchParams(params)
    if (clean) next.set('q', clean)
    else next.delete('q')
    navigate(`/search${next.toString() ? `?${next}` : ''}`)
  }

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    const empty = value === 'All' || value === '0' || value === ''
    if (key === 'type' && value === 'listings') next.delete(key)
    else if (empty) next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  const clearFilters = () => {
    const next = new URLSearchParams()
    if (submittedQuery) next.set('q', submittedQuery)
    setParams(next, { replace: true })
  }

  const hasFilters = location !== 'All' || condition !== 'All' || storeId !== 'All' || minPrice !== '' || maxPrice !== '' || minRating !== '0' || category !== 'All'

  const storeResults = useMemo(() => {
    const terms = submittedQuery.toLowerCase().trim().split(/\s+/).filter(Boolean)
    return Object.values(allBusinesses).filter(store => {
      const text = `${store.shopName} ${store.description || ''} ${store.category || ''} ${store.address || ''}`.toLowerCase()
      if (terms.length && !terms.every(term => text.includes(term))) return false
      if (location !== 'All' && store.locationName !== location && !store.address?.toLowerCase().includes(location.toLowerCase())) return false
      if (category !== 'All' && (store.category || '').toLowerCase() !== category.toLowerCase()) return false
      if (minRating !== '0' && Number(store.rating || 0) < Number(minRating)) return false
      return true
    })
  }, [submittedQuery, allBusinesses, location, category, minRating])

  const results = useMemo(() => {
    const terms = submittedQuery.toLowerCase().trim().split(/\s+/).filter(Boolean)
    return listings.filter(listing => {
      const text = `${listing.title} ${listing.description} ${listing.category} ${listing.seller_name || ''}`.toLowerCase()
      if (terms.length && !terms.every(term => text.includes(term))) return false
      if (location !== 'All' && allBusinesses[listing.user_id || '']?.locationName !== location) return false
      if (condition !== 'All' && (listing.condition || 'New').toLowerCase() !== condition.toLowerCase()) return false
      if (category !== 'All' && (listing.category || '').toLowerCase() !== category.toLowerCase()) return false
      if (storeId !== 'All' && listing.user_id !== storeId) return false
      if (minPrice && Number(listing.price) < Number(minPrice)) return false
      if (maxPrice && Number(listing.price) > Number(maxPrice)) return false
      const sellerRating = Number(listing.rating || allBusinesses[listing.user_id || '']?.rating || 0)
      if (sellerRating < Number(minRating || 0)) return false
      return true
    })
  }, [submittedQuery, listings, location, condition, category, storeId, minPrice, maxPrice, minRating, allBusinesses])

  const renderListing = (listing: Listing) => (
    <ListingCard
      key={listing.id}
      listing={listing}
      saved={Array.isArray(savedIds) && savedIds.includes(String(listing.id))}
      onOpen={onOpenListing}
      onToggleSave={onToggleSave}
      onAddToCart={onAddToCart}
      allBusinesses={allBusinesses}
      onVisitStore={onVisitStore}
    />
  )

  return (
    <main className="marketplace-search-page">
      {!submittedQuery && (
        <div className="search-result-tabs search-discovery-tabs" role="tablist"><button type="button" className={resultType === 'listings' ? 'active' : ''} onClick={() => updateParam('type', 'listings')}>Listings</button><button type="button" className={resultType === 'stores' ? 'active' : ''} onClick={() => updateParam('type', 'stores')}>Stores</button></div>
      )}
      {!submittedQuery && resultType === 'listings' && (
        <section className="search-discovery-grid" aria-label="Search suggestions">
          <div className="search-discovery-panel">
            <div className="search-panel-heading">
              <h2>Recent searches</h2>
              {searchHistory.length > 0 && <button type="button" className="search-text-button" onClick={clearSearchHistory}>Clear all</button>}
            </div>
            {(searchHistory.length ? searchHistory.slice(0, 8) : ['iPhone', 'Nike shoes', 'Smart TV']).map(item => (
              <button key={item} type="button" className="search-suggestion" onClick={() => runSearch(item)}>{item}</button>
            ))}
          </div>
          <div className="search-discovery-panel">
            <h2>Popular keywords</h2>
            <div className="search-keyword-list">
              {POPULAR_KEYWORDS.map(item => <button key={item} type="button" className="search-keyword" onClick={() => runSearch(item)}>{item}</button>)}
            </div>
          </div>
          <div className="search-discovery-panel search-trending-panel">
            <h2>Trending listings</h2>
            <div className="search-mini-grid">{listings.slice(0, 5).map(renderListing)}</div>
          </div>
        </section>
      )}

      <div className="search-results-layout">
        <aside className="search-filter-sidebar" aria-label="Search filters">
          <div className="search-filter-heading">
            <h2>Filters</h2>
            {hasFilters && <button type="button" className="search-text-button" onClick={clearFilters}>Reset</button>}
          </div>

          <label className="search-filter-field">Location
            <select value={location} onChange={event => updateParam('location', event.target.value)}>
              <option>All</option>{STORE_MARKET_LOCATIONS.map(item => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="search-filter-field">Category
            <select value={category} onChange={event => updateParam('category', event.target.value)}>
              {CATEGORIES.map(item => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="search-filter-field">Condition
            <select value={condition} onChange={event => updateParam('condition', event.target.value)}>
              <option>All</option><option>New</option><option>Used - Like New</option><option>Used - Good</option>
            </select>
          </label>
          <label className="search-filter-field">Seller
            <select value={storeId} onChange={event => updateParam('store', event.target.value)}>
              <option value="All">All sellers</option>{Object.values(allBusinesses).map(store => <option key={store.userId} value={store.userId}>{store.shopName}</option>)}
            </select>
          </label>
          <fieldset className="search-price-filter">
            <legend>Price range</legend>
            <div><input aria-label="Minimum price" type="number" min="0" value={minPrice} onChange={event => updateParam('min', event.target.value)} placeholder="Min" /><span>—</span><input aria-label="Maximum price" type="number" min="0" value={maxPrice} onChange={event => updateParam('max', event.target.value)} placeholder="Max" /></div>
          </fieldset>
          <label className="search-filter-field">Minimum rating
            <select value={minRating} onChange={event => updateParam('rating', event.target.value)}>
              <option value="0">Any rating</option><option value="3">3+</option><option value="4">4+</option><option value="4.5">4.5+</option>
            </select>
          </label>
        </aside>

        <section className="search-results-section" aria-live="polite">
          {(submittedQuery || resultType === 'stores' || hasFilters) ? <>
            <div className="search-results-heading">
              <div><h1>{submittedQuery ? `Results for “${submittedQuery}”` : 'Discover stores and listings'}</h1><p>{resultType === 'stores' ? `${storeResults.length} store${storeResults.length === 1 ? '' : 's'}` : `${results.length} listing${results.length === 1 ? '' : 's'}`} found</p></div>
              <div className="search-result-tabs" role="tablist"><button type="button" className={resultType === 'listings' ? 'active' : ''} onClick={() => updateParam('type', 'listings')}>Listings</button><button type="button" className={resultType === 'stores' ? 'active' : ''} onClick={() => updateParam('type', 'stores')}>Stores</button></div>
            </div>
            {resultType === 'stores' ? (storeResults.length ? <div className="store-search-results-grid">{storeResults.map(store => <button key={store.userId} type="button" className="store-search-result" onClick={() => window.open(`/store/${store.userId}`, '_blank')}><span className="store-search-logo">{store.logo ? <img src={store.logo} alt="" /> : <span className="material-icons">storefront</span>}</span><strong>{store.shopName}</strong><small>{store.category || 'Marketplace store'}</small><span>{store.locationName || store.address || 'Location unavailable'}</span>{store.rating ? <em>★ {store.rating.toFixed(1)}</em> : null}</button>)}</div> : <div className="search-empty-state">No stores match these filters.</div>) : results.length ? <div className="search-results-grid">{results.map(renderListing)}</div> : <div className="search-empty-state">No listings match these filters.</div>}
          </> : <div className="search-results-empty"><span className="material-icons">search</span><h2>Search MarketSpace</h2><p>Search listings or stores, or choose filters from the category menu.</p></div>}
        </section>
      </div>
    </main>
  )
}
