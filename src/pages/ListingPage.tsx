import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { CATEGORY_OPTIONS, CONDITION_OPTIONS } from '../features/marketplace/constants'
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
  onRenewListing?: (listingId: number) => void
  onDeleteListing?: (listingId: number) => void
}

export function ListingDetailPage({
  selectedListing,
  session,
  onBack,
  onMessageSeller,
  onToggleSave,
  onEditListing,
  allBusinesses,
  onVisitStore,
  onRenewListing,
  onDeleteListing
}: ListingDetailPageProps) {
  const navigate = useNavigate()
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [quantity, setQuantity] = useState(1)
  const [deliveryOption, setDeliveryOption] = useState(selectedListing?.delivery_option || '')
  const [phone, setPhone] = useState('')
  const [locationAddress, setLocationAddress] = useState('')
  const [offerAmount, setOfferAmount] = useState('')
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

  const isService = selectedListing.listing_type === 'service'
  const deliveryOptionsList = isService
    ? ["Online/Remote", "At Buyer's Location", "At Seller's Location", "Flexible"]
    : ["In-Person Meetup", "Local Delivery", "Courier Shipping", "Pickup Available"]

  const [offerError, setOfferError] = useState('')

  const handleBuyNow = () => {
    if (!session) {
      alert('Please sign in to place orders or contact sellers.')
      navigate('/login')
      return
    }
    const selectedColsText = selectedColors.length > 0 ? selectedColors.join(', ') : 'Default'
    const orderDetails = `[ORDER_CARD]{"listingId":${selectedListing.id},"title":"${selectedListing.title.replace(/"/g, '\\"')
      }","price":${selectedListing.price},"quantity":${quantity},"deliveryOption":"${deliveryOption || 'Flexible'
      }","phone":"${phone}","location":"${locationAddress}","colors":"${selectedColsText}","totalPrice":${selectedListing.price * quantity}}`

    onMessageSeller(orderDetails)
  }

  const handleMakeOffer = () => {
    if (!session) {
      alert('Please sign in to make offers.')
      navigate('/login')
      return
    }
    setOfferError('')
    const numOffer = Number(offerAmount)
    if (!offerAmount || numOffer <= 0) {
      setOfferError('Please enter a valid offer amount in ZMW.')
      return
    }

    const lowestPrice = selectedListing.lowest_acceptable_price
    if (lowestPrice != null && Number(lowestPrice) > 0 && numOffer < Number(lowestPrice)) {
      setOfferError('Offer too low. The seller is not accepting offers this far below the asking price.')
      return
    }

    const offerMsg = `[OFFER] Proposed Offer: ZMW ${offerAmount} for "${selectedListing.title}" (Original: ZMW ${selectedListing.price}) | Phone: ${phone || 'Not provided'}`
    onMessageSeller(offerMsg)
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: selectedListing.title,
          text: `Check out ${selectedListing.title} on MarketSpace!`,
          url,
        })
        return
      } catch {
        // Fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const lastRenewedTime = new Date(selectedListing.last_renewed_at || selectedListing.created_at || Date.now()).getTime()
  const daysSinceRenewed = Math.floor((Date.now() - lastRenewedTime) / (1000 * 60 * 60 * 24))
  const daysRemaining = Math.max(0, 7 - daysSinceRenewed)

  return (
    <section className="section-card detail-card" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <button className="ghost-btn" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={onBack}>
        <span className="material-icons">arrow_back</span>
        Back to feed
      </button>

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
            <label style={{ display: 'block' }}>
              <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text)' }}>Available Color Options</span>
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
          <label style={{ display: 'block' }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text)' }}>Quantity</span>
            <select value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}>
              {[...Array(10)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </label>

          {/* Delivery Option Selector */}
          <label style={{ display: 'block' }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text)' }}>Delivery Option</span>
            <select value={deliveryOption} onChange={(e) => setDeliveryOption(e.target.value)}>
              <option value="">Select Option</option>
              {deliveryOptionsList.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>

          {/* Make an Offer Section - Excluded if seller never set lowest_acceptable_price */}
          {selectedListing.lowest_acceptable_price != null && Number(selectedListing.lowest_acceptable_price) > 0 && (
            <div style={{ padding: '12px', background: 'var(--panel)', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <span style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>Make an Offer (ZMW)</span>
              {offerError && (
                <div style={{ padding: '8px 10px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '8px' }}>
                  {offerError}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  placeholder={`Min acceptable: ZMW ${selectedListing.lowest_acceptable_price}`}
                  value={offerAmount}
                  onChange={(e) => {
                    setOfferAmount(e.target.value)
                    setOfferError('')
                  }}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.9rem' }}
                />
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={handleMakeOffer}
                  style={{ padding: '10px 14px', fontSize: '0.86rem', fontWeight: 600, background: '#2563eb', color: '#fff', border: 'none' }}
                >
                  Send Offer
                </button>
              </div>
            </div>
          )}

          {/* Mobile Phone Input */}
          <label style={{ display: 'block' }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text)' }}>Your Mobile Number</span>
            <input
              type="tel"
              placeholder="e.g. +260977123456"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>

          {/* Buyer Location Input */}
          <label style={{ display: 'block' }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text)' }}>Your Delivery / Service Location</span>
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
                {copied ? 'Link Copied!' : 'Share Listing'}
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

            {/* Owner Management Panel: Renew, Edit, Delete */}
            {session?.user?.id === selectedListing.user_id && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', padding: '12px', background: 'var(--panel)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Seller Management</span>

                <button
                  type="button"
                  className="primary-btn"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: daysRemaining === 0 ? '#ef4444' : '#10b981',
                    color: '#ffffff',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                  onClick={() => onRenewListing?.(selectedListing.id)}
                >
                  <span className="material-icons" style={{ fontSize: '18px' }}>autorenew</span>
                  {daysRemaining === 0 ? 'Expired — Renew Listing Now!' : `Renew Listing (${daysRemaining}d left)`}
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    className="secondary-btn"
                    style={{ borderColor: '#f59e0b', color: '#d97706', padding: '8px', fontSize: '0.85rem' }}
                    onClick={() => onEditListing(selectedListing)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="secondary-btn"
                    style={{ borderColor: '#ef4444', color: '#ef4444', padding: '8px', fontSize: '0.85rem' }}
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this listing permanently?')) {
                        onDeleteListing?.(selectedListing.id)
                        onBack()
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Buyer Ratings & Reviews Section */}
      <div style={{ marginTop: '32px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text)' }}>
          Customer Ratings & Reviews
        </h3>
        <ListingRatingReviewBox listingId={selectedListing.id} currentUserName={session?.user?.user_metadata?.username || session?.user?.email?.split('@')[0] || 'Buyer'} />
      </div>
    </section>
  )
}

function ListingRatingReviewBox({ listingId, currentUserName }: { listingId: number; currentUserName: string }) {
  const [rating, setRating] = useState(5)
  console.log('Viewing reviews for listing:', listingId)
  const [comment, setComment] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [reviews, setReviews] = useState<Array<{ id: string; name: string; rating: number; comment: string; isAnon: boolean; date: string }>>([
    { id: '1', name: 'Anonymous Buyer', rating: 5, comment: 'Great seller! Product arrived exactly as described.', isAnon: true, date: '2 days ago' }
  ])

  const handleSubmitReview = (e: FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return
    const newRev = {
      id: String(Date.now()),
      name: isAnonymous ? 'Anonymous Buyer' : currentUserName,
      rating,
      comment: comment.trim(),
      isAnon: isAnonymous,
      date: 'Just now'
    }
    setReviews(prev => [newRev, ...prev])
    setComment('')
    setRating(5)
    alert('Thank you! Your rating has been posted successfully.')
  }

  const avgRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Summary Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--panel)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <span className="material-icons" style={{ fontSize: '32px', color: '#f59e0b' }}>star</span>
        <div>
          <strong style={{ fontSize: '1.4rem', color: 'var(--text)' }}>{avgRating} / 5.0</strong>
          <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>Based on {reviews.length} verified buyer review(s)</p>
        </div>
      </div>

      {/* Write a review form */}
      <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <h4 style={{ margin: 0, fontSize: '0.96rem' }}>Rate this item</h4>

        <div>
          <span style={{ fontSize: '0.84rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Select Star Rating</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <span className="material-icons" style={{ fontSize: '28px', color: star <= rating ? '#f59e0b' : 'var(--border)' }}>
                  {star <= rating ? 'star' : 'star_border'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.84rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Review Comment</span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Describe your experience with this item and seller..."
            rows={3}
            required
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit' }}
          />
        </div>

        {/* Anonymous vs Identified Posting Toggle */}
        <div>
          <span style={{ fontSize: '0.84rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Posting Identity</span>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.86rem' }}>
              <input type="radio" name="postAnon" checked={!isAnonymous} onChange={() => setIsAnonymous(false)} />
              <span>Identified ({currentUserName})</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.86rem' }}>
              <input type="radio" name="postAnon" checked={isAnonymous} onChange={() => setIsAnonymous(true)} />
              <span>Anonymous Buyer 🕵️</span>
            </label>
          </div>
        </div>

        <button type="submit" className="primary-btn" style={{ alignSelf: 'flex-start', padding: '10px 20px' }}>Submit Rating</button>
      </form>

      {/* Reviews List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {reviews.map((r) => (
          <div key={r.id} style={{ padding: '14px', background: 'var(--panel)', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{r.name}</strong>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[1, 2, 3, 4, 5].map((st) => (
                  <span key={st} className="material-icons" style={{ fontSize: '16px', color: st <= r.rating ? '#f59e0b' : 'var(--border)' }}>
                    {st <= r.rating ? 'star' : 'star_border'}
                  </span>
                ))}
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{r.comment}</p>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{r.date}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

type ListingFormPageProps = {
  mode: 'create' | 'edit'
  title: string
  description: string
  price: string
  category: string
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
  onStatusChange: (value: string) => void
  onListingTypeChange: (value: string) => void
  onConditionChange: (value: string) => void
  onDeliveryOptionChange: (value: string) => void
  availableColors: string[]
  onAvailableColorsChange: (colors: string[]) => void
  renewalFrequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  onRenewalFrequencyChange?: (val: 'daily' | 'weekly' | 'biweekly' | 'monthly') => void
}

export function ListingFormPage({
  mode,
  title,
  description,
  price,
  category,
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
  onStatusChange,
  onListingTypeChange,
  onConditionChange,
  onDeliveryOptionChange,
  availableColors,
  onAvailableColorsChange,
  renewalFrequency = 'weekly',
  onRenewalFrequencyChange,
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
  const [sellerPhone, setSellerPhone] = useState('')
  const [stockType, setStockType] = useState<'single' | 'in_stock'>('single')
  const [stockQuantity, setStockQuantity] = useState<number>(1)
  const [lowestPriceInput, setLowestPriceInput] = useState<string>('')
  const [deliveryPaidByInput, setDeliveryPaidByInput] = useState<'buyer' | 'seller' | 'split'>('buyer')
  const [selectedDeliveryMethods, setSelectedDeliveryMethods] = useState<string[]>(() => {
    return deliveryOption ? deliveryOption.split(', ') : ['Meetup']
  })

  const toggleDeliveryMethod = (method: string) => {
    let updated: string[]
    if (selectedDeliveryMethods.includes(method)) {
      updated = selectedDeliveryMethods.filter((m) => m !== method)
      if (updated.length === 0) updated = [method] // Keep at least one
    } else {
      updated = [...selectedDeliveryMethods, method]
    }
    setSelectedDeliveryMethods(updated)
    onDeliveryOptionChange(updated.join(', '))
  }

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
              status: status || 'Available',
              listing_type: listingKind,
              condition: listingKind === 'service' ? 'New' : condition,
              delivery_option: selectedDeliveryMethods.join(', '),
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
        <form onSubmit={onSubmit} className="form-stack" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* IMAGE UPLOAD CONTAINER */}
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text)' }}>
              Listing Photos ({uploadedImages.length})
            </label>
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
          </div>

          {/* TITLE INPUT */}
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text)' }}>
              Listing Title <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="e.g. iPhone 15 Pro Max 256GB - Like New"
              required
              style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.92rem' }}
            />
          </div>

          {/* DESCRIPTION TEXTAREA */}
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text)' }}>
              Detailed Description
            </label>
            <textarea
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              placeholder="Describe your item or service, key features, condition details, warranty, etc."
              rows={4}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.92rem', fontFamily: 'inherit' }}
            />
          </div>

          {/* PRICE INPUT */}
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text)' }}>
              Price (ZMW) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              value={price}
              onChange={(event) => onPriceChange(event.target.value)}
              placeholder={listingKind === 'service' ? "Price (e.g. 150 or 50/hour)" : "e.g. 4500"}
              required
              style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.92rem' }}
            />
          </div>

          {/* LOWEST ACCEPTABLE PRICE (LOWBALL SHIELD) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text)' }}>
              Lowest Acceptable Price (ZMW) — Optional Hidden Threshold
            </label>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              If a buyer offers less than this hidden threshold, the offer is blocked before reaching your device. Leave empty if you do not accept offers.
            </span>
            <input
              type="number"
              value={lowestPriceInput}
              onChange={(e) => setLowestPriceInput(e.target.value)}
              placeholder="e.g. 400 (Asking price is 500)"
              style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.92rem' }}
            />
          </div>

          {/* DELIVERY PAID BY SELECTION */}
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text)' }}>
              Delivery Fee Paid By
            </label>
            <select
              value={deliveryPaidByInput}
              onChange={(e) => setDeliveryPaidByInput(e.target.value as any)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.92rem' }}
            >
              <option value="buyer">Paid by Buyer</option>
              <option value="seller">Paid by Seller (Free Delivery)</option>
              <option value="split">Split (50/50)</option>
            </select>
          </div>

          {/* SELLER PHONE NUMBER INPUT */}
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text)' }}>
              Seller Contact / WhatsApp Number <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="tel"
              value={sellerPhone}
              onChange={(e) => setSellerPhone(e.target.value)}
              placeholder="e.g. +260 97 1234567"
              required
              style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.92rem' }}
            />
          </div>

          {/* STOCK vs SINGLE ITEM TOGGLE (ITEMS ONLY) */}
          {listingKind !== 'service' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text)' }}>
                Stock Availability / Quantity Type
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                <button
                  type="button"
                  onClick={() => { setStockType('single'); setStockQuantity(1); }}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: stockType === 'single' ? '2px solid #2563eb' : '1px solid var(--border)',
                    background: stockType === 'single' ? 'rgba(37, 99, 235, 0.1)' : 'var(--surface)',
                    color: 'var(--text)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Single Item (1 Available)
                </button>
                <button
                  type="button"
                  onClick={() => setStockType('in_stock')}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: stockType === 'in_stock' ? '2px solid #2563eb' : '1px solid var(--border)',
                    background: stockType === 'in_stock' ? 'rgba(37, 99, 235, 0.1)' : 'var(--surface)',
                    color: 'var(--text)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  In Stock / Multiple Units
                </button>
              </div>
              {stockType === 'in_stock' && (
                <div style={{ marginTop: '6px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Units in stock</label>
                  <input
                    type="number"
                    min="1"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    placeholder="Enter stock quantity"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.9rem' }}
                  />
                </div>
              )}
            </div>
          )}

          {/* COLOR PICKER SECTION (Hidden for Services) */}
          {listingKind !== 'service' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)' }}>Available Colors</label>
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

          {/* CATEGORY SELECT */}
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text)' }}>
              Category <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={category}
              onChange={(event) => onCategoryChange(event.target.value)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.92rem' }}
            >
              {CATEGORY_OPTIONS.filter((item) => item !== 'All').map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>

          {/* STATUS SELECT (EDIT MODE ONLY) */}
          {mode === 'edit' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text)' }}>
                Listing Status
              </label>
              <select
                value={status}
                onChange={(event) => onStatusChange(event.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.92rem' }}
              >
                <option>Available</option>
                <option>Reserved</option>
                <option>Sold</option>
              </select>
            </div>
          )}

          {/* CONDITION SELECT (Hidden for Services) */}
          {listingKind !== 'service' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text)' }}>
                Item Condition
              </label>
              <select
                value={condition}
                onChange={(event) => onConditionChange(event.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.92rem' }}
              >
                {CONDITION_OPTIONS.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
          )}

          {/* MULTI-SELECT DELIVERY & MEETUP CHECKBOXES */}
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text)' }}>
              Delivery & Meetup Options (Select all that apply)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {(listingKind === 'service'
                ? ["Online / Remote", "At Buyer's Location", "At Seller's Location", "Flexible / Negotiable"]
                : ["In-Person Meetup", "Local Delivery", "Courier Shipping", "Pickup Available"]
              ).map((opt) => {
                const isChecked = selectedDeliveryMethods.includes(opt)
                return (
                  <label
                    key={opt}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: isChecked ? '1px solid #2563eb' : '1px solid var(--border)',
                      background: isChecked ? 'rgba(37, 99, 235, 0.08)' : 'var(--surface)',
                      cursor: 'pointer',
                      fontSize: '0.88rem',
                      color: 'var(--text)',
                      fontWeight: isChecked ? 600 : 400
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleDeliveryMethod(opt)}
                    />
                    {opt}
                  </label>
                )
              })}
            </div>
          </div>

          {/* RENEWAL FREQUENCY SELECTOR */}
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text)' }}>
              Listing Renewal Frequency <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>(How often this listing needs to be renewed)</span>
            </label>
            <select
              value={renewalFrequency}
              onChange={(e) => {
                if (onRenewalFrequencyChange) onRenewalFrequencyChange(e.target.value as any)
              }}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.92rem' }}
            >
              <option value="weekly">Weekly (Every 7 Days — Recommended)</option>
              <option value="daily">Daily (Every 24 Hours)</option>
              <option value="biweekly">Bi-Weekly (Every 14 Days)</option>
              <option value="monthly">Monthly (Every 30 Days)</option>
            </select>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              After this duration, your listing will pause on the homepage until you tap "Renew" in your Seller Dashboard.
            </p>
          </div>

          <button className="primary-btn" type="submit" style={{ marginTop: '8px' }}>{mode === 'create' ? 'Publish listing' : 'Save changes'}</button>
        </form>
      )}
    </section>
  )
}
