import { useEffect, useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { CATEGORY_OPTIONS, CONDITION_OPTIONS, DELIVERY_OPTIONS } from './constants'
import type { Listing, Profile, View, BusinessProfile, StoreReview, PaymentMethodItem, NotificationConfig } from '../../types'

export type NotificationItem = {
  id: number
  title: string
  body: string
  time: string
  unread: boolean
}

export type ChatMessage = {
  id: number
  sender: 'me' | 'them'
  content: string
  time: string
}

export type ChatThread = {
  id: number
  title: string
  participant: string
  listingTitle: string
  unread: boolean
  messages: ChatMessage[]
  isPinned?: boolean
  isFavorite?: boolean
  isArchived?: boolean
}

export interface MarketplaceAppModel {
  view: View
  setView: Dispatch<SetStateAction<View>>
  theme: 'light' | 'dark'
  setTheme: Dispatch<SetStateAction<'light' | 'dark'>>
  session: Session | null
  setSession: Dispatch<SetStateAction<Session | null>>
  profile: Profile | null
  setProfile: Dispatch<SetStateAction<Profile | null>>
  listings: Listing[]
  setListings: Dispatch<SetStateAction<Listing[]>>
  stores: Profile[]
  setStores: Dispatch<SetStateAction<Profile[]>>
  selectedListing: Listing | null
  setSelectedListing: Dispatch<SetStateAction<Listing | null>>
  editingListing: Listing | null
  setEditingListing: Dispatch<SetStateAction<Listing | null>>
  loading: boolean
  setLoading: Dispatch<SetStateAction<boolean>>
  message: string
  setMessage: Dispatch<SetStateAction<string>>
  authEmail: string
  setAuthEmail: Dispatch<SetStateAction<string>>
  authPassword: string
  setAuthPassword: Dispatch<SetStateAction<string>>
  authUsername: string
  setAuthUsername: Dispatch<SetStateAction<string>>
  searchQuery: string
  setSearchQuery: Dispatch<SetStateAction<string>>
  activeCategories: string[]
  setActiveCategories: Dispatch<SetStateAction<string[]>>
  toggleCategory: (category: string) => void
  priceRange: number
  setPriceRange: Dispatch<SetStateAction<number>>
  distanceFilter: number
  setDistanceFilter: Dispatch<SetStateAction<number>>
  sortBy: string
  setSortBy: Dispatch<SetStateAction<string>>
  showOnlyAvailable: boolean
  setShowOnlyAvailable: Dispatch<SetStateAction<boolean>>
  savedIds: string[]
  setSavedIds: Dispatch<SetStateAction<string[]>>
  followingIds: string[]
  notifyStoreIds: string[]
  toggleFollowStore: (storeId: string) => void
  toggleNotifyStore: (storeId: string) => void
  notifications: NotificationItem[]
  setNotifications: Dispatch<SetStateAction<NotificationItem[]>>
  chatThreads: ChatThread[]
  setChatThreads: Dispatch<SetStateAction<ChatThread[]>>
  activeChatId: number | null
  setActiveChatId: Dispatch<SetStateAction<number | null>>
  chatDraft: string
  setChatDraft: Dispatch<SetStateAction<string>>
  title: string
  setTitle: Dispatch<SetStateAction<string>>
  description: string
  setDescription: Dispatch<SetStateAction<string>>
  price: string
  setPrice: Dispatch<SetStateAction<string>>
  category: string
  setCategory: Dispatch<SetStateAction<string>>
  location: string
  setLocation: Dispatch<SetStateAction<string>>
  status: string
  setStatus: Dispatch<SetStateAction<string>>
  listingType: string
  setListingType: Dispatch<SetStateAction<string>>
  condition: string
  setCondition: Dispatch<SetStateAction<string>>
  deliveryOption: string
  setDeliveryOption: Dispatch<SetStateAction<string>>
  canMessage: boolean
  setCanMessage: Dispatch<SetStateAction<boolean>>
  userEmail: string
  fetchListings: () => Promise<void>
  fetchStores: () => Promise<void>
  loadProfile: (userId: string) => Promise<void>
  handleLogin: () => Promise<void>
  handleSignup: () => Promise<void>
  handleLogout: () => Promise<void>
  resetForm: () => void
  handleCreateListing: (event: FormEvent<HTMLFormElement>) => Promise<void>
  handleUpdateListing: (event: FormEvent<HTMLFormElement>) => Promise<void>
  openListing: (listing: Listing) => void
  openEditListing: (listing: Listing) => void
  toggleSave: (listingId: number) => void
  markAllRead: () => void
  sendInboxMessage: () => void
  filteredListings: Listing[]
  savedListings: Listing[]
  myListings: Listing[]
  heroStats: Array<{ label: string; value: string }>
  businessProfile: BusinessProfile | null
  setBusinessProfile: Dispatch<SetStateAction<BusinessProfile | null>>
  allBusinesses: Record<string, BusinessProfile>
  setAllBusinesses: Dispatch<SetStateAction<Record<string, BusinessProfile>>>
  selectedStore: BusinessProfile | null
  setSelectedStore: Dispatch<SetStateAction<BusinessProfile | null>>
  uploadedImages: string[]
  setUploadedImages: Dispatch<SetStateAction<string[]>>
  handleCreateOrUpdateBusiness: (profile: BusinessProfile) => void
  handleDeleteListing: (listingId: number) => Promise<void>
  handleRenewListing: (listingId: number) => Promise<void>
  handleUpdateListingStatus: (listingId: number, status: string) => Promise<void>
  handleUploadAvatar: (base64: string) => Promise<void>
  cardSize: number
  setCardSize: Dispatch<SetStateAction<number>>
  handleStartChat: (listing: Listing, customMessage?: string) => Promise<void>
  availableColors: string[]
  setAvailableColors: Dispatch<SetStateAction<string[]>>
  listingKindFilter: 'all' | 'item' | 'service'
  setListingKindFilter: Dispatch<SetStateAction<'all' | 'item' | 'service'>>
  storeReviews: StoreReview[]
  addStoreReview: (storeId: string, rating: number, comment: string) => void
  replyToStoreReview: (reviewId: string, replyText: string) => void
  currency: 'ZMW' | 'USD' | 'EUR'
  setCurrency: Dispatch<SetStateAction<'ZMW' | 'USD' | 'EUR'>>
  notificationsConfig: NotificationConfig
  setNotificationsConfig: Dispatch<SetStateAction<NotificationConfig>>
  blockedUserIds: string[]
  toggleBlockUser: (userId: string) => void
  paymentMethods: PaymentMethodItem[]
  addPaymentMethod: (item: Omit<PaymentMethodItem, 'id'>) => void
  removePaymentMethod: (id: string) => void
  browsingHistory: Array<{ id: number; title: string; price: number; image?: string; timestamp: string }>
  clearBrowsingHistory: () => void
  searchHistory: string[]
  clearSearchHistory: () => void
  togglePinChat: (chatId: number) => void
  toggleFavoriteChat: (chatId: number) => void
  toggleArchiveChat: (chatId: number) => void
  deleteChat: (chatId: number) => void
}

type ListingRow = Listing & {
  user_id?: string
}

type ProfileSummary = Pick<Profile, 'user_id' | 'username'>

function getStoredTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.localStorage.getItem('marketspace-theme') === 'dark' ? 'dark' : 'light'
}

