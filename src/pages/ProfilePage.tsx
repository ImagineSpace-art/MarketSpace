import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Listing, Profile, BusinessProfile, PaymentMethodItem, NotificationConfig } from '../types'
import { SavedItemsPage, NotificationsPage } from './SavedNotificationsPage'
import { ListingFormPage } from './ListingPage'
import { StoreSetupPage } from './StoreSetupPage'
import { StoreRegistrationWizard } from './StoreRegistrationWizard'
import { AdCreationPage } from './AdCreationPage'
import { StoreInsightsView } from '../components/StoreInsightsView'
import { StoreTemplateEditor } from './StoreTemplateEditor'
import type { NotificationItem } from '../features/marketplace/useMarketplaceApp'
import { uploadImageToSupabase } from '../features/marketplace/ImageUploader'
import { fetchStoreAnalytics, type StoreAnalyticsData } from '../services/analytics'
import { getListingTimeRemainingMs, isListingExpired } from '../features/marketplace/listingExpiry'

// ---------------- PROFILE PAGE ----------------
type ProfilePageProps = {
    profile: Profile | null
    myListings: Listing[]
    listings: Listing[]
    savedListings: Listing[]
    savedIds: string[]
    businessProfile: BusinessProfile | null
    onSaveStoreTemplate?: (content: Record<string, string>, departments?: Array<{ name: string; image?: string }>, templateId?: 'boutique-grid' | 'storefront-landing') => Promise<void>
    onEditListing: (listing: Listing) => void
    onRenewListing: (listingId: number) => void
    onDeleteListing: (listingId: number) => void
    onUpdateStatus: (listingId: number, status: string) => void
    onOpenListing: (listing: Listing) => void
    onToggleSave: (listingId: number) => void
    onUpdateListingCollection?: (listingId: number, targetColId: string | null) => void | Promise<void>
    globalRenewalFrequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly'
    globalRenewalDay?: string

    // Settings panel specific props
    activeSection: 'dashboard' | 'settings' | 'notifications' | 'create' | 'create-ad' | 'business-setup' | 'store-dashboard' | 'store-insights' | 'saved-listings'
    theme: 'light' | 'dark'
    locationString: string
    onToggleTheme: () => void
    onGoHome: () => void

    // Notifications panel specific props
    notifications: NotificationItem[]
    onMarkAllRead: () => void

    // ListingFormPage props
    createListingProps: {
        title: string
        description: string
        price: string
        category: string
        status: string
        listingType: string
        condition: string
        deliveryOption: string
        uploadedImages: string[]
        onUploadedImagesChange: (images: string[]) => void
        onSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>
        onTitleChange: (v: string) => void
        onDescriptionChange: (v: string) => void
        onPriceChange: (v: string) => void
        onCategoryChange: (v: string) => void
        onStatusChange: (v: string) => void
        onListingTypeChange: (v: string) => void
        onConditionChange: (v: string) => void
        onDeliveryOptionChange: (v: string) => void
        availableColors: string[]
        onAvailableColorsChange: (colors: string[]) => void
    }

    // StoreSetupPage props
    storeSetupProps: {
        userId: string
        onSave: (shop: BusinessProfile) => void | Promise<void>
    }

    allBusinesses?: Record<string, BusinessProfile>
    followingIds?: string[]
    notifyStoreIds?: string[]
    onToggleFollowStore?: (storeId: string) => void
    onToggleNotifyStore?: (storeId: string) => void

    currency?: 'ZMW'
    setCurrency?: (c: 'ZMW') => void
    notificationsConfig?: NotificationConfig
    setNotificationsConfig?: React.Dispatch<React.SetStateAction<NotificationConfig>>
    blockedUserIds?: string[]
    toggleBlockUser?: (userId: string) => void
    paymentMethods?: PaymentMethodItem[]
    addPaymentMethod?: (item: Omit<PaymentMethodItem, 'id'>) => void
    removePaymentMethod?: (id: string) => void
    browsingHistory?: Array<{ id: number; title: string; price: number; image?: string; timestamp: string }>
    clearBrowsingHistory?: () => void
    searchHistory?: string[]
    clearSearchHistory?: () => void
}

