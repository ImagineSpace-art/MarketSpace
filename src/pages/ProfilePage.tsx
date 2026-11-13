import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Listing, Profile, BusinessProfile, BusinessAd, PaymentMethodItem, NotificationConfig } from '../types'
import { SavedItemsPage, NotificationsPage } from './SavedNotificationsPage'
import { ListingFormPage } from './ListingPage'
import { StoreSetupPage } from './StoreSetupPage'
import { StoreRegistrationWizard } from './StoreRegistrationWizard'
import { AdCreationPage } from './AdCreationPage'
import { StoreInsightsView } from '../components/StoreInsightsView'
import { StoreTemplateEditor } from './StoreTemplateEditor'
import type { NotificationItem } from '../features/marketplace/useMarketplaceApp'
import { fetchStoreAnalytics, type StoreAnalyticsData } from '../services/analytics'
import { getListingTimeRemainingMs, isListingExpired } from '../features/marketplace/listingExpiry'
import { DestructiveActionDialog } from '../components/DestructiveActionDialog'
import { SellerVerificationSubmission } from '../components/SellerVerificationSubmission'
import { getStoreUrl } from '../utils/storeUrl'
import { BoostControl } from '../components/BoostControl'
import { supabase } from '../lib/supabaseClient'

type StoreFollower = {
    user_id: string
    created_at: string | null
    username?: string | null
    avatar_url?: string | null
}

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
    onDeleteListing: (listingId: number) => Promise<void>
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
    onMarkNotificationRead: (notificationId: string | number, unread: boolean) => void
    onToggleNotificationPin: (notificationId: string | number) => void
    onDeleteNotification: (notificationId: string | number) => void
    onSaveAd: (ad: BusinessAd) => Promise<void>
    onUpdateAdStatus: (adId: string, status: BusinessAd['status']) => Promise<void>
    onDeleteAd: (adId: string) => Promise<void>

    // ListingFormPage props
    createListingProps: {
        title: string
        description: string
        price: string
        category: string
        status: string
        listingType: string
        servicePriceUnit: 'fixed' | 'from' | 'per_hour' | 'per_day'
        onServicePriceUnitChange: (value: 'fixed' | 'from' | 'per_hour' | 'per_day') => void
        serviceAreaId: string
        onServiceAreaIdChange: (value: string) => void
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
    onMarkNotificationRead,
    onToggleNotificationPin,
    onDeleteNotification,
    onSaveAd,
    onUpdateAdStatus,
    onDeleteAd,
    createListingProps,
    storeSetupProps,
    allBusinesses = {},
    followingIds = [],
    onToggleFollowStore = () => { },
    onSaveStoreTemplate,
}: ProfilePageProps) {
    const navigate = useNavigate()

    const [storeTab, setStoreTab] = useState<'analytics' | 'ads' | 'social' | 'customizer'>('analytics')

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        if (params.get('tab') === 'customizer') {
            setStoreTab('customizer')
        }
    }, [])

    const [sellerTab, setSellerTab] = useState<'active' | 'sold' | 'drafts'>('active')
    const [listingToDelete, setListingToDelete] = useState<Listing | null>(null)
    const [adToDelete, setAdToDelete] = useState<BusinessAd | null>(null)

    // Store Performance time filter & database data
    const [perfTimeFilter, setPerfTimeFilter] = useState<'7d' | '14d' | '30d'>('7d')
    const [perfAnalyticsData, setPerfAnalyticsData] = useState<StoreAnalyticsData | null>(null)

    const [socialFollowers, setSocialFollowers] = useState<StoreFollower[]>([])
    const [socialFollowingIds, setSocialFollowingIds] = useState<string[]>([])
    const [socialLoading, setSocialLoading] = useState(false)
    const [socialError, setSocialError] = useState('')

    useEffect(() => {
        if (storeTab !== 'social' || !businessProfile?.userId) return
        let isMounted = true
        const loadSocialData = async () => {
            setSocialLoading(true)
            setSocialError('')
            try {
                const [followersResult, followingResult] = await Promise.all([
                    supabase.from('store_followers').select('user_id,created_at').eq('store_id', businessProfile.userId),
                    profile?.user_id
                        ? supabase.from('store_followers').select('store_id').eq('user_id', profile.user_id)
                        : Promise.resolve({ data: null, error: new Error('Your account profile could not be loaded.') }),
                ])
                if (followersResult.error) throw followersResult.error
                if (followingResult.error) throw followingResult.error

                const rows = (followersResult.data || []).filter(row => row.user_id)
                const followerIds = rows.map(row => row.user_id as string)
                const profilesResult = followerIds.length
                    ? await supabase.from('public_profiles').select('user_id,username,avatar_url').in('user_id', followerIds)
                    : { data: [], error: null }
                if (profilesResult.error) throw profilesResult.error

                const profilesById = new Map((profilesResult.data || []).map(user => [user.user_id, user]))
                if (!isMounted) return
                setSocialFollowers(rows.map(row => ({
                    user_id: row.user_id as string,
                    created_at: row.created_at,
                    ...profilesById.get(row.user_id as string),
                })))
                setSocialFollowingIds((followingResult.data || []).map(row => row.store_id))
            } catch (error) {
                if (isMounted) setSocialError(error instanceof Error ? error.message : 'Followers and followed stores could not be loaded.')
            } finally {
                if (isMounted) setSocialLoading(false)
            }
        }
        void loadSocialData()
        return () => { isMounted = false }
    }, [businessProfile?.userId, profile?.user_id, storeTab])

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

    const handleToggleAdStatus = (adId: string) => {
        if (!businessProfile) return
        const ad = businessProfile.ads.find(item => item.id === adId)
        if (!ad) return
        void onUpdateAdStatus(adId, ad.status === 'Active' ? 'Paused' : 'Active')
            .catch(error => window.alert(error instanceof Error ? error.message : 'The ad status could not be updated.'))
    }

    const handleDeleteAd = (adId: string) => {
        const ad = businessProfile?.ads.find((item) => item.id === adId)
        if (ad) setAdToDelete(ad)
    }

    return (
        <div className="dashboard-layout">
            <main className="dashboard-main">
                {activeSection === 'notifications' ? (
                    <NotificationsPage
                        notifications={notifications}
                        onMarkAllRead={onMarkAllRead}
                        onMarkRead={onMarkNotificationRead}
                        onTogglePin={onToggleNotificationPin}
                        onDelete={onDeleteNotification}
                    />
                ) : activeSection === 'create' ? (
                    <>
                        {!businessProfile && <SellerVerificationSubmission />}
                        <ListingFormPage
                            mode="create"
                            {...createListingProps}
                            onCancel={() => navigate('/profile')}
                        />
                    </>
                ) : activeSection === 'create-ad' ? (
                    <AdCreationPage
                        businessProfile={businessProfile}
                        myListings={myListings}
                        profile={profile}
                        onSaveAd={onSaveAd}
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
                                        onClick={() => window.open(getStoreUrl(businessProfile.userId, businessProfile.subdomain), '_blank', 'noopener,noreferrer')}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
                                    >
                                        <span className="material-icons" style={{ fontSize: '18px' }}>open_in_new</span>
                                        Preview Storefront
                                    </button>
                                    {businessProfile.storeId && (
                                        <BoostControl
                                            targetType="store"
                                            targetId={businessProfile.storeId}
                                            targetTitle={businessProfile.shopName}
                                            eligible={!businessProfile.archivedAt}
                                        />
                                    )}
                                </div>
                            </div>


                            {/* Tab controls */}
                            <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', WebkitOverflowScrolling: 'touch' }}>
                                <button className={`dashboard-tab-btn ${storeTab === 'analytics' ? 'active' : ''}`} onClick={() => setStoreTab('analytics')}>Performance Dashboard</button>
                                <button className={`dashboard-tab-btn ${storeTab === 'ads' ? 'active' : ''}`} onClick={() => setStoreTab('ads')}>Advertising Manager</button>
                                <button className={`dashboard-tab-btn ${storeTab === 'social' ? 'active' : ''}`} onClick={() => setStoreTab('social')}>Followers & Following</button>
                                <button className={`dashboard-tab-btn ${storeTab === 'customizer' ? 'active' : ''}`} onClick={() => setStoreTab('customizer')}>
                                    <span className="material-icons" style={{ fontSize: '16px', verticalAlign: 'middle', marginRight: '4px' }}>palette</span>
                                    Storefront Customizer
                                </button>
                            </div>

                            {/* ANALYTICS TAB */}
                            {storeTab === 'analytics' && (() => {
                                const activeAds = (businessProfile.ads || []).filter(a => a.status === 'Active' && a.moderation_status === 'approved').length
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
                                                <h3 style={{ marginTop: 0 }}>Store Listings ({myListings.length})</h3>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
                                                    {myListings.length === 0 ? (
                                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Your store listings will appear here.</p>
                                                    ) : (
                                                        myListings.slice(0, 5).map(listing => (
                                                            <div key={listing.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '0.88rem', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>
                                                                <span>{listing.title}</span>
                                                                <strong style={{ color: 'var(--primary)', whiteSpace: 'nowrap' }}>K{Number(listing.price).toLocaleString()}</strong>
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
                                                                <span className="badge" style={{ background: ad.moderation_status === 'approved' && ad.status === 'Active' ? '#e2f0d9' : '#fef3c7', color: ad.moderation_status === 'rejected' ? '#b91c1c' : '#92400e' }}>
                                                                    {ad.moderation_status === 'pending' ? 'Pending review' : ad.moderation_status === 'rejected' ? 'Rejected' : ad.moderation_status === 'removed' ? 'Removed' : ad.status} ({ad.duration})
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
                                                    <div key={ad.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, background: 'var(--surface)', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px' }}>
                                                        <div style={{ minWidth: 0 }}>
                                                            <h4 style={{ margin: 0 }}>{ad.adTitle}</h4>
                                                            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Duration: {ad.duration} | Budget: {ad.budget}</span>
                                                            {ad.moderation_status === 'rejected' && ad.moderation_reason && (
                                                                <p style={{ margin: '5px 0 0', color: '#b91c1c', fontSize: '.78rem' }}>Reason: {ad.moderation_reason}</p>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                            <span className="badge" style={{ background: ad.status === 'Active' ? '#e2f0d9' : '#fce4d6', color: ad.status === 'Active' ? '#385723' : '#c65911' }}>
                                                                {ad.moderation_status === 'pending' ? 'Pending review' : ad.moderation_status === 'rejected' ? 'Rejected' : ad.moderation_status === 'removed' ? 'Removed' : ad.status}
                                                            </span>
                                                            <button className="secondary-btn compact-btn" disabled={ad.moderation_status === 'rejected' || ad.moderation_status === 'removed'} onClick={() => handleToggleAdStatus(ad.id)}>
                                                                {ad.status === 'Active' ? 'Pause' : 'Resume'}
                                                            </button>
                                                            <button className="secondary-btn compact-btn" aria-label={`Delete ad campaign ${ad.adTitle}`} onClick={() => handleDeleteAd(ad.id)}>
                                                                <span className="material-icons" aria-hidden="true">delete</span>
                                                                Delete
                                                            </button>
                                                            <BoostControl
                                                                targetType="ad"
                                                                targetId={ad.id}
                                                                targetTitle={ad.adTitle || 'advertisement'}
                                                                eligible={ad.status === 'Active'
                                                                    && ad.moderation_status === 'approved'}
                                                            />
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
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                                    {socialError && <p role="alert" style={{ gridColumn: '1 / -1', color: 'var(--danger)' }}>{socialError}</p>}
                                    <div className="sidebar-card" style={{ background: 'var(--panel)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                        <h3 style={{ marginTop: 0 }}>Followers ({socialFollowers.length})</h3>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>People who follow your store.</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                                            {socialLoading ? <p role="status">Loading followers…</p> : socialFollowers.length === 0 ? (
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No one is following your store yet.</p>
                                            ) : socialFollowers.map(follower => (
                                                <div key={follower.user_id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {follower.avatar_url ? (
                                                        <img src={follower.avatar_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div aria-hidden="true" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--border)', color: 'var(--text)', display: 'grid', placeItems: 'center', fontWeight: 600 }}>
                                                            {(follower.username || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <strong style={{ fontSize: '0.88rem', display: 'block' }}>{follower.username || 'MarketSpace user'}</strong>
                                                        {follower.created_at && (
                                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                                Following since {new Date(follower.created_at).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="sidebar-card" style={{ background: 'var(--panel)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                        <h3 style={{ marginTop: 0 }}>Stores You Follow ({socialFollowingIds.length})</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                                            {socialLoading ? <p role="status">Loading followed stores…</p> : socialFollowingIds.length === 0 ? (
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>You aren’t following any stores yet.</p>
                                            ) : (
                                                socialFollowingIds.map(id => {
                                                    const shopProfile = allBusinesses[id]
                                                    return (
                                                        <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                {shopProfile?.logo ? (
                                                                    <img src={shopProfile.logo} alt="Logo" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }} />
                                                                ) : (
                                                                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#ccc', display: 'grid', placeItems: 'center', fontSize: '0.8rem' }}>
                                                                        <span className="material-icons" style={{ fontSize: '14px' }}>storefront</span>
                                                                    </div>
                                                                )}
                                                                <strong style={{ fontSize: '0.88rem' }}>{shopProfile?.shopName || 'Store details unavailable'}</strong>
                                                            </div>
                                                            <button
                                                                className="ghost-btn compact-btn delete-btn"
                                                                onClick={() => {
                                                                    onToggleFollowStore(id)
                                                                    setSocialFollowingIds(current => current.filter(storeId => storeId !== id))
                                                                }}
                                                                style={{ color: 'var(--danger)' }}
                                                            >
                                                                Unfollow
                                                            </button>
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
                                                                    const moderationStatus = listing.moderation_status || 'approved'
                                                                    const statusLabel = moderationStatus === 'approved'
                                                                        ? 'Live'
                                                                        : moderationStatus === 'pending'
                                                                            ? 'Pending review'
                                                                            : moderationStatus === 'rejected'
                                                                                ? 'Rejected'
                                                                                : 'Removed'
                                                                    const statusColor = moderationStatus === 'approved' ? '#059669' : moderationStatus === 'pending' ? '#b45309' : '#dc2626'
                                                                    return (
                                                                        <span
                                                                            role="status"
                                                                            title={moderationStatus === 'rejected' ? listing.moderation_reason || undefined : undefined}
                                                                            style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '12px', background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}55`, fontWeight: 700 }}
                                                                        >
                                                                            {statusLabel}
                                                                        </span>
                                                                    )
                                                                })()}
                                                                {listing.moderation_status === 'rejected' && listing.moderation_reason && (
                                                                    <span style={{ flexBasis: '100%', color: '#b91c1c', fontSize: '0.78rem' }}>
                                                                        Reason: {listing.moderation_reason}
                                                                    </span>
                                                                )}
                                                                {(() => {
                                                                    if (listing.moderation_status && listing.moderation_status !== 'approved') return null
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
                                                    <BoostControl
                                                        targetType="listing"
                                                        targetId={String(listing.id)}
                                                        targetTitle={listing.title}
                                                        eligible={listing.moderation_status === 'approved'
                                                            && ['active', 'available'].includes((listing.status || 'Available').toLowerCase())
                                                            && !isListingExpired(listing, globalRenewalFrequency, globalRenewalDay)}
                                                    />
                                                    <button className="ghost-btn compact-btn delete-btn" onClick={() => setListingToDelete(listing)}>
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
            {listingToDelete && (
                <DestructiveActionDialog
                    title="Delete this listing?"
                    description="This permanently removes the listing from MarketSpace. This cannot be undone."
                    confirmationText={listingToDelete.title}
                    confirmLabel="Delete listing"
                    onCancel={() => setListingToDelete(null)}
                    onConfirm={async () => {
                        await onDeleteListing(listingToDelete.id)
                        setListingToDelete(null)
                    }}
                />
            )}
            {adToDelete && (
                <DestructiveActionDialog
                    title="Delete this ad campaign?"
                    description="This permanently removes the ad campaign. This cannot be undone."
                    confirmationText={adToDelete.adTitle}
                    confirmLabel="Delete ad"
                    onCancel={() => setAdToDelete(null)}
                    onConfirm={async () => {
                        await onDeleteAd(adToDelete.id)
                        setAdToDelete(null)
                    }}
                />
            )}
        </div>
    )
}