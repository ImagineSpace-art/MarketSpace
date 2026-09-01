import type { Listing } from '../types'
import { formatZMWPrice } from '../utils/formatPrice'

type ListingCardProps = {
  listing: Listing
  saved?: boolean
  onOpen: (listing: Listing) => void
  onToggleSave?: (listingId: number) => void
}

const categoryArt: Record<string, string> = {
  Electronics: 'linear-gradient(135deg, #e0f2fe, #2563eb)',
  Furniture: 'linear-gradient(135deg, #fef3c7, #92400e)',
  Fashion: 'linear-gradient(135deg, #fce7f3, #be185d)',
  Vehicles: 'linear-gradient(135deg, #e5e7eb, #111827)',
  'Home & Garden': 'linear-gradient(135deg, #dcfce7, #15803d)',
  Sports: 'linear-gradient(135deg, #ffedd5, #ea580c)',
}

export function ListingCard({ listing, saved = false, onOpen, onToggleSave }: ListingCardProps) {
  let cardClassName = 'listing-card marketplace-listing-card'
  if (listing.sponsored) {
    cardClassName += ' sponsored'
  }

  const artStyle = (listing.images && listing.images.length > 0)
    ? { backgroundImage: `url(${listing.images[0]})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: categoryArt[listing.category] ?? 'linear-gradient(135deg, #dbeafe, #0f766e)' }

  return (
    <article className={cardClassName}>
      {listing.sponsored && <span className="sponsored-badge">Sponsored</span>}

      <button className="listing-image-button" style={artStyle} onClick={() => onOpen(listing)} aria-label={`Open ${listing.title}`}>
        <span>{listing.category}</span>
      </button>

      <div className="listing-top-row" style={{ top: listing.sponsored ? '32px' : '10px', right: '10px', display: 'flex', gap: '6px', alignItems: 'center' }}>
        <button className="icon-btn" onClick={() => onToggleSave?.(Number(listing.id))} title={saved ? 'Remove Bookmark' : 'Bookmark Listing'}>
          <span className="material-icons" style={{ fontSize: '18px', color: saved ? '#ef4444' : 'inherit' }}>
            {saved ? 'bookmark' : 'bookmark_border'}
          </span>
        </button>
      </div>

      <div className="listing-card-body" onClick={() => onOpen(listing)} style={{ cursor: 'pointer', padding: '12px' }}>
        <h2 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>{listing.title}</h2>
        <div className="meta-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0', fontSize: '0.85rem' }}>
          <strong style={{ color: 'var(--primary)', fontSize: '1.05rem' }}>{formatZMWPrice(listing.price)}</strong>
        </div>
        <div className="meta-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>{listing.seller_name}</span>
          <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>{listing.status ?? 'Available'}</span>
        </div>
      </div>
    </article>
  )
}
