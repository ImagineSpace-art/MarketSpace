import type { CSSProperties } from 'react'
import { ListingCard } from '../components/ListingCard'
import type { MarketplaceAppModel } from '../features/marketplace/useMarketplaceApp'

type HomePageProps = Pick<MarketplaceAppModel,
  'loading' |
  'filteredListings' |
  'savedIds' |
  'openListing' |
  'toggleSave' |
  'setView' |
  'distanceFilter' |
  'searchQuery' |
  'setSearchQuery' |
  'cardSize'
>

export function HomePage({
  loading,
  filteredListings,
  savedIds,
  openListing,
  toggleSave,
  setView,
  distanceFilter,
  searchQuery,
  setSearchQuery,
  cardSize,
}: HomePageProps) {
  const listingGridStyle = { '--card-size': `${cardSize}px` } as CSSProperties

  return (
    <div className="marketplace-home">
      

      <section className="marketplace-toolbar" aria-label="Marketplace filters" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <p className="eyebrow">Browsing</p>
          <strong>Lusaka, Zambia</strong>
          <p className="subtitle">{distanceFilter === 100 ? 'Any distance' : `Within ${distanceFilter} km`}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexGrow: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <form className="topbar-search" onSubmit={(event) => event.preventDefault()} style={{ display: 'flex', gap: '8px', maxWidth: '360px', flexGrow: 1 }}>
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search Marketplace..." style={{ borderRadius: '999px', padding: '10px 16px', border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--text)', width: '100%' }} />
          </form>
          <button className="primary-btn" onClick={() => setView('create')}>+ Create new listing</button>
        </div>
      </section>

      <section className="marketplace-feed">
        <div className="marketplace-feed-header">
          <div>
            <h2>Today's picks</h2>
            <p>Lusaka, Zambia - {distanceFilter === 100 ? 'Any distance' : `Within ${distanceFilter} km`}</p>
          </div>
          <button className="ghost-btn" onClick={() => setView('stores')}>See all</button>
        </div>
        {loading ? (
          <p>Loading listings...</p>
        ) : filteredListings.length === 0 ? (
          <p>No listings match your filters yet.</p>
        ) : (
          <div className="marketplace-listing-grid" style={listingGridStyle}>
            {filteredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} saved={savedIds.includes(String(listing.id))} onOpen={openListing} onToggleSave={toggleSave} compact />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
