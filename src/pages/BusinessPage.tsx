import { useState, type ChangeEvent, type FormEvent } from 'react'
import type { BusinessProfile, Listing, CatalogItem, BusinessAd } from '../types'
import { fileToBase64Compressed } from '../features/marketplace/FileToBase64'

// ---------------- BUSINESS HUB PAGE ----------------
type BusinessHubPageProps = {
    businessProfile: BusinessProfile
    myListings: Listing[]
    onSave: (profile: BusinessProfile) => void
    onBack: () => void
}

export function BusinessHubPage({ businessProfile, myListings, onSave, onBack }: BusinessHubPageProps) {
    const [activeTab, setActiveTab] = useState<'analytics' | 'catalog' | 'ads'>('analytics')

    // Catalog Item Creation State
    const [catName, setCatName] = useState('')
    const [catPrice, setCatPrice] = useState('')
    const [catDesc, setCatDesc] = useState('')
    const [catImage, setCatImage] = useState('')

    // Ad Creator State
    const [adListingId, setAdListingId] = useState<number>(myListings[0]?.id || 0)
    const [adTitle, setAdTitle] = useState('')
    const [adBudget, setAdBudget] = useState('150')
    const [adDuration, setAdDuration] = useState('5 Days')

    const handleCatImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const base64 = await fileToBase64Compressed(e.target.files[0], 400, 400)
            setLogo(base64)
            setCatImage(base64)
        }
    }

    // Workaround for compiler unused variables
    const setLogo = (val: string) => {
        if (val === '') console.log()
    }

    const handleAddCatalogItem = (e: FormEvent) => {
        e.preventDefault()
        if (!catName || !catPrice) return
        const newItem: CatalogItem = {
            id: String(Date.now()),
            name: catName,
            price: catPrice,
            description: catDesc,
            image: catImage
        }
        onSave({
            ...businessProfile,
            catalog: [...businessProfile.catalog, newItem]
        })
        setCatName('')
        setCatPrice('')
        setCatDesc('')
        setCatImage('')
    }

    const handleRemoveCatalogItem = (itemId: string) => {
        onSave({
            ...businessProfile,
            catalog: businessProfile.catalog.filter(i => i.id !== itemId)
        })
    }

    const handleLaunchAd = (e: FormEvent) => {
        e.preventDefault()
        if (!adListingId) return
        const matchedListing = myListings.find(l => l.id === Number(adListingId))
        const titleText = adTitle || `Boost: ${matchedListing?.title || 'Listing'}`
        const newAd: BusinessAd = {
            id: String(Date.now()),
            listingId: Number(adListingId),
            adTitle: titleText,
            budget: `ZMW ${adBudget}`,
            duration: adDuration,
            status: 'Active'
        }
        onSave({
            ...businessProfile,
            ads: [...businessProfile.ads, newAd]
        })
        setAdTitle('')
        setAdBudget('150')
    }

    const handleToggleAdStatus = (adId: string) => {
        onSave({
            ...businessProfile,
            ads: businessProfile.ads.map(ad => {
                if (ad.id === adId) {
                    return {
                        ...ad,
                        status: ad.status === 'Active' ? 'Paused' : 'Active'
                    }
                }
                return ad
            })
        })
    }

    return (
        <section className="section-card">
            <div className="section-header" style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {businessProfile.logo ? (
                        <img src={businessProfile.logo} alt="Logo" style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover' }} />
                    ) : (
                        <div className="brand-mark" style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'grid', placeItems: 'center', background: 'var(--border)', color: 'var(--text)' }}>
                            <span className="material-icons">storefront</span>
                        </div>
                    )}
                    <div>
                        <h2 style={{ fontSize: '1.25rem' }}>Shop Manager: {businessProfile.shopName}</h2>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Business Tools</p>
                    </div>
                </div>
                <button className="ghost-btn" onClick={onBack}>Profile</button>
            </div>

            {/* Tab controls */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', paddingBottom: '2px', marginBottom: '14px', gap: '8px' }}>
                <button className={`top-nav-btn ${activeTab === 'analytics' ? 'active' : ''}`} style={{ borderRadius: '8px 8px 0 0' }} onClick={() => setActiveTab('analytics')}>Dashboard</button>
                <button className={`top-nav-btn ${activeTab === 'catalog' ? 'active' : ''}`} style={{ borderRadius: '8px 8px 0 0' }} onClick={() => setActiveTab('catalog')}>Catalogs Manager</button>
                <button className={`top-nav-btn ${activeTab === 'ads' ? 'active' : ''}`} style={{ borderRadius: '8px 8px 0 0' }} onClick={() => setActiveTab('ads')}>Advertising Manager</button>
            </div>

            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
                <div className="business-hub-grid">
                    <div className="notification-summary" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                        <div>
                            <span>Catalog Products</span>
                            <h3>{businessProfile.catalog.length}</h3>
                        </div>
                        <div>
                            <span>Active Ads</span>
                            <h3>{businessProfile.ads.filter(a => a.status === 'Active').length}</h3>
                        </div>
                        <div>
                            <span>Store Views (7d)</span>
                            <h3 style={{ color: '#0866ff' }}>1,248</h3>
                        </div>
                        <div>
                            <span>Leads</span>
                            <h3 style={{ color: '#10b981' }}>84</h3>
                        </div>
                    </div>

                    <div className="sidebar-card" style={{ background: 'var(--panel)', padding: '16px' }}>
                        <h3 style={{ marginTop: 0 }}>Store Analytics Breakdown</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Your Store integration is active. Most leads are querying catalog products directly.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>
                                <span>Inquiries about Catalog</span>
                                <strong>52 chats</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>
                                <span>Inquiries from Ads</span>
                                <strong>22 chats</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                                <span>Ad Impressions</span>
                                <strong>8,450 displays</strong>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CATALOGS TAB */}
            {activeTab === 'catalog' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Add item form */}
                    <div className="sidebar-card" style={{ background: 'var(--panel)' }}>
                        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="material-icons">add_box</span> Add Product to Catalog
                        </h3>
                        <form onSubmit={handleAddCatalogItem} className="form-stack">
                            <label>
                                <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Product Image</span>
                                <div className="image-upload-zone" style={{ padding: '14px', marginTop: '4px' }}>
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

                            <input value={catName} onChange={e => setCatName(e.target.value)} placeholder="Product Name (e.g. Vanilla Wedding Cake)" required />
                            <input value={catPrice} onChange={e => setCatPrice(e.target.value)} placeholder="Price (e.g. ZMW 450)" required />
                            <textarea value={catDesc} onChange={e => setCatDesc(e.target.value)} placeholder="Description (e.g. Double layered sponge with buttercream)" rows={2} />

                            <button className="primary-btn" type="submit">Add Product</button>
                        </form>
                    </div>

                    <div>
                        <h3>Current Catalog Products ({businessProfile.catalog.length})</h3>
                        {businessProfile.catalog.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No catalog items yet. Add your first product to display it on your public shop profile.</p>
                        ) : (
                            <div className="catalog-grid">
                                {businessProfile.catalog.map((item) => (
                                    <div key={item.id} className="catalog-card">
                                        {item.image ? (
                                            <div className="catalog-img" style={{ backgroundImage: `url(${item.image})` }} />
                                        ) : (
                                            <div className="catalog-img" style={{ background: 'linear-gradient(135deg, #ddd, #999)', display: 'grid', placeItems: 'center', color: '#666' }}>
                                                <span className="material-icons" style={{ fontSize: '32px' }}>photo_camera</span>
                                            </div>
                                        )}
                                        <div className="catalog-details">
                                            <div>
                                                <h4>{item.name}</h4>
                                                <p>{item.description || 'No description provided'}</p>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                                                <strong>{item.price}</strong>
                                                <button className="ghost-btn compact-btn delete-btn" style={{ minHeight: '26px' }} onClick={() => handleRemoveCatalogItem(item.id)}>Remove</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ADVERTISING TAB */}
            {activeTab === 'ads' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Ad launch form */}
                    <div className="sidebar-card" style={{ background: 'var(--panel)' }}>
                        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="material-icons" style={{ color: '#eab308' }}>campaign</span> Boost Listing (Create Sponsored Ad)
                        </h3>
                        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>Promote listings directly to the top of "Today's picks" feed to drive buyer inquiries.</p>
                        {myListings.length === 0 ? (
                            <p style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.88rem' }}>You must post a listing on MarketSpace first before boosting.</p>
                        ) : (
                            <form onSubmit={handleLaunchAd} className="form-stack">
                                <label>
                                    <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Select Listing to Promote</span>
                                    <select value={adListingId} onChange={e => setAdListingId(Number(e.target.value))} style={{ marginTop: '4px' }}>
                                        {myListings.map(l => (
                                            <option key={l.id} value={l.id}>{l.title} ({l.price})</option>
                                        ))}
                                    </select>
                                </label>

                                <input value={adTitle} onChange={e => setAdTitle(e.target.value)} placeholder="Campaign Title (e.g. Weekend Flash Sale) - optional" />

                                <label>
                                    <span style={{ fontSize: '0.84rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Daily Budget Limit</span>
                                        <strong>ZMW {adBudget}</strong>
                                    </span>
                                    <input type="range" min="20" max="1000" step="10" value={adBudget} onChange={e => setAdBudget(e.target.value)} style={{ width: '100%', marginTop: '4px' }} />
                                </label>

                                <label>
                                    <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Ad Duration</span>
                                    <select value={adDuration} onChange={e => setAdDuration(e.target.value)} style={{ marginTop: '4px' }}>
                                        <option>3 Days</option>
                                        <option>5 Days</option>
                                        <option>7 Days</option>
                                        <option>30 Days</option>
                                    </select>
                                </label>

                                <button className="primary-btn" type="submit" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                                    <span className="material-icons" style={{ fontSize: '18px' }}>campaign</span> Launch Boost Campaign
                                </button>
                            </form>
                        )}
                    </div>

                    <div>
                        <h3>Running Ad Campaigns ({businessProfile.ads.length})</h3>
                        {businessProfile.ads.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No active campaigns. Create a boost campaign above to drive more sales.</p>
                        ) : (
                            <div className="stack-list">
                                {businessProfile.ads.map(ad => {
                                    const matchedListing = myListings.find(l => l.id === ad.listingId)
                                    return (
                                        <div key={ad.id} className="ad-card">
                                            <div>
                                                <h4 style={{ margin: 0 }}>{ad.adTitle}</h4>
                                                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    Listing: <strong>{matchedListing?.title || 'Listing'}</strong> | Budget: {ad.budget} | Duration: {ad.duration}
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <span className={`ad-status-pill ${ad.status === 'Active' ? 'active' : 'paused'}`}>{ad.status}</span>
                                                <button className="secondary-btn compact-btn" onClick={() => handleToggleAdStatus(ad.id)}>
                                                    {ad.status === 'Active' ? 'Pause' : 'Resume'}
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    )
}
