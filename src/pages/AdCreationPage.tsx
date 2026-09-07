import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { BusinessProfile, Listing, BusinessAd, Profile } from '../types'
import { uploadImageToSupabase } from '../features/marketplace/ImageUploader'

type AdCreationPageProps = {
    businessProfile: BusinessProfile | null
    myListings: Listing[]
    profile?: Profile | null
    onSaveAd: (newAd: BusinessAd) => Promise<void> | void
    onBack: () => void
}

export function AdCreationPage({
    businessProfile,
    myListings,
    profile,
    onSaveAd,
    onBack
}: AdCreationPageProps) {
    const navigate = useNavigate()

    // 1. Target Entity (Store vs Specific Listing)
    const hasStore = Boolean(businessProfile && businessProfile.shopName)
    const [targetType, setTargetType] = useState<'store' | 'listing'>(hasStore ? 'store' : 'listing')
    const [selectedListingId, setSelectedListingId] = useState<number>(myListings.length > 0 ? myListings[0].id : 0)

    const selectedListing = useMemo(() => {
        return myListings.find(l => l.id === selectedListingId) || myListings[0] || null
    }, [myListings, selectedListingId])

    // 2. Goal Selection
    const [goal, setGoal] = useState<string>('Get more website visitors')
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)

    // 3. Ad Creative
    const [adText, setAdText] = useState<string>(
        targetType === 'store'
            ? (businessProfile?.description || 'Discover exclusive products and premium deals at our official store!')
            : (selectedListing?.description || 'Special limited offer! Top quality product available now.')
    )

    // Media (up to 5 images)
    const defaultInitialImage = useMemo(() => {
        if (targetType === 'store') {
            return businessProfile?.cover || businessProfile?.logo || '/banners/store_banner_electronics.png'
        }
        return selectedListing?.images?.[0] || '/banners/banner_electronics_1784444867350.png'
    }, [targetType, businessProfile, selectedListing])

    const [mediaList, setMediaList] = useState<string[]>([defaultInitialImage])
    const [activeMediaIndex, setActiveMediaIndex] = useState(0)

    // Headline & CTA
    const [headline, setHeadline] = useState<string>(
        targetType === 'store'
            ? (businessProfile?.shopName || 'MarketSpace Store')
            : (selectedListing?.title || 'Featured Product')
    )
    const [buttonLabel, setButtonLabel] = useState<string>(targetType === 'store' ? 'Visit Store' : 'Shop Now')

    // Destination URL (Dynamic pre-filled)
    const calculatedDestinationUrl = useMemo(() => {
        if (targetType === 'store') {
            return businessProfile ? `/store/${businessProfile.userId}` : '/stores'
        }
        if (selectedListing) {
            const storeOwnerId = businessProfile?.userId || selectedListing.user_id
            return `/store/${storeOwnerId}?highlight=${selectedListing.id}`
        }
        return '/'
    }, [targetType, businessProfile, selectedListing])

    const [destinationUrl, setDestinationUrl] = useState<string>(calculatedDestinationUrl)

    // Synchronize when target entity changes
    const handleTargetTypeChange = (newType: 'store' | 'listing') => {
        setTargetType(newType)
        if (newType === 'store' && businessProfile) {
            setAdText(businessProfile.description || `Welcome to ${businessProfile.shopName}! Browse our curated catalog.`)
            setHeadline(businessProfile.shopName.slice(0, 25))
            setButtonLabel('Visit Store')
            setMediaList([businessProfile.cover || businessProfile.logo || defaultInitialImage])
            setDestinationUrl(`/store/${businessProfile.userId}`)
        } else if (newType === 'listing' && selectedListing) {
            setAdText(selectedListing.description.slice(0, 140))
            setHeadline(selectedListing.title.slice(0, 25))
            setButtonLabel('Shop Now')
            if (selectedListing.images && selectedListing.images.length > 0) {
                setMediaList(selectedListing.images.slice(0, 5))
            }
            const storeOwnerId = businessProfile?.userId || selectedListing.user_id
            setDestinationUrl(`/store/${storeOwnerId}?highlight=${selectedListing.id}`)
        }
    }

    const handleSelectListing = (listingId: number) => {
        setSelectedListingId(listingId)
        const item = myListings.find(l => l.id === listingId)
        if (item) {
            setAdText(item.description.slice(0, 140))
            setHeadline(item.title.slice(0, 25))
            if (item.images && item.images.length > 0) {
                setMediaList(item.images.slice(0, 5))
            }
            const storeOwnerId = businessProfile?.userId || item.user_id
            setDestinationUrl(`/store/${storeOwnerId}?highlight=${item.id}`)
        }
    }

    // Additional Contact Method
    const [enableWhatsApp, setEnableWhatsApp] = useState(true)
    const [contactMethod, setContactMethod] = useState<'WhatsApp' | 'Direct Chat'>('WhatsApp')
    const [contactPhone, setContactPhone] = useState(businessProfile?.whatsapp || (profile as any)?.phone || '975102312')

    // Advantage+ Creative & Special Category
    const [advantageCreative, setAdvantageCreative] = useState(true)
    const [specialCategory, setSpecialCategory] = useState(false)

    // Audience
    const [audienceMode, setAudienceMode] = useState<'advantage' | 'custom'>('advantage')
    const [audienceLocation] = useState('Zambia')
    const [audienceMinAge] = useState(18)

    // Schedule & Duration
    const [scheduleType, setScheduleType] = useState<'continuous' | 'end_date'>('continuous')
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
    const [startTime, setStartTime] = useState('11:00 AM')
    const [endDate, setEndDate] = useState('')

    // Daily Budget
    const [budget, setBudget] = useState<number>(5.00)
    const [currency] = useState<'USD' | 'ZMW'>('USD')

    // Placements
    const [advantagePlacements, setAdvantagePlacements] = useState(true)

    // Upload new media handler
    const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            if (mediaList.length >= 5) {
                alert('You can select up to 5 images for the carousel.')
                return
            }
            try {
                const url = await uploadImageToSupabase(e.target.files[0], 'marketspace-media', 'ad-creatives')
                setMediaList(prev => [...prev, url])
            } catch (err) {
                console.error('Error uploading ad image:', err)
            }
        }
    }

    const handleRemoveMedia = (index: number) => {
        if (mediaList.length <= 1) return
        const updated = mediaList.filter((_, i) => i !== index)
        setMediaList(updated)
        if (activeMediaIndex >= updated.length) {
            setActiveMediaIndex(updated.length - 1)
        }
    }

    // Publishing state
    const [isPublishing, setIsPublishing] = useState(false)
    const [publishSuccess, setPublishSuccess] = useState(false)

    const handlePublish = async () => {
        if (!destinationUrl.trim()) {
            alert('Please enter a valid destination URL.')
            return
        }

        setIsPublishing(true)
        const newAd: BusinessAd = {
            id: `ad-${Date.now()}`,
            targetType,
            storeId: businessProfile?.userId,
            listingId: targetType === 'listing' ? selectedListing?.id : undefined,
            goal,
            adTitle: headline,
            adText,
            headline,
            media: mediaList,
            buttonLabel,
            destinationUrl,
            contactMethod: enableWhatsApp ? (contactMethod === 'WhatsApp' ? 'whatsapp' : 'messenger') : 'none',
            contactPhone: enableWhatsApp ? contactPhone : undefined,
            enableAdvantageCreative: advantageCreative,
            isSpecialCategory: specialCategory,
            audienceLocation,
            audienceMinAge,
            scheduleType,
            startDate,
            startTime,
            endDate: scheduleType === 'end_date' ? endDate : undefined,
            budget: String(budget),
            currency,
            placements: advantagePlacements ? ['Marketplace', 'Feed', 'Store Spotlight'] : ['Marketplace'],
            status: 'Active',
            createdAt: new Date().toISOString()
        }

        try {
            await onSaveAd(newAd)
            setPublishSuccess(true)
            setTimeout(() => {
                navigate('/profile/store-dashboard')
            }, 1500)
        } catch (err) {
            console.error('Failed to publish ad:', err)
        } finally {
            setIsPublishing(false)
        }
    }

    // Calculations for preview
    const impressionsMin = Math.round(budget * 2100)
    const impressionsMax = Math.round(budget * 11000)
    const clicksMin = Math.max(5, Math.round(budget * 1.5))
    const clicksMax = Math.max(15, Math.round(budget * 8.5))

    const displayName = targetType === 'store'
        ? (businessProfile?.shopName || 'Official Store')
        : (profile?.username || 'Verified Seller')

    const avatarUrl = targetType === 'store'
        ? (businessProfile?.logo || profile?.avatar_url)
        : profile?.avatar_url

    return (
        <div style={{ padding: '24px 0', maxWidth: '1240px', margin: '0 auto', color: 'var(--text)' }}>
            {/* Top Back & Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button type="button" className="ghost-btn" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="material-icons">arrow_back</span>
                        <span>Back</span>
                    </button>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Create New Ad</h2>
                </div>
            </div>

            {publishSuccess && (
                <div style={{ backgroundColor: '#10b981', color: '#ffffff', padding: '14px 20px', borderRadius: '10px', marginBottom: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="material-icons">check_circle</span>
                    <span>Your ad campaign has been published successfully! Redirecting to dashboard...</span>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.45fr) minmax(0, 1fr)', gap: '28px', alignItems: 'flex-start' }} className="ad-creation-grid">
                {/* ========================================================= */}
                {/* LEFT COLUMN: AD CONFIGURATION FORM                        */}
                {/* ========================================================= */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* 1. Target Entity Selection Card */}
                    <div className="section-card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--panel)' }}>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 700 }}>What are you advertising?</h3>
                        <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Select whether this campaign directs buyers to your overall storefront or a specific listed item.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {/* Option 1: Store */}
                            <label
                                style={{
                                    border: targetType === 'store' ? '2px solid #2563eb' : '1px solid var(--border)',
                                    background: targetType === 'store' ? 'rgba(37, 99, 235, 0.08)' : 'var(--surface)',
                                    opacity: hasStore ? 1 : 0.45,
                                    cursor: hasStore ? 'pointer' : 'not-allowed',
                                    borderRadius: '10px',
                                    padding: '14px',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '10px',
                                    position: 'relative'
                                }}
                            >
                                <input
                                    type="radio"
                                    name="adTarget"
                                    disabled={!hasStore}
                                    checked={targetType === 'store'}
                                    onChange={() => handleTargetTypeChange('store')}
                                    style={{ marginTop: '3px' }}
                                />
                                <div>
                                    <strong style={{ display: 'block', fontSize: '0.92rem' }}>Advertise My Store</strong>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                        {hasStore ? `${businessProfile?.shopName} Storefront` : 'Requires an active store profile'}
                                    </span>
                                </div>
                            </label>

                            {/* Option 2: Specific Listing */}
                            <label
                                style={{
                                    border: targetType === 'listing' ? '2px solid #2563eb' : '1px solid var(--border)',
                                    background: targetType === 'listing' ? 'rgba(37, 99, 235, 0.08)' : 'var(--surface)',
                                    cursor: 'pointer',
                                    borderRadius: '10px',
                                    padding: '14px',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '10px'
                                }}
                            >
                                <input
                                    type="radio"
                                    name="adTarget"
                                    checked={targetType === 'listing'}
                                    onChange={() => handleTargetTypeChange('listing')}
                                    style={{ marginTop: '3px' }}
                                />
                                <div>
                                    <strong style={{ display: 'block', fontSize: '0.92rem' }}>Specific Listing</strong>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Highlight a single item from your catalog</span>
                                </div>
                            </label>
                        </div>

                        {/* Listing Dropdown Selector if targetType === 'listing' */}
                        {targetType === 'listing' && (
                            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, marginBottom: '6px' }}>
                                    Select listing to promote:
                                </label>
                                {myListings.length === 0 ? (
                                    <p style={{ color: '#ef4444', fontSize: '0.84rem', margin: 0 }}>You haven't published any listings yet.</p>
                                ) : (
                                    <select
                                        value={selectedListingId}
                                        onChange={(e) => handleSelectListing(Number(e.target.value))}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.9rem' }}
                                    >
                                        {myListings.map(l => (
                                            <option key={l.id} value={l.id}>
                                                {l.title} — ZMW {l.price} ({l.category})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 2. Goal Section */}
                    <div className="section-card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--panel)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 700 }}>Goal</h3>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>What results would you like from this ad?</p>
                            </div>
                            <button
                                type="button"
                                className="secondary-btn compact-btn"
                                onClick={() => setIsGoalModalOpen(!isGoalModalOpen)}
                            >
                                Change
                            </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px', padding: '12px 14px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <span className="material-icons" style={{ color: '#2563eb' }}>open_in_new</span>
                            <div>
                                <strong style={{ display: 'block', fontSize: '0.9rem' }}>{goal}</strong>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                    Show your ad to people who are likely to click on a link in it.
                                </span>
                            </div>
                        </div>

                        {isGoalModalOpen && (
                            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                {['Get more website visitors', 'Get more store visits', 'Get more messages & inquiries', 'Promote brand awareness'].map((g) => (
                                    <button
                                        key={g}
                                        type="button"
                                        onClick={() => { setGoal(g); setIsGoalModalOpen(false) }}
                                        style={{
                                            textAlign: 'left',
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            background: goal === g ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
                                            border: goal === g ? '1px solid #2563eb' : '1px solid transparent',
                                            color: 'var(--text)',
                                            fontWeight: goal === g ? 700 : 500,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 3. Ad Creative Section */}
                    <div className="section-card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--panel)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Ad creative</h3>
                        </div>

                        {/* Ad text */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, marginBottom: '6px' }}>
                                Ad text (Primary copy):
                            </label>
                            <textarea
                                rows={3}
                                value={adText}
                                onChange={(e) => setAdText(e.target.value)}
                                placeholder="How do you want your ad to look?"
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.9rem', resize: 'vertical' }}
                            />
                        </div>

                        {/* Media Carousel (1/5) */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label style={{ fontSize: '0.86rem', fontWeight: 600 }}>
                                    Media ({mediaList.length}/5) - Select up to 5 images to create a carousel
                                </label>
                                <label className="secondary-btn compact-btn" style={{ cursor: 'pointer', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <span className="material-icons" style={{ fontSize: '16px' }}>add_photo_alternate</span>
                                    <span>Add Media</span>
                                    <input type="file" accept="image/*" onChange={handleMediaUpload} style={{ display: 'none' }} />
                                </label>
                            </div>

                            {/* Thumbnails grid */}
                            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px' }}>
                                {mediaList.map((img, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            position: 'relative',
                                            width: '90px',
                                            height: '90px',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            border: activeMediaIndex === idx ? '2px solid #2563eb' : '1px solid var(--border)',
                                            flexShrink: 0,
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => setActiveMediaIndex(idx)}
                                    >
                                        <img src={img} alt="media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        {mediaList.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleRemoveMedia(idx) }}
                                                style={{
                                                    position: 'absolute',
                                                    top: '4px',
                                                    right: '4px',
                                                    width: '20px',
                                                    height: '20px',
                                                    borderRadius: '50%',
                                                    backgroundColor: 'rgba(0,0,0,0.7)',
                                                    color: '#ffffff',
                                                    border: 'none',
                                                    display: 'grid',
                                                    placeItems: 'center',
                                                    cursor: 'pointer',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Headline */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <label style={{ fontSize: '0.86rem', fontWeight: 600 }}>Headline:</label>
                                <span style={{ fontSize: '0.78rem', color: headline.length > 25 ? '#ef4444' : 'var(--text-secondary)' }}>
                                    {headline.length} of 25 characters
                                </span>
                            </div>
                            <input
                                type="text"
                                maxLength={30}
                                value={headline}
                                onChange={(e) => setHeadline(e.target.value)}
                                placeholder="Enter a catchy headline"
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.9rem' }}
                            />
                        </div>

                        {/* Button Label CTA */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, marginBottom: '6px' }}>Button label (CTA):</label>
                            <select
                                value={buttonLabel}
                                onChange={(e) => setButtonLabel(e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.9rem' }}
                            >
                                <option value="Learn more">Learn more</option>
                                <option value="Shop now">Shop now</option>
                                <option value="Visit store">Visit store</option>
                                <option value="View listing">View listing</option>
                                <option value="Contact us">Contact us</option>
                                <option value="Buy now">Buy now</option>
                            </select>
                        </div>

                        {/* Destination Website URL */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, marginBottom: '6px' }}>Website / Destination URL:</label>
                            <input
                                type="text"
                                value={destinationUrl}
                                onChange={(e) => setDestinationUrl(e.target.value)}
                                placeholder="/store/123 or https://..."
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: destinationUrl.trim() ? '1px solid var(--border)' : '1px solid #ef4444',
                                    background: 'var(--surface)',
                                    color: 'var(--text)',
                                    fontSize: '0.9rem'
                                }}
                            />
                            {!destinationUrl.trim() && (
                                <span style={{ color: '#ef4444', fontSize: '0.78rem', display: 'block', marginTop: '4px' }}>Please enter a valid URL.</span>
                            )}
                            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                                💡 Tip: Links to specific listings will automatically scroll and highlight the product with a bright attention tint!
                            </span>
                        </div>
                    </div>

                    {/* 4. Additional Contact Method */}
                    <div className="section-card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--panel)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 700 }}>Additional contact method</h3>
                                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                                    Help customers contact you easily after they view your ad.
                                </p>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={enableWhatsApp}
                                    onChange={(e) => setEnableWhatsApp(e.target.checked)}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                            </label>
                        </div>

                        {enableWhatsApp && (
                            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px', padding: '14px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '6px' }}>Contact method:</label>
                                    <select
                                        value={contactMethod}
                                        onChange={(e) => setContactMethod(e.target.value as any)}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--text)' }}
                                    >
                                        <option value="WhatsApp">WhatsApp Message</option>
                                        <option value="Direct Chat">MarketSpace Direct Chat</option>
                                    </select>
                                </div>
                                {contactMethod === 'WhatsApp' && (
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '6px' }}>Phone number:</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <span style={{ padding: '8px 12px', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.88rem', fontWeight: 600 }}>+260</span>
                                            <input
                                                type="text"
                                                value={contactPhone}
                                                onChange={(e) => setContactPhone(e.target.value)}
                                                placeholder="975102312"
                                                style={{ flexGrow: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--text)' }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 5. Creative Enhancements & Special Category */}
                    <div className="section-card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--panel)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <strong style={{ display: 'block', fontSize: '0.92rem' }}>Automated Creative Variations</strong>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Automatically optimize creative brightness and contrast for maximum engagement</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={advantageCreative}
                                onChange={(e) => setAdvantageCreative(e.target.checked)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                        </div>

                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <strong style={{ display: 'block', fontSize: '0.92rem' }}>Special Category Ad</strong>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Is this ad about employment, services or real estate?</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={specialCategory}
                                onChange={(e) => setSpecialCategory(e.target.checked)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                        </div>
                    </div>

                    {/* 6. Audience & Targeting */}
                    <div className="section-card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--panel)' }}>
                        <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 700 }}>Audience</h3>
                        <p style={{ margin: '0 0 14px 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>Who should see your ad?</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="audMode"
                                    checked={audienceMode === 'advantage'}
                                    onChange={() => setAudienceMode('advantage')}
                                />
                                <div>
                                    <strong style={{ fontSize: '0.9rem' }}>Smart MarketSpace Audience (Recommended)</strong>
                                    <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                        Automatically adjust reach over time to target buyers most likely to purchase
                                    </span>
                                </div>
                            </label>

                            <div style={{ padding: '12px 14px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.84rem' }}>
                                <div><strong>Location:</strong> {audienceLocation}</div>
                                <div><strong>Minimum age:</strong> {audienceMinAge}+</div>
                            </div>
                        </div>
                    </div>

                    {/* 7. Schedule, Duration & Daily Budget */}
                    <div className="section-card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--panel)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Schedule and duration</h3>

                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '160px' }}>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Start date:</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                                />
                            </div>
                            <div style={{ flex: 1, minWidth: '160px' }}>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Start time:</label>
                                <input
                                    type="text"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
                                <input
                                    type="radio"
                                    name="schedType"
                                    checked={scheduleType === 'continuous'}
                                    onChange={() => setScheduleType('continuous')}
                                />
                                <span>Run ad continuously — Your ad will run until you pause it</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
                                <input
                                    type="radio"
                                    name="schedType"
                                    checked={scheduleType === 'end_date'}
                                    onChange={() => setScheduleType('end_date')}
                                />
                                <span>Choose end date</span>
                            </label>
                        </div>

                        {scheduleType === 'end_date' && (
                            <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>End date:</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                                />
                            </div>
                        )}

                        {/* Daily Budget Slider */}
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <strong style={{ fontSize: '0.94rem' }}>Daily budget</strong>
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Currency: {currency}</span>
                            </div>

                            <p style={{ margin: '0 0 10px 0', fontSize: '0.82rem', color: '#2563eb', fontWeight: 600 }}>
                                Estimated {impressionsMin.toLocaleString()} – {impressionsMax.toLocaleString()} impressions per day
                            </p>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', margin: '14px 0' }}>
                                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563eb' }}>{currency === 'USD' ? '$' : 'ZMW'}</span>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="1"
                                    max="100"
                                    value={budget}
                                    onChange={(e) => setBudget(Number(e.target.value))}
                                    style={{ width: '110px', fontSize: '1.5rem', fontWeight: 800, textAlign: 'center', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                                />
                            </div>

                            <input
                                type="range"
                                min="1"
                                max="100"
                                step="0.5"
                                value={budget}
                                onChange={(e) => setBudget(Number(e.target.value))}
                                style={{ width: '100%', cursor: 'pointer' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                <span>{currency === 'USD' ? '$1.00' : 'ZMW 25'}</span>
                                <span>{currency === 'USD' ? '$100.00' : 'ZMW 2,500'}</span>
                            </div>
                        </div>
                    </div>

                    {/* 8. Placements */}
                    <div className="section-card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--panel)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <strong style={{ display: 'block', fontSize: '0.94rem' }}>Smart Multi-Placements (Recommended)</strong>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Maximize reach across Homepage Feed, Search Spotlight, and Marketplace Grid</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={advantagePlacements}
                                onChange={(e) => setAdvantagePlacements(e.target.checked)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                        </div>
                    </div>
                </div>

                {/* ========================================================= */}
                {/* RIGHT COLUMN: STICKY LIVE AD PREVIEW & CAMPAIGN SUMMARY    */}
                {/* ========================================================= */}
                <div style={{ position: 'sticky', top: '90px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Live Ad Card Mockup */}
                    <div className="section-card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--panel)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <strong style={{ fontSize: '0.94rem' }}>Ad preview</strong>
                            <span style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 600 }}>Live Mockup</span>
                        </div>

                        {/* Social Ad Post Card */}
                        <div style={{ background: '#1c1c1c', borderRadius: '12px', border: '1px solid #2e2e2e', overflow: 'hidden', color: '#ffffff', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                            {/* Post Author Bar */}
                            <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="author" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#2563eb', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '0.88rem' }}>
                                            {displayName.slice(0, 1).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <strong style={{ display: 'block', fontSize: '0.9rem', color: '#ffffff' }}>{displayName}</strong>
                                        <span style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span>Sponsored</span> • <span className="material-icons" style={{ fontSize: '12px' }}>public</span>
                                        </span>
                                    </div>
                                </div>
                                <span className="material-icons" style={{ color: '#94a3b8', fontSize: '20px' }}>more_horiz</span>
                            </div>

                            {/* Ad Text / Body */}
                            <div style={{ padding: '0 14px 10px 14px', fontSize: '0.88rem', color: '#f1f5f9', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                                {adText || 'Your ad primary text will appear here.'}
                            </div>

                            {/* Creative Image Preview */}
                            <div style={{ width: '100%', height: '260px', background: '#0a0a0a', position: 'relative' }}>
                                <img
                                    src={mediaList[activeMediaIndex] || defaultInitialImage}
                                    alt="ad creative"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                {mediaList.length > 1 && (
                                    <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '12px' }}>
                                        {mediaList.map((_, i) => (
                                            <span
                                                key={i}
                                                style={{
                                                    width: activeMediaIndex === i ? '14px' : '6px',
                                                    height: '6px',
                                                    borderRadius: '3px',
                                                    backgroundColor: activeMediaIndex === i ? '#2563eb' : '#ffffff',
                                                    transition: 'all 0.2s'
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Destination & Headline CTA Bar */}
                            <div style={{ padding: '12px 14px', background: '#262626', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', borderTop: '1px solid #333' }}>
                                <div style={{ minWidth: 0 }}>
                                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                                        MARKETSPACE.ZM
                                    </span>
                                    <strong style={{ fontSize: '0.94rem', color: '#ffffff', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {headline || 'Your Headline'}
                                    </strong>
                                </div>
                                <button
                                    type="button"
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#3b82f6',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontWeight: 700,
                                        fontSize: '0.84rem',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {buttonLabel}
                                </button>
                            </div>

                            {/* Social Engagement Actions */}
                            <div style={{ display: 'flex', justifyContent: 'space-around', padding: '10px 0', borderTop: '1px solid #2e2e2e', fontSize: '0.8rem', color: '#94a3b8' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span className="material-icons" style={{ fontSize: '16px' }}>thumb_up</span> Like</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span className="material-icons" style={{ fontSize: '16px' }}>chat_bubble_outline</span> Comment</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span className="material-icons" style={{ fontSize: '16px' }}>share</span> Share</span>
                            </div>
                        </div>

                        <p style={{ margin: '10px 0 0 0', fontSize: '0.74rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                            Ad rendering and interactive elements adapt to device format and placements.
                        </p>
                    </div>

                    {/* Setup Checklist Progress */}
                    <div className="section-card" style={{ padding: '18px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--panel)' }}>
                        <strong style={{ fontSize: '0.88rem', display: 'block', marginBottom: '8px' }}>Setup Checklist</strong>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981' }}>
                                <span className="material-icons" style={{ fontSize: '16px' }}>check_circle</span>
                                <span>Goal selected ({goal})</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: mediaList.length > 0 ? '#10b981' : '#ef4444' }}>
                                <span className="material-icons" style={{ fontSize: '16px' }}>{mediaList.length > 0 ? 'check_circle' : 'error'}</span>
                                <span>Media creative ({mediaList.length} image{mediaList.length > 1 ? 's' : ''})</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: destinationUrl.trim() ? '#10b981' : '#ef4444' }}>
                                <span className="material-icons" style={{ fontSize: '16px' }}>{destinationUrl.trim() ? 'check_circle' : 'error'}</span>
                                <span>Destination URL verified</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981' }}>
                                <span className="material-icons" style={{ fontSize: '16px' }}>check_circle</span>
                                <span>Audience: {audienceLocation}</span>
                            </div>
                        </div>
                    </div>

                    {/* Estimated Daily Results & Payment Summary */}
                    <div className="section-card" style={{ padding: '18px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--panel)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <strong style={{ fontSize: '0.88rem', display: 'block' }}>Estimated Daily Results</strong>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Impressions:</span>
                            <strong>{impressionsMin.toLocaleString()} – {impressionsMax.toLocaleString()}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Link clicks:</span>
                            <strong>{clicksMin} – {clicksMax}</strong>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                            <strong style={{ fontSize: '0.88rem', display: 'block', marginBottom: '8px' }}>Payment summary</strong>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '4px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Daily budget:</span>
                                <span>{currency === 'USD' ? `$${budget.toFixed(2)}` : `ZMW ${budget}`}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '4px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Estimated VAT:</span>
                                <span>{currency === 'USD' ? '$0.00' : 'ZMW 0.00'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.94rem', fontWeight: 800, borderTop: '1px dashed var(--border)', paddingTop: '6px', marginTop: '6px' }}>
                                <span>Daily total:</span>
                                <span style={{ color: '#2563eb' }}>{currency === 'USD' ? `$${budget.toFixed(2)}` : `ZMW ${budget}`}</span>
                            </div>
                        </div>

                        {/* Publish CTA Button */}
                        <button
                            type="button"
                            className="primary-btn"
                            disabled={isPublishing || !destinationUrl.trim()}
                            onClick={handlePublish}
                            style={{
                                marginTop: '10px',
                                padding: '14px',
                                fontSize: '1rem',
                                fontWeight: 700,
                                background: '#2563eb',
                                color: '#ffffff',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: (isPublishing || !destinationUrl.trim()) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isPublishing ? 'Publishing Campaign...' : 'Publish Ad'}
                        </button>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                            By clicking Publish, you agree to MarketSpace Advertising Terms and Conditions.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