export function ProfilePage({
    profile,
    myListings,
    savedListings,
    businessProfile,
    onEditListing,
    onRenewListing,
    onDeleteListing,
    onUpdateStatus,
    onOpenListing,
    onToggleSave,
    globalRenewalFrequency = 'weekly',
    globalRenewalDay = 'Monday',
    activeSection,
    notifications,
    onMarkAllRead,
    createListingProps,
    storeSetupProps,
    allBusinesses = {},
    followingIds = [],
    onToggleFollowStore = () => { },
    onSaveStoreTemplate,
}: ProfilePageProps) {
    const navigate = useNavigate()

    const [storeTab, setStoreTab] = useState<'analytics' | 'catalog' | 'ads' | 'social' | 'customizer'>('analytics')

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        if (params.get('tab') === 'customizer') {
            setStoreTab('customizer')
        }
    }, [])

    const [sellerTab, setSellerTab] = useState<'active' | 'sold' | 'drafts'>('active')

    // Store Performance time filter & database data
    const [perfTimeFilter, setPerfTimeFilter] = useState<'7d' | '14d' | '30d'>('7d')
    const [perfAnalyticsData, setPerfAnalyticsData] = useState<StoreAnalyticsData | null>(null)

    useEffect(() => {
        if (!businessProfile?.userId || storeTab !== 'analytics') return
        let isMounted = true
        const days = perfTimeFilter === '7d' ? 7 : perfTimeFilter === '14d' ? 14 : 30
        const listingIds = myListings.map(l => l.id)
        fetchStoreAnalytics(businessProfile.userId, days, listingIds)
            .then(data => {
                if (isMounted) setPerfAnalyticsData(data)
            })
            .catch(err => console.error('Error loading performance analytics:', err))
        return () => { isMounted = false }
    }, [businessProfile?.userId, storeTab, perfTimeFilter, myListings])

    // Catalog Item creation states
    const [catalogName, setCatName] = useState('')
    const [catalogPrice, setCatPrice] = useState('')
    const [catalogDescription, setCatDesc] = useState('')
    const [catalogImage, setCatImage] = useState('')

    const handleCatImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const url = await uploadImageToSupabase(e.target.files[0], 'marketspace-media', 'catalog')
                setCatImage(url)
            } catch (err) {
                console.error(err)
            }
        }
    }

    const handleAddCatalogItem = (e: FormEvent) => {
        e.preventDefault()
        if (!businessProfile || !catalogName || !catalogPrice) return
        const newItem = {
            id: String(Date.now()),
            name: catalogName,
            price: catalogPrice,
            description: catalogDescription,
            image: catalogImage
        }
        void storeSetupProps.onSave({
            ...businessProfile,
            catalog: [...(businessProfile.catalog || []), newItem]
        })
        setCatName('')
        setCatPrice('')
        setCatDesc('')
        setCatImage('')
    }

    const handleRemoveCatalogItem = (itemId: string) => {
        if (!businessProfile) return
        void storeSetupProps.onSave({
            ...businessProfile,
            catalog: (businessProfile.catalog || []).filter(i => i.id !== itemId)
        })
    }

    const handleToggleAdStatus = (adId: string) => {
        if (!businessProfile) return
        void storeSetupProps.onSave({
            ...businessProfile,
            ads: (businessProfile.ads || []).map(ad => {
                if (ad.id === adId) {
                    return {
                        ...ad,
                        status: ad.status === 'Active' ? 'Paused' as const : 'Active' as const
                    }
                }
                return ad
            })
        })
    }

    return (
        <div className="dashboard-layout">
            <main className="dashboard-main">
                {activeSection === 'notifications' ? (
                    <NotificationsPage
                        notifications={notifications}
                        onMarkAllRead={onMarkAllRead}
                    />
                ) : activeSection === 'create' ? (
                    <ListingFormPage
                        mode="create"
                        {...createListingProps}
                        onCancel={() => navigate('/profile')}
                    />
                ) : activeSection === 'create-ad' ? (
                    <AdCreationPage
                        businessProfile={businessProfile}
                        myListings={myListings}
                        profile={profile}
                        onSaveAd={async (newAd) => {
                            if (businessProfile) {
                                await storeSetupProps.onSave({
                                    ...businessProfile,
                                    ads: [...(businessProfile.ads || []), newAd]
                                })
                            }
                        }}
                        onBack={() => navigate('/profile')}
                    />
                ) : activeSection === 'store-insights' ? (
                    <StoreInsightsView
                        businessProfile={businessProfile}
                        myListings={myListings}
                        followingCount={followingIds.filter(id => id === businessProfile?.userId).length}
                        onNavigateToCreatePost={() => navigate('/profile/create-ad')}
                    />
                ) : activeSection === 'store-dashboard' ? (
                    businessProfile ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    {businessProfile.logo ? (
                                        <img src={businessProfile.logo} alt="Logo" style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover' }} />
                                    ) : (
                                        <div className="brand-mark" style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'grid', placeItems: 'center', background: 'var(--border)', color: 'var(--text)' }}>
                                            <span className="material-icons">storefront</span>
                                        </div>
                                    )}
                                    <div>
                                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Shop Manager: {businessProfile.shopName}</h2>
                                        <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Store Tools & Insights</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        className="secondary-btn compact-btn"
                                        onClick={() => setStoreTab('customizer')}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--panel)', border: '1px solid var(--border)', cursor: 'pointer', borderRadius: '8px', fontWeight: 600 }}
                                    >
                                        <span className="material-icons" style={{ fontSize: '18px', color: '#2563eb' }}>palette</span>
                                        Customize Theme
                                    </button>
                                    <button
                                        type="button"
                                        className="primary-btn compact-btn"
                                        onClick={() => window.open(`/store/${businessProfile.userId}`, '_blank')}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
                                    >
                                        <span className="material-icons" style={{ fontSize: '18px' }}>open_in_new</span>
                                        Preview Storefront
                                    </button>
                                </div>
                            </div>

                            {/* Tab controls */}
                            <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', WebkitOverflowScrolling: 'touch' }}>
                                <button className={`dashboard-tab-btn ${storeTab === 'analytics' ? 'active' : ''}`} onClick={() => setStoreTab('analytics')}>Performance Dashboard</button>
                                <button className={`dashboard-tab-btn ${storeTab === 'catalog' ? 'active' : ''}`} onClick={() => setStoreTab('catalog')}>Catalogs Manager</button>
                                <button className={`dashboard-tab-btn ${storeTab === 'ads' ? 'active' : ''}`} onClick={() => setStoreTab('ads')}>Advertising Manager</button>
                                <button className={`dashboard-tab-btn ${storeTab === 'social' ? 'active' : ''}`} onClick={() => setStoreTab('social')}>Followers & Following</button>
                                <button className={`dashboard-tab-btn ${storeTab === 'customizer' ? 'active' : ''}`} onClick={() => setStoreTab('customizer')}>
                                    <span className="material-icons" style={{ fontSize: '16px', verticalAlign: 'middle', marginRight: '4px' }}>palette</span>
                                    Storefront Customizer
                                </button>
                            </div>

                            {/* ANALYTICS TAB */}
                            {storeTab === 'analytics' && (() => {
                                const activeAds = (businessProfile.ads || []).filter(a => a.status === 'Active').length
                                const perfStoreClicks = perfAnalyticsData?.storeClicks ?? 0
                                const perfListingClicks = perfAnalyticsData?.listingClicks ?? 0
                                const perfAdClicks = perfAnalyticsData?.adClicks ?? 0
                                const perfListingShares = perfAnalyticsData?.listingShares ?? 0
                                const perfListingSaves = perfAnalyticsData?.listingSaves ?? 0
                                const perfFollowers = perfAnalyticsData?.followersCount ?? followingIds.filter(id => id === businessProfile.userId).length

                                return (
                                    <div className="business-hub-grid" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {/* Time Filter Bar */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', background: 'var(--panel)', padding: '14px 20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Store Performance Metrics</h3>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Activity for the last {perfTimeFilter === '7d' ? '7 days' : perfTimeFilter === '14d' ? '14 days' : '30 days'}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                {(['7d', '14d', '30d'] as const).map(tf => (
                                                    <button
                                                        key={tf}
                                                        type="button"
                                                        onClick={() => setPerfTimeFilter(tf)}
                                                        style={{
                                                            padding: '6px 14px',
                                                            borderRadius: '8px',
                                                            border: 'none',
                                                            fontWeight: 700,
                                                            fontSize: '0.82rem',
                                                            cursor: 'pointer',
                                                            background: perfTimeFilter === tf ? '#2563eb' : 'var(--surface)',
                                                            color: perfTimeFilter === tf ? '#ffffff' : 'var(--text)',
                                                            boxShadow: perfTimeFilter === tf ? '0 2px 8px rgba(37, 99, 235, 0.3)' : 'none'
                                                        }}
                                                    >
                                                        {tf === '7d' ? '7 Days' : tf === '14d' ? '14 Days' : '30 Days'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Metric Summary Cards Grid */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                                            <div style={{ background: 'var(--panel)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Store Clicks</span>
                                                    <span className="material-icons" style={{ fontSize: '18px', color: '#2563eb' }}>storefront</span>
                                                </div>
                                                <h3 style={{ margin: '6px 0 2px 0', fontSize: '1.6rem', color: '#2563eb' }}>{perfStoreClicks.toLocaleString()}</h3>
                                                <span style={{ fontSize: '0.74rem', color: '#3b82f6', fontWeight: 600 }}>{perfTimeFilter} window</span>
                                            </div>

                                            <div style={{ background: 'var(--panel)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Listing Clicks</span>
                                                    <span className="material-icons" style={{ fontSize: '18px', color: '#3b82f6' }}>touch_app</span>
                                                </div>
                                                <h3 style={{ margin: '6px 0 2px 0', fontSize: '1.6rem' }}>{perfListingClicks.toLocaleString()}</h3>
                                                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Real-time</span>
                                            </div>

                                            <div style={{ background: 'var(--panel)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Ad Clicks</span>
                                                    <span className="material-icons" style={{ fontSize: '18px', color: '#f59e0b' }}>campaign</span>
                                                </div>
                                                <h3 style={{ margin: '6px 0 2px 0', fontSize: '1.6rem' }}>{perfAdClicks.toLocaleString()}</h3>
                                                <span style={{ fontSize: '0.74rem', color: activeAds > 0 ? '#10b981' : 'var(--text-secondary)', fontWeight: 600 }}>
                                                    {activeAds > 0 ? 'Active campaigns' : 'No active ads'}
                                                </span>
                                            </div>

                                            <div style={{ background: 'var(--panel)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Listing Shares</span>
                                                    <span className="material-icons" style={{ fontSize: '18px', color: '#8b5cf6' }}>share</span>
                                                </div>
                                                <h3 style={{ margin: '6px 0 2px 0', fontSize: '1.6rem' }}>{perfListingShares.toLocaleString()}</h3>
                                                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Real-time</span>
                                            </div>

                                            <div style={{ background: 'var(--panel)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Listing Saves</span>
                                                    <span className="material-icons" style={{ fontSize: '18px', color: '#ec4899' }}>bookmark</span>
                                                </div>
                                                <h3 style={{ margin: '6px 0 2px 0', fontSize: '1.6rem' }}>{perfListingSaves.toLocaleString()}</h3>
                                                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Real-time</span>
                                            </div>

                                            <div style={{ background: 'var(--panel)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Followers</span>
                                                    <span className="material-icons" style={{ fontSize: '18px', color: '#10b981' }}>people</span>
                                                </div>
                                                <h3 style={{ margin: '6px 0 2px 0', fontSize: '1.6rem', color: '#10b981' }}>{perfFollowers}</h3>
                                                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Total followers</span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            <div className="sidebar-card" style={{ background: 'var(--panel)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                                <h3 style={{ marginTop: 0 }}>Catalog Products Overview</h3>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
                                                    {(businessProfile.catalog || []).length === 0 ? (
                                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No catalog items listed yet.</p>
                                                    ) : (
                                                        (businessProfile.catalog || []).map(item => (
                                                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>
                                                                <span>{item.name}</span>
                                                                <strong style={{ color: 'var(--primary)' }}>{item.price}</strong>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                            <div className="sidebar-card" style={{ background: 'var(--panel)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                                <h3 style={{ marginTop: 0 }}>Ad Campaign Status</h3>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
                                                    {(businessProfile.ads || []).length === 0 ? (
                                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No active or past advertisements.</p>
                                                    ) : (
                                                        (businessProfile.ads || []).map(ad => (
                                                            <div key={ad.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>
                                                                <span>{ad.adTitle}</span>
                                                                <span className="badge" style={{ background: ad.status === 'Active' ? '#e2f0d9' : '#fce4d6', color: ad.status === 'Active' ? '#385723' : '#c65911' }}>
                                                                    {ad.status} ({ad.duration})
                                                                </span>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })()}

                            {/* CATALOGS TAB */}
                            {storeTab === 'catalog' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div className="sidebar-card" style={{ background: 'var(--panel)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span className="material-icons">add_box</span> Add Product to Catalog
                                        </h3>
                                        <form onSubmit={handleAddCatalogItem} className="form-stack" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <label>
                                                <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Product Image</span>
                                                <div className="image-upload-zone" style={{ padding: '14px', marginTop: '4px', border: '2px dashed var(--border)', borderRadius: '8px' }}>
                                                    <input type="file" accept="image/*" onChange={handleCatImageChange} style={{ display: 'none' }} id="catalog-image-input" />
                                                    <label htmlFor="catalog-image-input" style={{ cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                        {catalogImage ? (
                                                            <img src={catalogImage} alt="Product" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                                                        ) : (
                                                            <div className="upload-icon"><span className="material-icons">add_a_photo</span></div>
                                                        )}
                                                        <span>Select Product Image</span>
                                                    </label>
                                                </div>
                                            </label>

                                            <input value={catalogName} onChange={e => setCatName(e.target.value)} placeholder="Product Name (e.g. Vanilla Wedding Cake)" required style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
                                            <input value={catalogPrice} onChange={e => setCatPrice(e.target.value)} placeholder="Price (e.g. ZMW 450)" required style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
                                            <textarea value={catalogDescription} onChange={e => setCatDesc(e.target.value)} placeholder="Description (e.g. Double layered sponge with buttercream)" rows={2} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit' }} />

                                            <button className="primary-btn" type="submit" style={{ padding: '10px', borderRadius: '8px' }}>Add Product</button>
                                        </form>
                                    </div>

                                    <div>
                                        <h3>Current Catalog Products ({(businessProfile.catalog || []).length})</h3>
                                        {(businessProfile.catalog || []).length === 0 ? (
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No catalog items yet. Add your first product to display it on your public shop profile.</p>
                                        ) : (
                                            <div className="catalog-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                                                {(businessProfile.catalog || []).map((item) => (
                                                    <div key={item.id} className="catalog-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                                        {item.image ? (
                                                            <div className="catalog-img" style={{ backgroundImage: `url(${item.image})`, height: '140px', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                                                        ) : (
                                                            <div className="catalog-img" style={{ background: 'linear-gradient(135deg, #ddd, #999)', height: '140px', display: 'grid', placeItems: 'center', color: '#666' }}>
                                                                <span className="material-icons" style={{ fontSize: '32px' }}>photo_camera</span>
                                                            </div>
                                                        )}
                                                        <div className="catalog-details" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', flexGrow: 1, justifyContent: 'space-between' }}>
                                                            <div>
                                                                <h4 style={{ margin: 0 }}>{item.name}</h4>
                                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0' }}>{item.description || 'No description'}</p>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                                                                <strong>{item.price}</strong>
                                                                <button className="ghost-btn compact-btn delete-btn" style={{ color: 'var(--danger)' }} onClick={() => handleRemoveCatalogItem(item.id)}>Remove</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ADS TAB */}
                            {storeTab === 'ads' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div>
                                        <h3>Your Campaigns ({(businessProfile.ads || []).length})</h3>
                                        {(businessProfile.ads || []).length === 0 ? (
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No ad campaigns configured yet.</p>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {(businessProfile.ads || []).map((ad) => (
                                                    <div key={ad.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px' }}>
                                                        <div>
                                                            <h4 style={{ margin: 0 }}>{ad.adTitle}</h4>
                                                            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Duration: {ad.duration} | Budget: {ad.budget}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                            <span className="badge" style={{ background: ad.status === 'Active' ? '#e2f0d9' : '#fce4d6', color: ad.status === 'Active' ? '#385723' : '#c65911' }}>
                                                                {ad.status}
                                                            </span>
                                                            <button className="secondary-btn compact-btn" onClick={() => handleToggleAdStatus(ad.id)}>
                                                                {ad.status === 'Active' ? 'Pause' : 'Resume'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* SOCIAL TAB */}
                            {storeTab === 'social' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="sidebar-card" style={{ background: 'var(--panel)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                        <h3 style={{ marginTop: 0 }}>Followers (148)</h3>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>Users receiving notifications about your listing & store updates.</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 600 }}>C</div>
                                                <div>
                                                    <strong style={{ fontSize: '0.88rem', display: 'block' }}>Caleb Ng'ambi</strong>
                                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Following since July 2026</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#10b981', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 600 }}>M</div>
                                                <div>
                                                    <strong style={{ fontSize: '0.88rem', display: 'block' }}>Mwansa K.</strong>
                                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Following since June 2026</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f59e0b', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 600 }}>A</div>
                                                <div>
                                                    <strong style={{ fontSize: '0.88rem', display: 'block' }}>Angela Z.</strong>
                                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Following since May 2026</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="sidebar-card" style={{ background: 'var(--panel)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                        <h3 style={{ marginTop: 0 }}>Stores You Follow ({followingIds.length})</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                                            {followingIds.length === 0 ? (
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>You aren't following any other stores yet.</p>
                                            ) : (
                                                followingIds.map(id => {
                                                    const shopProfile = allBusinesses[id]
                                                    if (!shopProfile) return null
                                                    return (
                                                        <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                {shopProfile.logo ? (
                                                                    <img src={shopProfile.logo} alt="Logo" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }} />
                                                                ) : (
                                                                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#ccc', display: 'grid', placeItems: 'center', fontSize: '0.8rem' }}>
                                                                        <span className="material-icons" style={{ fontSize: '14px' }}>storefront</span>
                                                                    </div>
                                                                )}
                                                                <strong style={{ fontSize: '0.88rem' }}>{shopProfile.shopName}</strong>
                                                            </div>
                                                            <button className="ghost-btn compact-btn delete-btn" onClick={() => onToggleFollowStore(id)} style={{ color: 'var(--danger)' }}>Unfollow</button>
                                                        </div>
                                                    )
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* CUSTOMIZER TAB */}
                            {storeTab === 'customizer' && (
                                <div style={{ marginTop: '10px' }}>
                                    <StoreTemplateEditor
                                        businessProfile={businessProfile}
                                        myListings={myListings}
                                        onSave={async (content, departments, templateId) => {
                                            if (!onSaveStoreTemplate) throw new Error('Store template saving is not available.')
                                            await onSaveStoreTemplate(content, departments, templateId)
                                        }}
                                        onClose={() => setStoreTab('analytics')}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <section className="dashboard-banner">
                            <div className="banner-content">
                                <div className="banner-text">
                                    <h3>Boost sales with an online store!</h3>
                                    <p>Unlock premium features: catalog managers, advertising, and a custom public store view.</p>
                                </div>
                                <Link className="primary-btn" style={{ textDecoration: 'none' }} to="/profile/business-setup">Open Store</Link>
                            </div>
                        </section>
                    )
                ) : activeSection === 'saved-listings' ? (
                    <SavedItemsPage
                        savedListings={savedListings}
                        onOpenListing={onOpenListing}
                        onToggleSave={onToggleSave}
                    />
                ) : activeSection === 'business-setup' ? (
                    businessProfile ? (
                        <StoreSetupPage
                            userId={storeSetupProps.userId}
                            businessProfile={businessProfile}
                            onSave={storeSetupProps.onSave}
                            onCancel={() => navigate('/profile')}
                        />
                    ) : (
                        <StoreRegistrationWizard
                            userId={storeSetupProps.userId}
                            onCancel={() => navigate('/profile')}
                        />
                    )
                ) : (
                    <>
                        {/* BUSINESS OPT-IN CARD */}
                        <section className="dashboard-banner">
                            {businessProfile ? (
                                <div className="banner-content">
                                    <div className="banner-text">
                                        <h3>
                                            <span className="material-icons store-icon">storefront</span>
                                            {businessProfile.shopName}
                                            {businessProfile.verifiedId && <span className="badge verified-badge">Verified ID</span>}
                                        </h3>
                                        <p>Business tools, product catalogs, and advertising active.</p>
                                    </div>
                                    <div className="banner-actions">
                                        <Link className="secondary-btn compact-btn" style={{ textDecoration: 'none' }} to="/profile/business-setup">Edit Store Info</Link>
                                        <Link className="primary-btn compact-btn" style={{ textDecoration: 'none' }} to="/profile/store-dashboard">Manage Store</Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="banner-content">
                                    <div className="banner-text">
                                        <h3>Boost sales with an online store!</h3>
                                        <p>Unlock premium features: catalog managers, advertising, and a custom public store view.</p>
                                    </div>
                                    <Link className="primary-btn" style={{ textDecoration: 'none' }} to="/profile/business-setup">Open Store</Link>
                                </div>
                            )}
                        </section>

                        {/* OVERVIEW SECTION */}
                        <section className="dashboard-section">
                            <h3>Overview</h3>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <span className="stat-label">Your Listings</span>
                                    <span className="stat-value">{myListings.length}</span>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-label">Saved Items</span>
                                    <span className="stat-value">{savedListings.length}</span>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-label">Unread Alerts</span>
                                    <span className="stat-value">{notifications.filter(n => n.unread).length}</span>
                                </div>
                            </div>
                        </section>

                        {/* YOUR LISTINGS SECTION */}
                        <section className="dashboard-section">
                            <div className="section-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                                <h3 style={{ margin: 0 }}>Your listings</h3>
                                <div className="listing-filters" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        className={`filter-pill ${sellerTab === 'active' ? 'active' : ''}`}
                                        onClick={() => setSellerTab('active')}
                                    >
                                        Active & pending ({myListings.filter(l => l.status !== 'Sold' && l.status !== 'Draft' && l.status !== 'Drafts').length})
                                    </button>
                                    <button
                                        type="button"
                                        className={`filter-pill ${sellerTab === 'sold' ? 'active' : ''}`}
                                        onClick={() => setSellerTab('sold')}
                                    >
                                        Sold out ({myListings.filter(l => l.status === 'Sold').length})
                                    </button>
                                    <button
                                        type="button"
                                        className={`filter-pill ${sellerTab === 'drafts' ? 'active' : ''}`}
                                        onClick={() => setSellerTab('drafts')}
                                    >
                                        Drafts ({myListings.filter(l => l.status === 'Draft' || l.status === 'Drafts').length})
                                    </button>
                                </div>
                            </div>

                            <div className="dashboard-listing-grid" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {myListings.filter((l) => {
                                    if (sellerTab === 'sold') return l.status === 'Sold'
                                    if (sellerTab === 'drafts') return l.status === 'Draft' || l.status === 'Drafts'
                                    return l.status !== 'Sold' && l.status !== 'Draft' && l.status !== 'Drafts'
                                }).length === 0 ? (
                                    <p className="empty-state" style={{ color: 'var(--text-secondary)', padding: '16px', textAlign: 'center', background: 'var(--panel)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                        No {sellerTab} listings found.
                                    </p>
                                ) : (
                                    myListings
                                        .filter((l) => {
                                            if (sellerTab === 'sold') return l.status === 'Sold'
                                            if (sellerTab === 'drafts') return l.status === 'Draft' || l.status === 'Drafts'
                                            return l.status !== 'Sold' && l.status !== 'Draft' && l.status !== 'Drafts'
                                        })
                                        .map((listing) => (
                                            <div key={listing.id} className="dashboard-listing-row" style={{ display: 'flex', flexDirection: 'column', padding: '14px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', gap: '12px' }}>
                                                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', cursor: 'pointer' }} onClick={() => onOpenListing(listing)}>
                                                    {listing.images && listing.images.length > 0 ? (
                                                        <img src={listing.images[0]} alt={listing.title} style={{ width: '72px', height: '72px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                                                    ) : (
                                                        <div style={{ width: '72px', height: '72px', borderRadius: '8px', background: 'var(--border)', display: 'grid', placeItems: 'center', flexShrink: 0, color: 'var(--text-muted)' }}>
                                                            <span className="material-icons">photo_camera</span>
                                                        </div>
                                                    )}

                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <h3 style={{ margin: '0 0 4px 0', fontSize: '0.98rem', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {listing.title}
                                                        </h3>
                                                        <p className="seller-row-desc" style={{ margin: '0 0 6px 0', fontSize: '0.82rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                            {listing.description}
                                                        </p>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', fontSize: '0.86rem', marginTop: '6px', flexWrap: 'wrap' }}>
                                                            <strong style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>ZMW {listing.price}</strong>
                                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                                {(() => {
                                                                    const now = Date.now()
                                                                    const remainingMs = getListingTimeRemainingMs(listing, globalRenewalFrequency, now)
                                                                    const expired = isListingExpired(listing, globalRenewalFrequency, globalRenewalDay, now)

                                                                    if (expired || remainingMs <= 0) {
                                                                        return (
                                                                            <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                                                <span className="material-icons" style={{ fontSize: '13px' }}>error_outline</span>
                                                                                Expired — Paused on Homepage
                                                                            </span>
                                                                        )
                                                                    }

                                                                    const hoursRemaining = Math.floor(remainingMs / (1000 * 60 * 60))
                                                                    const daysRemaining = Math.floor(hoursRemaining / 24)
                                                                    const remainingHoursMod = hoursRemaining % 24
                                                                    const timeStr = daysRemaining > 0 ? `${daysRemaining}d ${remainingHoursMod}h left` : `${hoursRemaining}h left`
                                                                    const isWarning = hoursRemaining < 48

                                                                    return (
                                                                        <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '12px', background: isWarning ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.12)', color: isWarning ? '#f59e0b' : '#10b981', border: isWarning ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                                            <span className="material-icons" style={{ fontSize: '13px' }}>schedule</span>
                                                                            {isWarning ? `Expires Soon: ${timeStr}` : `Expires in ${timeStr}`}
                                                                        </span>
                                                                    )
                                                                })()}
                                                                <span style={{ fontSize: '0.78rem', background: 'var(--panel)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                                                                    {listing.category}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="listing-row-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                                                    <button className="secondary-btn compact-btn" onClick={() => onEditListing(listing)}>Edit</button>
                                                    <button className="secondary-btn compact-btn" onClick={() => onUpdateStatus(listing.id, listing.status === 'Sold' ? 'Available' : 'Sold')}>
                                                        {listing.status === 'Sold' ? 'Restock' : 'Mark Sold'}
                                                    </button>
                                                    <button className="primary-btn compact-btn" onClick={() => onRenewListing(listing.id)}>Renew Listing</button>
                                                    <button className="ghost-btn compact-btn delete-btn" onClick={() => onDeleteListing(listing.id)}>
                                                        <span className="material-icons">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                )}
                            </div>
                        </section>
                    </>
                )}
            </main>
        </div>
    )
}