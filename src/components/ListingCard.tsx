import type { Listing } from '../types'

type ListingCardProps = {
  listing: Listing
  saved?: boolean
  onOpen: (listing: Listing) => void
  onToggleSave?: (listingId: number) => void
  compact?: boolean
}

const categoryArt: Record<string, string> = {
  Electronics: 'linear-gradient(135deg, #e0f2fe, #2563eb)',
  Furniture: 'linear-gradient(135deg, #fef3c7, #92400e)',
  Fashion: 'linear-gradient(135deg, #fce7f3, #be185d)',
  Vehicles: 'linear-gradient(135deg, #e5e7eb, #111827)',
  'Home & Garden': 'linear-gradient(135deg, #dcfce7, #15803d)',
  Sports: 'linear-gradient(135deg, #ffedd5, #ea580c)',
}

export function ListingCard({ listing, saved = false, onOpen, onToggleSave, compact = false }: ListingCardProps) {
  let cardClassName = compact ? 'listing-card marketplace-listing-card' : 'listing-card'
  if (listing.sponsored) {
    cardClassName += ' sponsored'
  }

  const artStyle = (listing.images && listing.images.length > 0)
    ? { backgroundImage: `url(${listing.images[0]})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: categoryArt[listing.category] ?? 'linear-gradient(135deg, #dbeafe, #0f766e)' }

  return (
    <article className={cardClassName}>
      {listing.sponsored && <span className="sponsored-badge">Sponsored</span>}
      {compact ? (
        <button className="listing-image-button" style={artStyle} onClick={() => onOpen(listing)} aria-label={`Open ${listing.title}`}>
          <span>{listing.category}</span>
        </button>
      ) : null}
      <div className="listing-top-row" style={{ top: listing.sponsored ? '32px' : '6px' }}>
        {!compact ? <span className="chip">{listing.category}</span> : null}
        <button className="icon-btn" onClick={() => onToggleSave?.(Number(listing.id))}>
          {saved ? '*' : '+'}
        </button>
      </div>
      <div onClick={() => onOpen(listing)}>
        <h3>{listing.title}</h3>
        {!compact ? <p>{listing.description}</p> : null}
        <div className="meta-row">
          <span>{listing.location}</span>
          <strong>{listing.price}</strong>
        </div>
        <div className="meta-row">
          <span>{listing.seller_name}</span>
          <span>{listing.status ?? 'Available'}</span>
        </div>
      </div>
    </article>
  )
}
