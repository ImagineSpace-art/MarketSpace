import { useState, type FormEvent, type ChangeEvent } from 'react'
import type { BusinessProfile } from '../types'
import { uploadImageToSupabase } from '../features/marketplace/ImageUploader'

// ---------------- STORE SETUP PAGE ----------------
type StoreSetupPageProps = {
    userId: string
    businessProfile: BusinessProfile | null
    onSave: (profile: BusinessProfile) => void
    onCancel: () => void
}

export function StoreSetupPage({ userId, businessProfile, onSave, onCancel }: StoreSetupPageProps) {
    const [shopName, setShopName] = useState(businessProfile?.shopName || '')
    const [description, setDescription] = useState(businessProfile?.description || '')
    const [category, setCategory] = useState(businessProfile?.category || 'Retail')
    const [operationType, setOperationType] = useState<'online' | 'physical' | 'omnichannel'>(businessProfile?.operationType || 'omnichannel')
    const [address, setAddress] = useState(businessProfile?.address || '')
    const [whatsapp, setWhatsapp] = useState(businessProfile?.whatsapp || '')
    const [logo, setLogo] = useState(businessProfile?.logo || '')
    const [cover, setCover] = useState(businessProfile?.cover || '')

    const [accentColor, setAccentColor] = useState(businessProfile?.accentColor || '#2563eb')
    const [announcementBar, setAnnouncementBar] = useState(businessProfile?.announcementBar || '')
    const [workingHours, setWorkingHours] = useState(businessProfile?.customerCare?.workingHours || 'Mon-Sat: 08:00 - 18:00')
    const [deliveryPolicy, setDeliveryPolicy] = useState(businessProfile?.customerCare?.deliveryPolicy || 'Same-day delivery in Lusaka for orders placed before 14:00.')
    const [returnPolicy, setReturnPolicy] = useState(businessProfile?.customerCare?.returnPolicy || '3-day inspection & exchange guarantee.')
    const [supportPhone, setSupportPhone] = useState(businessProfile?.customerCare?.phone || businessProfile?.whatsapp || '')
    const [supportEmail, setSupportEmail] = useState(businessProfile?.customerCare?.email || '')
    
    // Store Collections / Department state
    const [collections, setCollections] = useState(businessProfile?.collections || [
        { id: '1', name: 'New Arrivals' },
        { id: '2', name: 'Best Sellers' }
    ])
    const [newColName, setNewColName] = useState('')

    const PRESET_ACCENTS = ['#2563eb', '#10b981', '#000000', '#be185d', '#ea580c', '#8b5cf6', '#1e293b']

    const handleAddCollection = () => {
        if (!newColName.trim()) return
        const created = {
            id: String(Date.now()),
            name: newColName.trim()
        }
        setCollections(prev => [...prev, created])
        setNewColName('')
    }

    const handleRemoveCollection = (colId: string) => {
        setCollections(prev => prev.filter(c => c.id !== colId))
    }

    const handleLogoChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const url = await uploadImageToSupabase(e.target.files[0], 'marketspace-media', 'logos')
            setLogo(url)
        }
    }

    const handleCoverChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const url = await uploadImageToSupabase(e.target.files[0], 'marketspace-media', 'covers')
            setCover(url)
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
            operationType,
            accentColor,
            announcementBar,
            collections,
            customerCare: {
                workingHours,
                deliveryPolicy,
                returnPolicy,
                phone: supportPhone || whatsapp,
                email: supportEmail,
                address
            },
            catalog: businessProfile?.catalog || [],
            ads: businessProfile?.ads || []
        })
    }

    return (
        <section className="section-card form-card">
            <div className="section-header">
                <div>
                    <p className="eyebrow">Store Customizer & Setup</p>
                    <h2>{businessProfile ? 'Edit Storefront & Branding' : 'Create Storefront'}</h2>
                </div>
                <button className="ghost-btn" onClick={onCancel}>Cancel</button>
            </div>

            <form onSubmit={handleSubmit} className="form-stack" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 1. Basic Store Information */}
                <div style={{ padding: '16px', background: 'var(--panel)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <h3 style={{ marginTop: 0, fontSize: '1.05rem', color: 'var(--text)' }}>1. Basic Store Information</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                        <input value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="Shop Name (e.g. Balenciaga Boutique)" required style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Business Description & Tagline" rows={3} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit' }} />
                        
                        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}>
                            <option>Retail & Boutique</option>
                            <option>Electronics & Tech</option>
                            <option>Food & Catering</option>
                            <option>Automotive & Services</option>
                            <option>Fashion & Apparel</option>
                            <option>Health & Beauty</option>
                        </select>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>Store Operation Model</span>
                            <select value={operationType} onChange={(e) => setOperationType(e.target.value as any)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}>
                                <option value="omnichannel">Omnichannel (Online & Physical Shop)</option>
                                <option value="online">Online Only (Delivery / Courier Services Only)</option>
                                <option value="physical">Physical Only (Over-The-Counter Transactions Only)</option>
                            </select>
                        </label>

                        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Physical Address / Branch Location" required style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
                        <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Business WhatsApp Number (e.g. +260...)" required style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
                    </div>
                </div>

                {/* 2. Store Visual Identity & Branding Theme */}
                <div style={{ padding: '16px', background: 'var(--panel)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <h3 style={{ marginTop: 0, fontSize: '1.05rem', color: 'var(--text)' }}>2. Visual Branding & Colors</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
                        <div>
                            <span style={{ fontSize: '0.86rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Store Primary Accent Color</span>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                {PRESET_ACCENTS.map((hex) => (
                                    <button
                                        key={hex}
                                        type="button"
                                        onClick={() => setAccentColor(hex)}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            backgroundColor: hex,
                                            border: accentColor === hex ? '3px solid var(--text)' : '1px solid var(--border)',
                                            cursor: 'pointer',
                                            outline: 'none'
                                        }}
                                    />
                                ))}
                                <input
                                    type="color"
                                    value={accentColor}
                                    onChange={(e) => setAccentColor(e.target.value)}
                                    style={{ width: '36px', height: '36px', border: 'none', background: 'none', cursor: 'pointer' }}
                                />
                            </div>
                        </div>

                        <div>
                            <span style={{ fontSize: '0.86rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Store Top Announcement Banner Text</span>
                            <input
                                value={announcementBar}
                                onChange={(e) => setAnnouncementBar(e.target.value)}
                                placeholder="e.g. 🎁 Free delivery in Lusaka on orders above ZMW 500!"
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                            />
                        </div>

                        {/* Logo & Cover Inputs */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <label>
                                <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Store Logo</span>
                                <div className="image-upload-zone" style={{ padding: '12px', marginTop: '4px' }}>
                                    <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} id="logo-input" />
                                    <label htmlFor="logo-input" style={{ cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        {logo ? (
                                            <img src={logo} alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                                        ) : (
                                            <div className="upload-icon"><span className="material-icons">add_a_photo</span></div>
                                        )}
                                        <span style={{ fontSize: '0.82rem' }}>Upload Logo</span>
                                    </label>
                                </div>
                            </label>

                            <label>
                                <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Cover Banner</span>
                                <div className="image-upload-zone" style={{ padding: '12px', marginTop: '4px' }}>
                                    <input type="file" accept="image/*" onChange={handleCoverChange} style={{ display: 'none' }} id="cover-input" />
                                    <label htmlFor="cover-input" style={{ cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        {cover ? (
                                            <img src={cover} alt="Cover" style={{ width: '80px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                                        ) : (
                                            <div className="upload-icon"><span className="material-icons">landscape</span></div>
                                        )}
                                        <span style={{ fontSize: '0.82rem' }}>Upload Banner</span>
                                    </label>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* 3. Custom Store Departments & Sub-Pages */}
                <div style={{ padding: '16px', background: 'var(--panel)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <h3 style={{ marginTop: 0, fontSize: '1.05rem', color: 'var(--text)' }}>3. Custom Store Departments & Navigation Tabs</h3>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Create custom sub-pages for your store (e.g. Bags, Shoes, Laptops, Accessories).</p>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <input
                            value={newColName}
                            onChange={(e) => setNewColName(e.target.value)}
                            placeholder="New Department / Page Name (e.g. Handbags)"
                            style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                        />
                        <button type="button" className="secondary-btn" onClick={handleAddCollection} style={{ padding: '10px 16px' }}>+ Add Department</button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                        {collections.map((col) => (
                            <div key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
                                <span style={{ fontWeight: 600 }}>{col.name}</span>
                                <button type="button" onClick={() => handleRemoveCollection(col.id)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. Customer Care & Store Policies */}
                <div style={{ padding: '16px', background: 'var(--panel)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <h3 style={{ marginTop: 0, fontSize: '1.05rem', color: 'var(--text)' }}>4. Customer Care & Store Policies</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                        <input value={workingHours} onChange={(e) => setWorkingHours(e.target.value)} placeholder="Business Working Hours (e.g. Mon-Sat: 08:00 - 18:00)" style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
                        <textarea value={deliveryPolicy} onChange={(e) => setDeliveryPolicy(e.target.value)} placeholder="Delivery Policy (e.g. Same-day delivery in Lusaka)" rows={2} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit' }} />
                        <textarea value={returnPolicy} onChange={(e) => setReturnPolicy(e.target.value)} placeholder="Return & Refund Policy (e.g. 3-day guarantee)" rows={2} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit' }} />
                        <input value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} placeholder="Customer Care Direct Phone" style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
                        <input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} placeholder="Customer Support Email" style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
                    </div>
                </div>

                <button className="primary-btn" type="submit" style={{ padding: '14px', fontSize: '1rem' }}>Save & Publish Storefront Settings</button>
            </form>
        </section>
    )
}