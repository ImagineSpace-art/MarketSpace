import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
}: StoreViewPageProps) {
    const navigate = useNavigate()
    const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'listings' | 'reviews'>('catalog')
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button className="ghost-btn" style={{ alignSelf: 'flex-start' }} onClick={onBack}>← Back to Stores</button>

            <section
                style={{
                    position: 'relative',
                    overflow: 'hidden',
                    height: '280px',
                    borderRadius: '16px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: '24px',
                    boxShadow: 'var(--shadow)'
                }}
            >
                {/* Store cover banner background image */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '100%',
                        height: '100%',
                        backgroundImage: `url(${coverImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        zIndex: 1,
                    }}
                >
                    {/* Linear gradient fade towards the right (opaque on the left, transparent on the right) */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(to right, var(--surface) 25%, rgba(15, 23, 42, 0.4) 65%, rgba(0, 0, 0, 0) 100%)'
                        }}
                    />
                </div>

                {/* Content Overlay */}
                <div style={{ position: 'relative', zIndex: 2, display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        {/* Always display the image logo */}
                        <div style={{ width: '80px', height: '80px', borderRadius: '16px', overflow: 'hidden', border: '3px solid var(--surface)', boxShadow: 'var(--shadow)', flexShrink: 0 }}>
                            <img src={logoImage} alt={shop.shopName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ color: 'var(--text)' }}>
                            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, textShadow: '0 2px 4px rgba(255,255,255,0.8)' }}>
                                {shop.shopName}
                                <span className="badge" style={{ marginLeft: '8px', background: '#10b981', color: 'white', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px' }}>Shop</span>
                            </h2>
                            <p style={{ margin: '6px 0 0 0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                                <span className="material-icons" style={{ fontSize: '18px' }}>storefront</span> {shop.category} |
                                <span className="material-icons" style={{ fontSize: '18px' }}>location_on</span> {shop.address}
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                        <button
                            className="secondary-btn compact-btn"
                            onClick={() => navigate(`/seller/${shop.userId}`)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '10px 16px', background: 'var(--surface)' }}
                        >
                            <span className="material-icons" style={{ fontSize: '18px' }}>person</span>
                            Owner Profile
                        </button>
                        {!isOwner && (
                            <>
                                {shop.whatsapp && (
                                    <a href={`https://wa.me/${shop.whatsapp.replace(/[^\d]/g, '')}`} target="_blank" rel="noreferrer" className="primary-btn compact-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', background: '#25D366', color: 'white', padding: '10px 16px' }}>
                                        <span className="material-icons" style={{ fontSize: '18px' }}>chat</span> WhatsApp
                                    </a>
                                )}
                                <button className="secondary-btn compact-btn" onClick={onMessageSeller} style={{ padding: '10px 16px', background: 'var(--surface)' }}>Chat</button>

                                <button
                                    className={followingIds.includes(shop.userId) ? "secondary-btn compact-btn" : "primary-btn compact-btn"}
                                    onClick={() => onToggleFollowStore(shop.userId)}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '10px 16px' }}
                                >
                                    <span className="material-icons" style={{ fontSize: '18px' }}>
                                        {followingIds.includes(shop.userId) ? 'person_remove' : 'person_add'}
                                    </span>
                                    {followingIds.includes(shop.userId) ? 'Unfollow' : 'Follow'}
                                </button>

                                <button
                                    className="secondary-btn compact-btn"
                                    onClick={() => onToggleNotifyStore(shop.userId)}
                                    title={notifyStoreIds.includes(shop.userId) ? "Mute Notifications" : "Get Store Notifications"}
                                    style={{ minWidth: '40px', padding: '10px 8px', color: notifyStoreIds.includes(shop.userId) ? 'var(--primary)' : 'var(--text-muted)', background: 'var(--surface)' }}
                                >
                                    <span className="material-icons" style={{ fontSize: '20px' }}>
                                        {notifyStoreIds.includes(shop.userId) ? 'notifications_active' : 'notifications_none'}
                                    </span>
                                </button>
                            </>
                        )}
                        {isOwner && (
                            <span className="badge" style={{ background: 'var(--primary)', color: 'white', padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600, border: '2px solid var(--surface)', boxShadow: 'var(--shadow)' }}>
                                Store Owner View
                            </span>
                        )}
                    </div>
                </div>
            </section>

            {shop.description && (
                <div style={{ background: 'var(--panel)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', marginTop: '4px' }}>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{shop.description}</p>
                </div>
            )}

            {/* Subtab selection */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', paddingBottom: '8px', gap: '8px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <button className={`dashboard-tab-btn ${activeSubTab === 'catalog' ? 'active' : ''}`} onClick={() => setActiveSubTab('catalog')}>Catalog Products</button>
                <button className={`dashboard-tab-btn ${activeSubTab === 'listings' ? 'active' : ''}`} onClick={() => setActiveSubTab('listings')}>Active Listings ({shopListings.length})</button>
                <button className={`dashboard-tab-btn ${activeSubTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveSubTab('reviews')}>Reviews & Ratings ({reviewsList.length})</button>
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
                                    compact
                                />
                            ))}
                        </div>
                    )}
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
    )
}
