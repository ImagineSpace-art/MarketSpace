import { useState, type FormEvent, type ChangeEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { CATEGORY_OPTIONS, CONDITION_OPTIONS, DELIVERY_OPTIONS } from '../features/marketplace/constants'
import type { Listing } from '../types'

function fileToBase64(file: File): Promise<string> {
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
        const max_width = 600
        const max_height = 500
        if (width > height) {
          if (width > max_width) {
            height = Math.round((height * max_width) / width)
            width = max_width
          }
        } else {
          if (height > max_height) {
            width = Math.round((width * max_height) / height)
            height = max_height
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.onerror = (e) => reject(e)
    }
    reader.onerror = (e) => reject(e)
  })
}

type ListingDetailPageProps = {
  selectedListing: Listing | null
  session: Session | null
  onBack: () => void
  onMessageSeller: () => void
  onToggleSave: (listingId: number) => void
  onEditListing: (listing: Listing) => void
}

export function ListingDetailPage({ selectedListing, session, onBack, onMessageSeller, onToggleSave, onEditListing }: ListingDetailPageProps) {
  return (
    <section className="section-card detail-card">
      {selectedListing ? (
        <>
          <div className="section-header">
            <div>
              <p className="eyebrow">Listing details</p>
              <h2>{selectedListing.title}</h2>
            </div>
            <button className="ghost-btn" onClick={onBack}>Back</button>
          </div>
          <div className="detail-body" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            {selectedListing.images && selectedListing.images.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', borderRadius: '12px' }}>
                {selectedListing.images.map((img, idx) => (
                  <img key={idx} src={img} alt={`Listing visual ${idx + 1}`} style={{ height: '260px', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--border)' }} />
                ))}
              </div>
            )}
            <div>
              <p style={{ fontSize: '1.05rem', lineHeight: '1.6', margin: '8px 0 16px' }}>{selectedListing.description || 'No description provided.'}</p>
              <div className="detail-meta">
                <div><span>Price</span><strong>{selectedListing.price}</strong></div>
                <div><span>Category</span><strong>{selectedListing.category}</strong></div>
                <div><span>Location</span><strong>{selectedListing.location}</strong></div>
                <div><span>Status</span><strong>{selectedListing.status ?? 'Available'}</strong></div>
              </div>
            </div>
            <div className="detail-actions" style={{ marginTop: '16px' }}>
              <button className="primary-btn" onClick={onMessageSeller}>Message seller</button>
              <button className="secondary-btn" onClick={() => onToggleSave(Number(selectedListing.id))}>Save</button>
              {session?.user?.id === selectedListing.user_id ? (
                <button className="secondary-btn" onClick={() => onEditListing(selectedListing)}>Edit listing</button>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
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
}: ListingFormPageProps) {
  const [errorText, setErrorText] = useState('')

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setErrorText('')
    if (event.target.files) {
      const filesArray = Array.from(event.target.files)
      try {
        const promises = filesArray.map((file) => fileToBase64(file))
        const base64Images = await Promise.all(promises)
        onUploadedImagesChange([...uploadedImages, ...base64Images])
      } catch {
        setErrorText('Failed to upload/compress some images.')
      }
    }
  }

  const handleRemoveImage = (index: number) => {
    onUploadedImagesChange(uploadedImages.filter((_, idx) => idx !== index))
  }

  return (
    <section className="section-card form-card">
      <div className="section-header">
        <div>
          <p className="eyebrow">{mode === 'create' ? 'Create listing' : 'Edit listing'}</p>
          <h2>{mode === 'create' ? 'Sell something new' : 'Update your listing'}</h2>
        </div>
        <button className="ghost-btn" onClick={onCancel}>Cancel</button>
      </div>
      <form onSubmit={onSubmit} className="form-stack">
        <input value={title} onChange={(event) => onTitleChange(event.target.value)} placeholder="Title" required />
        <textarea value={description} onChange={(event) => onDescriptionChange(event.target.value)} placeholder="Description" rows={4} />
        
        {/* IMAGE UPLOAD CONTAINER */}
        <label>
          <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Photos ({uploadedImages.length})</span>
          <div className="image-upload-zone" style={{ marginTop: '4px' }}>
            <input type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} id="listing-file-input" />
            <label htmlFor="listing-file-input" style={{ cursor: 'pointer' }}>
              <div className="upload-icon">📷</div>
              <span>Click or Drop images to upload</span>
            </label>
          </div>
          {errorText && <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: '4px 0 0' }}>{errorText}</p>}
          <div className="upload-thumbnails">
            {uploadedImages.map((img, index) => (
              <div key={index} className="upload-thumbnail">
                <img src={img} alt={`Preview ${index + 1}`} />
                <button type="button" className="remove-thumb-btn" onClick={() => handleRemoveImage(index)}>×</button>
              </div>
            ))}
          </div>
        </label>

        <input value={price} onChange={(event) => onPriceChange(event.target.value)} placeholder="Price" required />
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

        <select value={condition} onChange={(event) => onConditionChange(event.target.value)}>
          {CONDITION_OPTIONS.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={deliveryOption} onChange={(event) => onDeliveryOptionChange(event.target.value)}>
          {DELIVERY_OPTIONS.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={listingType} onChange={(event) => onListingTypeChange(event.target.value)}>
          <option value="single">Single item</option>
          <option value="stock">Stock listing</option>
        </select>
        <button className="primary-btn" type="submit">{mode === 'create' ? 'Publish listing' : 'Save changes'}</button>
      </form>
    </section>
  )
}
