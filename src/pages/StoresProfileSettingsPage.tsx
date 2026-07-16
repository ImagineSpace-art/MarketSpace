import { useState, type FormEvent, type ChangeEvent } from 'react'
import type { Listing, Profile, BusinessProfile, CatalogItem, BusinessAd } from '../types'
import { ListingCard } from '../components/ListingCard'

// Helper for client-side canvas image compression
function fileToBase64Compressed(file: File, maxWidth = 500, maxHeight = 500): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
        resolve(dataUrl)
      }
      img.onerror = (err) => reject(err)
    }
    reader.onerror = (err) => reject(err)
  })
}

// ---------------- STORES PAGE ----------------
type StoresPageProps = {
  stores: Profile[]
  allBusinesses: Record<string, BusinessProfile>
  onVisitShop: (shop: BusinessProfile) => void
  onOpenProfile: () => void
}

export function StoresPage({ stores, allBusinesses, onVisitShop, onOpenProfile }: StoresPageProps) {
  const activeShops = Object.values(allBusinesses)

  return (
    <section className="section-card">
      <div className="section-header">
        <div>
          <p className="eyebrow">Stores</p>
          <h2>Featured Sellers & Shops</h2>
        </div>
      </div>

      {activeShops.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <p className="eyebrow" style={{ color: '#2563eb' }}>🏪 Registered Shops</p>
          <div className="listing-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
            {activeShops.map((shop) => (
              <article key={shop.userId} className="listing-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {shop.logo ? (
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <img src={shop.logo} alt={shop.shopName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div className="brand-mark" style={{ width: '48px', height: '48px', borderRadius: '12px', fontSize: '1.2rem' }}>
                      {shop.shopName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{shop.shopName}</h3>
                    <span className="badge" style={{ marginTop: '2px', fontSize: '0.7rem' }}>{shop.category}</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', flexGrow: 1, margin: '8px 0', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {shop.description}
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍 {shop.address}</div>
                <button className="primary-btn compact-btn" style={{ marginTop: '8px' }} onClick={() => onVisitShop(shop)}>Visit Shop 🏪</button>
              </article>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="eyebrow">All MarketSpace Sellers</p>
        <div className="listing-grid">
          {stores.map((store) => (
            <article key={store.user_id} className="listing-card">
              <h3>{store.username || 'Store owner'}</h3>
              <p>{store.email || 'Contact available through profile'}</p>
              <button className="secondary-btn" onClick={onOpenProfile}>View profile</button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------- PROFILE PAGE ----------------
type ProfilePageProps = {
  profile: Profile | null
  userEmail: string
  myListings: Listing[]
  listings: Listing[]
  savedListings: Listing[]
  savedIds: string[]
  businessProfile: BusinessProfile | null
  onOpenSettings: () => void
  onCreateListing: () => void
  onEditListing: (listing: Listing) => void
  onRenewListing: (listingId: number) => void
  onDeleteListing: (listingId: number) => void
  onUpdateStatus: (listingId: number, status: string) => void
  onOpenBusinessSetup: () => void
  onOpenBusinessHub: () => void
  onUploadAvatar: (base64: string) => void
  onOpenListing: (listing: Listing) => void
  onToggleSave: (listingId: number) => void
  onLogout: () => void
}

export function ProfilePage({
  profile,
  userEmail,
  myListings,
  listings,
  savedListings,
  savedIds,
  businessProfile,
  onOpenSettings,
  onCreateListing,
  onEditListing,
  onRenewListing,
  onDeleteListing,
  onUpdateStatus,
  onOpenBusinessSetup,
  onOpenBusinessHub,
  onUploadAvatar,
  onOpenListing,
  onToggleSave,
  onLogout,
}: ProfilePageProps) {
  const displayName = profile?.username || 'Your profile'

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64Compressed(e.target.files[0], 200, 200)
        onUploadAvatar(base64)
      } catch (err) {
        console.error('Error uploading avatar:', err)
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <section className="section-card profile-card">
        <div className="profile-hero">
          <label style={{ position: 'relative', cursor: 'pointer' }}>
            <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={displayName} style={{ width: '72px', height: '72px', borderRadius: '22px', objectFit: 'cover', border: '1px solid var(--border)' }} />
            ) : (
              <div className="profile-avatar">{displayName.slice(0, 1).toUpperCase()}</div>
            )}
            <div style={{ position: 'absolute', bottom: -2, right: -2, background: 'rgba(15,23,42,0.7)', color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'grid', placeItems: 'center', fontSize: '0.65rem' }}>📷</div>
          </label>
          <div className="profile-identity">
            <p className="eyebrow">Profile</p>
            <h2>{displayName}</h2>
            <p>{userEmail}</p>
          </div>
          <div className="profile-actions">
            <button className="secondary-btn" onClick={onOpenSettings}>Account settings</button>
            <button className="ghost-btn" onClick={onLogout}>Log out</button>
          </div>
        </div>
        <div className="profile-stats">
          <div><strong>{myListings.length}</strong><span>My listings</span></div>
          <div><strong>{listings.length}</strong><span>Marketplace listings</span></div>
          <div><strong>{savedListings.length}</strong><span>Saved</span></div>
        </div>
      </section>

      {/* WHATSAPP BUSINESS OPT-IN CARD */}
      <section className="section-card" style={{
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(15, 118, 110, 0.08))',
        border: '1px dashed var(--border)'
      }}>
        {businessProfile ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                🏪 {businessProfile.shopName} <span className="badge" style={{ background: '#10b981', color: 'white' }}>Verified Shop</span>
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>WhatsApp Business tools, product catalogs, and advertising active.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="secondary-btn compact-btn" onClick={onOpenBusinessSetup}>Edit Shop Info</button>
              <button className="primary-btn compact-btn" onClick={onOpenBusinessHub}>Manage Shop (Hub)</button>
            </div>
          </div>
        ) : (
          <div>
            <h3 style={{ margin: 0 }}>🚀 Boost sales with a WhatsApp Business Shop!</h3>
            <p style={{ margin: '6px 0 12px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Open a shop on MarketSpace to unlock premium features: catalog managers, advertising, customer lead analytics, and a custom public store view.
            </p>
            <button className="primary-btn" onClick={onOpenBusinessSetup}>Open Business Shop</button>
          </div>
        )}
      </section>

      <section className="section-card">
        <div className="section-header">
          <div>
            <h3>Your listings</h3>
            <p className="subtitle">Manage the items you have posted.</p>
          </div>
          <button className="primary-btn" onClick={onCreateListing}>New listing</button>
        </div>

        <div className="marketplace-listing-grid" style={{ marginTop: '14px' }}>
          {myListings.length === 0 ? (
            <p>No listings yet. Create your first one.</p>
          ) : (
            myListings.map((listing) => (
              <div key={listing.id} className="profile-listing-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <ListingCard
                  listing={listing}
                  saved={savedIds.includes(String(listing.id))}
                  onOpen={onOpenListing}
                  onToggleSave={onToggleSave}
                  compact
                />
                <div className="listing-management-actions">
                  <button className="secondary-btn compact-btn" onClick={() => onEditListing(listing)}>Edit</button>
                  <button className="secondary-btn compact-btn" onClick={() => onRenewListing(listing.id)}>Renew</button>
                  <button className="secondary-btn compact-btn" onClick={() => onUpdateStatus(listing.id, listing.status === 'Sold' ? 'Available' : 'Sold')}>
                    {listing.status === 'Sold' ? 'In stock' : 'Mark sold'}
                  </button>
                  <button className="ghost-btn compact-btn delete-btn" onClick={() => onDeleteListing(listing.id)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

// ---------------- BUSINESS SETUP PAGE ----------------
type BusinessSetupPageProps = {
  userId: string
  businessProfile: BusinessProfile | null
  onSave: (profile: BusinessProfile) => void
  onCancel: () => void
}

export function BusinessSetupPage({ userId, businessProfile, onSave, onCancel }: BusinessSetupPageProps) {
  const [shopName, setShopName] = useState(businessProfile?.shopName || '')
  const [description, setDescription] = useState(businessProfile?.description || '')
  const [category, setCategory] = useState(businessProfile?.category || 'Retail')
  const [address, setAddress] = useState(businessProfile?.address || '')
  const [whatsapp, setWhatsapp] = useState(businessProfile?.whatsapp || '')
  const [logo, setLogo] = useState(businessProfile?.logo || '')
  const [cover, setCover] = useState(businessProfile?.cover || '')

  const handleLogoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const base64 = await fileToBase64Compressed(e.target.files[0], 150, 150)
      setLogo(base64)
    }
  }

  const handleCoverChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const base64 = await fileToBase64Compressed(e.target.files[0], 600, 200)
      setCover(base64)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSave({
      userId,
      shopName,
      description,
      category,
      address,
      whatsapp,
      logo,
      cover,
      catalog: businessProfile?.catalog || [],
      ads: businessProfile?.ads || []
    })
  }

  return (
    <section className="section-card form-card">
      <div className="section-header">
        <div>
          <p className="eyebrow">Business Shop Setup</p>
          <h2>{businessProfile ? 'Edit Business Shop' : 'Open Business Shop'}</h2>
        </div>
        <button className="ghost-btn" onClick={onCancel}>Cancel</button>
      </div>

      <form onSubmit={handleSubmit} className="form-stack">
        <label>
          <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Shop Logo</span>
          <div className="image-upload-zone" style={{ padding: '14px', marginTop: '4px' }}>
            <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} id="logo-input" />
            <label htmlFor="logo-input" style={{ cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center' }}>
              {logo ? (
                <img src={logo} alt="Logo" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
              ) : (
                <div className="upload-icon">📷</div>
              )}
              <span>Upload Shop Logo</span>
            </label>
          </div>
        </label>

        <label>
          <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Shop Cover Photo</span>
          <div className="image-upload-zone" style={{ padding: '14px', marginTop: '4px' }}>
            <input type="file" accept="image/*" onChange={handleCoverChange} style={{ display: 'none' }} id="cover-input" />
            <label htmlFor="cover-input" style={{ cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center' }}>
              {cover ? (
                <img src={cover} alt="Cover" style={{ width: '120px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
              ) : (
                <div className="upload-icon">🌅</div>
              )}
              <span>Upload Cover Banner</span>
            </label>
          </div>
        </label>

        <input value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="Shop Name (e.g. Lusaka Cakes & Bakes)" required />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Business Description (What do you sell?)" rows={3} required />
        
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>Retail</option>
          <option>Electronics</option>
          <option>Food & Catering</option>
          <option>Automotive & Services</option>
          <option>Fashion & Apparel</option>
          <option>Real Estate</option>
        </select>

        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Business Address / Pickup Location" required />
        <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp Business Number (e.g. +260...)" required />

        <button className="primary-btn" type="submit">Save Business Profile</button>
      </form>
    </section>
  )
}

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
            <div className="brand-mark" style={{ width: '48px', height: '48px', borderRadius: '12px' }}>🏪</div>
          )}
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>Shop Manager: {businessProfile.shopName}</h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>🏪 WhatsApp Business Tools</p>
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
              <span>WhatsApp Leads</span>
              <h3 style={{ color: '#10b981' }}>84</h3>
            </div>
          </div>

          <div className="sidebar-card" style={{ background: 'var(--panel)', padding: '16px' }}>
            <h3 style={{ marginTop: 0 }}>📊 Shop Analytics Breakdown</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Your WhatsApp Business Shop integration is active. Most leads are querying catalog products directly.</p>
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
            <h3 style={{ marginTop: 0 }}>➕ Add Product to Catalog</h3>
            <form onSubmit={handleAddCatalogItem} className="form-stack">
              <label>
                <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Product Image</span>
                <div className="image-upload-zone" style={{ padding: '14px', marginTop: '4px' }}>
                  <input type="file" accept="image/*" onChange={handleCatImageChange} style={{ display: 'none' }} id="catalog-image-input" />
                  <label htmlFor="catalog-image-input" style={{ cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {catImage ? (
                      <img src={catImage} alt="Product" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                    ) : (
                      <div className="upload-icon">📷</div>
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
                      <div className="catalog-img" style={{ background: 'linear-gradient(135deg, #ddd, #999)', display: 'grid', placeItems: 'center', color: 'white' }}>📷</div>
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
            <h3 style={{ marginTop: 0 }}>📢 Boost Listing (Create Sponsored Ad)</h3>
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

                <button className="primary-btn" type="submit">Launch Boost Campaign 📢</button>
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

// ---------------- PUBLIC STORE VIEW ----------------
type StoreViewPageProps = {
  shop: BusinessProfile
  listings: Listing[]
  onBack: () => void
  onMessageSeller: () => void
  onOpenListing: (listing: Listing) => void
  onToggleSave: (listingId: number) => void
  savedIds: string[]
}

export function StoreViewPage({ shop, listings, onBack, onMessageSeller, onOpenListing, onToggleSave, savedIds }: StoreViewPageProps) {
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'listings'>('catalog')
  const shopListings = listings.filter(l => l.user_id === shop.userId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <button className="ghost-btn" style={{ alignSelf: 'flex-start' }} onClick={onBack}>← Back to Stores</button>

      <section className="business-header" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        {shop.cover ? (
          <div className="business-cover" style={{ backgroundImage: `url(${shop.cover})` }} />
        ) : (
          <div className="business-cover-placeholder" />
        )}
        <div className="business-info-bar">
          {shop.logo ? (
            <div className="business-logo">
              <img src={shop.logo} alt={shop.shopName} />
            </div>
          ) : (
            <div className="business-logo" style={{ display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #2563eb, #0f766e)', color: 'white', fontWeight: 800, fontSize: '2rem' }}>
              {shop.shopName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="business-title-block">
            <h2>{shop.shopName} <span className="badge" style={{ background: '#10b981', color: 'white', fontSize: '0.72rem' }}>Shop</span></h2>
            <p style={{ fontSize: '0.88rem', margin: '4px 0 0' }}>🏪 {shop.category} | 📍 {shop.address}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a href={`https://wa.me/${shop.whatsapp.replace(/[^\d]/g, '')}`} target="_blank" rel="noreferrer" className="primary-btn compact-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', background: '#25D366' }}>
              WhatsApp 💬
            </a>
            <button className="secondary-btn compact-btn" onClick={onMessageSeller}>Chat</button>
          </div>
        </div>
        <div style={{ padding: '16px', paddingTop: 0 }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{shop.description}</p>
        </div>
      </section>

      {/* Subtab selection */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', paddingBottom: '2px', gap: '8px' }}>
        <button className={`top-nav-btn ${activeSubTab === 'catalog' ? 'active' : ''}`} style={{ borderRadius: '8px' }} onClick={() => setActiveSubTab('catalog')}>Catalog Products</button>
        <button className={`top-nav-btn ${activeSubTab === 'listings' ? 'active' : ''}`} style={{ borderRadius: '8px' }} onClick={() => setActiveSubTab('listings')}>Active Listings ({shopListings.length})</button>
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
                    <div className="catalog-img" style={{ background: '#ddd', display: 'grid', placeItems: 'center', color: 'white' }}>📷</div>
                  )}
                  <div className="catalog-details">
                    <div>
                      <h4 style={{ margin: 0 }}>{item.name}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0' }}>{item.description}</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                      <strong>{item.price}</strong>
                      <a href={`https://wa.me/${shop.whatsapp.replace(/[^\d]/g, '')}?text=Hi, I'm interested in your product: ${item.name}`} target="_blank" rel="noreferrer" className="primary-btn compact-btn" style={{ minHeight: '26px', padding: '4px 8px', background: '#25D366', fontSize: '0.72rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
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
    </div>
  )
}

// ---------------- SETTINGS PAGE ----------------
type SettingsPageProps = {
  theme: 'light' | 'dark'
  location: string
  cardSize: number
  onCardSizeChange: (size: number) => void
  onToggleTheme: () => void
  onGoHome: () => void
}

export function SettingsPage({ theme, location, cardSize, onCardSizeChange, onToggleTheme, onGoHome }: SettingsPageProps) {
  return (
    <section className="section-card settings-card">
      <div className="section-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h2>Control the Experience</h2>
        </div>
      </div>
      <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
        <div>
          <h3>Theme</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Switch between light and dark mode.</p>
        </div>
        <button className="secondary-btn" onClick={onToggleTheme}>
          {theme === 'light' ? 'Dark mode' : 'Light mode'}
        </button>
      </div>

      <div className="setting-row" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px 0', borderTop: '1px solid var(--border)' }}>
        <div style={{ width: '100%' }}>
          <h3>Card Size</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '8px' }}>Adjust the size of listings on the homepage feed.</p>
        </div>
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input type="range" min="130" max="260" value={cardSize} onChange={(event) => onCardSizeChange(Number(event.target.value))} style={{ flexGrow: 1, accentColor: '#2563eb', cursor: 'pointer' }} />
          <span style={{ fontWeight: 'bold', minWidth: '45px', textAlign: 'right' }}>{cardSize}px</span>
        </div>
      </div>

      <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--border)' }}>
        <div>
          <h3>Location</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Currently browsing around {location}.</p>
        </div>
        <button className="secondary-btn" onClick={onGoHome}>Update</button>
      </div>
    </section>
  )
}
