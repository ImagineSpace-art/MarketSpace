import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { BusinessProfile, Listing, StoreReview, StoreCartItem, StoreThemeConfig } from '../types'
import { Listing as ListingView } from '../components/Listing'
import { logAnalyticsEvent } from '../services/analytics'
import { StoreSectionRenderer } from '../components/store-theme/StoreSectionRenderer'
import { StoreThemedListingView } from '../components/store-theme/StoreThemedListingView'
import { StoreNavbar } from '../components/store-theme/StoreNavbar'
import { StoreFooter } from '../components/store-theme/StoreFooter'
import { StoreInfoPanel } from '../components/store-theme/StoreInfoPanel'
import { StoreCartDrawer } from '../components/store-theme/StoreCartDrawer'
import { HYPER_THEME } from '../components/store-theme/defaultSections'
import { BoutiqueGridTemplate, type BoutiqueGridContent } from './BoutiqueGridTemplate'
import './StoreTemplates.css'

// ---------------- PUBLIC STORE VIEW ----------------
type StoreViewPageProps = {
    shop: BusinessProfile
    listings: Listing[]
    onBack?: () => void
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
    onSaveStoreTheme?: (config: StoreThemeConfig) => Promise<void> | void
}

export function StoreViewPage({
    shop,
    listings,
    onMessageSeller,
    onOpenListing: _onOpenListing,
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
    onSaveStoreTheme,
}: StoreViewPageProps) {
    const navigate = useNavigate()
    const collectionsList = shop.collections || []
    const careInfo = shop.customerCare || {}

    const [searchParams, setSearchParams] = useSearchParams()
    const tabQuery = searchParams.get('tab')
    const highlightListingId = searchParams.get('highlight')
    const listingQueryId = searchParams.get('listing')
    const [activeSubTab, setActiveSubTab] = useState<string>(tabQuery || 'catalog')
    const [isPushDrawerOpen, setIsPushDrawerOpen] = useState(false)
    const [isStorePanelOpen, setIsStorePanelOpen] = useState(false)
    const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false)
    const [cartItems, setCartItems] = useState<StoreCartItem[]>(() => {
        try {
            const saved = localStorage.getItem(`marketspace_cart_${shop.userId}`)
            return saved ? JSON.parse(saved) : []
        } catch {
            return []
        }
    })

    useEffect(() => {
        try {
            localStorage.setItem(`marketspace_cart_${shop.userId}`, JSON.stringify(cartItems))
        } catch { }
    }, [cartItems, shop.userId])

    const handleAddToCart = (listing: Listing, qty: number = 1) => {
        setCartItems(prev => {
            const existingIndex = prev.findIndex(item => item.listing.id === listing.id)
            if (existingIndex >= 0) {
                const next = [...prev]
                next[existingIndex] = {
                    ...next[existingIndex],
                    quantity: next[existingIndex].quantity + qty,
                }
                return next
            } else {
                return [...prev, { listing, quantity: qty }]
            }
        })
        setIsCartDrawerOpen(true)
    }

    const handleUpdateCartQuantity = (listingId: number, qty: number) => {
        if (qty <= 0) {
            handleRemoveCartItem(listingId)
            return
        }
        setCartItems(prev => prev.map(item => item.listing.id === listingId ? { ...item, quantity: qty } : item))
    }

    const handleRemoveCartItem = (listingId: number) => {
        setCartItems(prev => prev.filter(item => item.listing.id !== listingId))
    }

    const handleClearCart = () => {
        setCartItems([])
    }

    const cartCount = useMemo(() => cartItems.reduce((acc, i) => acc + i.quantity, 0), [cartItems])

    const [blinkListingId, setBlinkListingId] = useState<string | null>(highlightListingId)
    const [formRating, setFormRating] = useState(0)
    const [inStoreSearch, setInStoreSearch] = useState('')
    const [selectedModalListing, setSelectedModalListing] = useState<Listing | null>(null)
    const [modalActiveImgIdx, setModalActiveImgIdx] = useState(0)
    const [copiedShareLink, setCopiedShareLink] = useState(false)
    const [modalSelectedColor, setModalSelectedColor] = useState<string | null>(null)
    const [modalQuantity, setModalQuantity] = useState<number>(1)

    const shopListings = listings.filter(l => l.user_id === shop.userId)
    const displayedListings = shopListings.filter(l => {
        if (!inStoreSearch.trim()) return true
        const q = inStoreSearch.toLowerCase()
        return l.title.toLowerCase().includes(q) || (l.description && l.description.toLowerCase().includes(q))
    })
    const isOwner = currentUserId === shop.userId

    const activeThemedListing = useMemo(() => {
        if (!listingQueryId) return null
        return shopListings.find(l => String(l.id) === listingQueryId) || listings.find(l => String(l.id) === listingQueryId) || null
    }, [listingQueryId, shopListings, listings])

    const handleOpenThemedListing = (targetListing: Listing) => {
        setIsCartDrawerOpen(false)
        setIsStorePanelOpen(false)
        const nextParams = new URLSearchParams(searchParams)
        nextParams.set('listing', String(targetListing.id))
        setSearchParams(nextParams)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleBackToStoreCatalog = () => {
        const nextParams = new URLSearchParams(searchParams)
        nextParams.delete('listing')
        setSearchParams(nextParams)
    }

    const handleOpenStoreListing = (listing: Listing) => {
        handleOpenThemedListing(listing)
    }

    const [liveThemeConfig, setLiveThemeConfig] = useState<StoreThemeConfig>(() => {
        try {
            const localSaved = localStorage.getItem(`marketspace-store-theme-${shop.userId}`)
            if (localSaved) {
                const parsed = JSON.parse(localSaved)
                if (parsed && parsed.sections && parsed.sections.length > 0) return parsed
            }
        } catch { }
        if (shop.themeConfig && shop.themeConfig.sections && shop.themeConfig.sections.length > 0) {
            return JSON.parse(JSON.stringify(shop.themeConfig))
        }
        return JSON.parse(JSON.stringify(HYPER_THEME))
    })

    const hasCustomSections = Boolean(liveThemeConfig?.sections && liveThemeConfig.sections.length > 0)

    useEffect(() => {
        try {
            const localSaved = localStorage.getItem(`marketspace-store-theme-${shop.userId}`)
            if (localSaved) {
                const parsed = JSON.parse(localSaved)
                if (parsed && parsed.sections && parsed.sections.length > 0) {
                    setLiveThemeConfig(parsed)
                    return
                }
            }
        } catch { }
        if (shop.themeConfig && shop.themeConfig.sections && shop.themeConfig.sections.length > 0) {
            setLiveThemeConfig(JSON.parse(JSON.stringify(shop.themeConfig)))
        }
    }, [shop.themeConfig, shop.userId])

    const [isLiveEditMode, setIsLiveEditMode] = useState(false)
    const [isSavingLive, setIsSavingLive] = useState(false)
    const [saveFeedback, setSaveFeedback] = useState<string | null>(null)
    const handleUpdateSection = (sectionId: string, newSettings: Record<string, any>) => {
        setLiveThemeConfig(prev => ({
            ...prev,
            sections: prev.sections.map(s => s.id === sectionId ? { ...s, settings: { ...s.settings, ...newSettings } } : s)
        }))
    }

    const handleSaveLiveChanges = async () => {
        setIsSavingLive(true)
        try {
            // Immediate local storage backup
            try {
                localStorage.setItem(`marketspace-store-theme-${shop.userId}`, JSON.stringify(liveThemeConfig))
                const allBizRaw = localStorage.getItem('marketspace-all-businesses')
                if (allBizRaw) {
                    const allBiz = JSON.parse(allBizRaw)
                    if (allBiz[shop.userId]) {
                        allBiz[shop.userId].themeConfig = liveThemeConfig
                        localStorage.setItem('marketspace-all-businesses', JSON.stringify(allBiz))
                    }
                }
            } catch (storageErr) {
                console.warn('Storage sync error:', storageErr)
            }

            if (onSaveStoreTheme) {
                await onSaveStoreTheme(liveThemeConfig)
            }
            setSaveFeedback('Store theme saved & published!')
            setTimeout(() => setSaveFeedback(null), 3500)
        } catch (err) {
            console.error('Failed to save store theme live:', err)
            setSaveFeedback('Error publishing changes.')
            setTimeout(() => setSaveFeedback(null), 3500)
        } finally {
            setIsSavingLive(false)
        }
    }

    const handleClearPresetImages = () => {
        setLiveThemeConfig(prev => {
            const nextSections = prev.sections.map(s => {
                const nextSettings = { ...s.settings }
                if (nextSettings.bgImage) nextSettings.bgImage = ''
                if (nextSettings.image) nextSettings.image = ''
                if (nextSettings.spotlightCard?.image) {
                    nextSettings.spotlightCard = { ...nextSettings.spotlightCard, image: '' }
                }
                if (Array.isArray(nextSettings.items)) {
                    nextSettings.items = nextSettings.items.map((item: any) => ({ ...item, image: '' }))
                }
                return { ...s, settings: nextSettings }
            })
            return { ...prev, sections: nextSections }
        })
        setSaveFeedback('Cleared sample images! Gallery icons active.')
        setTimeout(() => setSaveFeedback(null), 3500)
    }

    // Comprehensive Preset Theme Styles for all Store Pages (Hyper & Xtra)
    const themeStyles = useMemo(() => {
        const preset = (liveThemeConfig.presetName || '').toLowerCase()
        const primary = liveThemeConfig.primaryColor || shop.themeConfig?.primaryColor || shop.accentColor || '#2563eb'
        const navBg = liveThemeConfig.navigation?.backgroundColor
        const isNavDark = navBg ? (navBg.startsWith('#0') || navBg.startsWith('#1') || navBg.startsWith('#2')) : false

        if (preset === 'hyper') {
            return {
                pageBg: '#ffffff',
                panelBg: '#f7f7f7',
                cardBg: '#ffffff',
                text: '#191919',
                textSecondary: '#707070',
                border: '#e5e5e5',
                borderLight: '#ebebeb',
                accent: liveThemeConfig.navigation?.accentColor || '#3665f3',
                accentText: '#ffffff',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                cardRadius: '16px',
                isDark: false
            }
        }

        if (preset === 'xtra') {
            return {
                pageBg: '#131038',
                panelBg: '#1e1b4b',
                cardBg: '#272365',
                text: '#ffffff',
                textSecondary: '#a5b4fc',
                border: 'rgba(255, 255, 255, 0.12)',
                borderLight: 'rgba(255, 255, 255, 0.22)',
                accent: liveThemeConfig.navigation?.accentColor || '#facc15',
                accentText: '#0f172a',
                fontFamily: '"Outfit", -apple-system, BlinkMacSystemFont, sans-serif',
                cardRadius: '16px',
                isDark: true
            }
        }

        // Custom Fallback
        const isCustomDark = isNavDark || (primary.startsWith('#0') || primary.startsWith('#1'))
        return {
            pageBg: isCustomDark ? '#0b0f19' : '#f8fafc',
            panelBg: isCustomDark ? '#111827' : '#ffffff',
            cardBg: isCustomDark ? '#1f2937' : '#ffffff',
            text: isCustomDark ? '#f9fafb' : '#0f172a',
            textSecondary: isCustomDark ? '#9ca3af' : '#64748b',
            border: isCustomDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
            borderLight: isCustomDark ? 'rgba(255, 255, 255, 0.18)' : '#cbd5e1',
            accent: liveThemeConfig.navigation?.accentColor || primary,
            accentText: '#ffffff',
            fontFamily: liveThemeConfig.fontFamily ? `"${liveThemeConfig.fontFamily}", sans-serif` : 'inherit',
            cardRadius: '12px',
            isDark: isCustomDark
        }
    }, [liveThemeConfig, shop])

    // Dynamic document title
    useEffect(() => {
        if (shop?.shopName) {
            const originalTitle = document.title
            document.title = `${shop.shopName} | Official Store`
            return () => {
                document.title = originalTitle
            }
        }
    }, [shop?.shopName])

    // Dynamic browser tab favicon
    useEffect(() => {
        if (shop?.logo) {
            let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null
            if (!link) {
                link = document.createElement('link')
                link.rel = 'shortcut icon'
                document.head.appendChild(link)
            }
            const originalFavicon = link.href
            link.href = shop.logo
            return () => {
                if (link) link.href = originalFavicon
            }
        }
    }, [shop?.logo])

    // Analytics event logging
    useEffect(() => {
        if (shop?.userId) {
            void logAnalyticsEvent({
                event_type: 'store_view',
                seller_id: shop.userId,
                actor_id: currentUserId || undefined
            })
        }
    }, [shop?.userId, currentUserId])

    useEffect(() => {
        if (tabQuery) {
            setActiveSubTab(tabQuery)
        } else if (highlightListingId) {
            const target = shopListings.find(l => String(l.id) === String(highlightListingId))
            if (target && target.collection_id) {
                setActiveSubTab(`col-${target.collection_id}`)
            } else {
                setActiveSubTab('listings')
            }
        }
    }, [tabQuery, highlightListingId])

    useEffect(() => {
        if (highlightListingId) {
            setBlinkListingId(highlightListingId)
            const scrollTimer = setTimeout(() => {
                const el = document.getElementById(`listing-${highlightListingId}`)
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }
            }, 350)

            const clearTimer = setTimeout(() => {
                setBlinkListingId(null)
            }, 5000)

            return () => {
                clearTimeout(scrollTimer)
                clearTimeout(clearTimer)
            }
        }
    }, [highlightListingId, activeSubTab])

    const coverImage = shop.cover || '/banners/store_banner_electronics.png'
    const logoImage = shop.logo || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=120&auto=format&fit=crop&q=60'

    // Reviews list & stats
    const reviewsList = storeReviews.filter(r => r.storeId === shop.userId)
    const avgRating = reviewsList.length > 0
        ? (reviewsList.reduce((acc, r) => acc + r.rating, 0) / reviewsList.length).toFixed(1)
        : null
    const boutiqueContent = (shop.templateContent?.['boutique-grid'] || {}) as BoutiqueGridContent

    const handleNavigateTarget = (target: string) => {
        if (listingQueryId) {
            const nextParams = new URLSearchParams(searchParams)
            nextParams.delete('listing')
            setSearchParams(nextParams)
        }

        if (target === '#top') {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } else if (target === '#products' || target === '#catalog') {
            if (hasCustomSections && activeSubTab === 'catalog') {
                const el = document.getElementById('products') || document.getElementById('catalog')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            } else {
                setActiveSubTab('catalog')
                const el = document.getElementById('store-content-area')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
        } else if (target === '#departments') {
            if (hasCustomSections && activeSubTab === 'catalog') {
                const el = document.getElementById('departments')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            } else {
                setActiveSubTab('catalog')
                const el = document.getElementById('store-content-area')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
        } else if (target.startsWith('col-')) {
            setActiveSubTab(target)
            const el = document.getElementById('store-content-area')
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } else if (target.startsWith('#')) {
            const el = document.querySelector(target)
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } else if (target.startsWith('http')) {
            window.open(target, '_blank', 'noopener,noreferrer')
        }
    }

    if (shop.templateId === 'boutique-grid' && !activeThemedListing) {
        return (
            <BoutiqueGridTemplate
                shop={shop}
                listings={shopListings}
                content={boutiqueContent}
                currentUserId={currentUserId}
                savedIds={savedIds}
                storeReviews={storeReviews}
                isFollowing={followingIds.includes(shop.userId)}
                isNotified={notifyStoreIds.includes(shop.userId)}
                followerCount={followingIds.filter(id => id === shop.userId).length}
                cartCount={cartCount}
                cartItems={cartItems}
                onOpenListing={handleOpenStoreListing}
                onToggleSave={onToggleSave}
                onMessageSeller={onMessageSeller}
                onToggleFollow={() => onToggleFollowStore(shop.userId)}
                onToggleNotify={() => onToggleNotifyStore(shop.userId)}
                onAddReview={onAddReview}
                onReplyToReview={onReplyToReview}
                onRequireSignIn={() => navigate('/login')}
                onUpdateCartQuantity={handleUpdateCartQuantity}
                onRemoveCartItem={handleRemoveCartItem}
                onClearCart={handleClearCart}
                onOpenCart={() => setIsCartDrawerOpen(true)}
                onCloseCart={() => setIsCartDrawerOpen(false)}
                onOpenInfo={() => setIsStorePanelOpen(true)}
                onCloseInfo={() => setIsStorePanelOpen(false)}
                isCartOpen={isCartDrawerOpen}
                isInfoOpen={isStorePanelOpen}
            />
        )
    }

    return (
        <div id="top" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: themeStyles.pageBg, color: themeStyles.text, fontFamily: themeStyles.fontFamily }}>
            {/* STORE OWNER LIVE CUSTOMIZER BAR */}
            {isOwner && (
                <aside
                    aria-label="Store Owner Live Customizer Bar"
                    style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 150,
                        background: 'rgba(15, 23, 42, 0.94)',
                        backdropFilter: 'blur(12px)',
                        borderBottom: '1px solid rgba(255,255,255,0.12)',
                        padding: '10px 20px',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '14px',
                        flexWrap: 'wrap',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.35)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="material-icons" style={{ color: '#facc15', fontSize: '20px' }}>storefront</span>
                            <span style={{ fontWeight: 800, fontSize: '0.88rem', letterSpacing: '-0.01em' }}>
                                Merchant Live View
                            </span>
                        </div>

                        <div style={{ height: '18px', width: '1px', background: 'rgba(255,255,255,0.2)' }} />

                        {/* Live Edit Mode Toggle */}
                        <button
                            type="button"
                            onClick={() => {
                                const next = !isLiveEditMode
                                setIsLiveEditMode(next)
                                if (next && activeSubTab !== 'catalog') {
                                    setActiveSubTab('catalog')
                                }
                            }}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 14px',
                                borderRadius: '20px',
                                border: 'none',
                                background: isLiveEditMode ? '#10b981' : 'rgba(255,255,255,0.12)',
                                color: '#ffffff',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: isLiveEditMode ? '0 0 16px rgba(16, 185, 129, 0.5)' : 'none'
                            }}
                        >
                            <span className="material-icons" style={{ fontSize: '16px' }}>
                                {isLiveEditMode ? 'edit_note' : 'tune'}
                            </span>
                            <span>{isLiveEditMode ? 'Live Edit: ON' : 'Turn On Live Customizer'}</span>
                        </button>

                        {isLiveEditMode && (
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span className="material-icons" style={{ fontSize: '14px', color: '#38bdf8' }}>info</span>
                                Click pencil icon on text or drag photos directly into cards
                            </span>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {saveFeedback && (
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '4px 10px', borderRadius: '12px' }}>
                                {saveFeedback}
                            </span>
                        )}

                        {isLiveEditMode && (
                            <>

                                <button
                                    type="button"
                                    onClick={handleClearPresetImages}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 14px',
                                        borderRadius: '20px',
                                        border: '1px solid rgba(239, 68, 68, 0.4)',
                                        background: 'rgba(239, 68, 68, 0.15)',
                                        color: '#fca5a5',
                                        fontWeight: 700,
                                        fontSize: '0.8rem',
                                        cursor: 'pointer'
                                    }}
                                    title="Clear all fake preset stock images leaving gallery placeholders"
                                >
                                    <span className="material-icons" style={{ fontSize: '16px' }}>hide_image</span>
                                    <span>Clear Sample Images</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSaveLiveChanges}
                                    disabled={isSavingLive}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 16px',
                                        borderRadius: '20px',
                                        border: 'none',
                                        background: themeStyles.accent,
                                        color: themeStyles.accentText,
                                        fontWeight: 800,
                                        fontSize: '0.82rem',
                                        cursor: isSavingLive ? 'default' : 'pointer',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                                        opacity: isSavingLive ? 0.7 : 1
                                    }}
                                >
                                    <span className="material-icons" style={{ fontSize: '16px' }}>
                                        {isSavingLive ? 'sync' : 'cloud_upload'}
                                    </span>
                                    <span>{isSavingLive ? 'Saving...' : 'Save & Publish'}</span>
                                </button>
                            </>
                        )}

                        {/* Store Messages sync button */}
                        <button
                            type="button"
                            onClick={() => navigate('/inbox')}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 14px',
                                borderRadius: '20px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'rgba(255,255,255,0.08)',
                                color: '#ffffff',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                cursor: 'pointer'
                            }}
                            title="Open direct chats & customer inquiries in MarketSpace Inbox"
                        >
                            <span className="material-icons" style={{ fontSize: '16px', color: '#60a5fa' }}>forum</span>
                            <span>Store Messages</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/profile/store-dashboard?tab=customizer')}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                border: 'none',
                                background: 'transparent',
                                color: 'rgba(255,255,255,0.7)',
                                fontWeight: 600,
                                fontSize: '0.78rem',
                                cursor: 'pointer'
                            }}
                            title="Open full Theme Customizer Studio in Store Dashboard"
                        >
                            <span>Advanced Studio</span>
                            <span className="material-icons" style={{ fontSize: '14px' }}>open_in_new</span>
                        </button>
                    </div>
                </aside>
            )}

            {/* 1. STANDALONE CUSTOMIZED STORE NAVIGATION BAR */}
            <StoreNavbar
                shop={shop}
                themeConfig={liveThemeConfig}
                currentUserId={currentUserId}
                isFollowing={followingIds.includes(shop.userId)}
                followerCount={followingIds.filter(id => id === shop.userId).length}
                onToggleFollow={() => onToggleFollowStore(shop.userId)}
                isNotified={notifyStoreIds.includes(shop.userId)}
                onToggleNotify={() => onToggleNotifyStore(shop.userId)}
                onOpenPanel={() => setIsStorePanelOpen(true)}
                cartCount={cartCount}
                onOpenCart={() => setIsCartDrawerOpen(true)}
                onMessageSeller={onMessageSeller}
                onSearchChange={q => setInStoreSearch(q)}
                onNavigateTarget={handleNavigateTarget}
                isOwner={isOwner}
                onOpenCustomizer={() => navigate('/profile/store-dashboard?tab=customizer')}
            />

            {/* 1.5 THEMED IN-STORE LISTING VIEW */}
            {activeThemedListing ? (
                <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <StoreThemedListingView
                        listing={activeThemedListing}
                        shop={shop}
                        themeConfig={liveThemeConfig}
                        onBackToStore={handleBackToStoreCatalog}
                        onAddToCart={handleAddToCart}
                        onToggleSave={onToggleSave}
                        isSaved={savedIds.includes(String(activeThemedListing.id))}
                        onSelectListing={handleOpenThemedListing}
                        storeListings={shopListings}
                        onMessageSeller={onMessageSeller}
                    />
                </main>
            ) : inStoreSearch.trim() ? (
                /* 2. IN-STORE SEARCH RESULTS OVERLAY */
                <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px 24px', width: '100%', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: themeStyles.panelBg, borderRadius: '14px', border: `1px solid ${themeStyles.border}`, marginBottom: '28px' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: themeStyles.text }}>
                                Search Results for "{inStoreSearch}"
                            </h2>
                            <span style={{ fontSize: '0.84rem', color: themeStyles.textSecondary }}>
                                {displayedListings.length} items found in {shop.shopName}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setInStoreSearch('')}
                            style={{ background: 'none', border: 'none', color: themeStyles.accent, fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                            <span className="material-icons" style={{ fontSize: '18px' }}>close</span>
                            Clear Search
                        </button>
                    </div>

                    {displayedListings.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', background: themeStyles.panelBg, borderRadius: '16px', border: `1px dashed ${themeStyles.border}` }}>
                            <span className="material-icons" style={{ fontSize: '48px', color: themeStyles.textSecondary }}>search_off</span>
                            <p style={{ margin: '12px 0 0', fontSize: '1rem', color: themeStyles.textSecondary }}>
                                No items found matching "{inStoreSearch}" in this store.
                            </p>
                        </div>
                    ) : (
                        <div className="marketplace-listing-grid">
                            {displayedListings.map(listing => (
                                <ListingView
                                    key={listing.id}
                                    listing={listing}
                                    saved={savedIds.includes(String(listing.id))}
                                    onOpen={handleOpenThemedListing}
                                    onQuickPeek={handleOpenThemedListing}
                                    onToggleSave={onToggleSave}
                                    onAddToCart={handleAddToCart}
                                />
                            ))}
                        </div>
                    )}
                </main>
            ) : ((hasCustomSections || isLiveEditMode) && activeSubTab === 'catalog') ? (
                /* 3. CUSTOM MODULAR STORE SECTIONS (SHOPIFY-STYLE THEME) */
                <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 clamp(16px, 2.5vw, 36px)', boxSizing: 'border-box' }}>
                    {liveThemeConfig.sections.map((section) => (
                        <div key={section.id}>
                            <StoreSectionRenderer
                                section={section}
                                shop={{ ...shop, themeConfig: liveThemeConfig }}
                                listings={displayedListings}
                                savedIds={savedIds}
                                onOpenListing={handleOpenThemedListing}
                                onQuickPeek={handleOpenThemedListing}
                                onToggleSave={onToggleSave}
                                onAddToCart={handleAddToCart}
                                onSelectDepartment={colId => setActiveSubTab(`col-${colId}`)}
                                isLiveEditing={isLiveEditMode}
                                onUpdateSettings={(newSettings) => handleUpdateSection(section.id, newSettings)}
                            />
                        </div>
                    ))}
                </main>
            ) : (
                /* 4. DEFAULT STOREFRONT OR DEDICATED DEPARTMENT/REVIEWS TAB */
                <main id="store-content-area" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Default Store Hero Banner (only if not viewing a custom theme) */}
                    {!hasCustomSections && (
                        <div
                            style={{
                                position: 'relative',
                                height: '320px',
                                backgroundImage: `url(${coverImage})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                                textAlign: 'center',
                                padding: '24px'
                            }}
                        >
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(15,23,42,0.4), rgba(15,23,42,0.85))' }} />
                            <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', maxWidth: '700px' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '18px', overflow: 'hidden', border: `3px solid ${themeStyles.accent}`, background: '#ffffff', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                                    <img src={logoImage} alt={shop.shopName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <h1 style={{ margin: 0, fontSize: '2.4rem', fontWeight: 800, textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
                                    {shop.shopName}
                                </h1>
                                <p style={{ margin: 0, fontSize: '1rem', opacity: 0.9, lineHeight: 1.5 }}>
                                    {shop.description || 'Welcome to our official store catalog.'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Department Navigation Tabs styled with themeStyles */}
                    <div style={{ background: themeStyles.panelBg, borderBottom: `1px solid ${themeStyles.border}`, padding: '12px 24px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <button
                            type="button"
                            onClick={() => setActiveSubTab('catalog')}
                            style={{
                                padding: '8px 18px',
                                borderRadius: '20px',
                                border: activeSubTab === 'catalog' ? 'none' : `1px solid ${themeStyles.border}`,
                                fontWeight: 700,
                                fontSize: '0.86rem',
                                cursor: 'pointer',
                                background: activeSubTab === 'catalog' ? themeStyles.accent : themeStyles.cardBg,
                                color: activeSubTab === 'catalog' ? themeStyles.accentText : themeStyles.text,
                                transition: 'all 0.15s'
                            }}
                        >
                            Catalog
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveSubTab('listings')}
                            style={{
                                padding: '8px 18px',
                                borderRadius: '20px',
                                border: activeSubTab === 'listings' ? 'none' : `1px solid ${themeStyles.border}`,
                                fontWeight: 700,
                                fontSize: '0.86rem',
                                cursor: 'pointer',
                                background: activeSubTab === 'listings' ? themeStyles.accent : themeStyles.cardBg,
                                color: activeSubTab === 'listings' ? themeStyles.accentText : themeStyles.text,
                                transition: 'all 0.15s'
                            }}
                        >
                            All Listings ({shopListings.length})
                        </button>
                        {collectionsList.map(col => (
                            <button
                                key={col.id}
                                type="button"
                                onClick={() => setActiveSubTab(`col-${col.id}`)}
                                style={{
                                    padding: '8px 18px',
                                    borderRadius: '20px',
                                    border: activeSubTab === `col-${col.id}` ? 'none' : `1px solid ${themeStyles.border}`,
                                    fontWeight: 700,
                                    fontSize: '0.86rem',
                                    cursor: 'pointer',
                                    background: activeSubTab === `col-${col.id}` ? themeStyles.accent : themeStyles.cardBg,
                                    color: activeSubTab === `col-${col.id}` ? themeStyles.accentText : themeStyles.text,
                                    transition: 'all 0.15s'
                                }}
                            >
                                {col.name}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setActiveSubTab('care')}
                            style={{
                                padding: '8px 18px',
                                borderRadius: '20px',
                                border: activeSubTab === 'care' ? 'none' : `1px solid ${themeStyles.border}`,
                                fontWeight: 700,
                                fontSize: '0.86rem',
                                cursor: 'pointer',
                                background: activeSubTab === 'care' ? themeStyles.accent : themeStyles.cardBg,
                                color: activeSubTab === 'care' ? themeStyles.accentText : themeStyles.text,
                                transition: 'all 0.15s'
                            }}
                        >
                            Care & Policies
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveSubTab('reviews')}
                            style={{
                                padding: '8px 18px',
                                borderRadius: '20px',
                                border: activeSubTab === 'reviews' ? 'none' : `1px solid ${themeStyles.border}`,
                                fontWeight: 700,
                                fontSize: '0.86rem',
                                cursor: 'pointer',
                                background: activeSubTab === 'reviews' ? themeStyles.accent : themeStyles.cardBg,
                                color: activeSubTab === 'reviews' ? themeStyles.accentText : themeStyles.text,
                                transition: 'all 0.15s'
                            }}
                        >
                            Reviews ({reviewsList.length})
                        </button>
                    </div>

                    {/* Tab Body Content */}
                    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px', width: '100%', flex: 1 }}>
                        {activeSubTab === 'catalog' && (
                            <section>
                                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '20px', color: themeStyles.text }}>Product Catalog</h3>
                                {shop.catalog.length === 0 ? (
                                    <p style={{ color: themeStyles.textSecondary }}>No catalog items uploaded yet.</p>
                                ) : (
                                    <div className="catalog-grid">
                                        {shop.catalog.map(item => (
                                            <div key={item.id} className="catalog-card" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.text }}>
                                                {item.image ? (
                                                    <div className="catalog-img" style={{ backgroundImage: `url(${item.image})` }} />
                                                ) : (
                                                    <div className="catalog-img" style={{ background: themeStyles.panelBg, display: 'grid', placeItems: 'center', color: themeStyles.textSecondary }}>
                                                        <span className="material-icons" style={{ fontSize: '32px' }}>photo_camera</span>
                                                    </div>
                                                )}
                                                <div className="catalog-details">
                                                    <div>
                                                        <h4 style={{ margin: 0, color: themeStyles.text }}>{item.name}</h4>
                                                        <p style={{ fontSize: '0.8rem', color: themeStyles.textSecondary, margin: '4px 0' }}>{item.description}</p>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                                                        <strong style={{ color: themeStyles.accent }}>{item.price}</strong>
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
                            <section>
                                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '20px', color: themeStyles.text }}>All Store Listings</h3>
                                {displayedListings.length === 0 ? (
                                    <p style={{ color: themeStyles.textSecondary }}>No active listings currently available.</p>
                                ) : (
                                    <div className="marketplace-listing-grid">
                                        {displayedListings.map(listing => (
                                            <div
                                                id={`listing-${listing.id}`}
                                                key={listing.id}
                                                style={{
                                                    transition: 'all 0.3s ease',
                                                    borderRadius: '16px',
                                                    ...(String(listing.id) === String(blinkListingId) ? {
                                                        animation: 'attention-glow-blink 0.8s ease-in-out infinite alternate',
                                                        border: `3px solid ${themeStyles.accent}`,
                                                        boxShadow: `0 0 30px 10px ${themeStyles.accent}70`
                                                    } : {})
                                                }}
                                            >
                                                <ListingView
                                                    listing={listing}
                                                    saved={savedIds.includes(String(listing.id))}
                                                    onOpen={handleOpenThemedListing}
                                                    onQuickPeek={handleOpenThemedListing}
                                                    onToggleSave={onToggleSave}
                                                    onAddToCart={handleAddToCart}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}

                        {activeSubTab.startsWith('col-') && (() => {
                            const colId = activeSubTab.replace('col-', '')
                            const targetCol = collectionsList.find(c => c.id === colId)
                            const colTitle = targetCol?.name || 'Department'
                            const filteredColListings = shopListings.filter(l => String(l.collection_id) === String(colId))

                            return (
                                <section>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: `1px solid ${themeStyles.border}`, paddingBottom: '14px', marginBottom: '20px' }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: themeStyles.accent }}>{colTitle}</h3>
                                            <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: themeStyles.textSecondary }}>
                                                Browse {shop.shopName}'s {colTitle} collection ({filteredColListings.length} items).
                                            </p>
                                        </div>
                                        {isOwner && (
                                            <button
                                                type="button"
                                                className="primary-btn compact-btn"
                                                onClick={() => setIsPushDrawerOpen(true)}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: themeStyles.accent, color: themeStyles.accentText, padding: '10px 16px', borderRadius: '8px' }}
                                            >
                                                <span className="material-icons" style={{ fontSize: '18px' }}>move_to_inbox</span>
                                                <span>Push Listings to {colTitle}</span>
                                            </button>
                                        )}
                                    </div>

                                    {filteredColListings.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '36px 16px', background: themeStyles.panelBg, borderRadius: '12px', border: `1px dashed ${themeStyles.border}` }}>
                                            <p style={{ color: themeStyles.textSecondary, margin: 0, fontSize: '0.92rem' }}>No products categorized under {colTitle} yet.</p>
                                        </div>
                                    ) : (
                                        <div className="marketplace-listing-grid">
                                            {filteredColListings.map(listing => (
                                                <ListingView
                                                    key={listing.id}
                                                    listing={listing}
                                                    saved={savedIds.includes(String(listing.id))}
                                                    onOpen={handleOpenThemedListing}
                                                    onQuickPeek={handleOpenThemedListing}
                                                    onToggleSave={onToggleSave}
                                                    onAddToCart={handleAddToCart}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Push Listings Drawer */}
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
                                                    maxWidth: '440px',
                                                    height: '100%',
                                                    backgroundColor: themeStyles.panelBg,
                                                    borderLeft: `1px solid ${themeStyles.border}`,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    boxShadow: '-8px 0 24px rgba(0,0,0,0.3)',
                                                    overflow: 'hidden'
                                                }}
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${themeStyles.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: themeStyles.text }}>Push to {colTitle}</h3>
                                                    <button type="button" onClick={() => setIsPushDrawerOpen(false)} style={{ background: 'transparent', border: 'none', color: themeStyles.textSecondary, cursor: 'pointer' }}>
                                                        <span className="material-icons">close</span>
                                                    </button>
                                                </div>
                                                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {shopListings.map(listing => {
                                                        const isAssigned = String(listing.collection_id) === String(colId)
                                                        return (
                                                            <div key={listing.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', borderRadius: '8px', background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
                                                                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: themeStyles.text }}>{listing.title}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (onUpdateListingCollection) {
                                                                            onUpdateListingCollection(listing.id, isAssigned ? null : colId)
                                                                        }
                                                                    }}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        borderRadius: '6px',
                                                                        border: 'none',
                                                                        background: isAssigned ? 'var(--danger, #ef4444)' : themeStyles.accent,
                                                                        color: themeStyles.accentText,
                                                                        fontSize: '0.78rem',
                                                                        fontWeight: 700,
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    {isAssigned ? 'Remove' : 'Add'}
                                                                </button>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            )
                        })()}

                        {activeSubTab === 'care' && (
                            <section style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: themeStyles.text }}>Customer Care & Policies</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                                    <div style={{ padding: '20px', borderRadius: '12px', background: themeStyles.panelBg, border: `1px solid ${themeStyles.border}` }}>
                                        <h4 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '6px', color: themeStyles.text }}>
                                            <span className="material-icons" style={{ color: '#22c55e' }}>local_shipping</span> Delivery Options
                                        </h4>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: themeStyles.textSecondary }}>
                                            {careInfo.delivery || 'Courier delivery available nationwide. Local delivery in Lusaka within 24-48 hours.'}
                                        </p>
                                    </div>
                                    <div style={{ padding: '20px', borderRadius: '12px', background: themeStyles.panelBg, border: `1px solid ${themeStyles.border}` }}>
                                        <h4 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '6px', color: themeStyles.text }}>
                                            <span className="material-icons" style={{ color: '#3b82f6' }}>replay</span> Return & Exchange Policy
                                        </h4>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: themeStyles.textSecondary }}>
                                            {careInfo.returns || 'Inspection upon delivery is encouraged. Returns accepted for damaged items within 48 hours.'}
                                        </p>
                                    </div>
                                    <div style={{ padding: '20px', borderRadius: '12px', background: themeStyles.panelBg, border: `1px solid ${themeStyles.border}` }}>
                                        <h4 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '6px', color: themeStyles.text }}>
                                            <span className="material-icons" style={{ color: '#eab308' }}>payments</span> Payment Methods
                                        </h4>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: themeStyles.textSecondary }}>
                                            {careInfo.payment || 'Cash on Delivery, Airtel Money, MTN MoMo, and Bank Transfer.'}
                                        </p>
                                    </div>
                                    <div style={{ padding: '20px', borderRadius: '12px', background: themeStyles.panelBg, border: `1px solid ${themeStyles.border}` }}>
                                        <h4 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '6px', color: themeStyles.text }}>
                                            <span className="material-icons" style={{ color: '#a855f7' }}>schedule</span> Operating Hours
                                        </h4>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: themeStyles.textSecondary }}>
                                            {careInfo.hours || 'Monday – Saturday: 08:30 AM – 06:00 PM. Sunday: Closed.'}
                                        </p>
                                    </div>
                                </div>
                            </section>
                        )}

                        {activeSubTab === 'reviews' && (
                            <section style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: `1px solid ${themeStyles.border}`, paddingBottom: '16px' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: themeStyles.text }}>Customer Reviews & Ratings</h3>
                                        <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: themeStyles.textSecondary }}>
                                            {reviewsList.length} verified customer reviews • {avgRating ? `${avgRating} / 5.0` : 'No ratings yet'}
                                        </p>
                                    </div>
                                </div>

                                {!isOwner && currentUserId && (
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault()
                                            const form = e.currentTarget
                                            const comment = (form.elements.namedItem('comment') as HTMLTextAreaElement).value
                                            if (formRating > 0 && comment.trim()) {
                                                onAddReview(shop.userId, formRating, comment)
                                                form.reset()
                                                setFormRating(0)
                                            }
                                        }}
                                        style={{ padding: '20px', borderRadius: '12px', background: themeStyles.panelBg, border: `1px solid ${themeStyles.border}`, display: 'flex', flexDirection: 'column', gap: '14px' }}
                                    >
                                        <h4 style={{ margin: 0, fontSize: '1rem', color: themeStyles.text }}>Write a Review</h4>
                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.88rem', fontWeight: 600, marginRight: '8px', color: themeStyles.text }}>Your Rating:</span>
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setFormRating(star)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                                                >
                                                    <span className="material-icons" style={{ color: star <= formRating ? '#f59e0b' : themeStyles.textSecondary, fontSize: '24px' }}>
                                                        {star <= formRating ? 'star' : 'star_border'}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                        <textarea
                                            name="comment"
                                            required
                                            placeholder="Share your experience shopping with this store..."
                                            rows={3}
                                            style={{ padding: '10px 14px', borderRadius: '8px', border: `1px solid ${themeStyles.border}`, background: themeStyles.cardBg, color: themeStyles.text, fontSize: '0.9rem', resize: 'vertical' }}
                                        />
                                        <button type="submit" className="primary-btn compact-btn" style={{ alignSelf: 'flex-start', backgroundColor: themeStyles.accent, color: themeStyles.accentText, padding: '8px 20px', border: 'none' }}>
                                            Submit Review
                                        </button>
                                    </form>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {reviewsList.length === 0 ? (
                                        <p style={{ color: themeStyles.textSecondary }}>No customer reviews yet. Be the first to review!</p>
                                    ) : (
                                        reviewsList.map((review) => {
                                            const showReplyInput = isOwner && !review.reply
                                            return (
                                                <div key={review.id} style={{ border: `1px solid ${themeStyles.border}`, padding: '16px', borderRadius: '12px', background: themeStyles.panelBg, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                                        <strong style={{ fontSize: '0.95rem', color: themeStyles.text }}>{review.reviewerName}</strong>
                                                        <div style={{ display: 'flex', gap: '2px' }}>
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <span key={star} className="material-icons" style={{ color: star <= review.rating ? '#f59e0b' : themeStyles.textSecondary, fontSize: '16px' }}>
                                                                    {star <= review.rating ? 'star' : 'star_border'}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p style={{ margin: 0, fontSize: '0.92rem', color: themeStyles.textSecondary }}>{review.comment}</p>
                                                    {review.reply && (
                                                        <div style={{ marginTop: '6px', padding: '10px 14px', borderRadius: '8px', background: themeStyles.cardBg, borderLeft: `3px solid ${themeStyles.accent}` }}>
                                                            <strong style={{ fontSize: '0.84rem', color: themeStyles.accent }}>Store Response:</strong>
                                                            <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: themeStyles.text }}>{review.reply}</p>
                                                        </div>
                                                    )}
                                                    {showReplyInput && (
                                                        <form onSubmit={(e) => {
                                                            e.preventDefault()
                                                            const form = e.currentTarget
                                                            const replyText = (form.elements.namedItem('replyText') as HTMLInputElement).value
                                                            if (replyText.trim()) {
                                                                onReplyToReview(review.id, replyText)
                                                                form.reset()
                                                            }
                                                        }} style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                                            <input
                                                                type="text"
                                                                name="replyText"
                                                                required
                                                                placeholder="Reply as store owner..."
                                                                style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: `1px solid ${themeStyles.border}`, background: themeStyles.cardBg, color: themeStyles.text, fontSize: '0.85rem' }}
                                                            />
                                                            <button type="submit" className="primary-btn compact-btn" style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: themeStyles.accent, color: themeStyles.accentText, border: 'none' }}>
                                                                Reply
                                                            </button>
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
                </main>
            )}

            {/* 5. STORE FOOTER */}
            <StoreFooter
                shop={shop}
                themeConfig={liveThemeConfig}
                onNavigateTarget={handleNavigateTarget}
            />

            {/* 6. FLOATING MINIMAL MARKETPLACE BADGE */}
            <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '20px',
                    zIndex: 998,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '20px',
                    background: 'rgba(15, 23, 42, 0.9)',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    transition: 'transform 0.2s, background 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = '#0f172a'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(15, 23, 42, 0.9)'; }}
                title="MarketSpace Marketplace"
            >
                <span style={{ fontSize: '13px', color: '#60a5fa' }}>❖</span>
                <span>MarketSpace</span>
            </a>

            {/* 7. IN-STORE PRODUCT DETAIL POPUP PANEL */}
            {selectedModalListing && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        backgroundColor: 'rgba(0, 0, 0, 0.72)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 'clamp(16px, 3vw, 32px)',
                        overflowY: 'auto',
                    }}
                    onClick={() => setSelectedModalListing(null)}
                >
                    <div
                        style={{
                            backgroundColor: themeStyles.panelBg,
                            color: themeStyles.text,
                            borderRadius: '24px',
                            border: `1px solid ${themeStyles.borderLight}`,
                            maxWidth: '860px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.65), 0 0 1px 1px rgba(255,255,255,0.06)',
                            position: 'relative',
                            padding: 'clamp(20px, 3vw, 32px)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            type="button"
                            onClick={() => setSelectedModalListing(null)}
                            style={{
                                position: 'absolute',
                                top: '18px',
                                right: '18px',
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                background: themeStyles.cardBg,
                                border: `1px solid ${themeStyles.border}`,
                                color: themeStyles.text,
                                cursor: 'pointer',
                                display: 'grid',
                                placeItems: 'center',
                                zIndex: 10,
                                transition: 'transform 0.15s ease, background 0.15s ease',
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            title="Close preview"
                        >
                            <span className="material-icons" style={{ fontSize: '20px' }}>close</span>
                        </button>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '28px' }}>
                            {/* Images Gallery */}
                            <div>
                                {(() => {
                                    const allImgs = (selectedModalListing.images && selectedModalListing.images.length > 0)
                                        ? selectedModalListing.images
                                        : [selectedModalListing.images?.[0] || '/banners/store_banner_apparel.png']
                                    const currentImg = allImgs[modalActiveImgIdx] || allImgs[0]

                                    return (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ width: '100%', height: '340px', borderRadius: '16px', overflow: 'hidden', background: '#000000', display: 'grid', placeItems: 'center', border: `1px solid ${themeStyles.border}` }}>
                                                <img
                                                    src={currentImg}
                                                    alt={selectedModalListing.title}
                                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                />
                                            </div>

                                            {allImgs.length > 1 && (
                                                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                                                    {allImgs.map((img, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => setModalActiveImgIdx(idx)}
                                                            style={{
                                                                width: '64px',
                                                                height: '64px',
                                                                borderRadius: '10px',
                                                                overflow: 'hidden',
                                                                border: idx === modalActiveImgIdx ? `2px solid ${themeStyles.accent}` : `1px solid ${themeStyles.border}`,
                                                                cursor: 'pointer',
                                                                padding: 0,
                                                                background: '#000',
                                                                flexShrink: 0,
                                                                opacity: idx === modalActiveImgIdx ? 1 : 0.7,
                                                                transition: 'all 0.15s ease'
                                                            }}
                                                        >
                                                            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })()}
                            </div>

                            {/* Product Info & Actions */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <span className="badge" style={{ backgroundColor: `${themeStyles.accent}20`, color: themeStyles.accent, border: `1px solid ${themeStyles.accent}40`, fontWeight: 700, padding: '4px 10px', borderRadius: '12px' }}>
                                            {selectedModalListing.category}
                                        </span>
                                        <span style={{ fontSize: '0.82rem', color: themeStyles.textSecondary, fontWeight: 500 }}>
                                            {selectedModalListing.condition || 'Brand New'}
                                        </span>
                                    </div>
                                    <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 700, lineHeight: 1.25, color: themeStyles.text }}>
                                        {selectedModalListing.title}
                                    </h2>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                                    <span style={{ fontSize: '1.75rem', fontWeight: 800, color: themeStyles.accent }}>
                                        K {Number(selectedModalListing.price).toLocaleString()}
                                    </span>
                                </div>

                                {/* Selectable Available Color Swatches */}
                                {selectedModalListing.available_colors && selectedModalListing.available_colors.length > 0 && (
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: themeStyles.textSecondary }}>Available Colors:</span>
                                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: themeStyles.text }}>
                                                {modalSelectedColor || 'Choose a color'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {selectedModalListing.available_colors.map((c, i) => {
                                                const isSelected = modalSelectedColor === c
                                                return (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => setModalSelectedColor(c)}
                                                        style={{
                                                            padding: '5px 12px',
                                                            borderRadius: '16px',
                                                            background: isSelected ? `${themeStyles.accent}22` : themeStyles.cardBg,
                                                            border: isSelected ? `2px solid ${themeStyles.accent}` : `1px solid ${themeStyles.border}`,
                                                            color: isSelected ? themeStyles.accent : themeStyles.text,
                                                            fontWeight: isSelected ? 700 : 500,
                                                            fontSize: '0.8rem',
                                                            cursor: 'pointer',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            transition: 'all 0.15s ease'
                                                        }}
                                                    >
                                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isSelected ? themeStyles.accent : themeStyles.textSecondary }} />
                                                        <span>{c}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Quantity Counter */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: themeStyles.textSecondary }}>Quantity:</span>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', borderRadius: '8px', border: `1px solid ${themeStyles.border}`, background: themeStyles.cardBg, overflow: 'hidden' }}>
                                        <button
                                            type="button"
                                            onClick={() => setModalQuantity(q => Math.max(1, q - 1))}
                                            style={{ width: '34px', height: '32px', border: 'none', background: 'transparent', color: themeStyles.text, cursor: 'pointer', fontWeight: 700, fontSize: '1rem', display: 'grid', placeItems: 'center' }}
                                        >
                                            −
                                        </button>
                                        <span style={{ minWidth: '36px', textAlign: 'center', fontSize: '0.88rem', fontWeight: 700, color: themeStyles.text }}>
                                            {modalQuantity}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setModalQuantity(q => q + 1)}
                                            style={{ width: '34px', height: '32px', border: 'none', background: 'transparent', color: themeStyles.text, cursor: 'pointer', fontWeight: 700, fontSize: '1rem', display: 'grid', placeItems: 'center' }}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: themeStyles.textSecondary }}>
                                    <span className="material-icons" style={{ fontSize: '18px', color: '#10b981' }}>local_shipping</span>
                                    <span>{selectedModalListing.delivery_option || 'Courier delivery or store pickup available'}</span>
                                </div>

                                <p style={{ margin: 0, fontSize: '0.9rem', color: themeStyles.textSecondary, lineHeight: 1.6, maxHeight: '120px', overflowY: 'auto' }}>
                                    {selectedModalListing.description || 'No additional description provided for this item.'}
                                </p>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto', paddingTop: '16px', borderTop: `1px solid ${themeStyles.border}` }}>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleAddToCart(selectedModalListing, modalQuantity)
                                            }}
                                            style={{
                                                flex: 2,
                                                minWidth: '140px',
                                                backgroundColor: themeStyles.accent,
                                                color: themeStyles.accentText,
                                                border: 'none',
                                                borderRadius: '10px',
                                                padding: '12px 18px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                fontWeight: 800,
                                                fontSize: '0.92rem',
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                                                transition: 'opacity 0.15s ease'
                                            }}
                                        >
                                            <span className="material-icons" style={{ fontSize: '19px' }}>shopping_bag</span>
                                            <span>Add to Cart</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleAddToCart(selectedModalListing, modalQuantity)
                                                setIsCartDrawerOpen(true)
                                            }}
                                            style={{
                                                flex: 1,
                                                minWidth: '100px',
                                                backgroundColor: themeStyles.cardBg,
                                                color: themeStyles.text,
                                                border: `1px solid ${themeStyles.borderLight}`,
                                                borderRadius: '10px',
                                                padding: '12px 14px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px',
                                                fontWeight: 700,
                                                fontSize: '0.88rem',
                                                cursor: 'pointer',
                                                transition: 'background 0.15s ease'
                                            }}
                                        >
                                            <span>Buy Now</span>
                                        </button>

                                        {shop.whatsapp && (
                                            <a
                                                href={`https://wa.me/${shop.whatsapp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Hi ${shop.shopName}, I'm interested in "${selectedModalListing.title}" (K ${selectedModalListing.price}${modalSelectedColor ? `, Color: ${modalSelectedColor}` : ''}) from your official store.`)}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{
                                                    backgroundColor: '#25D366',
                                                    color: '#ffffff',
                                                    padding: '12px 16px',
                                                    borderRadius: '10px',
                                                    textDecoration: 'none',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    fontWeight: 700,
                                                    fontSize: '0.88rem',
                                                }}
                                            >
                                                <span className="material-icons" style={{ fontSize: '18px' }}>chat</span>
                                                WhatsApp
                                            </a>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedModalListing(null)
                                                if (isOwner) {
                                                    navigate('/inbox')
                                                } else {
                                                    onMessageSeller()
                                                }
                                            }}
                                            style={{
                                                padding: '12px 14px',
                                                borderRadius: '10px',
                                                border: `1px solid ${themeStyles.border}`,
                                                background: themeStyles.cardBg,
                                                color: themeStyles.text,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontWeight: 600,
                                                fontSize: '0.85rem',
                                            }}
                                            title={isOwner ? "Open your MarketSpace Inbox" : "Message seller in MarketSpace"}
                                        >
                                            <span className="material-icons" style={{ fontSize: '18px', color: '#60a5fa' }}>forum</span>
                                            <span>{isOwner ? 'Store Inbox' : 'Chat'}</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => onToggleSave(selectedModalListing.id)}
                                            style={{
                                                background: themeStyles.cardBg,
                                                border: `1px solid ${themeStyles.border}`,
                                                borderRadius: '10px',
                                                padding: '0 14px',
                                                cursor: 'pointer',
                                                display: 'grid',
                                                placeItems: 'center',
                                                color: savedIds.includes(String(selectedModalListing.id)) ? '#ef4444' : themeStyles.textSecondary,
                                            }}
                                            title="Save to Wishlist"
                                        >
                                            <span className="material-icons">
                                                {savedIds.includes(String(selectedModalListing.id)) ? 'favorite' : 'favorite_border'}
                                            </span>
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: themeStyles.textSecondary }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const url = `${window.location.origin}/store/${shop.userId}?highlight=${selectedModalListing.id}`
                                                navigator.clipboard.writeText(url)
                                                setCopiedShareLink(true)
                                                setTimeout(() => setCopiedShareLink(false), 2000)
                                            }}
                                            style={{ background: 'none', border: 'none', color: themeStyles.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0, fontSize: '0.8rem' }}
                                        >
                                            <span className="material-icons" style={{ fontSize: '16px' }}>share</span>
                                            {copiedShareLink ? 'Link Copied!' : 'Share Product Link'}
                                        </button>

                                        <a
                                            href={`/listings/${selectedModalListing.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: themeStyles.textSecondary, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                        >
                                            <span>MarketSpace Marketplace</span>
                                            <span className="material-icons" style={{ fontSize: '13px' }}>open_in_new</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. STORE INFO SLIDE-OUT PANEL */}
            <StoreInfoPanel
                isOpen={isStorePanelOpen}
                onClose={() => setIsStorePanelOpen(false)}
                shop={shop}
                themeConfig={liveThemeConfig}
                isFollowing={followingIds.includes(shop.userId)}
                followerCount={followingIds.filter(id => id === shop.userId).length}
                onToggleFollow={() => onToggleFollowStore(shop.userId)}
                isNotified={notifyStoreIds.includes(shop.userId)}
                onToggleNotify={() => onToggleNotifyStore(shop.userId)}
                onMessageSeller={onMessageSeller}
            />

            {/* 4. THEME DRAWER CART PANEL */}
            <StoreCartDrawer
                isOpen={isCartDrawerOpen}
                onClose={() => setIsCartDrawerOpen(false)}
                shop={shop}
                themeConfig={liveThemeConfig}
                cartItems={cartItems}
                onUpdateQuantity={handleUpdateCartQuantity}
                onRemoveItem={handleRemoveCartItem}
                onClearCart={handleClearCart}
                onOpenListing={handleOpenStoreListing}
            />
        </div>
    )
}
