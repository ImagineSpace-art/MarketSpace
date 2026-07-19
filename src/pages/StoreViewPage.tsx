import { useState } from 'react'
import type { BusinessProfile, Listing } from '../types'
import { ListingCard } from '../components/ListingCard'

// ---------------- PUBLIC STORE VIEW ----------------
type StoreViewPageProps = {
    shop: BusinessProfile
    listings: Listing[]
    onBack: () => void
    onMessageSeller: () => void
    onOpenListing: (listing: Listing) => void
    onToggleSave: (listingId: number) => void
    savedIds: string[]
}

export function StoreViewPage({ shop, listings, onBack, onMessageSeller, onOpenListing, onToggleSave, savedIds }: StoreViewPageProps) {
    const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'listings'>('catalog')
    const shopListings = listings.filter(l => l.user_id === shop.userId)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button className="ghost-btn" style={{ alignSelf: 'flex-start' }} onClick={onBack}>← Back to Stores</button>

            <section className="business-header" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                {shop.cover ? (
                    <div className="business-cover" style={{ backgroundImage: `url(${shop.cover})` }} />
                ) : (
                    <div className="business-cover-placeholder" />
                )}
                <div className="business-info-bar">
                    {shop.logo ? (
                        <div className="business-logo">
                            <img src={shop.logo} alt={shop.shopName} />
                        </div>
                    ) : (
                        <div className="business-logo" style={{ display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #2563eb, #0f766e)', color: 'white', fontWeight: 800, fontSize: '2rem' }}>
                            {shop.shopName.slice(0, 1).toUpperCase()}
                        </div>
                    )}
                    <div className="business-title-block">
                        <h2>{shop.shopName} <span className="badge" style={{ background: '#10b981', color: 'white', fontSize: '0.72rem' }}>Shop</span></h2>
                        <p style={{ fontSize: '0.88rem', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                            <span className="material-icons" style={{ fontSize: '16px' }}>storefront</span> {shop.category} | 
                            <span className="material-icons" style={{ fontSize: '16px' }}>location_on</span> {shop.address}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <a href={`https://wa.me/${shop.whatsapp.replace(/[^\d]/g, '')}`} target="_blank" rel="noreferrer" className="primary-btn compact-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', background: '#25D366' }}>
                            <span className="material-icons" style={{ fontSize: '16px' }}>chat</span> WhatsApp
                        </a>
                        <button className="secondary-btn compact-btn" onClick={onMessageSeller}>Chat</button>
                    </div>
                </div>
                <div style={{ padding: '16px', paddingTop: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{shop.description}</p>
                </div>
            </section>

            {/* Subtab selection */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', paddingBottom: '2px', gap: '8px' }}>
                <button className={`top-nav-btn ${activeSubTab === 'catalog' ? 'active' : ''}`} style={{ borderRadius: '8px' }} onClick={() => setActiveSubTab('catalog')}>Catalog Products</button>
                <button className={`top-nav-btn ${activeSubTab === 'listings' ? 'active' : ''}`} style={{ borderRadius: '8px' }} onClick={() => setActiveSubTab('listings')}>Active Listings ({shopListings.length})</button>
            </div>

            {/* Tab render */}
            {activeSubTab === 'catalog' && (
                <section className="section-card">
                    <h3>Product Catalog</h3>
                    {shop.catalog.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>This business hasn't listed catalog items yet.</p>
                    ) : (
                        <div className="catalog-grid">
                            {shop.catalog.map(item => (
                                <div key={item.id} className="catalog-card">
                                    {item.image ? (
                                        <div className="catalog-img" style={{ backgroundImage: `url(${item.image})` }} />
                                    ) : (
                                        <div className="catalog-img" style={{ background: '#ddd', display: 'grid', placeItems: 'center', color: '#666' }}>
                                            <span className="material-icons" style={{ fontSize: '32px' }}>photo_camera</span>
                                        </div>
                                    )}
                                    <div className="catalog-details">
                                        <div>
                                            <h4 style={{ margin: 0 }}>{item.name}</h4>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0' }}>{item.description}</p>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                                            <strong>{item.price}</strong>
                                            <a href={`https://wa.me/${shop.whatsapp.replace(/[^\d]/g, '')}?text=Hi, I'm interested in your product: ${item.name}`} target="_blank" rel="noreferrer" className="primary-btn compact-btn" style={{ minHeight: '26px', padding: '4px 8px', background: '#25D366', fontSize: '0.72rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                                                Inquire
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {activeSubTab === 'listings' && (
                <section className="section-card">
                    <h3>Marketplace Listings</h3>
                    {shopListings.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No active marketplace listings from this store.</p>
                    ) : (
                        <div className="marketplace-listing-grid">
                            {shopListings.map(listing => (
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
            )}
        </div>
    )
}

