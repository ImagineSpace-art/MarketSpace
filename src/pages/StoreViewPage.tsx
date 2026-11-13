import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { BusinessProfile, Listing, StoreCartItem, StoreReview } from '../types'
import { logAnalyticsEvent } from '../services/analytics'
import { isListingExpired } from '../features/marketplace/listingExpiry'
import { BoutiqueGridTemplate } from './BoutiqueGridTemplate'
import { StorefrontLandingTemplate } from './StorefrontLandingTemplate'
import { TemplateStoreListingView } from './TemplateStoreListingView'
import './StoreTemplates.css'

type StoreViewPageProps = {
  shop: BusinessProfile
  listings: Listing[]
  onMessageSeller: (customMessage?: string) => void
  onToggleSave: (listingId: number) => void
  savedIds: string[]
  currentUserId?: string
  followingIds?: string[]
  notifyStoreIds?: string[]
  onToggleFollowStore?: (storeId: string) => void
  onToggleNotifyStore?: (storeId: string) => void
  storeReviews?: StoreReview[]
  onAddReview?: (storeId: string, rating: number, comment: string) => void
  onReplyToReview?: (reviewId: string, replyText: string) => void
  globalRenewalFrequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  globalRenewalDay?: string
  onEditListing?: (listing: Listing) => void
  onRenewListing?: (listingId: number) => void
}

export function StoreViewPage({
  shop,
  listings,
  onMessageSeller,
  onToggleSave,
  savedIds,
  currentUserId = '',
  followingIds = [],
  notifyStoreIds = [],
  onToggleFollowStore = () => {},
  onToggleNotifyStore = () => {},
  storeReviews = [],
  onAddReview,
  onReplyToReview,
  globalRenewalFrequency = 'weekly',
  globalRenewalDay = 'Monday',
  onEditListing,
  onRenewListing,
}: StoreViewPageProps) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const listingQueryId = searchParams.get('listing')
  const templateId = shop.templateId === 'storefront-landing' ? 'storefront-landing' : 'boutique-grid'
  const isOwner = currentUserId === shop.userId
  const isFollowing = followingIds.includes(shop.userId)
  const isNotified = notifyStoreIds.includes(shop.userId)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [cartItems, setCartItems] = useState<StoreCartItem[]>(() => {
    try {
      const saved = localStorage.getItem(`marketspace_cart_${shop.userId}`)
      const items = saved ? JSON.parse(saved) as StoreCartItem[] : []
      return items.filter(item => item.listing?.listing_type !== 'service')
    } catch {
      return []
    }
  })

  const storeListings = useMemo(() => listings.filter(listing => {
    if (listing.user_id !== shop.userId) return false
    if (isOwner) return true
    return !isListingExpired(listing, globalRenewalFrequency, globalRenewalDay)
      && (!listing.status || ['active', 'available'].includes(listing.status.toLowerCase()))
  }), [globalRenewalDay, globalRenewalFrequency, isOwner, listings, shop.userId])

  const activeListing = useMemo(() => {
    if (!listingQueryId) return null
    return storeListings.find(listing => String(listing.id) === listingQueryId) || null
  }, [listingQueryId, storeListings])

  useEffect(() => {
    if (listingQueryId) window.scrollTo({ top: 0 })
  }, [listingQueryId])

  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems],
  )

  useEffect(() => {
    try {
      localStorage.setItem(`marketspace_cart_${shop.userId}`, JSON.stringify(cartItems))
    } catch {
      // Cart persistence is optional when browser storage is unavailable.
    }
  }, [cartItems, shop.userId])

  useEffect(() => {
    void logAnalyticsEvent({
      event_type: 'store_view',
      seller_id: shop.userId,
      actor_id: currentUserId || undefined,
    })
  }, [currentUserId, shop.userId])

  const openStoreListing = (listing: Listing) => {
    setIsCartOpen(false)
    setIsInfoOpen(false)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('listing', String(listing.id))
    setSearchParams(nextParams)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const backToStore = () => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('listing')
    setSearchParams(nextParams)
  }

  const addToCart = (listing: Listing, quantity: number) => {
    if (listing.listing_type === 'service') return
    setCartItems(items => {
      const existing = items.find(item => item.listing.id === listing.id)
      if (existing) {
        return items.map(item => item.listing.id === listing.id
          ? { ...item, quantity: item.quantity + quantity }
          : item)
      }
      return [...items, { listing, quantity }]
    })
    setIsCartOpen(true)
  }

  const updateCartQuantity = (listingId: number, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(items => items.filter(item => item.listing.id !== listingId))
      return
    }
    setCartItems(items => items.map(item => item.listing.id === listingId ? { ...item, quantity } : item))
  }

  const removeCartItem = (listingId: number) => {
    setCartItems(items => items.filter(item => item.listing.id !== listingId))
  }

  const startStoreMessage = (message?: string) => {
    if (isOwner) return
    onMessageSeller(message)
  }

  if (activeListing) {
    return (
      <>
        <TemplateStoreListingView
          key={activeListing.id}
          templateId={templateId}
          listing={activeListing}
          shop={shop}
          storeListings={storeListings}
          isSaved={savedIds.includes(String(activeListing.id))}
          onBack={backToStore}
          onAddToCart={addToCart}
          onToggleSave={onToggleSave}
          onSelectListing={openStoreListing}
          onMessageSeller={startStoreMessage}
          isOwner={isOwner}
          onEditListing={onEditListing}
          onRenewListing={onRenewListing}
        />
      </>
    )
  }

  const templateProps = {
    shop,
    listings: storeListings,
    content: shop.templateContent?.[templateId] || {},
    currentUserId,
    savedIds,
    storeReviews,
    cartCount,
    cartItems,
    onOpenListing: openStoreListing,
    onToggleSave,
    onMessageSeller: () => startStoreMessage(),
    onToggleFollow: () => onToggleFollowStore(shop.userId),
    onToggleNotify: () => onToggleNotifyStore(shop.userId),
    isFollowing,
    isNotified,
    onAddReview,
    onReplyToReview,
    onUpdateCartQuantity: updateCartQuantity,
    onRemoveCartItem: removeCartItem,
    onClearCart: () => setCartItems([]),
    onOpenCart: () => setIsCartOpen(true),
    onCloseCart: () => setIsCartOpen(false),
    onOpenInfo: () => setIsInfoOpen(true),
    onCloseInfo: () => setIsInfoOpen(false),
    isCartOpen,
    isInfoOpen,
    onRequireSignIn: () => navigate('/login'),
  }

  return (
    <>
      {templateId === 'storefront-landing'
        ? <StorefrontLandingTemplate {...templateProps} />
        : <BoutiqueGridTemplate {...templateProps} />}
    </>
  )
}
