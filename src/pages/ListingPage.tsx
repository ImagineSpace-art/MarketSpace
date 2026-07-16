import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { CATEGORY_OPTIONS, CONDITION_OPTIONS, DELIVERY_OPTIONS } from '../features/marketplace/constants'
import type { Listing } from '../types'

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
          <div className="detail-body">
            <div>
              <p>{selectedListing.description || 'No description provided.'}</p>
              <div className="detail-meta">
                <div><span>Price</span><strong>{selectedListing.price}</strong></div>
                <div><span>Category</span><strong>{selectedListing.category}</strong></div>
                <div><span>Location</span><strong>{selectedListing.location}</strong></div>
                <div><span>Status</span><strong>{selectedListing.status ?? 'Available'}</strong></div>
              </div>
            </div>
            <div className="detail-actions">
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
        <input value={price} onChange={(event) => onPriceChange(event.target.value)} placeholder="Price" required />
        <select value={category} onChange={(event) => onCategoryChange(event.target.value)}>
          {CATEGORY_OPTIONS.filter((item) => item !== 'All').map((item) => <option key={item}>{item}</option>)}
        </select>
        <input value={location} onChange={(event) => onLocationChange(event.target.value)} placeholder="Location" required />
        <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
          <option>Available</option>
          <option>Reserved</option>
          <option>Sold</option>
        </select>
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
