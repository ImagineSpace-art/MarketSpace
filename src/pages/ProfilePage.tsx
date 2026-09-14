import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import type { Listing, Profile, BusinessProfile, PaymentMethodItem, NotificationConfig } from '../types'
import { SavedItemsPage, NotificationsPage } from './SavedNotificationsPage'
import { ListingFormPage } from './ListingPage'
import { StoreSetupPage } from './StoreSetupPage'
import { AdCreationPage } from './AdCreationPage'
import { StoreInsightsView } from '../components/StoreInsightsView'
import type { NotificationItem } from '../features/marketplace/useMarketplaceApp'
import { uploadImageToSupabase } from '../features/marketplace/ImageUploader'
import { fetchStoreAnalytics, type StoreAnalyticsData } from '../services/analytics'

// ---------------- PROFILE PAGE ----------------
type ProfilePageProps = {
    profile: Profile | null
    userEmail: string
    myListings: Listing[]
    listings: Listing[]
    savedListings: Listing[]
    savedIds: string[]
    businessProfile: BusinessProfile | null
    onEditListing: (listing: Listing) => void
    onRenewListing: (listingId: number) => void
    onDeleteListing: (listingId: number) => void
    onUpdateStatus: (listingId: number, status: string) => void
    onUploadAvatar: (base64: string) => void
    onOpenListing: (listing: Listing) => void
    onToggleSave: (listingId: number) => void
    onLogout: () => void
    onOpenDashboardPanel?: () => void
    onUpdateListingCollection?: (listingId: number, targetColId: string | null) => void | Promise<void>

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
    userEmail,
    myListings,
    savedListings,
    businessProfile,
    onEditListing,
    onRenewListing,
    onDeleteListing,
    onUpdateStatus,
    onUploadAvatar,
    onOpenListing,
    onToggleSave,
    onLogout,
    onOpenDashboardPanel,
    activeSection,
    notifications,
    onMarkAllRead,
    createListingProps,
    storeSetupProps,
    allBusinesses = {},
    followingIds = [],
    onToggleFollowStore = () => { },
    onUpdateListingCollection,
}: ProfilePageProps) {
    const displayName = profile?.username || (userEmail && userEmail !== 'Guest' ? userEmail.split('@')[0] : 'User Profile')
    const navigate = useNavigate()

    const [storeTab, setStoreTab] = useState<'analytics' | 'departments' | 'catalog' | 'ads' | 'social'>('analytics')
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

    // Departments Manager states
    const [newDeptName, setNewDeptName] = useState('')
    const [newDeptDesc, setNewDeptDesc] = useState('')
    const [editingDeptId, setEditingDeptId] = useState<string | null>(null)
    const [editingDeptName, setEditingDeptName] = useState('')
    const [deptListingsFilter, setDeptListingsFilter] = useState<string>('all')

    // Catalog Item creation states
    const [catalogName, setCatName] = useState('')
    const [catalogPrice, setCatPrice] = useState('')
    const [catalogDescription, setCatDesc] = useState('')
    const [catalogImage, setCatImage] = useState('')

    // Ads creation states
    const [adListingId, setAdListingId] = useState<number>(myListings[0]?.id || 0)
    const [adTitle, setAdTitle] = useState('')
    const [adBudget, setAdBudget] = useState('150')
    const [adDuration, setAdDuration] = useState('5 Days')

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

    const handleLaunchAd = (e: FormEvent) => {
        e.preventDefault()
        if (!businessProfile || !adListingId) return
        const matchedListing = myListings.find(l => l.id === Number(adListingId))
        const titleText = adTitle || `Boost: ${matchedListing?.title || 'Listing'}`
        const newAd = {
            id: String(Date.now()),
            listingId: Number(adListingId),
            adTitle: titleText,
            budget: `ZMW ${adBudget}`,
            duration: adDuration,
            status: 'Active' as const
        }
        void storeSetupProps.onSave({
            ...businessProfile,
            ads: [...(businessProfile.ads || []), newAd]
        })
        setAdTitle('')
        setAdBudget('150')
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

    const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const url = await uploadImageToSupabase(e.target.files[0], 'marketspace-media', 'avatars')
                onUploadAvatar(url)
            } catch (err) {
                console.error('Error uploading avatar:', err)
            }
        }
    }

    const [isMobileNavExpanded, setIsMobileNavExpanded] = useState(false)

    const navItems = [
        { path: '/profile/create', label: 'Create new listing', icon: 'add_circle', isPrimary: true },
        { path: '/profile/create-ad', label: 'Create ad', icon: 'campaign', isPrimary: false },
        { path: '/profile', label: 'Seller dashboard', icon: 'dashboard', exact: true },
        { path: '/profile/store-dashboard', label: 'Store dashboard', icon: 'storefront' },
        { path: '/profile/store-insights', label: 'Store insights', icon: 'insights' },
        { path: '/profile/saved-listings', label: 'Saved listings', icon: 'bookmark' },
        { path: '/profile/notifications', label: 'Notifications', icon: 'notifications' },
    ]

    return (
        <div className="dashboard-layout">
            {/* --- MOBILE PROFILE NAVIGATION DROPDOWN (<1024px) --- */}
            <div className="mobile-profile-nav-toggle-bar">
                <button
                    className="mobile-profile-nav-btn"
                    onClick={() => setIsMobileNavExpanded(!isMobileNavExpanded)}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="material-icons" style={{ fontSize: '20px', color: '#1967d2' }}>
                            {activeSection === 'settings' ? 'settings' :
                                activeSection === 'create' ? 'add_circle' :
                                    activeSection === 'create-ad' ? 'campaign' :
                                        activeSection === 'store-dashboard' ? 'storefront' :
                                            activeSection === 'store-insights' ? 'insights' :
                                                activeSection === 'saved-listings' ? 'bookmark' :
                                                    activeSection === 'notifications' ? 'notifications' : 'dashboard'}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                            {activeSection === 'settings' ? 'Settings Menu' :
                                activeSection === 'create' ? 'Create New Listing' :
                                    activeSection === 'create-ad' ? 'Create Ad' :
                                        activeSection === 'store-dashboard' ? 'Store Dashboard' :
                                            activeSection === 'store-insights' ? 'Store Insights' :
                                                activeSection === 'saved-listings' ? 'Saved Listings' :
                                                    activeSection === 'notifications' ? 'Notifications' : 'Seller Dashboard'}
                        </span>
                    </div>
                    <span className="material-icons" style={{ fontSize: '22px' }}>
                        {isMobileNavExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                </button>

                {isMobileNavExpanded && (
                    <div className="mobile-profile-dropdown-menu">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                className={({ isActive }) => `nav-btn ${item.isPrimary ? 'primary-action' : ''} ${isActive ? 'active' : ''}`}
                                to={item.path}
                                end={item.exact}
                                onClick={() => setIsMobileNavExpanded(false)}
                                style={{ textDecoration: 'none' }}
                            >
                                <span className="material-icons">{item.icon}</span> {item.label}
                            </NavLink>
                        ))}
                        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className="mini-avatar-placeholder" style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>{displayName.slice(0, 1).toUpperCase()}</div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{displayName}</span>
                            </div>
                            <button className="ghost-btn" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={onLogout}>Log out</button>
                        </div>
                    </div>
                )}
            </div>

            {/* --- LEFT SIDEBAR (DESKTOP NAVIGATION) --- */}
            <aside className="dashboard-sidebar section-card desktop-profile-sidebar">

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            className={({ isActive }) => `nav-btn ${item.isPrimary ? 'primary-action' : ''} ${isActive ? 'active' : ''}`}
                            to={item.path}
                            end={item.exact}
                            style={{ textDecoration: 'none' }}
                        >
                            <span className="material-icons">{item.icon}</span> {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="profile-mini">
                        <label className="avatar-upload-label">
                            <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt={displayName} className="mini-avatar-img" />
                            ) : (
                                <div className="mini-avatar-placeholder">{displayName.slice(0, 1).toUpperCase()}</div>
                            )}
                            <div className="avatar-badge">
                                <span className="material-icons">photo_camera</span>
                            </div>
                        </label>
                        <div
                            className="profile-mini-info"
                            onClick={onOpenDashboardPanel}
                            style={{ cursor: 'pointer' }}
                            title="Open Professional Dashboard"
                        >
                            <strong>{displayName}</strong>
                            <span>{userEmail}</span>
                        </div>
                    </div>
                    <button className="ghost-btn logout-btn" onClick={onLogout}>Log out</button>
                </div>
            </aside>

            {/* --- MAIN CONTENT AREA --- */}
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
                                void storeSetupProps.onSave({
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
                                <button
                                    type="button"
                                    className="primary-btn compact-btn"
                                    onClick={() => navigate(`/store/${businessProfile.userId}`)}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
                                >
                                    <span className="material-icons" style={{ fontSize: '18px' }}>storefront</span>
                                    Preview Storefront
                                </button>
                            </div>

                            {/* Tab controls */}
                            <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', WebkitOverflowScrolling: 'touch' }}>
                                <button className={`dashboard-tab-btn ${storeTab === 'analytics' ? 'active' : ''}`} onClick={() => setStoreTab('analytics')}>Performance Dashboard</button>
                                <button className={`dashboard-tab-btn ${storeTab === 'departments' ? 'active' : ''}`} onClick={() => setStoreTab('departments')}>Departments Manager</button>
                                <button className={`dashboard-tab-btn ${storeTab === 'catalog' ? 'active' : ''}`} onClick={() => setStoreTab('catalog')}>Catalogs Manager</button>
                                <button className={`dashboard-tab-btn ${storeTab === 'ads' ? 'active' : ''}`} onClick={() => setStoreTab('ads')}>Advertising Manager</button>
                                <button className={`dashboard-tab-btn ${storeTab === 'social' ? 'active' : ''}`} onClick={() => setStoreTab('social')}>Followers & Following</button>
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

                            {/* DEPARTMENTS MANAGER TAB */}
                            {storeTab === 'departments' && (() => {
                                const currentCols = businessProfile.collections || []
                                const storeCatalogListings = myListings

                                const handleCreateDept = () => {
                                    if (!newDeptName.trim()) return
                                    const created = {
                                        id: String(Date.now()),
                                        name: newDeptName.trim(),
                                        description: newDeptDesc.trim() || undefined
                                    }
                                    void storeSetupProps.onSave({
                                        ...businessProfile,
                                        collections: [...currentCols, created]
                                    })
                                    setNewDeptName('')
                                    setNewDeptDesc('')
                                }

                                const handleRenameDept = (id: string) => {
                                    if (!editingDeptName.trim()) return
                                    const updated = currentCols.map(c => c.id === id ? { ...c, name: editingDeptName.trim() } : c)
                                    void storeSetupProps.onSave({
                                        ...businessProfile,
                                        collections: updated
                                    })
                                    setEditingDeptId(null)
                                    setEditingDeptName('')
                                }

                                const handleDeleteDept = async (id: string) => {
                                    if (!confirm('Are you sure you want to delete this department? All items inside will become unassigned general store listings.')) return
                                    const affected = storeCatalogListings.filter(l => l.collection_id === id)
                                    for (const l of affected) {
                                        if (onUpdateListingCollection) {
                                            await onUpdateListingCollection(l.id, null)
                                        }
                                    }
                                    void storeSetupProps.onSave({
                                        ...businessProfile,
                                        collections: currentCols.filter(c => c.id !== id)
                                    })
                                }

                                const filteredListings = storeCatalogListings.filter(l => {
                                    if (deptListingsFilter === 'all') return true
                                    if (deptListingsFilter === 'unassigned') return !l.collection_id
                                    return l.collection_id === deptListingsFilter
                                })

                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {/* Add New Department Card */}
                                        <div style={{ background: 'var(--panel)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span className="material-icons" style={{ color: '#2563eb' }}>add_business</span>
                                                Create Store Department
                                            </h3>
                                            <p style={{ margin: '0 0 16px 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                                                Organize your store catalog into departments (e.g. "Footwear", "New Arrivals", "Electronics", "Beauty & Care").
                                            </p>
                                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                <input
                                                    type="text"
                                                    value={newDeptName}
                                                    onChange={e => setNewDeptName(e.target.value)}
                                                    placeholder="Department Name (e.g. Summer Essentials)"
                                                    style={{ flex: 1, minWidth: '220px', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.9rem' }}
                                                />
                                                <input
                                                    type="text"
                                                    value={newDeptDesc}
                                                    onChange={e => setNewDeptDesc(e.target.value)}
                                                    placeholder="Optional description"
                                                    style={{ flex: 1, minWidth: '220px', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.9rem' }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleCreateDept}
                                                    disabled={!newDeptName.trim()}
                                                    className="primary-btn"
                                                    style={{ padding: '10px 20px', borderRadius: '8px', whiteSpace: 'nowrap' }}
                                                >
                                                    Add Department
                                                </button>
                                            </div>
                                        </div>

                                        {/* Existing Departments List */}
                                        <div style={{ background: 'var(--panel)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                            <h3 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', fontWeight: 700 }}>
                                                Store Departments ({currentCols.length})
                                            </h3>
                                            {currentCols.length === 0 ? (
                                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>No departments created yet. Create one above to start organizing your store catalog.</p>
                                            ) : (
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                                                    {currentCols.map(col => {
                                                        const count = storeCatalogListings.filter(l => l.collection_id === col.id).length
                                                        const isEditing = editingDeptId === col.id
                                                        return (
                                                            <div
                                                                key={col.id}
                                                                style={{
                                                                    background: 'var(--surface)',
                                                                    padding: '14px 16px',
                                                                    borderRadius: '12px',
                                                                    border: '1px solid var(--border)',
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    gap: '8px'
                                                                }}
                                                            >
                                                                {isEditing ? (
                                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                                        <input
                                                                            type="text"
                                                                            value={editingDeptName}
                                                                            onChange={e => setEditingDeptName(e.target.value)}
                                                                            style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--text)' }}
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRenameDept(col.id)}
                                                                            className="primary-btn"
                                                                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                                                        >
                                                                            Save
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setEditingDeptId(null)}
                                                                            className="outline-btn"
                                                                            style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <strong style={{ fontSize: '0.98rem' }}>{col.name}</strong>
                                                                        <span style={{ fontSize: '0.78rem', background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', padding: '3px 8px', borderRadius: '12px', fontWeight: 700 }}>
                                                                            {count} {count === 1 ? 'item' : 'items'}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {col.description && (
                                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{col.description}</span>
                                                                )}
                                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                                                                    {!isEditing && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => { setEditingDeptId(col.id); setEditingDeptName(col.name) }}
                                                                            style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                                                                        >
                                                                            <span className="material-icons" style={{ fontSize: '14px' }}>edit</span> Rename
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteDept(col.id)}
                                                                        style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                                                                    >
                                                                        <span className="material-icons" style={{ fontSize: '14px' }}>delete_outline</span> Remove
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Organize / Move Listings in Departments */}
                                        <div style={{ background: 'var(--panel)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                                                <div>
                                                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Manage & Move Store Listings</h3>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                        Move listings between departments, assign unassigned products, or remove items from a department.
                                                    </span>
                                                </div>

                                                {/* Filter pills */}
                                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeptListingsFilter('all')}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '8px',
                                                            border: 'none',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            background: deptListingsFilter === 'all' ? '#2563eb' : 'var(--surface)',
                                                            color: deptListingsFilter === 'all' ? '#ffffff' : 'var(--text)'
                                                        }}
                                                    >
                                                        All ({storeCatalogListings.length})
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeptListingsFilter('unassigned')}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '8px',
                                                            border: 'none',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            background: deptListingsFilter === 'unassigned' ? '#2563eb' : 'var(--surface)',
                                                            color: deptListingsFilter === 'unassigned' ? '#ffffff' : 'var(--text)'
                                                        }}
                                                    >
                                                        Unassigned ({storeCatalogListings.filter(l => !l.collection_id).length})
                                                    </button>
                                                    {currentCols.map(col => {
                                                        const count = storeCatalogListings.filter(l => l.collection_id === col.id).length
                                                        return (
                                                            <button
                                                                key={col.id}
                                                                type="button"
                                                                onClick={() => setDeptListingsFilter(col.id)}
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    borderRadius: '8px',
                                                                    border: 'none',
                                                                    fontSize: '0.8rem',
                                                                    fontWeight: 600,
                                                                    cursor: 'pointer',
                                                                    background: deptListingsFilter === col.id ? '#2563eb' : 'var(--surface)',
                                                                    color: deptListingsFilter === col.id ? '#ffffff' : 'var(--text)'
                                                                }}
                                                            >
                                                                {col.name} ({count})
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            {/* Listings Grid */}
                                            {filteredListings.length === 0 ? (
                                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', padding: '16px 0' }}>
                                                    No listings match this department filter.
                                                </p>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {filteredListings.map(item => {
                                                        const currentDept = currentCols.find(c => c.id === item.collection_id)
                                                        return (
                                                            <div
                                                                key={item.id}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'space-between',
                                                                    gap: '12px',
                                                                    background: 'var(--surface)',
                                                                    padding: '12px 16px',
                                                                    borderRadius: '10px',
                                                                    border: '1px solid var(--border)',
                                                                    flexWrap: 'wrap'
                                                                }}
                                                            >
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
                                                                    <div style={{ width: '44px', height: '44px', borderRadius: '8px', overflow: 'hidden', background: 'var(--border)', flexShrink: 0 }}>
                                                                        {item.images && item.images[0] ? (
                                                                            <img src={item.images[0]} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                        ) : (
                                                                            <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)' }}>
                                                                                <span className="material-icons" style={{ fontSize: '20px' }}>inventory_2</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <strong style={{ display: 'block', fontSize: '0.92rem' }}>{item.title}</strong>
                                                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                                            ZMW {item.price} • {item.category}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Move to Department Action */}
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Department:</span>
                                                                        <select
                                                                            value={item.collection_id || ''}
                                                                            onChange={(e) => {
                                                                                const targetVal = e.target.value || null
                                                                                if (onUpdateListingCollection) {
                                                                                    void onUpdateListingCollection(item.id, targetVal)
                                                                                }
                                                                            }}
                                                                            style={{
                                                                                padding: '6px 10px',
                                                                                borderRadius: '6px',
                                                                                border: '1px solid var(--border)',
                                                                                background: 'var(--panel)',
                                                                                color: 'var(--text)',
                                                                                fontSize: '0.84rem',
                                                                                fontWeight: 600
                                                                            }}
                                                                        >
                                                                            <option value="">Unassigned (General Store)</option>
                                                                            {currentCols.map(c => (
                                                                                <option key={c.id} value={c.id}>{c.name}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>

                                                                    {item.collection_id && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                if (onUpdateListingCollection) {
                                                                                    void onUpdateListingCollection(item.id, null)
                                                                                }
                                                                            }}
                                                                            style={{
                                                                                background: 'none',
                                                                                border: 'none',
                                                                                color: 'var(--text-secondary)',
                                                                                fontSize: '0.78rem',
                                                                                cursor: 'pointer',
                                                                                textDecoration: 'underline'
                                                                            }}
                                                                        >
                                                                            Remove from {currentDept?.name || 'Department'}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
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
                                    <div className="sidebar-card" style={{ background: 'var(--panel)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span className="material-icons">campaign</span> Launch Boost Ad campaign
                                        </h3>
                                        <form onSubmit={handleLaunchAd} className="form-stack" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Select Listing to Boost</span>
                                                <select
                                                    value={adListingId}
                                                    onChange={e => setAdListingId(Number(e.target.value))}
                                                    required
                                                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                                                >
                                                    <option value="">-- Choose Listing --</option>
                                                    {myListings.map(l => (
                                                        <option key={l.id} value={l.id}>{l.title} (ZMW {l.price})</option>
                                                    ))}
                                                </select>
                                            </label>

                                            <input value={adTitle} onChange={e => setAdTitle(e.target.value)} placeholder="Custom Ad Slogan (e.g. Lusaka's Finest Tutors - 10% Off!)" style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
                                            <input value={adBudget} onChange={e => setAdBudget(e.target.value)} placeholder="Budget in ZMW (e.g. 150)" required style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />

                                            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Campaign Duration</span>
                                                <select
                                                    value={adDuration}
                                                    onChange={e => setAdDuration(e.target.value)}
                                                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                                                >
                                                    <option value="3 Days">3 Days</option>
                                                    <option value="5 Days">5 Days</option>
                                                    <option value="7 Days">7 Days</option>
                                                    <option value="14 Days">14 Days</option>
                                                </select>
                                            </label>

                                            <button className="primary-btn" type="submit" style={{ padding: '10px', borderRadius: '8px' }}>Launch Campaign</button>
                                        </form>
                                    </div>

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
                    <StoreSetupPage
                        userId={storeSetupProps.userId}
                        businessProfile={businessProfile}
                        onSave={storeSetupProps.onSave}
                        onCancel={() => navigate('/profile')}
                    />
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
                                            <span className="badge verified-badge">Verified Store</span>
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
                                                                    const DAY_MS = 24 * 60 * 60 * 1000
                                                                    const freq = listing.renewal_frequency ?? 'weekly'
                                                                    const interval = freq === 'daily' ? DAY_MS : freq === 'biweekly' ? 14 * DAY_MS : freq === 'monthly' ? 30 * DAY_MS : 7 * DAY_MS
                                                                    const lastRenewed = new Date(listing.last_renewed_at || listing.created_at || now).getTime()
                                                                    const remainingMs = interval - (now - lastRenewed)

                                                                    if (remainingMs <= 0) {
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