import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { BusinessProfile, Listing, StoreReview } from '../types'
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
    currentUserId?: string
    followingIds?: string[]
    notifyStoreIds?: string[]
    onToggleFollowStore?: (storeId: string) => void
    onToggleNotifyStore?: (storeId: string) => void
    storeReviews?: StoreReview[]
    onAddReview?: (storeId: string, rating: number, comment: string) => void
    onReplyToReview?: (reviewId: string, replyText: string) => void
    onUpdateListingCollection?: (listingId: number, colId: string | null) => void
}

export function StoreViewPage({
    shop,
    listings,
    onBack,
    onMessageSeller,
    onOpenListing,
    onToggleSave,
    savedIds,
    currentUserId = '',
    followingIds = [],
    notifyStoreIds = [],
    onToggleFollowStore = () => { },
    onToggleNotifyStore = () => { },
    storeReviews = [],
    onAddReview = () => { },
    onReplyToReview = () => { },
    onUpdateListingCollection,
}: StoreViewPageProps) {
    const navigate = useNavigate()
    const brandColor = shop.accentColor || '#2563eb'
    const collectionsList = shop.collections || []
    const careInfo = shop.customerCare || {}

    const [searchParams] = useSearchParams()
    const tabQuery = searchParams.get('tab')
    const [activeSubTab, setActiveSubTab] = useState<string>(tabQuery || 'catalog')
    const [isPushDrawerOpen, setIsPushDrawerOpen] = useState(false)

    useEffect(() => {
        if (tabQuery) {
            setActiveSubTab(tabQuery)
        }
    }, [tabQuery])
    const [formRating, setFormRating] = useState(0)

    const shopListings = listings.filter(l => l.user_id === shop.userId)
    const isOwner = currentUserId === shop.userId

    // Cover image and logo image fallbacks
    const coverImage = shop.cover || '/banners/store_banner_electronics.png'
    const logoImage = shop.logo || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=120&auto=format&fit=crop&q=60'

    // Reviews list & stats
    const reviewsList = storeReviews.filter(r => r.storeId === shop.userId)
    const avgRating = reviewsList.length > 0
        ? (reviewsList.reduce((acc, r) => acc + r.rating, 0) / reviewsList.length).toFixed(1)
        : null

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Merchant Top Announcement Ticker Bar */}
            {shop.announcementBar && (
                <div style={{ padding: '10px 16px', backgroundColor: brandColor, color: '#ffffff', fontWeight: 600, fontSize: '0.88rem', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 15 }}>
                    {shop.announcementBar}
                </div>
            )}

            {/* 1. Full-Bleed Sticky Hero Store Cover Banner (Identical scroll behavior to Homepage Hero) */}
            <div
                style={{
                    position: 'sticky',
                    top: '105px',
                    marginLeft: 'calc(-50vw + 50%)',
                    marginRight: 'calc(-50vw + 50%)',
                    overflow: 'hidden',
                    height: '380px',
                    marginTop: '-24px',
                    zIndex: 1,
                }}
            >
                {/* Store cover image background full bleed */}
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        backgroundImage: `url(${coverImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative'
                    }}
                >
                    {/* Contrast Gradient Overlay */}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.6) 55%, rgba(15, 23, 42, 0.2) 100%)' }} />

                    {/* Banner Content Overlay */}
                    <div
                        style={{
                            position: 'relative',
                            zIndex: 5,
                            padding: '0 max(28px, calc((100vw - 1200px) / 2))',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '20px',
                            color: '#ffffff'
                        }}
                    >
                        {/* Store Brand / Logo / Title */}
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <div style={{ width: '90px', height: '90px', borderRadius: '18px', overflow: 'hidden', border: `3px solid ${brandColor}`, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', flexShrink: 0, background: '#ffffff' }}>
                                <img src={logoImage} alt={shop.shopName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div>
                                <span style={{ display: 'inline-block', padding: '4px 12px', backgroundColor: brandColor, color: '#ffffff', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                                    Verified Store
                                </span>
                                <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>
                                    {shop.shopName}
                                </h1>
                                <p style={{ margin: '6px 0 0 0', fontSize: '0.92rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, flexWrap: 'wrap' }}>
                                    <span><span className="material-icons" style={{ fontSize: '18px', color: '#60a5fa', verticalAlign: 'middle' }}>storefront</span> {shop.category}</span>
                                    <span>|</span>
                                    <span><span className="material-icons" style={{ fontSize: '18px', color: '#60a5fa', verticalAlign: 'middle' }}>location_on</span> {shop.address}</span>
                                </p>
                            </div>
                        </div>

                        {/* Store Action Buttons */}
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <button
                                className="secondary-btn compact-btn"
                                onClick={() => navigate(`/seller/${shop.userId}`)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)', borderRadius: '10px', fontWeight: 600 }}
                            >
                                <span className="material-icons" style={{ fontSize: '18px' }}>person</span>
                                Owner Profile
                            </button>
                            {!isOwner && (
                                <>
                                    {shop.whatsapp && (
                                        <a href={`https://wa.me/${shop.whatsapp.replace(/[^\d]/g, '')}`} target="_blank" rel="noreferrer" className="primary-btn compact-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', background: '#25D366', color: 'white', padding: '10px 18px', borderRadius: '10px', fontWeight: 700 }}>
                                            <span className="material-icons" style={{ fontSize: '18px' }}>chat</span> WhatsApp
                                        </a>
                                    )}
                                    <button className="secondary-btn compact-btn" onClick={onMessageSeller} style={{ padding: '10px 18px', background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)', borderRadius: '10px', fontWeight: 600 }}>Chat</button>

                                    <button
                                        className={followingIds.includes(shop.userId) ? "secondary-btn compact-btn" : "primary-btn compact-btn"}
                                        onClick={() => onToggleFollowStore(shop.userId)}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '10px', fontWeight: 700, backgroundColor: followingIds.includes(shop.userId) ? 'rgba(255,255,255,0.2)' : brandColor }}
                                    >
                                        <span className="material-icons" style={{ fontSize: '18px' }}>
                                            {followingIds.includes(shop.userId) ? 'person_remove' : 'person_add'}
                                        </span>
                                        {followingIds.includes(shop.userId) ? 'Unfollow' : 'Follow Store'}
                                    </button>

                                    <button
                                        className="secondary-btn compact-btn"
                                        onClick={() => onToggleNotifyStore(shop.userId)}
                                        title={notifyStoreIds.includes(shop.userId) ? "Mute Notifications" : "Get Store Notifications"}
                                        style={{ minWidth: '40px', padding: '10px 12px', color: notifyStoreIds.includes(shop.userId) ? brandColor : '#ffffff', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px' }}
                                    >
                                        <span className="material-icons" style={{ fontSize: '20px' }}>
                                            {notifyStoreIds.includes(shop.userId) ? 'notifications_active' : 'notifications_none'}
                                        </span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom gradient fade into main sheet */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '90px', background: 'linear-gradient(to bottom, transparent 0%, rgba(11, 15, 23, 0.4) 40%, var(--bg) 100%)', pointerEvents: 'none', zIndex: 4 }} />
            </div>

            {/* 2. Overlapping Elevated Content Sheet (Scrolls Over Faded Hero Cover Background) */}
            <div
                style={{
                    position: 'relative',
                    zIndex: 10,
                    marginTop: '-80px',
                    marginLeft: 'calc(-50vw + 50%)',
                    marginRight: 'calc(-50vw + 50%)',
                    background: 'var(--bg)',
                    borderTopLeftRadius: '24px',
                    borderTopRightRadius: '24px',
                    padding: '24px max(24px, calc((100vw - 1200px) / 2))',
                    minHeight: '600px',
                    boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                }}
            >
                <button className="ghost-btn" style={{ alignSelf: 'flex-start' }} onClick={onBack}>← Back to Stores</button>

                {shop.description && (
                    <div style={{ background: 'var(--panel)', padding: '16px 20px', borderRadius: '14px', border: '1px solid var(--border)' }}>
                        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{shop.description}</p>
                    </div>
                )}

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
                                            <a href={`https://wa.me/${shop.whatsapp.replace(/[^\d]/g, '')}?text=Hi, I'm interested in your product: ${item.name}`} target="_blank" rel="noreferrer" className="primary-btn compact-btn" style={{ minHeight: '26px', padding: '4px 8px', background: '#25D366', color: 'white', fontSize: '0.72rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
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
                                />
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* Custom Store Collection / Department Tab Render */}
            {activeSubTab.startsWith('col-') && (() => {
                const colId = activeSubTab.replace('col-', '')
                const targetCol = collectionsList.find(c => c.id === colId)
                const colTitle = targetCol?.name || 'Department'
                const filteredColListings = shopListings.filter(l => String(l.collection_id) === String(colId))

                return (
                    <section className="section-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '14px', marginBottom: '16px' }}>
                            <div>
                                <h3 style={{ margin: 0, color: brandColor }}>{colTitle} Department</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                                    Browse items in {shop.shopName}'s {colTitle} collection ({filteredColListings.length} items).
                                </p>
                            </div>
                            {isOwner && (
                                <button
                                    type="button"
                                    className="primary-btn compact-btn"
                                    onClick={() => setIsPushDrawerOpen(true)}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: brandColor, padding: '10px 16px', borderRadius: '8px' }}
                                >
                                    <span className="material-icons" style={{ fontSize: '18px' }}>move_to_inbox</span>
                                    <span>Push Listings to {colTitle}</span>
                                </button>
                            )}
                        </div>

                        {filteredColListings.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '36px 16px', background: 'var(--panel)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.92rem' }}>No products categorized under {colTitle} yet.</p>
                                {isOwner && (
                                    <button
                                        type="button"
                                        className="primary-btn compact-btn"
                                        onClick={() => setIsPushDrawerOpen(true)}
                                        style={{ marginTop: '12px', backgroundColor: brandColor }}
                                    >
                                        Push Items Now
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="marketplace-listing-grid">
                                {filteredColListings.map(listing => (
                                    <ListingCard
                                        key={listing.id}
                                        listing={listing}
                                        saved={savedIds.includes(String(listing.id))}
                                        onOpen={onOpenListing}
                                        onToggleSave={onToggleSave}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Push Listings Seller Drawer Overlay */}
                        {isPushDrawerOpen && isOwner && (
                            <div
                                style={{
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    width: '100vw',
                                    height: '100vh',
                                    backgroundColor: 'rgba(0,0,0,0.65)',
                                    zIndex: 99999,
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    backdropFilter: 'blur(4px)'
                                }}
                                onClick={() => setIsPushDrawerOpen(false)}
                            >
                                <div
                                    style={{
                                        width: '100%',
                                        maxWidth: '460px',
                                        height: '100%',
                                        backgroundColor: '#141414',
                                        borderLeft: '1px solid #333',
                                        padding: '24px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        boxShadow: '-10px 0 30px rgba(0,0,0,0.7)',
                                        overflowY: 'auto'
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #2e2e2e', paddingBottom: '14px' }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ffffff' }}>Push Items to {colTitle}</h3>
                                            <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>Select listings to categorize under this department</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsPushDrawerOpen(false)}
                                            style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '1.2rem' }}
                                        >
                                            <span className="material-icons">close</span>
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {shopListings.length === 0 ? (
                                            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>You have no listings posted under your store yet.</p>
                                        ) : (
                                            shopListings.map((item) => {
                                                const isAssigned = String(item.collection_id) === String(colId)
                                                return (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => onUpdateListingCollection && onUpdateListingCollection(item.id, isAssigned ? null : colId)}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            padding: '12px',
                                                            borderRadius: '10px',
                                                            border: isAssigned ? `2px solid ${brandColor}` : '1px solid #2e2e2e',
                                                            background: isAssigned ? 'rgba(37, 99, 235, 0.12)' : '#1f1f1f',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.15s ease'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={isAssigned}
                                                                onChange={() => onUpdateListingCollection && onUpdateListingCollection(item.id, isAssigned ? null : colId)}
                                                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                            />
                                                            {item.images && item.images[0] ? (
                                                                <img src={item.images[0]} alt={item.title} style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover' }} />
                                                            ) : (
                                                                <div style={{ width: '42px', height: '42px', borderRadius: '6px', background: '#333', display: 'grid', placeItems: 'center', color: '#888', fontSize: '0.7rem' }}>Item</div>
                                                            )}
                                                            <div>
                                                                <strong style={{ display: 'block', fontSize: '0.88rem', color: '#ffffff' }}>{item.title}</strong>
                                                                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>ZMW {item.price} • {item.category}</span>
                                                            </div>
                                                        </div>

                                                        {isAssigned && (
                                                            <span style={{ fontSize: '0.72rem', background: brandColor, color: '#ffffff', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>Categorized</span>
                                                        )}
                                                    </div>
                                                )
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                )
            })()}

            {/* Customer Care & Policies Tab Render */}
            {activeSubTab === 'care' && (
                <section className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                        <h3 style={{ margin: 0, color: brandColor }}>Customer Care & Store Policies</h3>
                        <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                            Operating hours, contact channels, and buyer guarantees for {shop.shopName}.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                        {/* 1. Working Hours & Location */}
                        <div style={{ padding: '16px', background: 'var(--panel)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <span className="material-icons" style={{ color: brandColor }}>schedule</span>
                                <h4 style={{ margin: 0 }}>Business Hours & Location</h4>
                            </div>
                            <p style={{ fontSize: '0.88rem', margin: '4px 0', color: 'var(--text)' }}>
                                <strong>Hours:</strong> {careInfo.workingHours || 'Mon - Sat: 08:00 - 18:00'}
                            </p>
                            <p style={{ fontSize: '0.88rem', margin: '4px 0', color: 'var(--text)' }}>
                                <strong>Address:</strong> {shop.address}
                            </p>
                        </div>

                        {/* 2. Delivery Guidelines */}
                        <div style={{ padding: '16px', background: 'var(--panel)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <span className="material-icons" style={{ color: brandColor }}>local_shipping</span>
                                <h4 style={{ margin: 0 }}>Delivery Terms</h4>
                            </div>
                            <p style={{ fontSize: '0.88rem', margin: 0, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                {careInfo.deliveryPolicy || 'Same-day local delivery available in Lusaka for orders placed before 14:00.'}
                            </p>
                        </div>

                        {/* 3. Returns & Guarantee */}
                        <div style={{ padding: '16px', background: 'var(--panel)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <span className="material-icons" style={{ color: brandColor }}>verified</span>
                                <h4 style={{ margin: 0 }}>Return & Exchange Guarantee</h4>
                            </div>
                            <p style={{ fontSize: '0.88rem', margin: 0, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                {careInfo.returnPolicy || '3-day inspection & return guarantee for defective products.'}
                            </p>
                        </div>

                        {/* 4. Support Contact Channels */}
                        <div style={{ padding: '16px', background: 'var(--panel)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <span className="material-icons" style={{ color: brandColor }}>support_agent</span>
                                <h4 style={{ margin: 0 }}>Direct Support Line</h4>
                            </div>
                            {shop.whatsapp && (
                                <p style={{ fontSize: '0.88rem', margin: '4px 0' }}>
                                    <strong>WhatsApp:</strong> <a href={`https://wa.me/${shop.whatsapp.replace(/[^\d]/g, '')}`} target="_blank" rel="noreferrer" style={{ color: brandColor, textDecoration: 'none' }}>{shop.whatsapp}</a>
                                </p>
                            )}
                            {careInfo.phone && (
                                <p style={{ fontSize: '0.88rem', margin: '4px 0' }}>
                                    <strong>Phone:</strong> {careInfo.phone}
                                </p>
                            )}
                            {careInfo.email && (
                                <p style={{ fontSize: '0.88rem', margin: '4px 0' }}>
                                    <strong>Email:</strong> {careInfo.email}
                                </p>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {activeSubTab === 'reviews' && (
                <section className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                        <div>
                            <h3 style={{ margin: 0 }}>Reviews & Ratings</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                <span className="material-icons" style={{ color: '#f59e0b', fontSize: '24px' }}>star</span>
                                <strong style={{ fontSize: '1.25rem' }}>{avgRating ? `${avgRating} / 5.0` : 'No ratings yet'}</strong>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>({reviewsList.length} reviews)</span>
                            </div>
                        </div>
                    </div>

                    {/* Review submission form (Visitor only) */}
                    {!isOwner && (
                        <div style={{ background: 'var(--panel)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <h4 style={{ margin: '0 0 12px 0' }}>Write a Review</h4>
                            <form onSubmit={(e) => {
                                e.preventDefault()
                                const form = e.currentTarget
                                const rating = formRating
                                const comment = (form.elements.namedItem('comment') as HTMLTextAreaElement).value
                                if (!rating || rating < 1) {
                                    alert('Please select a rating')
                                    return
                                }
                                onAddReview(shop.userId, rating, comment)
                                form.reset()
                                setFormRating(0)
                            }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                    <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Your Rating</span>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setFormRating(star)}
                                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                            >
                                                <span className="material-icons" style={{ color: star <= formRating ? '#f59e0b' : 'var(--text-muted)', fontSize: '28px' }}>
                                                    {star <= formRating ? 'star' : 'star_border'}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                    <input type="hidden" name="rating" value={formRating} />
                                </div>
                                <div>
                                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Your Review Comment</span>
                                        <textarea
                                            name="comment"
                                            rows={3}
                                            required
                                            placeholder="Write your review here... How was your experience with this seller?"
                                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                                        />
                                    </label>
                                </div>
                                <button type="submit" className="primary-btn" style={{ alignSelf: 'flex-start', padding: '10px 20px' }}>Submit Review</button>
                            </form>
                        </div>
                    )}

                    {/* Reviews List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {reviewsList.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)' }}>No reviews yet for this business storefront.</p>
                        ) : (
                            reviewsList.map((review) => {
                                const showReplyInput = isOwner && !review.reply
                                return (
                                    <div key={review.id} style={{ border: '1px solid var(--border)', padding: '16px', borderRadius: '12px', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span className="material-icons" style={{ color: 'var(--text-secondary)', fontSize: '20px' }}>account_circle</span>
                                                <strong style={{ fontSize: '0.95rem' }}>{review.reviewerName}</strong>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {new Date(review.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '2px' }}>
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <span key={star} className="material-icons" style={{ color: star <= review.rating ? '#f59e0b' : 'var(--text-muted)', fontSize: '16px' }}>
                                                        {star <= review.rating ? 'star' : 'star_border'}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{review.comment}</p>

                                        {/* Store owner reply */}
                                        {review.reply ? (
                                            <div style={{ marginLeft: '16px', marginTop: '8px', padding: '12px', borderRadius: '8px', background: 'var(--panel)', borderLeft: '3px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span className="material-icons" style={{ fontSize: '16px', color: 'var(--primary)' }}>storefront</span>
                                                    <strong style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>Store Response:</strong>
                                                </div>
                                                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{review.reply}</p>
                                            </div>
                                        ) : null}

                                        {/* Reply submission form (Owner only) */}
                                        {showReplyInput && (
                                            <form onSubmit={(e) => {
                                                e.preventDefault()
                                                const form = e.currentTarget
                                                const replyText = (form.elements.namedItem('replyText') as HTMLInputElement).value
                                                if (replyText.trim()) {
                                                    onReplyToReview(review.id, replyText)
                                                    form.reset()
                                                }
                                            }} style={{ display: 'flex', gap: '8px', marginTop: '8px', marginLeft: '16px' }}>
                                                <input
                                                    type="text"
                                                    name="replyText"
                                                    required
                                                    placeholder="Respond to this review..."
                                                    style={{ flexGrow: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--text)', fontSize: '0.88rem' }}
                                                />
                                                <button type="submit" className="primary-btn compact-btn" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Reply</button>
                                            </form>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                </section>
            )}
            </div>
        </div>
    )
}
