import { useState } from 'react'
import type { CSSProperties } from 'react'
import { ListingCard } from '../components/ListingCard'
import type { MarketplaceAppModel } from '../features/marketplace/useMarketplaceApp'

type HomePageProps = Pick<MarketplaceAppModel,
  'loading' |
  'filteredListings' |
  'savedIds' |
  'savedListings' |
  'heroStats' |
  'openListing' |
  'toggleSave' |
  'setView' |
  'distanceFilter'
>

export function HomePage({
  loading,
  filteredListings,
  savedIds,
  savedListings,
  heroStats,
  openListing,
  toggleSave,
  setView,
  distanceFilter,
}: HomePageProps) {
  const [cardSize, setCardSize] = useState(180)
  const firstSavedListing = savedListings[0]
  const listingGridStyle = { '--card-size': `${cardSize}px` } as CSSProperties

  return (
    <div className="marketplace-home">
      

      <section className="marketplace-toolbar" aria-label="Marketplace filters">
        <div>
          <p className="eyebrow">Browsing</p>
          <strong>Lusaka, Zambia</strong>
          <p className="subtitle">{distanceFilter}</p>
        </div>
        <div className="card-size-control">
          <label htmlFor="card-size">Card size</label>
          <input id="card-size" type="range" min="130" max="260" value={cardSize} onChange={(event) => setCardSize(Number(event.target.value))} />
          <span>{cardSize}px</span>
        </div>
        <button className="primary-btn" onClick={() => setView('create')}>+ Create new listing</button>
      </section>

      <section className="marketplace-feed">
        <div className="marketplace-feed-header">
          <div>
            <h2>Today's picks</h2>
            <p>Lusaka, Zambia - Within 65 km</p>
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