function getStoredSavedIds(): string[] {
  if (typeof window === 'undefined') {
    return []
  }

  const storedSaves = window.localStorage.getItem('marketspace-saved')
  if (!storedSaves) {
    return []
  }

  try {
    const parsedSaves: unknown = JSON.parse(storedSaves)
    return Array.isArray(parsedSaves) ? parsedSaves.filter((value): value is string => typeof value === 'string') : []
  } catch {
    return []
  }
}

export function useMarketplaceApp(): MarketplaceAppModel {
  const navigate = useNavigate()
  const [view, setView] = useState<View>('home')
  const [theme, setTheme] = useState<'light' | 'dark'>(getStoredTheme)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [stores, setStores] = useState<Profile[]>([])
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [editingListing, setEditingListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authUsername, setAuthUsername] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategories, setActiveCategories] = useState<string[]>(['All'])
  const [priceRange, setPriceRange] = useState<number>(3000)
  const [distanceFilter, setDistanceFilter] = useState<number>(65)
  const [sortBy, setSortBy] = useState('Newest')
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true)
  const [savedIds, setSavedIds] = useState<string[]>(getStoredSavedIds)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([])
  const [activeChatId, setActiveChatId] = useState<number | null>(1)
  const [chatDraft, setChatDraft] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState<string>('3000')
  const [category, setCategory] = useState('Electronics')
  const [location, setLocation] = useState('Lusaka')
  const [status, setStatus] = useState('Available')
  const [listingType, setListingType] = useState('single')
  const [condition, setCondition] = useState('Used - Good')
  const [deliveryOption, setDeliveryOption] = useState('Meetup')
  const [canMessage, setCanMessage] = useState(true)
  const [availableColors, setAvailableColors] = useState<string[]>([])
  const [listingKindFilter, setListingKindFilter] = useState<'all' | 'item' | 'service'>('all')
  const [cardSize, setCardSize] = useState<number>(() => {
    if (typeof window === 'undefined') return 180
    const stored = window.localStorage.getItem('marketspace-card-size')
    return stored ? Number(stored) || 180 : 180
  })

  useEffect(() => {
    window.localStorage.setItem('marketspace-card-size', String(cardSize))
  }, [cardSize])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [allBusinesses, setAllBusinesses] = useState<Record<string, BusinessProfile>>({})
  const [selectedStore, setSelectedStore] = useState<BusinessProfile | null>(null)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])

  const [followingIds, setFollowingIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    const stored = window.localStorage.getItem('marketspace-following-ids')
    return stored ? JSON.parse(stored) : []
  })

  const [notifyStoreIds, setNotifyStoreIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    const stored = window.localStorage.getItem('marketspace-notify-store-ids')
    return stored ? JSON.parse(stored) : []
  })

  const [storeReviews, setStoreReviews] = useState<StoreReview[]>(() => {
    if (typeof window === 'undefined') return []
    const stored = window.localStorage.getItem('marketspace-store-reviews')
    return stored ? JSON.parse(stored) : []
  })

  const [currency, setCurrency] = useState<'ZMW' | 'USD' | 'EUR'>(() => {
    if (typeof window === 'undefined') return 'ZMW'
    return (window.localStorage.getItem('marketspace-currency') as any) || 'ZMW'
  })

  useEffect(() => {
    window.localStorage.setItem('marketspace-currency', currency)
  }, [currency])

  const [notificationsConfig, setNotificationsConfig] = useState<NotificationConfig>(() => {
    if (typeof window === 'undefined') return { email: true, push: true, sms: false, orders: true, promos: false }
    const stored = window.localStorage.getItem('marketspace-notifications-config')
    return stored ? JSON.parse(stored) : { email: true, push: true, sms: false, orders: true, promos: false }
  })

  useEffect(() => {
    window.localStorage.setItem('marketspace-notifications-config', JSON.stringify(notificationsConfig))
  }, [notificationsConfig])

  const [blockedUserIds, setBlockedUserIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    const stored = window.localStorage.getItem('marketspace-blocked-user-ids')
    return stored ? JSON.parse(stored) : []
  })

  useEffect(() => {
    window.localStorage.setItem('marketspace-blocked-user-ids', JSON.stringify(blockedUserIds))
  }, [blockedUserIds])

  const toggleBlockUser = (targetUserId: string) => {
    setBlockedUserIds((prev) =>
      prev.includes(targetUserId) ? prev.filter((id) => id !== targetUserId) : [...prev, targetUserId]
    )
    setMessage(blockedUserIds.includes(targetUserId) ? 'User unblocked' : 'User blocked')
  }

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>(() => {
    if (typeof window === 'undefined') return []
    const stored = window.localStorage.getItem('marketspace-payment-methods')
    return stored ? JSON.parse(stored) : []
  })

  useEffect(() => {
    window.localStorage.setItem('marketspace-payment-methods', JSON.stringify(paymentMethods))
  }, [paymentMethods])

  const addPaymentMethod = (item: Omit<PaymentMethodItem, 'id'>) => {
    const newItem: PaymentMethodItem = {
      ...item,
      id: 'p-' + Date.now(),
    }
    setPaymentMethods((prev) => [...prev, newItem])
    setMessage('Payment method added')
  }

  const removePaymentMethod = (id: string) => {
    setPaymentMethods((prev) => prev.filter((p) => p.id !== id))
    setMessage('Payment method removed')
  }

  const [browsingHistory, setBrowsingHistory] = useState<Array<{ id: number; title: string; price: number; image?: string; timestamp: string }>>(() => {
    if (typeof window === 'undefined') return []
    const stored = window.localStorage.getItem('marketspace-browsing-history')
    return stored ? JSON.parse(stored) : []
  })

  const clearBrowsingHistory = () => {
    setBrowsingHistory([])
    window.localStorage.removeItem('marketspace-browsing-history')
    setMessage('Browsing history cleared')
  }

  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    const stored = window.localStorage.getItem('marketspace-search-history')
    return stored ? JSON.parse(stored) : []
  })

  const clearSearchHistory = () => {
    setSearchHistory([])
    window.localStorage.removeItem('marketspace-search-history')
    setMessage('Search history cleared')
  }

  const [chatFlags, setChatFlags] = useState<Record<number, { isPinned?: boolean; isFavorite?: boolean; isArchived?: boolean }>>(() => {
    if (typeof window === 'undefined') return {}
    const stored = window.localStorage.getItem('marketspace-chat-flags')
    return stored ? JSON.parse(stored) : {}
  })

  useEffect(() => {
    window.localStorage.setItem('marketspace-chat-flags', JSON.stringify(chatFlags))
  }, [chatFlags])

  const [deletedChatIds, setDeletedChatIds] = useState<number[]>(() => {
    if (typeof window === 'undefined') return []
    const stored = window.localStorage.getItem('marketspace-deleted-chats')
    return stored ? JSON.parse(stored) : []
  })

  useEffect(() => {
    window.localStorage.setItem('marketspace-deleted-chats', JSON.stringify(deletedChatIds))
  }, [deletedChatIds])

  const togglePinChat = (chatId: number) => {
    setChatFlags((prev) => ({
      ...prev,
      [chatId]: { ...prev[chatId], isPinned: !prev[chatId]?.isPinned }
    }))
  }

  const toggleFavoriteChat = (chatId: number) => {
    setChatFlags((prev) => ({
      ...prev,
      [chatId]: { ...prev[chatId], isFavorite: !prev[chatId]?.isFavorite }
    }))
  }

  const toggleArchiveChat = (chatId: number) => {
    setChatFlags((prev) => ({
      ...prev,
      [chatId]: { ...prev[chatId], isArchived: !prev[chatId]?.isArchived }
    }))
  }

  const deleteChat = (chatId: number) => {
    setDeletedChatIds((prev) => [...prev, chatId])
    if (activeChatId === chatId) {
      setActiveChatId(null)
    }
    setMessage('Chat thread deleted')
  }

  useEffect(() => {
    window.localStorage.setItem('marketspace-following-ids', JSON.stringify(followingIds))
  }, [followingIds])

  useEffect(() => {
    window.localStorage.setItem('marketspace-notify-store-ids', JSON.stringify(notifyStoreIds))
  }, [notifyStoreIds])

  useEffect(() => {
    window.localStorage.setItem('marketspace-store-reviews', JSON.stringify(storeReviews))
  }, [storeReviews])

  const addStoreReview = (storeId: string, rating: number, comment: string) => {
    if (!session) {
      setMessage('Please sign in to write a review')
      return
    }
    const newReview: StoreReview = {
      id: Math.random().toString(36).substring(2, 9),
      storeId,
      reviewerId: session.user.id,
      reviewerName: profile?.username || session.user.email || 'Anonymous',
      rating,
      comment,
      createdAt: new Date().toISOString(),
    }
    setStoreReviews((prev) => [newReview, ...prev])
    setMessage('Review submitted successfully')
  }

  const replyToStoreReview = (reviewId: string, replyText: string) => {
    setStoreReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, reply: replyText } : r))
    )
    setMessage('Response posted successfully')
  }

  const toggleFollowStore = (storeId: string) => {
    setFollowingIds(prev =>
      prev.includes(storeId) ? prev.filter(id => id !== storeId) : [...prev, storeId]
    )
  }

  const toggleNotifyStore = (storeId: string) => {
    setNotifyStoreIds(prev =>
      prev.includes(storeId) ? prev.filter(id => id !== storeId) : [...prev, storeId]
    )
  }

  const userEmail = session?.user?.email ?? profile?.email ?? 'Guest'

  async function fetchListings() {
    const { data, error } = await supabase.from('listings').select('*').order('created_at', { ascending: false })
    if (error) return

    const { data: profilesData } = await supabase.from('profiles').select('user_id, username')
    const sellerMap = new Map<string, string>()
      ; ((profilesData ?? []) as ProfileSummary[]).forEach((profileRow) => {
        if (profileRow.user_id) {
          sellerMap.set(profileRow.user_id, profileRow.username ?? 'Seller')
        }
      })

    const enriched = ((data ?? []) as ListingRow[]).map((item) => ({
      ...item,
      seller_name: sellerMap.get(item.user_id ?? '') ?? 'Seller',
    }))

    setListings(enriched)
  }

  async function fetchStores() {
    const { data, error } = await supabase.from('profiles').select('*').limit(8)
    if (!error) {
      setStores((data ?? []) as Profile[])
    }
  }

  async function loadProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle()
    if (data) {
      setProfile(data as Profile)
    }
  }

  async function fetchChatThreads() {
    if (!session) return

    const { data: chatsData, error: chatsError } = await supabase
      .from('chats')
      .select('*')
      .or(`buyer_id.eq.${session.user.id},seller_id.eq.${session.user.id}`)

    if (chatsError) return

    if (!chatsData || chatsData.length === 0) {
      setChatThreads([])
      return
    }

    const chatIds = chatsData.map(c => c.id)

    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .in('chat_id', chatIds)
      .order('created_at', { ascending: true })

    if (messagesError) return

    const userIds = new Set<string>()
    chatsData.forEach(c => {
      userIds.add(c.buyer_id)
      userIds.add(c.seller_id)
    })

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, username')
      .in('user_id', Array.from(userIds))

    const profileMap = new Map<string, string>()
    if (profilesData) {
      profilesData.forEach(p => {
        if (p.user_id) profileMap.set(p.user_id, p.username || 'User')
      })
    }

    const threads: ChatThread[] = chatsData.map(chatRow => {
      const chatMessages = (messagesData ?? [])
        .filter(m => m.chat_id === chatRow.id)
        .map(m => {
          const timeVal = m.created_at
            ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Now'
          return {
            id: m.id,
            sender: m.sender_id === session.user.id ? ('me' as const) : ('them' as const),
            content: m.content,
            time: timeVal
          }
        })

      const otherUserId = chatRow.buyer_id === session.user.id ? chatRow.seller_id : chatRow.buyer_id
      const participantName = profileMap.get(otherUserId) || 'Other User'
      const flags = chatFlags[chatRow.id] || {}

      return {
        id: chatRow.id,
        title: chatRow.title || 'Chat',
        participant: participantName,
        listingTitle: chatRow.title || 'Inquiry',
        unread: false,
        messages: chatMessages,
        isPinned: !!flags.isPinned,
        isFavorite: !!flags.isFavorite,
        isArchived: !!flags.isArchived,
      }
    }).filter((t) => !deletedChatIds.includes(t.id))

    setChatThreads(threads)
  }

  useEffect(() => {
    if (!session) return

    const channel = supabase
      .channel('chat-messages-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        void fetchChatThreads()
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [session])

  useEffect(() => {
    const loadInitialData = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()
      setSession(currentSession)

      if (currentSession) {
        await loadProfile(currentSession.user.id)
      }

      await fetchListings()
      await fetchStores()
      setLoading(false)
    }

    void loadInitialData()
  }, [])

  useEffect(() => {
    if (session) {
      void fetchChatThreads()
    }
  }, [session])

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
      if (currentSession) {
        void loadProfile(currentSession.user.id)
        void fetchListings()
      } else {
        setProfile(null)
        setChatThreads([])
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem('marketspace-theme', theme)
  }, [theme])

  useEffect(() => {
    window.localStorage.setItem('marketspace-saved', JSON.stringify(savedIds))
  }, [savedIds])

  const handleLogin = async () => {
    setMessage('')
    const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
    if (error) {
      setMessage(error.message)
      return
    }
    setSession(data.session)
    setMessage('Welcome back to MarketSpace')
    setAuthEmail('')
    setAuthPassword('')
    navigate('/')
  }

  const handleSignup = async () => {
    setMessage('')
    const { data, error } = await supabase.auth.signUp({
      email: authEmail,
      password: authPassword,
      options: { data: { username: authUsername } },
    })

    if (error) {
      setMessage(error.message)
      return
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        user_id: data.user.id,
        username: authUsername || authEmail.split('@')[0],
        email: authEmail,
      })
    }

    setSession(data.session)
    setMessage('Account created successfully')
    setAuthEmail('')
    setAuthPassword('')
    setAuthUsername('')
    navigate('/')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
    navigate('/login')
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setPrice('0')
    setCategory('Electronics')
    setLocation('Lusaka')
    setStatus('Available')
    setListingType('single')
    setCondition('Used - Good')
    setDeliveryOption('Meetup')
    setUploadedImages([])
    setAvailableColors([])
  }

  const handleCreateListing = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!session) {
      setMessage('Please sign in to create a listing')
      return
    }

    const { error } = await supabase.from('listings').insert({
      user_id: session.user.id,
      title,
      description,
      price: Number(price) || 0,
      category,
      location,
      status,
      listing_type: listingType,
      condition,
      delivery_option: deliveryOption,
      images: uploadedImages,
      colors: [],
      available_colors: availableColors,
      color: null,
    })

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Listing posted successfully')
    resetForm()
    await fetchListings()
    navigate('/')
  }

  const handleUpdateListing = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingListing) return

    const { error } = await supabase.from('listings').update({
      title,
      description,
      price: Number(price) || 0,
      category,
      location,
      status,
      listing_type: listingType,
      condition,
      delivery_option: deliveryOption,
      images: uploadedImages,
      available_colors: availableColors,
    }).eq('id', editingListing.id)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Listing updated successfully')
    resetForm()
    setEditingListing(null)
    await fetchListings()
    navigate('/')
  }

  const openListing = (listing: Listing) => {
    setSelectedListing(listing)
    navigate(`/listings/${listing.id}`)
  }

  const openEditListing = (listing: Listing) => {
    setEditingListing(listing)
    setTitle(listing.title)
    setDescription(listing.description)
    setPrice(String(listing.price))
    setCategory(listing.category)
    setLocation(listing.location)
    setStatus(listing.status ?? 'Available')
    setListingType(listing.listing_type ?? 'single')
    setCondition(listing.condition ?? 'Used - Good')
    setDeliveryOption(listing.delivery_option ?? 'Meetup')
    setUploadedImages(listing.images ?? [])
    setAvailableColors(listing.available_colors ?? [])
    navigate(`/edit/${listing.id}`)
  }

  async function fetchSavedListings(userId: string) {
    const { data } = await supabase.from('saved_listings').select('listing_id').eq('user_id', userId)
    if (data) {
      setSavedIds(data.map((item: any) => String(item.listing_id)))
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      void fetchSavedListings(session.user.id)
    } else {
      setSavedIds([])
    }
  }, [session?.user?.id])

  const toggleSave = async (listingId: number) => {
    if (!session) {
      setMessage('Please sign in to save items')
      return
    }
    const strId = String(listingId)
    const exists = savedIds.includes(strId)
    const nextSaved = exists ? savedIds.filter((id) => id !== strId) : [...savedIds, strId]
    setSavedIds(nextSaved)
    setMessage(exists ? 'Item removed from saved' : 'Item saved')

    if (exists) {
      await supabase.from('saved_listings').delete().eq('user_id', session.user.id).eq('listing_id', strId)
    } else {
      await supabase.from('saved_listings').upsert({ user_id: session.user.id, listing_id: strId }, { onConflict: 'user_id,listing_id' })
    }
  }

  const toggleCategory = (nextCategory: string) => {
    setActiveCategories((current) => {
      if (nextCategory === 'All') {
        return ['All']
      }

      const withoutAll = current.filter((categoryItem) => categoryItem !== 'All')
      if (withoutAll.includes(nextCategory)) {
        const nextCategories = withoutAll.filter((categoryItem) => categoryItem !== nextCategory)
        return nextCategories.length === 0 ? ['All'] : nextCategories
      }

      return [...withoutAll, nextCategory]
    })
  }

  const markAllRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, unread: false })))
  }

  const sendInboxMessage = async () => {
    if (!chatDraft.trim() || !activeChatId || !session) return

    const messageText = chatDraft.trim()
    setChatDraft('')

    const { error } = await supabase.from('messages').insert({
      chat_id: activeChatId,
      sender_id: session.user.id,
      content: messageText
    })

    if (error) {
      setMessage('Failed to send message: ' + error.message)
    } else {
      await fetchChatThreads()
    }
  }

  const handleStartChat = async (listing: Listing, customMessage?: string) => {
    if (!session) {
      setMessage('Please sign in to message the seller')
      navigate('/login')
      return
    }
    if (listing.user_id === session.user.id) {
      setMessage("You cannot message yourself about your own listing")
      return
    }

    setLoading(true)
    try {
      const { data: existingChats, error: selectError } = await supabase
        .from('chats')
        .select('*')
        .eq('listing_id', listing.id)
        .eq('buyer_id', session.user.id)
        .eq('seller_id', listing.user_id || '')

      if (selectError) throw selectError

      let chatId: number
      if (existingChats && existingChats.length > 0) {
        chatId = existingChats[0].id
      } else {
        const { data: newChat, error: insertError } = await supabase
          .from('chats')
          .insert({
            listing_id: listing.id,
            buyer_id: session.user.id,
            seller_id: listing.user_id || '',
            title: listing.title
          })
          .select()
          .single()

        if (insertError) throw insertError
        chatId = newChat.id

        if (!customMessage) {
          await supabase.from('messages').insert({
            chat_id: chatId,
            sender_id: session.user.id,
            content: "Hi, is this still available?"
          })
        }
      }

      if (customMessage) {
        await supabase.from('messages').insert({
          chat_id: chatId,
          sender_id: session.user.id,
          content: customMessage
        })
      }

      await fetchChatThreads()
      setActiveChatId(chatId)
      navigate('/inbox')
    } catch (err: any) {
      setMessage(err.message || 'Failed to start chat')
    } finally {
      setLoading(false)
    }
  }

  const filteredListings = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return [...listings]
      .map((listing) => {
        const listingSellerId = listing.user_id || ''
        const sellerBusiness = allBusinesses[listingSellerId]
        const isAdActive = sellerBusiness?.ads?.some(
          (ad) => ad.listingId === listing.id && ad.status === 'Active'
        )
        return {
          ...listing,
          sponsored: isAdActive || false,
        }
      })
      .filter((listing) => {
        const listingPrice = Number(String(listing.price).replace(/[^\d.]/g, ''))

        const matchesQuery = !normalizedQuery || `${listing.title} ${listing.description}`.toLowerCase().includes(normalizedQuery)
        const matchesCategory = activeCategories.includes('All') || activeCategories.includes(listing.category)
        const matchesPrice = priceRange === 3000 || listingPrice <= priceRange
        const matchesAvailability = !showOnlyAvailable || (listing.status ?? 'Available') === 'Available'
        const matchesKind =
          listingKindFilter === 'all' ||
          (listingKindFilter === 'service' && listing.listing_type === 'service') ||
          (listingKindFilter === 'item' && listing.listing_type !== 'service')

        return matchesQuery && matchesCategory && matchesPrice && matchesAvailability && matchesKind
      })
      .sort((a, b) => {
        const aSponsored = a.sponsored ? 1 : 0
        const bSponsored = b.sponsored ? 1 : 0
        if (aSponsored !== bSponsored) {
          return bSponsored - aSponsored
        }

        if (sortBy === 'Price: Low to High') {
          return Number(String(a.price).replace(/[^\d.]/g, '')) - Number(String(b.price).replace(/[^\d.]/g, ''))
        }
        if (sortBy === 'Price: High to Low') {
          return Number(String(b.price).replace(/[^\d.]/g, '')) - Number(String(a.price).replace(/[^\d.]/g, ''))
        }
        return Number(b.id) - Number(a.id)
      })
  }, [listings, searchQuery, activeCategories, priceRange, showOnlyAvailable, sortBy, allBusinesses, listingKindFilter])

  // --- ADD THESE MISSING VARIABLES ---
  const savedListings = useMemo(() => {
    return listings.filter((listing) => savedIds.includes(String(listing.id)))
  }, [listings, savedIds])

  const myListings = useMemo(() => {
    if (!session?.user?.id) return []
    // Using type assertion because user_id comes from ListingRow
    return listings.filter((listing) => (listing as ListingRow).user_id === session.user.id)
  }, [listings, session])

  const heroStats = useMemo(() => [
    { label: 'Active Listings', value: String(listings.length) },
    { label: 'Saved Items', value: String(savedIds.length) },
    { label: 'Unread Messages', value: String(chatThreads.filter(t => t.unread).length) }
  ], [listings.length, savedIds.length, chatThreads])

  const handleDeleteListing = async (listingId: number) => {
    const { error } = await supabase.from('listings').delete().eq('id', listingId)
    if (error) {
      setMessage(error.message)
      return
    }
    setMessage('Listing deleted successfully')
    await fetchListings()
  }

  const handleRenewListing = async (listingId: number) => {
    const { error } = await supabase.from('listings').update({
      created_at: new Date().toISOString(),
      status: 'Available'
    }).eq('id', listingId)
    if (error) {
      setMessage(error.message)
      return
    }
    setMessage('Listing renewed successfully')
    await fetchListings()
  }

  const handleUpdateListingStatus = async (listingId: number, nextStatus: string) => {
    const { error } = await supabase.from('listings').update({ status: nextStatus }).eq('id', listingId)
    if (error) {
      setMessage(error.message)
      return
    }
    setMessage(`Listing marked as ${nextStatus.toLowerCase()}`)
    await fetchListings()
  }

  const handleUploadAvatar = async (base64: string) => {
    if (!session?.user?.id) return
    const { error } = await supabase.from('profiles').update({ avatar_url: base64 }).eq('user_id', session.user.id)
    if (!error) {
      setProfile((current) => current ? { ...current, avatar_url: base64 } : null)
      setMessage('Avatar updated successfully')
    } else {
      setMessage(error.message)
    }
  }

  const handleCreateOrUpdateBusiness = (updated: BusinessProfile) => {
    const nextAll = { ...allBusinesses, [updated.userId]: updated }
    setAllBusinesses(nextAll)
    setBusinessProfile(updated)
    window.localStorage.setItem('marketspace-all-businesses', JSON.stringify(nextAll))
    setMessage('Business profile updated successfully')

    if (session?.user?.id) {
      void supabase.from('stores').upsert({
        user_id: updated.userId,
        shop_name: updated.shopName,
        description: updated.description,
        category: updated.category,
        address: updated.address,
        whatsapp: updated.whatsapp,
        logo: updated.logo,
        cover: updated.cover,
        catalog: updated.catalog,
        ads: updated.ads,
      }, { onConflict: 'user_id' })
    }
    navigate('/profile/store-dashboard')
  }

  const loadBusinesses = async () => {
    const stored = window.localStorage.getItem('marketspace-all-businesses')
    let baseStores: Record<string, BusinessProfile> = {}
    if (stored) {
      try {
        baseStores = JSON.parse(stored) as Record<string, BusinessProfile>
      } catch {
        // ignore
      }
    }
    setAllBusinesses(baseStores)

    const { data } = await supabase.from('stores').select('*')
    if (data && data.length > 0) {
      const dbStores: Record<string, BusinessProfile> = {}
      data.forEach((s: any) => {
        dbStores[s.user_id] = {
          userId: s.user_id,
          shopName: s.shop_name,
          description: s.description,
          category: s.category,
          address: s.address,
          whatsapp: s.whatsapp,
          logo: s.logo,
          cover: s.cover,
          catalog: s.catalog || [],
          ads: s.ads || [],
        }
      })
      setAllBusinesses(prev => ({ ...prev, ...dbStores }))
    }
  }

  useEffect(() => {
    void loadBusinesses()
  }, [])

  useEffect(() => {
    if (session?.user?.id && allBusinesses[session.user.id]) {
      setBusinessProfile(allBusinesses[session.user.id])
    } else {
      setBusinessProfile(null)
    }
  }, [session, allBusinesses])

  return {
    view,
    setView,
    theme,
    setTheme,
    session,
    setSession,
    profile,
    setProfile,
    listings,
    setListings,
    stores,
    setStores,
    selectedListing,
    setSelectedListing,
    editingListing,
    setEditingListing,
    loading,
    setLoading,
    message,
    setMessage,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    authUsername,
    setAuthUsername,
    searchQuery,
    setSearchQuery,
    activeCategories,
    setActiveCategories,
    toggleCategory,
    priceRange,
    setPriceRange,
    distanceFilter,
    setDistanceFilter,
    sortBy,
    setSortBy,
    showOnlyAvailable,
    setShowOnlyAvailable,
    savedIds,
    setSavedIds,
    notifications,
    setNotifications,
    chatThreads,
    setChatThreads,
    activeChatId,
    setActiveChatId,
    chatDraft,
    setChatDraft,
    title,
    setTitle,
    description,
    setDescription,
    price,
    setPrice,
    category,
    setCategory,
    location,
    setLocation,
    status,
    setStatus,
    listingType,
    setListingType,
    condition,
    setCondition,
    deliveryOption,
    setDeliveryOption,
    canMessage,
    setCanMessage,
    userEmail,
    fetchListings,
    fetchStores,
    loadProfile,
    handleLogin,
    handleSignup,
    handleLogout,
    resetForm,
    handleCreateListing,
    handleUpdateListing,
    openListing,
    openEditListing,
    toggleSave,
    markAllRead,
    sendInboxMessage,
    filteredListings,
    savedListings,
    myListings,
    heroStats,
    businessProfile,
    setBusinessProfile,
    allBusinesses,
    setAllBusinesses,
    selectedStore,
    setSelectedStore,
    uploadedImages,
    setUploadedImages,
    handleCreateOrUpdateBusiness,
    handleDeleteListing,
    handleRenewListing,
    handleUpdateListingStatus,
    handleUploadAvatar,
    cardSize,
    setCardSize,
    handleStartChat,
    availableColors,
    setAvailableColors,
    listingKindFilter,
    setListingKindFilter,
    followingIds,
    notifyStoreIds,
    toggleFollowStore,
    toggleNotifyStore,
    storeReviews,
    addStoreReview,
    replyToStoreReview,
    currency,
    setCurrency,
    notificationsConfig,
    setNotificationsConfig,
    blockedUserIds,
    toggleBlockUser,
    paymentMethods,
    addPaymentMethod,
    removePaymentMethod,
    browsingHistory,
    clearBrowsingHistory,
    searchHistory,
    clearSearchHistory,
    togglePinChat,
    toggleFavoriteChat,
    toggleArchiveChat,
    deleteChat,
  }
}

export { CATEGORY_OPTIONS, CONDITION_OPTIONS, DELIVERY_OPTIONS }
