export type View = 'home' | 'listing' | 'create' | 'edit' | 'saved' | 'notifications' | 'stores' | 'profile' | 'settings' | 'inbox' | 'account' | 'login' | 'signup' | 'business-hub' | 'business-setup' | 'store-view' | 'seller' | 'onboarding'

export type Listing = {
  id: number
  title: string
  description: string
  price: number
  category: string
  status?: string
  listing_type?: string
  condition?: string
  delivery_option?: string
  seller_name?: string
  user_id?: string
  images?: string[]
  sponsored?: boolean
  available_colors?: string[]
  lowest_acceptable_price?: number
  delivery_paid_by?: 'buyer' | 'seller' | 'split'
  last_renewed_at?: string
  created_at?: string
  rating?: number
  renewal_frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly'
}

export type Profile = {
  user_id?: string
  username?: string
  email?: string
  phone_number?: string
  avatar_url?: string
  pending_otp?: string
  onboarding_choice?: string
  phone_verified?: boolean
}

export type CatalogItem = {
  id: string
  name: string
  price: string
  description: string
  image: string // base64 data url
}

export type BusinessAd = {
  id: string
  listingId: number
  adTitle: string
  budget: string
  duration: string
  status: 'Active' | 'Paused' | 'Ended'
}

export type StoreCollection = {
  id: string
  name: string
  description?: string
  bannerImage?: string
  listingIds?: number[]
}

export type StoreCustomerCare = {
  workingHours?: string
  phone?: string
  email?: string
  address?: string
  deliveryPolicy?: string
  returnPolicy?: string
}

export type ListingReview = {
  id: string
  listingId: number
  reviewerUserId?: string
  reviewerName: string
  rating: number
  comment: string
  isAnonymous: boolean
  createdAt: string
}

export type BusinessProfile = {
  userId: string
  shopName: string
  description: string
  category: string
  address: string
  whatsapp: string
  logo: string // base64 data url
  cover: string // base64 data url
  operationType?: 'online' | 'physical' | 'omnichannel'
  accentColor?: string
  announcementBar?: string
  collections?: StoreCollection[]
  customerCare?: StoreCustomerCare
  catalog: CatalogItem[]
  ads: BusinessAd[]
  rating?: number
}

export type MessageRecord = {
  id: number
  content: string
  sender_id: string
  created_at?: string
}

export type StoreReview = {
  id: string
  storeId?: string | null
  targetUserId?: string | null
  reviewerId: string
  reviewerName: string
  rating: number
  comment: string
  createdAt: string
  reply?: string
}

export type PaymentMethodItem = {
  id: string
  type: 'mobile_money' | 'card' | 'bank'
  title: string
  accountNumber: string
  provider: string
  isDefault?: boolean
}

export type NotificationConfig = {
  email: boolean
  push: boolean
  sms: boolean
  orders: boolean
  promos: boolean
}

export type NotificationItem = {
  id: string | number
  user_id?: string | null
  title: string
  body: string
  time: string
  unread: boolean
  link_url?: string
}
