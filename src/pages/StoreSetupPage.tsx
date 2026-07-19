import { useState, type FormEvent, type ChangeEvent } from 'react'
import type { BusinessProfile } from '../types'
import { fileToBase64Compressed } from '../features/marketplace/FileToBase64'

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
                    <p className="eyebrow">Store Setup</p>
                    <h2>{businessProfile ? 'Edit Store' : 'Create Store'}</h2>
                </div>
                <button className="ghost-btn" onClick={onCancel}>Cancel</button>
            </div>

            <form onSubmit={handleSubmit} className="form-stack">
                <label>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Store Logo</span>
                    <div className="image-upload-zone" style={{ padding: '14px', marginTop: '4px' }}>
                        <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} id="logo-input" />
                        <label htmlFor="logo-input" style={{ cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center' }}>
                            {logo ? (
                                <img src={logo} alt="Logo" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                            ) : (
                                <div className="upload-icon"><span className="material-icons">add_a_photo</span></div>
                            )}
                            <span>Upload Store Logo</span>
                        </label>
                    </div>
                </label>

                <label>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Store Cover Photo</span>
                    <div className="image-upload-zone" style={{ padding: '14px', marginTop: '4px' }}>
                        <input type="file" accept="image/*" onChange={handleCoverChange} style={{ display: 'none' }} id="cover-input" />
                        <label htmlFor="cover-input" style={{ cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center' }}>
                            {cover ? (
                                <img src={cover} alt="Cover" style={{ width: '120px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                            ) : (
                                <div className="upload-icon"><span className="material-icons">landscape</span></div>
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
                <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Business Number (e.g. +260...)" required />

                <button className="primary-btn" type="submit">Save Business Profile</button>
            </form>
        </section>
    )
}