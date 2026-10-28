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
  store_id?: string | null
  images?: string[]
  sponsored?: boolean
  available_colors?: string[]
  available_sizes?: string[]
  lowest_acceptable_price?: number
  delivery_paid_by?: 'buyer' | 'seller' | 'split'
  last_renewed_at?: string
  created_at?: string
  rating?: number
  renewal_frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  use_global_renewal?: boolean
  collection_id?: string
  publish_as?: 'private' | 'store'
  how_it_works?: string
}

export type Profile = {
  user_id?: string
  username?: string
  email?: string
  phone_number?: string
  avatar_url?: string
  created_at?: string
  onboarding_choice?: string
  phone_verified?: boolean
  global_renewal_frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  global_renewal_day?: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'
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
  targetType?: 'store' | 'listing'
  storeId?: string
  listingId?: number
  goal?: string
  adTitle?: string
  adText?: string
  headline?: string
  media?: string[]
  buttonLabel?: string
  destinationUrl?: string
  contactMethod?: 'whatsapp' | 'messenger' | 'none'
  contactPhone?: string
  enableAdvantageCreative?: boolean
  isSpecialCategory?: boolean
  audienceLocation?: string
  audienceMinAge?: number
  scheduleType?: 'continuous' | 'end_date'
  startDate?: string
  startTime?: string
  endDate?: string
  budget: string
  duration?: string
  currency?: string
  placements?: string[]
  status: 'Active' | 'Paused' | 'Ended'
  createdAt?: string
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
  hours?: string
  delivery?: string
  returns?: string
  payment?: string
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

export type StoreSectionType =
  | 'hero_banner'
  | 'featured_products'
  | 'promo_banner'
  | 'categories_grid'
  | 'rich_text'
  | 'testimonials'
  | 'faq'
  | 'announcement'
  | 'countdown_deal'
  | 'editorial_grid'
  | 'featured_collection_split'
  | 'bento_grid'

export type StoreSection = {
  id: string
  type: StoreSectionType
  enabled: boolean
  settings: Record<string, any>
}

export type StoreNavLink = {
  id: string
  label: string
  url: string // e.g. '#products', '#departments', '#story', '#faq', '#reviews', 'category:Shoes', 'https://...'
  type?: 'all' | 'category' | 'section' | 'external'
}

export type StoreInfoPanelHighlight = {
  icon: string
  title: string
  desc: string
}

export type StoreInfoPanelConfig = {
  enabled?: boolean
  title?: string
  subtitle?: string
  badgeText?: string
  highlights?: StoreInfoPanelHighlight[]
}

export type StoreCartItem = {
  listing: Listing
  quantity: number
  selectedVariant?: string
}

export type StoreCartDrawerConfig = {
  enabled?: boolean
  headline?: string
  freeShippingThreshold?: number
  freeShippingMessage?: string
  checkoutNote?: string
  emptyMessage?: string
}

export type StoreNavConfig = {
  layout?: 'logo-left' | 'logo-center' | 'minimal'
  backgroundColor?: string
  textColor?: string
  accentColor?: string
  isSticky?: boolean
  showSearch?: boolean
  showContactBtn?: boolean
  showFollowBtn?: boolean
  showNotificationsBtn?: boolean
  showPanelBtn?: boolean
  showCartBtn?: boolean
  showCategorySelector?: boolean
  logoStyle?: 'both' | 'logo-only' | 'name-only'
  links: StoreNavLink[]
  subnavLinks?: StoreNavLink[]
  panel?: StoreInfoPanelConfig
  cartDrawer?: StoreCartDrawerConfig
}

export type StoreThemeConfig = {
  presetName?: 'arctos' | 'hyper' | 'xtra' | 'modern' | 'boutique' | 'bold' | 'minimal'
  primaryColor?: string
  fontFamily?: string
  bannerStyle?: 'full-bleed' | 'contained' | 'minimal'
  navigation?: StoreNavConfig
  panel?: StoreInfoPanelConfig
  cartDrawer?: StoreCartDrawerConfig
  sections: StoreSection[]
}

export type BusinessProfile = {
  userId: string
  subdomain?: string
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
  verifiedId?: boolean
  verifiedLocation?: boolean
  registeredBusiness?: boolean
  probationState?: 'probation' | 'trusted'
  themeConfig?: StoreThemeConfig
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
