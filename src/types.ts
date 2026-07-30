export type View = 'home' | 'listing' | 'create' | 'edit' | 'saved' | 'notifications' | 'stores' | 'profile' | 'settings' | 'inbox' | 'account' | 'login' | 'signup' | 'business-hub' | 'business-setup' | 'store-view' | 'seller'

export type Listing = {
  id: number
  title: string
  description: string
  price: number
  category: string
  location: string
  status?: string
  listing_type?: string
  condition?: string
  delivery_option?: string
  seller_name?: string
  user_id?: string
  images?: string[]
  sponsored?: boolean
  available_colors?: string[]
}

export type Profile = {
  user_id?: string
  username?: string
  email?: string
  phone_number?: string
  avatar_url?: string
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

export type BusinessProfile = {
  userId: string
  shopName: string
  description: string
  category: string
  address: string
  whatsapp: string
  logo: string // base64 data url
  cover: string // base64 data url
  catalog: CatalogItem[]
  ads: BusinessAd[]
}

export type MessageRecord = {
  id: number
  content: string
  sender_id: string
  created_at?: string
}

export type StoreReview = {
  id: string
  storeId: string
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
