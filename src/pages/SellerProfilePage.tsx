import type { Profile, Listing, BusinessProfile } from '../types'
import { ListingCard } from '../components/ListingCard'
import { useNavigate } from 'react-router-dom'

type SellerProfilePageProps = {
    seller: Profile
    listings: Listing[]
    businessProfile?: BusinessProfile | null
    onBack: () => void
    onOpenListing: (listing: Listing) => void
    onToggleSave: (listingId: number) => void
    savedIds: string[]
}

export function SellerProfilePage({
    seller,
    listings,
    businessProfile,
    onBack,
    onOpenListing,
    onToggleSave,
    savedIds,
}: SellerProfilePageProps) {
    const navigate = useNavigate()
    const sellerListings = listings.filter((l) => l.user_id === seller.user_id)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <button className="ghost-btn" style={{ alignSelf: 'flex-start' }} onClick={onBack}>← Back</button>

            {/* Profile Card Header */}
            <div className="section-card" style={{ display: 'flex', gap: '24px', alignItems: 'center', padding: '24px', background: 'var(--panel)', border: '1px solid var(--border)' }}>
                {seller.avatar_url ? (
                    <img 
                        src={seller.avatar_url} 
                        alt={seller.username || 'Seller'} 
                        style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border)', boxShadow: 'var(--shadow)' }} 
                    />
                ) : (
                    <div style={{ width: '90px', height: '90px', borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--border)', color: 'var(--text)', fontSize: '2.5rem', fontWeight: 800 }}>
                        {(seller.username || 'S').slice(0, 1).toUpperCase()}
                    </div>
                )}

                <div style={{ flexGrow: 1 }}>
                    <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>{seller.username || 'MarketSpace Seller'}</h2>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Personal Seller Account</p>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                            <span className="material-icons" style={{ fontSize: '18px' }}>email</span> {seller.email}
                        </span>
                        <span style={{ fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                            <span className="material-icons" style={{ fontSize: '18px' }}>inventory</span> {sellerListings.length} Active Listings
                        </span>
                    </div>
                </div>

                {businessProfile && (
                    <button 
                        className="primary-btn" 
                        onClick={() => navigate(`/store/${businessProfile.userId}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 20px' }}
                    >
                        <span className="material-icons">storefront</span>
                        Visit Storefront
                    </button>
                )}
            </div>

            {/* Marketplace Listings of this Seller */}
            <section className="section-card">
                <h3 style={{ margin: '0 0 16px 0' }}>Seller's Marketplace Listings</h3>
                {sellerListings.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>This seller has no active listings on the marketplace.</p>
                ) : (
                    <div className="marketplace-listing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                        {sellerListings.map((listing) => (
                            <ListingCard
                                key={listing.id}
                                listing={listing}
                                saved={savedIds.includes(String(listing.id))}
                                onOpen={onOpenListing}
                                onToggleSave={onToggleSave}
                                compact
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}
