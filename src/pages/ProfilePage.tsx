import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import type { Listing, Profile, BusinessProfile, PaymentMethodItem, NotificationConfig } from '../types'
import { ListingCard } from '../components/ListingCard'
import { SettingsPage } from './SettingsPage'
import { NotificationsPage } from './SavedNotificationsPage'
import { ListingFormPage } from './ListingPage'
import { StoreSetupPage } from './StoreSetupPage'
import type { NotificationItem } from '../features/marketplace/useMarketplaceApp'
import { uploadImageToSupabase } from '../features/marketplace/ImageUploader'

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

    // Settings panel specific props
    activeSection: 'dashboard' | 'settings' | 'notifications' | 'create' | 'business-setup' | 'store-dashboard' | 'saved-listings'
    theme: 'light' | 'dark'
    locationString: string
    cardSize: number
    onCardSizeChange: (size: number) => void
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
        location: string
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
        onLocationChange: (v: string) => void
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

    currency?: 'ZMW' | 'USD' | 'EUR'
    setCurrency?: (c: 'ZMW' | 'USD' | 'EUR') => void
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
    listings,
    savedListings,
    savedIds,
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
    theme,
    locationString,
    cardSize,
    onCardSizeChange,
    onToggleTheme,
    onGoHome,
    notifications,
    onMarkAllRead,
    createListingProps,
    storeSetupProps,
    allBusinesses = {},
    followingIds = [],
    onToggleFollowStore = () => {},
    currency = 'ZMW',
    setCurrency = () => {},
    notificationsConfig = { email: true, push: true, sms: false, orders: true, promos: false },
    setNotificationsConfig = () => {},
    blockedUserIds = [],
    toggleBlockUser = () => {},
    paymentMethods = [],
    addPaymentMethod = () => {},
    removePaymentMethod = () => {},
    browsingHistory = [],
    clearBrowsingHistory = () => {},
    searchHistory = [],
    clearSearchHistory = () => {},
}: ProfilePageProps) {
    const displayName = profile?.username || 'Your profile'
    const navigate = useNavigate()

    const [storeTab, setStoreTab] = useState<'analytics' | 'catalog' | 'ads' | 'social'>('analytics')

    // Catalog Item creation states
    const [catName, setCatName] = useState('')
    const [catPrice, setCatPrice] = useState('')
    const [catDesc, setCatDesc] = useState('')
    const [catImage, setCatImage] = useState('')

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
        if (!businessProfile || !catName || !catPrice) return
        const newItem = {
            id: String(Date.now()),
            name: catName,
            price: catPrice,
            description: catDesc,
            image: catImage
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

    return (
        <div className="dashboard-layout">
            {/* --- LEFT SIDEBAR (NAVIGATION) --- */}
            <aside className="dashboard-sidebar section-card">

                <nav className="sidebar-nav">
                    <NavLink className={({ isActive }) => `nav-btn primary-action ${isActive ? 'active' : ''}`} to="/profile/create" style={{ textDecoration: 'none' }}>
                        <span className="material-icons">add_circle</span> Create new listing
                    </NavLink>
                    <NavLink className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`} to="/profile" end style={{ textDecoration: 'none' }}>
                        <span className="material-icons">dashboard</span> Seller dashboard
                    </NavLink>
                    <NavLink className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`} to="/profile/store-dashboard" style={{ textDecoration: 'none' }}>
                        <span className="material-icons">storefront</span> Store dashboard
                    </NavLink>
                    <NavLink className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`} to="/profile/saved-listings" style={{ textDecoration: 'none' }}>
                        <span className="material-icons">bookmark</span> Saved listings
                    </NavLink>
                    <NavLink className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`} to="/profile/notifications" style={{ textDecoration: 'none' }}>
                        <span className="material-icons">notifications</span> Notifications
                    </NavLink>
                    <NavLink className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`} to="/profile/settings" style={{ textDecoration: 'none' }}>
                        <span className="material-icons">settings</span> Settings
                    </NavLink>
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
                {activeSection === 'settings' ? (
                    <SettingsPage
                        theme={theme}
                        location={locationString}
                        cardSize={cardSize}
                        onCardSizeChange={onCardSizeChange}
                        onToggleTheme={onToggleTheme}
                        onGoHome={onGoHome}
                        currency={currency}
                        setCurrency={setCurrency}
                        notificationsConfig={notificationsConfig}
                        setNotificationsConfig={setNotificationsConfig}
                        blockedUserIds={blockedUserIds}
                        toggleBlockUser={toggleBlockUser}
                        paymentMethods={paymentMethods}
                        addPaymentMethod={addPaymentMethod}
                        removePaymentMethod={removePaymentMethod}
                        browsingHistory={browsingHistory}
                        clearBrowsingHistory={clearBrowsingHistory}
                        searchHistory={searchHistory}
                        clearSearchHistory={clearSearchHistory}
                        userEmail={userEmail}
                    />
                ) : activeSection === 'notifications' ? (
                    <NotificationsPage
                        notifications={notifications}
                        onMarkAllRead={onMarkAllRead}
                    />
                ) : activeSection === 'create' ? (
                    <ListingFormPage
                        mode="create"
                        title={createListingProps.title}
                        description={createListingProps.description}
                        price={createListingProps.price}
                        category={createListingProps.category}
                        location={createListingProps.location}
                        status={createListingProps.status}
                        listingType={createListingProps.listingType}
                        condition={createListingProps.condition}
                        deliveryOption={createListingProps.deliveryOption}
                        uploadedImages={createListingProps.uploadedImages}
                        onUploadedImagesChange={createListingProps.onUploadedImagesChange}
                        onSubmit={createListingProps.onSubmit}
                        onCancel={() => navigate('/profile')}
                        onTitleChange={createListingProps.onTitleChange}
                        onDescriptionChange={createListingProps.onDescriptionChange}
                        onPriceChange={createListingProps.onPriceChange}
                        onCategoryChange={createListingProps.onCategoryChange}
                        onLocationChange={createListingProps.onLocationChange}
                        onStatusChange={createListingProps.onStatusChange}
                        onListingTypeChange={createListingProps.onListingTypeChange}
                        onConditionChange={createListingProps.onConditionChange}
                        onDeliveryOptionChange={createListingProps.onDeliveryOptionChange}
                        availableColors={createListingProps.availableColors}
                        onAvailableColorsChange={createListingProps.onAvailableColorsChange}
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
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Store Tools & Insights</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tab controls */}
                            <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', WebkitOverflowScrolling: 'touch' }}>
                                <button className={`dashboard-tab-btn ${storeTab === 'analytics' ? 'active' : ''}`} onClick={() => setStoreTab('analytics')}>Performance Dashboard</button>
                                <button className={`dashboard-tab-btn ${storeTab === 'catalog' ? 'active' : ''}`} onClick={() => setStoreTab('catalog')}>Catalogs Manager</button>
                                <button className={`dashboard-tab-btn ${storeTab === 'ads' ? 'active' : ''}`} onClick={() => setStoreTab('ads')}>Advertising Manager</button>
                                <button className={`dashboard-tab-btn ${storeTab === 'social' ? 'active' : ''}`} onClick={() => setStoreTab('social')}>Followers & Following</button>
                            </div>

                            {/* ANALYTICS TAB */}
                            {storeTab === 'analytics' && (
                                <div className="business-hub-grid" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div className="notification-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', background: 'var(--panel)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Catalog Products</span>
                                            <h3 style={{ margin: '4px 0 0', fontSize: '1.5rem' }}>{(businessProfile.catalog || []).length}</h3>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active Ads</span>
                                            <h3 style={{ margin: '4px 0 0', fontSize: '1.5rem' }}>{(businessProfile.ads || []).filter(a => a.status === 'Active').length}</h3>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Store Clicks (7d)</span>
                                            <h3 style={{ margin: '4px 0 0', fontSize: '1.5rem', color: 'var(--primary)' }}>
                                                {(businessProfile.catalog || []).length * 4 + (businessProfile.ads || []).filter(a => a.status === 'Active').length * 10}
                                            </h3>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Followers</span>
                                            <h3 style={{ margin: '4px 0 0', fontSize: '1.5rem', color: '#10b981' }}>
                                                {followingIds.filter(id => id === businessProfile.userId).length}
                                            </h3>
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
                            }

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
                                                        {catImage ? (
                                                            <img src={catImage} alt="Product" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                                                        ) : (
                                                            <div className="upload-icon"><span className="material-icons">add_a_photo</span></div>
                                                        )}
                                                        <span>Select Product Image</span>
                                                    </label>
                                                </div>
                                            </label>

                                            <input value={catName} onChange={e => setCatName(e.target.value)} placeholder="Product Name (e.g. Vanilla Wedding Cake)" required style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
                                            <input value={catPrice} onChange={e => setCatPrice(e.target.value)} placeholder="Price (e.g. ZMW 450)" required style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
                                            <textarea value={catDesc} onChange={e => setCatDesc(e.target.value)} placeholder="Description (e.g. Double layered sponge with buttercream)" rows={2} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit' }} />

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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3>Saved listings ({savedListings.length})</h3>
                        {savedListings.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No saved listings. Tap the Wishlist button on any listing to save it.</p>
                        ) : (
                            <div className="dashboard-listing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                                {savedListings.map((listing) => (
                                    <div key={listing.id} className="listing-card-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <ListingCard
                                            listing={listing}
                                            saved={true}
                                            onOpen={onOpenListing}
                                            onToggleSave={onToggleSave}
                                        />
                                        <button className="secondary-btn compact-btn delete-btn" onClick={() => onToggleSave(Number(listing.id))} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', width: '100%' }}>
                                            <span className="material-icons" style={{ fontSize: '16px' }}>bookmark_remove</span>
                                            Unsave / Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
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
                                    <span className="stat-label">Total Listings</span>
                                    <span className="stat-value">{myListings.length}</span>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-label">Saved Items</span>
                                    <span className="stat-value">{savedListings.length}</span>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-label">Marketplace Total</span>
                                    <span className="stat-value">{listings.length}</span>
                                </div>
                            </div>
                        </section>

                        {/* YOUR LISTINGS SECTION */}
                        <section className="dashboard-section">
                            <div className="section-header-flex">
                                <h3>Your listings</h3>
                                <div className="listing-filters">
                                    <button className="filter-pill active">Active & pending</button>
                                    <button className="filter-pill">Sold out</button>
                                    <button className="filter-pill">Drafts</button>
                                </div>
                            </div>

                            <div className="dashboard-listing-grid">
                                {myListings.length === 0 ? (
                                    <p className="empty-state">No listings yet. Create your first one.</p>
                                ) : (
                                    myListings.map((listing) => (
                                        <div key={listing.id} className="dashboard-listing-row">
                                            <div className="listing-row-item">
                                                <ListingCard
                                                    listing={listing}
                                                    saved={savedIds.includes(String(listing.id))}
                                                    onOpen={onOpenListing}
                                                    onToggleSave={onToggleSave}
                                                    compact
                                                />
                                            </div>
                                            <div className="listing-row-actions">
                                                <button className="secondary-btn compact-btn" onClick={() => onEditListing(listing)}>Edit</button>
                                                <button className="secondary-btn compact-btn" onClick={() => onUpdateStatus(listing.id, listing.status === 'Sold' ? 'Available' : 'Sold')}>
                                                    {listing.status === 'Sold' ? 'Restock' : 'Mark Sold'}
                                                </button>
                                                <button className="secondary-btn compact-btn" onClick={() => onRenewListing(listing.id)}>Renew</button>
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