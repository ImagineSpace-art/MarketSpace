import { useState, useEffect } from 'react'
import type { BusinessProfile, Listing, StoreThemeConfig } from '../../types'
import { formatZMWPrice } from '../../utils/formatPrice'

interface StoreThemedListingViewProps {
    listing: Listing
    shop: BusinessProfile
    themeConfig: StoreThemeConfig
    onBackToStore: () => void
    onAddToCart: (listing: Listing, qty: number) => void
    onToggleSave: (listingId: number) => void
    isSaved: boolean
    onSelectListing: (listing: Listing) => void
    storeListings: Listing[]
    onMessageSeller: (customMessage?: string) => void
}

export function StoreThemedListingView({
    listing,
    shop,
    themeConfig,
    onBackToStore,
    onAddToCart,
    onToggleSave,
    isSaved,
    onSelectListing,
    storeListings,
    onMessageSeller,
}: StoreThemedListingViewProps) {
    const isXtra = themeConfig.presetName === 'xtra'

    const images = (listing.images && listing.images.length > 0)
        ? listing.images
        : ['/banners/store_banner_electronics.png']

    const [activeImgIdx, setActiveImgIdx] = useState(0)
    const [selectedColor, setSelectedColor] = useState<string | null>(
        listing.available_colors && listing.available_colors.length > 0 ? listing.available_colors[0] : null
    )
    const [quantity, setQuantity] = useState(1)
    const [copiedShare, setCopiedShare] = useState(false)
    const [addedCartFeedback, setAddedCartFeedback] = useState(false)

    useEffect(() => {
        setActiveImgIdx(0)
        setSelectedColor(listing.available_colors && listing.available_colors.length > 0 ? listing.available_colors[0] : null)
        setQuantity(1)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [listing.id])

    const handleShare = () => {
        const url = window.location.href
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => {
                setCopiedShare(true)
                setTimeout(() => setCopiedShare(false), 2500)
            }).catch(() => { })
        }
    }

    const handleAddToCartClick = () => {
        onAddToCart(listing, quantity)
        setAddedCartFeedback(true)
        setTimeout(() => setAddedCartFeedback(false), 2200)
    }

    const handleBuyNowClick = () => {
        onAddToCart(listing, quantity)
        const waMsg = `Hi ${shop.shopName}, I want to Buy Now: "${listing.title}" (Qty: ${quantity}${selectedColor ? `, Color: ${selectedColor}` : ''}) for ${formatZMWPrice(listing.price * quantity)}. Please process my order.`
        const cleanWa = shop.whatsapp ? shop.whatsapp.replace(/[^\d]/g, '') : ''
        if (cleanWa) {
            window.open(`https://wa.me/${cleanWa}?text=${encodeURIComponent(waMsg)}`, '_blank', 'noopener,noreferrer')
        } else {
            onMessageSeller(waMsg)
        }
    }

    const handleWhatsAppInquiry = () => {
        const waMsg = `Hi ${shop.shopName}, I'm inquiring about "${listing.title}" (K ${Number(listing.price).toLocaleString()}${selectedColor ? `, Color: ${selectedColor}` : ''}) from your official store.`
        const cleanWa = shop.whatsapp ? shop.whatsapp.replace(/[^\d]/g, '') : ''
        if (cleanWa) {
            window.open(`https://wa.me/${cleanWa}?text=${encodeURIComponent(waMsg)}`, '_blank', 'noopener,noreferrer')
        } else {
            onMessageSeller(waMsg)
        }
    }

    // Related products from the same shop
    const relatedListings = storeListings
        .filter(l => l.id !== listing.id)
        .slice(0, 4)

    // ----------------------------------------------------
    // XTRA PRESET RENDERING (Dark Indigo + Electric Yellow Bento)
    // ----------------------------------------------------
    if (isXtra) {
        return (
            <div style={{ backgroundColor: '#090d16', color: '#f8fafc', minHeight: '80vh', padding: '24px clamp(16px, 3vw, 48px) 60px', boxSizing: 'border-box' }}>
                {/* Breadcrumbs */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: '#94a3b8' }}>
                        <button
                            type="button"
                            onClick={onBackToStore}
                            style={{ background: 'transparent', border: 'none', color: '#facc15', cursor: 'pointer', padding: 0, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                            <span className="material-icons" style={{ fontSize: '18px' }}>arrow_back</span>
                            Store Catalog
                        </button>
                        <span>/</span>
                        <span>{listing.category || 'General'}</span>
                        <span>/</span>
                        <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{listing.title}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                            type="button"
                            onClick={handleShare}
                            style={{
                                background: '#1e293b',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#f8fafc',
                                borderRadius: '9999px',
                                padding: '8px 16px',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            <span className="material-icons" style={{ fontSize: '16px' }}>{copiedShare ? 'check' : 'share'}</span>
                            {copiedShare ? 'Link Copied' : 'Share'}
                        </button>
                        <button
                            type="button"
                            onClick={() => onToggleSave(listing.id)}
                            style={{
                                background: isSaved ? 'rgba(239, 68, 68, 0.15)' : '#1e293b',
                                border: `1px solid ${isSaved ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                                color: isSaved ? '#ef4444' : '#f8fafc',
                                borderRadius: '9999px',
                                padding: '8px 16px',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            <span className="material-icons" style={{ fontSize: '16px' }}>{isSaved ? 'favorite' : 'favorite_border'}</span>
                            {isSaved ? 'Saved' : 'Save'}
                        </button>
                    </div>
                </div>

                {/* Main Product Bento Layout */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', marginBottom: '48px' }}>
                    {/* Media Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Main Stage */}
                        <div style={{
                            position: 'relative',
                            width: '100%',
                            aspectRatio: '1 / 1',
                            maxHeight: '520px',
                            backgroundColor: '#0f172a',
                            borderRadius: '20px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)',
                        }}>
                            <img
                                src={images[activeImgIdx]}
                                alt={listing.title}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />

                            {/* Badge */}
                            <div style={{ position: 'absolute', top: '16px', left: '16px', background: '#facc15', color: '#090d16', padding: '6px 14px', borderRadius: '9999px', fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span className="material-icons" style={{ fontSize: '16px' }}>flash_on</span>
                                Xtra Verified Drop
                            </div>

                            {/* Navigation Arrows */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setActiveImgIdx(prev => (prev === 0 ? images.length - 1 : prev - 1))}
                                        style={{
                                            position: 'absolute',
                                            left: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            backgroundColor: 'rgba(15, 23, 42, 0.85)',
                                            border: '1px solid rgba(255,255,255,0.15)',
                                            color: '#fff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <span className="material-icons">chevron_left</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveImgIdx(prev => (prev === images.length - 1 ? 0 : prev + 1))}
                                        style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            backgroundColor: 'rgba(15, 23, 42, 0.85)',
                                            border: '1px solid rgba(255,255,255,0.15)',
                                            color: '#fff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <span className="material-icons">chevron_right</span>
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Thumbnail Strip */}
                        {images.length > 1 && (
                            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                                {images.map((img, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setActiveImgIdx(i)}
                                        style={{
                                            flexShrink: 0,
                                            width: '74px',
                                            height: '74px',
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            border: activeImgIdx === i ? '2px solid #facc15' : '1px solid rgba(255,255,255,0.1)',
                                            background: '#0f172a',
                                            padding: 0,
                                            cursor: 'pointer',
                                            opacity: activeImgIdx === i ? 1 : 0.65,
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Xtra Express Courier Dispatch Info */}
                        <div style={{ background: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(250, 204, 21, 0.15)', color: '#facc15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span className="material-icons">local_shipping</span>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>Rapid Dispatch Express</div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Dispatches within 2 hours across Lusaka. Verified door delivery or store pickup.</div>
                            </div>
                        </div>
                    </div>

                    {/* Information & Action Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Title & Seller Pill */}
                        <div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(250, 204, 21, 0.1)', color: '#facc15', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700, marginBottom: '10px' }}>
                                <span className="material-icons" style={{ fontSize: '14px' }}>verified</span>
                                {shop.shopName} Official
                            </div>
                            <h1 style={{ fontSize: 'clamp(1.4rem, 2.4vw, 1.85rem)', fontWeight: 800, margin: 0, color: '#f8fafc', lineHeight: 1.25 }}>
                                {listing.title}
                            </h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px', fontSize: '0.84rem', color: '#94a3b8' }}>
                                <span>Condition: <strong style={{ color: '#e2e8f0' }}>{listing.condition || 'Brand New'}</strong></span>
                                <span>|</span>
                                <span>Category: <strong style={{ color: '#e2e8f0' }}>{listing.category}</strong></span>
                            </div>
                        </div>

                        {/* Price Card */}
                        <div style={{ background: '#0f172a', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)', padding: '20px' }}>
                            <div style={{ fontSize: '0.82rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Store Price</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
                                <span style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 900, color: '#facc15' }}>
                                    K {Number(listing.price).toLocaleString()}
                                </span>
                                {listing.lowest_acceptable_price && (
                                    <span style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
                                        Offers accepted from K {Number(listing.lowest_acceptable_price).toLocaleString()}
                                    </span>
                                )}
                            </div>

                            {/* Wholesale Tier Pricing Spec */}
                            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                                    Volume Advantage Tiers
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                                    <div style={{ background: '#1e293b', padding: '8px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>1 - 2 Units</div>
                                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>Standard</div>
                                    </div>
                                    <div style={{ background: '#1e293b', padding: '8px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>3 - 5 Units</div>
                                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#facc15', marginTop: '2px' }}>5% Off</div>
                                    </div>
                                    <div style={{ background: '#1e293b', padding: '8px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>6+ Wholesale</div>
                                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#4ade80', marginTop: '2px' }}>10% Off</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Color Options */}
                        {listing.available_colors && listing.available_colors.length > 0 && (
                            <div>
                                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px' }}>
                                    Selected Color: <span style={{ color: '#facc15' }}>{selectedColor || 'None selected'}</span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {listing.available_colors.map((c, i) => {
                                        const isSel = selectedColor === c
                                        return (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => setSelectedColor(c)}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '9999px',
                                                    border: isSel ? '2px solid #facc15' : '1px solid rgba(255,255,255,0.15)',
                                                    background: isSel ? 'rgba(250, 204, 21, 0.15)' : '#1e293b',
                                                    color: isSel ? '#facc15' : '#e2e8f0',
                                                    fontWeight: 600,
                                                    fontSize: '0.82rem',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                {c}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Quantity Counter */}
                        <div>
                            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px' }}>Quantity</div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', background: '#1e293b', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.15)', padding: '4px' }}>
                                <button
                                    type="button"
                                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                                    style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: 'transparent', color: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <span className="material-icons" style={{ fontSize: '18px' }}>remove</span>
                                </button>
                                <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: 800, fontSize: '0.95rem', color: '#facc15' }}>{quantity}</span>
                                <button
                                    type="button"
                                    onClick={() => setQuantity(prev => prev + 1)}
                                    style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: 'transparent', color: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <span className="material-icons" style={{ fontSize: '18px' }}>add</span>
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                            <button
                                type="button"
                                onClick={handleBuyNowClick}
                                style={{
                                    width: '100%',
                                    padding: '16px 24px',
                                    borderRadius: '9999px',
                                    border: 'none',
                                    background: '#facc15',
                                    color: '#090d16',
                                    fontWeight: 900,
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    boxShadow: '0 8px 24px -6px rgba(250, 204, 21, 0.45)',
                                    transition: 'transform 0.15s ease',
                                }}
                            >
                                <span className="material-icons" style={{ fontSize: '20px' }}>shopping_bag</span>
                                Buy It Now
                            </button>

                            <button
                                type="button"
                                onClick={handleAddToCartClick}
                                style={{
                                    width: '100%',
                                    padding: '14px 24px',
                                    borderRadius: '9999px',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    background: addedCartFeedback ? '#16a34a' : '#1e293b',
                                    color: '#f8fafc',
                                    fontWeight: 700,
                                    fontSize: '0.95rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'background-color 0.2s ease',
                                }}
                            >
                                <span className="material-icons" style={{ fontSize: '20px' }}>{addedCartFeedback ? 'done' : 'add_shopping_cart'}</span>
                                {addedCartFeedback ? 'Added to Cart!' : 'Add to Cart'}
                            </button>

                            <button
                                type="button"
                                onClick={handleWhatsAppInquiry}
                                style={{
                                    width: '100%',
                                    padding: '12px 20px',
                                    borderRadius: '9999px',
                                    border: 'none',
                                    background: 'rgba(37, 211, 102, 0.15)',
                                    color: '#25d366',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                }}
                            >
                                <span className="material-icons" style={{ fontSize: '18px' }}>chat</span>
                                Order via WhatsApp
                            </button>
                        </div>

                        {/* Description Bento Card */}
                        <div style={{ background: '#0f172a', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)', padding: '20px' }}>
                            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#facc15', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Product Specifications & Details
                            </div>
                            <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.6, color: '#cbd5e1', whiteSpace: 'pre-line' }}>
                                {listing.description || 'Verified product listing directly from store warehouse.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* More from this Store Grid */}
                {relatedListings.length > 0 && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '36px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                                    More from {shop.shopName}
                                </h3>
                                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '2px' }}>Curated drops from the same verified store</div>
                            </div>
                            <button
                                type="button"
                                onClick={onBackToStore}
                                style={{ background: 'transparent', border: 'none', color: '#facc15', fontWeight: 700, fontSize: '0.86rem', cursor: 'pointer' }}
                            >
                                View All Products
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                            {relatedListings.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => onSelectListing(item)}
                                    style={{
                                        background: '#0f172a',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        padding: '12px',
                                        cursor: 'pointer',
                                        transition: 'transform 0.15s ease, border-color 0.15s ease',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = '#facc15'
                                        e.currentTarget.style.transform = 'translateY(-2px)'
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                                        e.currentTarget.style.transform = 'none'
                                    }}
                                >
                                    <div style={{ width: '100%', height: '160px', borderRadius: '12px', overflow: 'hidden', background: '#1e293b', marginBottom: '10px' }}>
                                        <img
                                            src={item.images?.[0] || '/banners/store_banner_electronics.png'}
                                            alt={item.title}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {item.title}
                                    </div>
                                    <div style={{ fontSize: '0.96rem', fontWeight: 900, color: '#facc15', marginTop: '4px' }}>
                                        K {Number(item.price).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // ----------------------------------------------------
    // HYPER PRESET RENDERING (Clean White, Pill Buttons, Trust Cards)
    // ----------------------------------------------------
    return (
        <div style={{ backgroundColor: '#ffffff', color: '#191919', minHeight: '80vh', padding: '20px clamp(16px, 3vw, 40px) 60px', boxSizing: 'border-box' }}>
            {/* Hyper Store Breadcrumbs */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', fontSize: '0.84rem', color: '#555555' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        type="button"
                        onClick={onBackToStore}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#3665f3',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                        }}
                    >
                        <span className="material-icons" style={{ fontSize: '18px' }}>storefront</span>
                        {shop.shopName}
                    </button>
                    <span>&gt;</span>
                    <span style={{ color: '#707070' }}>{listing.category || 'General'}</span>
                    <span>&gt;</span>
                    <span style={{ color: '#191919', fontWeight: 600, maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {listing.title}
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                        type="button"
                        onClick={handleShare}
                        style={{
                            background: '#f7f7f7',
                            border: '1px solid #e5e5e5',
                            color: '#191919',
                            borderRadius: '9999px',
                            padding: '6px 14px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        <span className="material-icons" style={{ fontSize: '16px' }}>{copiedShare ? 'check' : 'share'}</span>
                        {copiedShare ? 'Copied' : 'Share'}
                    </button>

                    <button
                        type="button"
                        onClick={() => onToggleSave(listing.id)}
                        style={{
                            background: isSaved ? '#fef2f2' : '#f7f7f7',
                            border: `1px solid ${isSaved ? '#ef4444' : '#e5e5e5'}`,
                            color: isSaved ? '#ef4444' : '#191919',
                            borderRadius: '9999px',
                            padding: '6px 14px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        <span className="material-icons" style={{ fontSize: '16px' }}>{isSaved ? 'favorite' : 'favorite_border'}</span>
                        {isSaved ? 'Watchlist' : 'Add to watchlist'}
                    </button>
                </div>
            </div>

            {/* Hyper Listing 2-Column Showcase */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '36px', marginBottom: '48px' }}>
                {/* Left Column: Photo Stage & Item Specifics */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Main Image Stage */}
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '1 / 1',
                        maxHeight: '520px',
                        backgroundColor: '#fafafa',
                        borderRadius: '16px',
                        border: '1px solid #e5e5e5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                    }}>
                        <img
                            src={images[activeImgIdx]}
                            alt={listing.title}
                            style={{ maxWidth: '94%', maxHeight: '94%', objectFit: 'contain' }}
                        />

                        {images.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setActiveImgIdx(prev => (prev === 0 ? images.length - 1 : prev - 1))}
                                    style={{
                                        position: 'absolute',
                                        left: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: '38px',
                                        height: '38px',
                                        borderRadius: '50%',
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #dcdcdc',
                                        color: '#191919',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                                    }}
                                >
                                    <span className="material-icons">chevron_left</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveImgIdx(prev => (prev === images.length - 1 ? 0 : prev + 1))}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: '38px',
                                        height: '38px',
                                        borderRadius: '50%',
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #dcdcdc',
                                        color: '#191919',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                                    }}
                                >
                                    <span className="material-icons">chevron_right</span>
                                </button>
                            </>
                        )}
                    </div>

                    {/* Thumbnail Strip */}
                    {images.length > 1 && (
                        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                            {images.map((img, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setActiveImgIdx(i)}
                                    style={{
                                        flexShrink: 0,
                                        width: '70px',
                                        height: '70px',
                                        borderRadius: '10px',
                                        border: activeImgIdx === i ? '2px solid #3665f3' : '1px solid #e5e5e5',
                                        backgroundColor: '#fafafa',
                                        padding: '4px',
                                        cursor: 'pointer',
                                        boxSizing: 'border-box',
                                    }}
                                >
                                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Item Specifics Table */}
                    <div style={{ border: '1px solid #e5e5e5', borderRadius: '12px', padding: '16px 20px', backgroundColor: '#fafafa' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#191919', marginBottom: '12px' }}>
                            Item specifics
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', fontSize: '0.82rem' }}>
                            <div>
                                <span style={{ color: '#707070' }}>Condition: </span>
                                <strong style={{ color: '#191919' }}>{listing.condition || 'Brand New'}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#707070' }}>Category: </span>
                                <strong style={{ color: '#191919' }}>{listing.category}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#707070' }}>Shipping: </span>
                                <strong style={{ color: '#191919' }}>{listing.delivery_option || 'Standard delivery or pickup'}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#707070' }}>Location: </span>
                                <strong style={{ color: '#191919' }}>{shop.address || 'Lusaka, Zambia'}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Title, Seller Card, Pricing & Pill Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {/* Header */}
                    <div>
                        <h1 style={{ fontSize: 'clamp(1.3rem, 2.2vw, 1.75rem)', fontWeight: 700, margin: 0, color: '#191919', lineHeight: 1.3 }}>
                            {listing.title}
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '0.84rem' }}>
                            <span style={{ display: 'inline-flex', color: '#f5af02' }}>
                                <span className="material-icons" style={{ fontSize: '18px' }}>star</span>
                                <span className="material-icons" style={{ fontSize: '18px' }}>star</span>
                                <span className="material-icons" style={{ fontSize: '18px' }}>star</span>
                                <span className="material-icons" style={{ fontSize: '18px' }}>star</span>
                                <span className="material-icons" style={{ fontSize: '18px' }}>star</span>
                            </span>
                            <span style={{ color: '#3665f3', fontWeight: 600 }}>99.6% Positive Feedback</span>
                            <span style={{ color: '#707070' }}>•</span>
                            <span style={{ color: '#707070' }}>Verified Store Merchant</span>
                        </div>
                    </div>

                    {/* Store Seller Profile Card */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', backgroundColor: '#f7f7f7', borderRadius: '12px', border: '1px solid #e5e5e5' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#0064d2', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
                                {shop.shopName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#191919' }}>{shop.shopName}</div>
                                <div style={{ fontSize: '0.78rem', color: '#707070' }}>Official Store on MarketSpace</div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => onMessageSeller(`Hi ${shop.shopName}, I have a question regarding "${listing.title}".`)}
                            style={{
                                background: '#ffffff',
                                border: '1px solid #3665f3',
                                color: '#3665f3',
                                borderRadius: '9999px',
                                padding: '6px 14px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                            }}
                        >
                            Contact store
                        </button>
                    </div>

                    <div style={{ height: '1px', backgroundColor: '#e5e5e5' }} />

                    {/* Pricing Box */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontSize: '0.82rem', color: '#707070' }}>Price:</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span style={{ fontSize: 'clamp(1.8rem, 2.8vw, 2.3rem)', fontWeight: 800, color: '#191919' }}>
                                K {Number(listing.price).toLocaleString()}
                            </span>
                            {listing.lowest_acceptable_price && (
                                <span style={{ fontSize: '0.84rem', color: '#707070' }}>
                                    (Best Offer Available)
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Color Swatches */}
                    {listing.available_colors && listing.available_colors.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ fontSize: '0.84rem', color: '#191919', fontWeight: 600 }}>
                                Color: <span style={{ color: '#3665f3' }}>{selectedColor || 'Default'}</span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {listing.available_colors.map((c, i) => {
                                    const isSel = selectedColor === c
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setSelectedColor(c)}
                                            style={{
                                                padding: '6px 16px',
                                                borderRadius: '9999px',
                                                border: isSel ? '2px solid #3665f3' : '1px solid #dcdcdc',
                                                backgroundColor: isSel ? '#eff4fe' : '#ffffff',
                                                color: isSel ? '#3665f3' : '#191919',
                                                fontWeight: isSel ? 700 : 500,
                                                fontSize: '0.82rem',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {c}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Quantity Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontSize: '0.84rem', color: '#191919', fontWeight: 600 }}>Quantity:</span>
                        <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #dcdcdc', borderRadius: '9999px', padding: '2px 6px', backgroundColor: '#ffffff' }}>
                            <button
                                type="button"
                                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                                style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#191919' }}
                            >
                                <span className="material-icons" style={{ fontSize: '16px' }}>remove</span>
                            </button>
                            <span style={{ minWidth: '36px', textAlign: 'center', fontWeight: 700, fontSize: '0.9rem', color: '#191919' }}>{quantity}</span>
                            <button
                                type="button"
                                onClick={() => setQuantity(prev => prev + 1)}
                                style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#191919' }}
                            >
                                <span className="material-icons" style={{ fontSize: '16px' }}>add</span>
                            </button>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#707070' }}>In stock • Ready to ship</span>
                    </div>

                    {/* Pill Action Buttons (Full Rounded Pill 9999px) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                        <button
                            type="button"
                            onClick={handleBuyNowClick}
                            style={{
                                width: '100%',
                                padding: '14px 24px',
                                borderRadius: '9999px',
                                border: 'none',
                                backgroundColor: '#3665f3',
                                color: '#ffffff',
                                fontWeight: 700,
                                fontSize: '0.98rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 14px rgba(54, 101, 243, 0.3)',
                            }}
                        >
                            Buy It Now
                        </button>

                        <button
                            type="button"
                            onClick={handleAddToCartClick}
                            style={{
                                width: '100%',
                                padding: '13px 24px',
                                borderRadius: '9999px',
                                border: '1px solid #3665f3',
                                backgroundColor: addedCartFeedback ? '#e6f4ea' : '#ffffff',
                                color: addedCartFeedback ? '#137333' : '#3665f3',
                                fontWeight: 700,
                                fontSize: '0.96rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <span className="material-icons" style={{ fontSize: '18px' }}>{addedCartFeedback ? 'done' : 'shopping_cart'}</span>
                            {addedCartFeedback ? 'Added to Cart' : 'Add to cart'}
                        </button>

                        <button
                            type="button"
                            onClick={handleWhatsAppInquiry}
                            style={{
                                width: '100%',
                                padding: '11px 20px',
                                borderRadius: '9999px',
                                border: '1px solid #25d366',
                                backgroundColor: '#f0fdf4',
                                color: '#166534',
                                fontWeight: 700,
                                fontSize: '0.88rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                            }}
                        >
                            <span className="material-icons" style={{ fontSize: '18px', color: '#25d366' }}>chat</span>
                            Order or Inquire via WhatsApp
                        </button>
                    </div>

                    {/* Trust Guarantees */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', backgroundColor: '#f7f7f7', borderRadius: '10px', border: '1px solid #e5e5e5' }}>
                            <span className="material-icons" style={{ color: '#0064d2', fontSize: '22px', flexShrink: 0 }}>verified_user</span>
                            <div>
                                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#191919' }}>MarketSpace Money Back Guarantee</div>
                                <div style={{ fontSize: '0.78rem', color: '#555555' }}>Get the item you ordered or your money back. Direct merchant accountability.</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', backgroundColor: '#f7f7f7', borderRadius: '10px', border: '1px solid #e5e5e5' }}>
                            <span className="material-icons" style={{ color: '#86b817', fontSize: '22px', flexShrink: 0 }}>published_with_changes</span>
                            <div>
                                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#191919' }}>30 Days Hassle-Free Returns</div>
                                <div style={{ fontSize: '0.78rem', color: '#555555' }}>Seller accepts returns within 30 days. Buyer pays return shipping for remorse returns.</div>
                            </div>
                        </div>
                    </div>

                    {/* Product Description */}
                    <div style={{ marginTop: '8px', borderTop: '1px solid #e5e5e5', paddingTop: '16px' }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#191919', marginBottom: '8px' }}>Description</div>
                        <p style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.6, color: '#333333', whiteSpace: 'pre-line' }}>
                            {listing.description || 'Authentic store merchandise with verified warranty and fast courier dispatch.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Hyper "More from this store" Grid */}
            {relatedListings.length > 0 && (
                <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#191919' }}>
                                Similar items from {shop.shopName}
                            </h3>
                            <div style={{ fontSize: '0.82rem', color: '#707070', marginTop: '2px' }}>Explore more merchandise from this store</div>
                        </div>
                        <button
                            type="button"
                            onClick={onBackToStore}
                            style={{ background: 'transparent', border: 'none', color: '#3665f3', fontWeight: 700, fontSize: '0.86rem', cursor: 'pointer' }}
                        >
                            See all items
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '16px' }}>
                        {relatedListings.map(item => (
                            <div
                                key={item.id}
                                onClick={() => onSelectListing(item)}
                                style={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '12px',
                                    border: '1px solid #e5e5e5',
                                    padding: '12px',
                                    cursor: 'pointer',
                                    transition: 'box-shadow 0.15s ease, transform 0.15s ease',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)'
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.boxShadow = 'none'
                                    e.currentTarget.style.transform = 'none'
                                }}
                            >
                                <div style={{ width: '100%', height: '160px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fafafa', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img
                                        src={item.images?.[0] || '/banners/store_banner_electronics.png'}
                                        alt={item.title}
                                        style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
                                    />
                                </div>
                                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#191919', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {item.title}
                                </div>
                                <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#191919', marginTop: '4px' }}>
                                    K {Number(item.price).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
