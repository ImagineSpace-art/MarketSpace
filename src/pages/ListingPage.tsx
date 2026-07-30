import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { CATEGORY_OPTIONS, CONDITION_OPTIONS, DELIVERY_OPTIONS } from '../features/marketplace/constants'
import type { Listing } from '../types'
import { formatZMWPrice } from '../utils/formatPrice'
import { uploadImageToSupabase } from '../features/marketplace/ImageUploader'

type ListingDetailPageProps = {
  selectedListing: Listing | null
  session: Session | null
  onBack: () => void
  onMessageSeller: (customMessage?: string) => void
  onToggleSave: (listingId: number) => void
  onEditListing: (listing: Listing) => void
  allBusinesses: Record<string, any>
  onVisitStore: (userId: string) => void
}

export function ListingDetailPage({
  selectedListing,
  session,
  onBack,
  onMessageSeller,
  onToggleSave,
  onEditListing,
  allBusinesses,
  onVisitStore
}: ListingDetailPageProps) {
  const navigate = useNavigate()
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [quantity, setQuantity] = useState(1)
  const [deliveryOption, setDeliveryOption] = useState(selectedListing?.delivery_option || '')
  const [phone, setPhone] = useState('')
  const [locationAddress, setLocationAddress] = useState('')
  const [copied, setCopied] = useState(false)
  const [activeImageIdx, setActiveImageIdx] = useState(0)

  if (!selectedListing) return null

  const totalImages = selectedListing.images?.length || 0

  const handlePrevImage = () => {
    setActiveImageIdx((prev) => (prev === 0 ? totalImages - 1 : prev - 1))
  }

  const handleNextImage = () => {
    setActiveImageIdx((prev) => (prev === totalImages - 1 ? 0 : prev + 1))
  }

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    )
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleBuyNow = () => {
    const buyPayload = {
      colors: selectedColors,
      quantity,
      deliveryOption,
      phone,
      location: locationAddress,
      isService: selectedListing.listing_type === 'service'
    }
    const customMessage = `[ORDER_CARD]${JSON.stringify(buyPayload)}`
    onMessageSeller(customMessage)
  }

  const isService = selectedListing.listing_type === 'service'
  const deliveryOptionsList = isService
    ? ["Online / Remote", "At Buyer's Location", "At Seller's Location", "Flexible / Negotiable"]
    : ["Meetup", "Shipping", "Pickup", "Negotiable"]

  return (
    <section className="section-card detail-card" style={{ background: 'transparent', border: 'none', padding: 0, boxShadow: 'none' }}>
      <div className="section-header" style={{ marginBottom: '20px', background: 'var(--surface)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p className="eyebrow" style={{ margin: 0 }}>Listing details</p>
          <h2 style={{ margin: '4px 0 0 0', fontSize: '1.4rem' }}>{selectedListing.title}</h2>
        </div>
        <button className="ghost-btn" onClick={onBack}>Back</button>
      </div>

      <div className="listing-detail-container">
        {/* Left Column: Media, Details, Metadata */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          {selectedListing.images && selectedListing.images.length > 0 && (
            <div style={{ position: 'relative', width: '100%', height: '400px', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid var(--border)' }}>

              {/* Active Image */}
              <img
                src={selectedListing.images[activeImageIdx]}
                alt={`Listing visual ${activeImageIdx + 1}`}
                style={{
                  maxHeight: '100%',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  transition: 'all 0.3s'
                }}
              />

              {/* Left Arrow Button */}
              {selectedListing.images.length > 1 && (
                <button
                  type="button"
                  onClick={handlePrevImage}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(15, 23, 42, 0.65)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                    outline: 'none'
                  }}
                >
                  <span className="material-icons">chevron_left</span>
                </button>
              )}

              {/* Right Arrow Button */}
              {selectedListing.images.length > 1 && (
                <button
                  type="button"
                  onClick={handleNextImage}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(15, 23, 42, 0.65)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                    outline: 'none'
                  }}
                >
                  <span className="material-icons">chevron_right</span>
                </button>
              )}

              {/* Dots indicator */}
              {selectedListing.images.length > 1 && (
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  backgroundColor: 'rgba(15, 23, 42, 0.7)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  zIndex: 10
                }}>
                  {activeImageIdx + 1} / {selectedListing.images.length}
                </div>
              )}
            </div>
          )}

          <div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: 'var(--text)' }}>Description</h3>
            <p style={{ fontSize: '1.02rem', lineHeight: '1.6', color: 'var(--text-secondary)', margin: 0 }}>
              {selectedListing.description || 'No description provided.'}
            </p>
          </div>

          {/* Rows of Metadata Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginTop: '10px' }}>
            <div style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
                <span className="material-icons" style={{ fontSize: '20px' }}>payments</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</span>
                <strong style={{ display: 'block', fontSize: '0.98rem', color: 'var(--text)', marginTop: '2px' }}>{formatZMWPrice(selectedListing.price)}</strong>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
                <span className="material-icons" style={{ fontSize: '20px' }}>sell</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</span>
                <strong style={{ display: 'block', fontSize: '0.98rem', color: 'var(--text)', marginTop: '2px' }}>{selectedListing.category}</strong>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', flexShrink: 0 }}>
                <span className="material-icons" style={{ fontSize: '20px' }}>place</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location</span>
                <strong style={{ display: 'block', fontSize: '0.98rem', color: 'var(--text)', marginTop: '2px' }}>{selectedListing.location}</strong>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', flexShrink: 0 }}>
                <span className="material-icons" style={{ fontSize: '20px' }}>info</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</span>
                <strong style={{ display: 'block', fontSize: '0.98rem', color: 'var(--text)', marginTop: '2px' }}>{selectedListing.status ?? 'Available'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Buy Box Card */}
        <div className="buy-box-panel">
          <div>
            <span style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Price</span>
            <h3 style={{ color: '#2563eb', marginTop: '4px' }}>{formatZMWPrice(selectedListing.price)}</h3>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <span style={{ fontSize: '0.84rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              <span className="material-icons" style={{ fontSize: '16px' }}>check_circle</span>
              {isService ? 'Service Available' : (selectedListing.status === 'Sold' ? 'Sold out' : 'In Stock & Ready')}
            </span>
          </div>

          {/* Color Selection (Multi-select) */}
          {selectedListing.available_colors && selectedListing.available_colors.length > 0 && (
            <label>
              <span>Select Color(s)</span>
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                {selectedListing.available_colors.map((color) => {
                  const isChosen = selectedColors.includes(color)
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => toggleColor(color)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: color,
                        border: isChosen ? '3px solid #2563eb' : '1px solid var(--border)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                        cursor: 'pointer',
                        position: 'relative',
                        outline: 'none',
                        transition: 'transform 0.1s'
                      }}
                      title={color}
                    />
                  )
                })}
              </div>
            </label>
          )}

          {/* Quantity Selector */}
          <label>
            <span>Quantity</span>
            <select value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}>
              {[...Array(10)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </label>

          {/* Delivery Option Selector */}
          <label>
            <span>Delivery Option</span>
            <select value={deliveryOption} onChange={(e) => setDeliveryOption(e.target.value)}>
              <option value="">Select Option</option>
              {deliveryOptionsList.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>

          {/* Mobile Phone Input */}
          <label>
            <span>Your Mobile Number</span>
            <input
              type="tel"
              placeholder="e.g. +260977123456"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>

          {/* Buyer Location Input */}
          <label>
            <span>Your Delivery / Service Location</span>
            <input
              type="text"
              placeholder="e.g. Cairo Road Branch"
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
            />
          </label>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            <button className="primary-btn" style={{ width: '100%', padding: '12px' }} onClick={handleBuyNow}>
              Buy Now
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button className="secondary-btn" onClick={() => onToggleSave(Number(selectedListing.id))} style={{ padding: '10px' }}>
                Wishlist
              </button>
              <button className="secondary-btn" onClick={handleShare} style={{ padding: '10px' }}>
                {copied ? 'Copied!' : 'Share'}
              </button>
            </div>

            {/* Visit Store / Seller Profile Button */}
            {selectedListing.user_id && (
              allBusinesses[selectedListing.user_id] ? (
                <button
                  type="button"
                  onClick={() => onVisitStore(selectedListing.user_id || '')}
                  className="secondary-btn"
                  style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <span className="material-icons" style={{ fontSize: '18px' }}>storefront</span>
                  Visit Store: {allBusinesses[selectedListing.user_id].shopName}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate(`/seller/${selectedListing.user_id}`)}
                  className="secondary-btn"
                  style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <span className="material-icons" style={{ fontSize: '18px' }}>person</span>
                  Seller Profile
                </button>
              )
            )}

            {/* Owner Edit Actions */}
            {session?.user?.id === selectedListing.user_id && (
              <button className="secondary-btn" style={{ width: '100%', borderColor: '#f59e0b', color: '#d97706', padding: '10px' }} onClick={() => onEditListing(selectedListing)}>
                Edit Listing
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

type ListingFormPageProps = {
  mode: 'create' | 'edit'
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
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void> | void
  onCancel: () => void
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onPriceChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onLocationChange: (value: string) => void
  onStatusChange: (value: string) => void
  onListingTypeChange: (value: string) => void
  onConditionChange: (value: string) => void
  onDeliveryOptionChange: (value: string) => void
  availableColors: string[]
  onAvailableColorsChange: (colors: string[]) => void
}

export function ListingFormPage({
  mode,
  title,
  description,
  price,
  category,
  location,
  status,
  listingType,
  condition,
  deliveryOption,
  uploadedImages,
  onUploadedImagesChange,
  onSubmit,
  onCancel,
  onTitleChange,
  onDescriptionChange,
  onPriceChange,
  onCategoryChange,
  onLocationChange,
  onStatusChange,
  onListingTypeChange,
  onConditionChange,
  onDeliveryOptionChange,
  availableColors,
  onAvailableColorsChange,
}: ListingFormPageProps) {
  const [errorText, setErrorText] = useState('')
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [customColor, setCustomColor] = useState('#2563eb')

  const [listingKind, setListingKind] = useState<'item' | 'service' | null>(() => {
    if (mode === 'edit') {
      return listingType === 'service' ? 'service' : 'item'
    }
    return null
  })

  const PRESET_COLORS = ['#000000', '#ffffff', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#6b7280']

  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setErrorText('')
    if (event.target.files && event.target.files.length > 0) {
      const filesArray = Array.from(event.target.files)
      setIsUploading(true)
      try {
        const promises = filesArray.map((file) => uploadImageToSupabase(file, 'marketspace-media', 'listings'))
        const uploadedUrls = await Promise.all(promises)
        onUploadedImagesChange([...uploadedImages, ...uploadedUrls])
      } catch {
        setErrorText('Failed to upload/compress some images.')
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleRemoveImage = (index: number) => {
    onUploadedImagesChange(uploadedImages.filter((_, idx) => idx !== index))
  }

  const handleAddColor = (color: string) => {
    if (!availableColors.includes(color)) {
      onAvailableColorsChange([...availableColors, color])
    }
  }

  const handleRemoveColor = (color: string) => {
    onAvailableColorsChange(availableColors.filter((c) => c !== color))
  }

  // Listing kind selection step UI
  if (listingKind === null) {
    return (
      <section className="section-card form-card" style={{ maxWidth: '600px', margin: '40px auto', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <p className="eyebrow" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Create new listing</p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0 0', color: 'var(--text)' }}>What are you listing today?</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.92rem' }}>Choose a type to get started with the right fields.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
          {/* Item Card */}
          <button
            type="button"
            onClick={() => {
              setListingKind('item')
              onListingTypeChange('item')
              onDeliveryOptionChange('Meetup')
            }}
            className="card-option-btn"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s, border-color 0.2s',
              outline: 'none'
            }}
          >
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <span className="material-icons" style={{ fontSize: '28px' }}>shopping_bag</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--text)' }}>Item for Sale</strong>
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>Sell physical goods like electronics, clothing, vehicles, or home goods.</span>
            </div>
          </button>

          {/* Service Card */}
          <button
            type="button"
            onClick={() => {
              setListingKind('service')
              onListingTypeChange('service')
              onDeliveryOptionChange('Online/Remote')
            }}
            className="card-option-btn"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s, border-color 0.2s',
              outline: 'none'
            }}
          >
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <span className="material-icons" style={{ fontSize: '28px' }}>build</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--text)' }}>Service</strong>
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>Advertise professional services like tutoring, plumbing, design, or repairs.</span>
            </div>
          </button>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button type="button" className="ghost-btn" style={{ padding: '10px 24px' }} onClick={onCancel}>Cancel</button>
        </div>
      </section>
    )
  }

  return (
    <section className="section-card form-card">
      <div className="section-header" style={{ marginBottom: '12px' }}>
        <div>
          <p className="eyebrow">
            {mode === 'create' ? `Create ${listingKind} listing` : `Edit ${listingKind} listing`}
          </p>
          <h2>{mode === 'create' ? 'Sell something new' : 'Update your listing'}</h2>
        </div>
        <button
          className="ghost-btn"
          onClick={() => {
            if (mode === 'create') {
              setListingKind(null)
            } else {
              onCancel()
            }
          }}
        >
          {mode === 'create' ? 'Back' : 'Cancel'}
        </button>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('edit')}
          style={{
            padding: '8px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'edit' ? '2px solid #2563eb' : 'none',
            fontWeight: activeTab === 'edit' ? 600 : 400,
            color: activeTab === 'edit' ? 'var(--text)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.92rem',
            outline: 'none'
          }}
        >
          Edit Form
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          style={{
            padding: '8px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'preview' ? '2px solid #2563eb' : 'none',
            fontWeight: activeTab === 'preview' ? 600 : 400,
            color: activeTab === 'preview' ? 'var(--text)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.92rem',
            outline: 'none'
          }}
        >
          Preview Listing
        </button>
      </div>

      {activeTab === 'preview' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '10px 14px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-icons" style={{ fontSize: '18px' }}>visibility</span>
            <span>Preview Mode — This is how your listing will appear to buyers</span>
          </div>
          <ListingDetailPage
            selectedListing={{
              id: -1,
              title: title || 'Untitled Listing',
              description: description || 'No description provided.',
              price: Number(price) || 0,
              category,
              location,
              status: status || 'Available',
              listing_type: listingKind,
              condition: listingKind === 'service' ? 'New' : condition,
              delivery_option: deliveryOption,
              images: uploadedImages,
              available_colors: listingKind === 'service' ? [] : availableColors,
              seller_name: 'You (Preview)',
              sponsored: false
            }}
            session={null}
            onBack={() => setActiveTab('edit')}
            onMessageSeller={() => { }}
            onToggleSave={() => { }}
            onEditListing={() => { }}
            allBusinesses={{}}
            onVisitStore={() => { }}
          />
        </div>
      ) : (
        <form onSubmit={onSubmit} className="form-stack">
          {/* IMAGE UPLOAD CONTAINER */}
          <label>
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Photos ({uploadedImages.length})</span>
            <div className="image-upload-zone" style={{ marginTop: '4px' }}>
              <input type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} id="listing-file-input" />
              <label htmlFor="listing-file-input" style={{ cursor: 'pointer' }}>
                <div className="upload-icon"><span className="material-icons">add_a_photo</span></div>
                <span>Click or Drop images to upload</span>
              </label>
            </div>
            {isUploading && <p style={{ color: 'var(--primary)', fontSize: '0.82rem', margin: '6px 0 0', fontWeight: 600 }}>Compressing & uploading WebP images...</p>}
            {errorText && <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: '4px 0 0' }}>{errorText}</p>}
            <div className="upload-thumbnails">
              {uploadedImages.map((img, index) => (
                <div key={index} className="upload-thumbnail">
                  <img src={img} alt={`Preview ${index + 1}`} loading="lazy" />
                  <button type="button" className="remove-thumb-btn" onClick={() => handleRemoveImage(index)}>×</button>
                </div>
              ))}
            </div>
          </label>

          <input value={title} onChange={(event) => onTitleChange(event.target.value)} placeholder="Title" required />
          <textarea value={description} onChange={(event) => onDescriptionChange(event.target.value)} placeholder="Description" rows={4} />

          <input value={price} onChange={(event) => onPriceChange(event.target.value)} placeholder={listingKind === 'service' ? "Price (e.g. 150 or 50/hour)" : "Price"} required />

          {/* COLOR PICKER SECTION (Hiden for Services) */}
          {listingKind !== 'service' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '8px 0' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)' }}>Available Colors</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleAddColor(color)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: color,
                      border: availableColors.includes(color) ? '2px solid #2563eb' : '1px solid var(--border)',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      outline: 'none'
                    }}
                    title={color}
                  />
                ))}

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px' }}>
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    style={{ width: '32px', height: '32px', border: 'none', padding: 0, background: 'none', cursor: 'pointer' }}
                  />
                  <button
                    type="button"
                    className="secondary-btn compact-btn"
                    onClick={() => handleAddColor(customColor)}
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    + Add Color
                  </button>
                </div>
              </div>

              {availableColors.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px', padding: '8px', background: 'var(--panel)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  {availableColors.map((color) => (
                    <div
                      key={color}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '16px',
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        fontSize: '0.78rem'
                      }}
                    >
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: color, border: '1px solid rgba(0,0,0,0.15)' }} />
                      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{color.toUpperCase()}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(color)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 2px', fontSize: '1rem', fontWeight: 'bold', lineHeight: 1 }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <select value={category} onChange={(event) => onCategoryChange(event.target.value)}>
            {CATEGORY_OPTIONS.filter((item) => item !== 'All').map((item) => <option key={item}>{item}</option>)}
          </select>
          <input value={location} onChange={(event) => onLocationChange(event.target.value)} placeholder="Location" required />

          {mode === 'edit' && (
            <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
              <option>Available</option>
              <option>Reserved</option>
              <option>Sold</option>
            </select>
          )}

          {/* Condition Select (Hidden for Services) */}
          {listingKind !== 'service' && (
            <select value={condition} onChange={(event) => onConditionChange(event.target.value)}>
              {CONDITION_OPTIONS.map((item) => <option key={item}>{item}</option>)}
            </select>
          )}

          {/* Delivery Option select */}
          {listingKind === 'service' ? (
            <select value={deliveryOption} onChange={(event) => onDeliveryOptionChange(event.target.value)}>
              <option value="Online/Remote">Online / Remote</option>
              <option value="At Buyer's Location">At Buyer's Location</option>
              <option value="At Seller's Location">At Seller's Location</option>
              <option value="Flexible">Flexible / Negotiable</option>
            </select>
          ) : (
            <select value={deliveryOption} onChange={(event) => onDeliveryOptionChange(event.target.value)}>
              {DELIVERY_OPTIONS.map((item) => <option key={item}>{item}</option>)}
            </select>
          )}

          <button className="primary-btn" type="submit">{mode === 'create' ? 'Publish listing' : 'Save changes'}</button>
        </form>
      )}
    </section>
  )
}
