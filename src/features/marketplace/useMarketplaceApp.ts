import { useEffect, useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { isListingExpired } from './listingExpiry'
import { CATEGORY_OPTIONS, CONDITION_OPTIONS, DELIVERY_OPTIONS } from './constants'
import type { Listing, Profile, View, BusinessProfile, BusinessAd, StoreCollection, StoreReview, PaymentMethodItem, NotificationConfig, StoreThemeConfig, StoreTemplateContent, StoreTemplateId } from '../../types'
import { logAnalyticsEvent, toggleStoreFollowInDb } from '../../services/analytics'
import { getFunctionErrorMessage } from '../../utils/functionError'

export type NotificationItem = {
  id: number | string
  user_id?: string | null
  title: string
  body: string
  time: string
  unread: boolean
  link_url?: string
  isPinned?: boolean
  isBroadcast?: boolean
  unreadOverride?: boolean | null
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
  status: string
  setStatus: Dispatch<SetStateAction<string>>
  listingType: string
  setListingType: Dispatch<SetStateAction<string>>
  servicePriceUnit: 'fixed' | 'from' | 'per_hour' | 'per_day'
  setServicePriceUnit: Dispatch<SetStateAction<'fixed' | 'from' | 'per_hour' | 'per_day'>>
  serviceAreaId: string
  setServiceAreaId: Dispatch<SetStateAction<string>>
  condition: string
  setCondition: Dispatch<SetStateAction<string>>
  deliveryOption: string
  setDeliveryOption: Dispatch<SetStateAction<string>>
  renewalFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  setRenewalFrequency: Dispatch<SetStateAction<'daily' | 'weekly' | 'biweekly' | 'monthly'>>
  publishAs: 'private' | 'store'
  setPublishAs: Dispatch<SetStateAction<'private' | 'store'>>
  collectionId: string
  setCollectionId: Dispatch<SetStateAction<string>>
  howItWorks: string
  setHowItWorks: Dispatch<SetStateAction<string>>
  useGlobalRenewal: boolean
  setUseGlobalRenewal: Dispatch<SetStateAction<boolean>>
  globalRenewalFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  setGlobalRenewalFrequency: Dispatch<SetStateAction<'daily' | 'weekly' | 'biweekly' | 'monthly'>>
  globalRenewalDay: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'
  setGlobalRenewalDay: Dispatch<SetStateAction<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'>>
  enableGlobalRenewal: boolean
  setEnableGlobalRenewal: Dispatch<SetStateAction<boolean>>
  canMessage: boolean
  setCanMessage: Dispatch<SetStateAction<boolean>>
  userEmail: string
  fetchListings: (userId?: string) => Promise<void>
  fetchStores: () => Promise<void>
  loadProfile: (userId: string, userObj?: any) => Promise<Profile>
  handleLogin: () => Promise<void>
  handleSignup: (captchaToken?: string) => Promise<void>
  handleLogout: () => Promise<void>
  resetForm: () => void
  handleCreateListing: (event: FormEvent<HTMLFormElement>) => Promise<void>
  handleUpdateListing: (event: FormEvent<HTMLFormElement>) => Promise<void>
  openListing: (listing: Listing) => void
  openEditListing: (listing: Listing) => void
  toggleSave: (listingId: number) => void
  clearAllFilters: () => void
  handleUpdateListingCollection: (listingId: number, targetColId: string | null) => Promise<void>
  markAllRead: () => Promise<void>
  markNotificationRead: (notificationId: string | number, unread: boolean) => Promise<void>
  toggleNotificationPin: (notificationId: string | number) => Promise<void>
  deleteNotification: (notificationId: string | number) => Promise<void>
  setChatUnread: (chatId: number, unread: boolean) => Promise<void>
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
  saveAd: (ad: BusinessAd) => Promise<void>
  updateAdStatus: (adId: string, status: BusinessAd['status']) => Promise<void>
  deleteAd: (adId: string) => Promise<void>
  archiveStore: (storeId: string, archived: boolean) => Promise<void>
  deleteStore: (storeId: string) => Promise<void>
  handleSaveStoreTheme: (config: StoreThemeConfig, storeUserId?: string) => Promise<void>
  handleSaveStoreTemplate: (templateId: StoreTemplateId, content: Record<string, unknown>, departments?: Array<{ name: string; image?: string }>, storeUserId?: string) => Promise<void>
  handleDeleteListing: (listingId: number) => Promise<void>
  handleRenewListing: (listingId: number) => Promise<void>
  handleUpdateListingStatus: (listingId: number, status: string) => Promise<void>
  handleUploadAvatar: (base64: string) => Promise<void>
  handleUploadCover: (url: string) => Promise<void>
  handleStartChat: (listing: Listing, customMessage?: string, stayInCurrentPage?: boolean) => Promise<void>
  availableColors: string[]
  setAvailableColors: Dispatch<SetStateAction<string[]>>
  listingKindFilter: 'all' | 'item' | 'service'
  setListingKindFilter: Dispatch<SetStateAction<'all' | 'item' | 'service'>>
  storeReviews: StoreReview[]
  addStoreReview: (storeId: string | null, rating: number, comment: string, targetUserId?: string | null) => void
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
  addSearchHistory: (query: string) => void
  clearSearchHistory: () => void
  togglePinChat: (chatId: number) => void
  toggleUnreadChat: (chatId: number) => void
  toggleFavoriteChat: (chatId: number) => void
  toggleArchiveChat: (chatId: number) => void
  deleteChat: (chatId: number) => void
  handleDeleteAccount: () => Promise<void>
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

function isDatabaseNotificationId(id: string | number): id is string {
  return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}

function isMissingSchemaObject(error: { code?: string; message: string }): boolean {
  return ['PGRST204', 'PGRST205', '42P01', '42703'].includes(error.code || '')
    || /schema cache|does not exist/i.test(error.message)
}

async function isModeratorAccount() {
  const { data, error } = await supabase.rpc('is_moderator')
  if (error) throw new Error(`Account access could not be verified: ${error.message}`)
  return data === true
}

export function useMarketplaceApp(): MarketplaceAppModel {
  const navigate = useNavigate()
  const [view, setView] = useState<View>('home')
  const [theme, setTheme] = useState<'light' | 'dark'>(getStoredTheme)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [myListings, setMyListings] = useState<Listing[]>([])
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
  const [globalRenewalFrequency, setGlobalRenewalFrequency] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>(() => {
    if (typeof window === 'undefined') return 'weekly'
    const stored = window.localStorage.getItem('marketspace-global-renewal')
    return (stored as any) || 'weekly'
  })

  const [globalRenewalDay, setGlobalRenewalDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'>(() => {
    if (typeof window === 'undefined') return 'Monday'
    const stored = window.localStorage.getItem('marketspace-global-renewal-day')
    return (stored as any) || 'Monday'
  })

  const [enableGlobalRenewal, setEnableGlobalRenewalState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    const stored = window.localStorage.getItem('marketspace-enable-global-renewal')
    return stored !== null ? JSON.parse(stored) : true
  })

  const persistGlobalRenewalPreferences = async (updates: Partial<Pick<Profile, 'global_renewal_frequency' | 'global_renewal_day' | 'enable_global_renewal'>>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update(updates).eq('user_id', user.id)
  }

  const updateGlobalRenewalFrequency = (value: SetStateAction<'daily' | 'weekly' | 'biweekly' | 'monthly'>) => {
    const next = typeof value === 'function' ? value(globalRenewalFrequency) : value
    setGlobalRenewalFrequency(next)
    void persistGlobalRenewalPreferences({ global_renewal_frequency: next })
  }

  const updateGlobalRenewalDay = (value: SetStateAction<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'>) => {
    const next = typeof value === 'function' ? value(globalRenewalDay) : value
    setGlobalRenewalDay(next)
    void persistGlobalRenewalPreferences({ global_renewal_day: next })
  }

  const setEnableGlobalRenewal: Dispatch<SetStateAction<boolean>> = (value) => {
    const next = typeof value === 'function' ? value(enableGlobalRenewal) : value
    setEnableGlobalRenewalState(next)
    void persistGlobalRenewalPreferences({ enable_global_renewal: next })
  }
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  useEffect(() => {
    let active = true
    const userId = session?.user.id
    if (!userId) {
      return () => { active = false }
    }

    const loadNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id,user_id,title,body,time,unread,link_url,created_at')
        .or(`user_id.eq.${userId},user_id.is.null`)
        .order('created_at', { ascending: false })
      if (!active) return
      if (error) {
        setMessage(`Notifications could not be loaded: ${error.message}`)
        return
      }

      const notificationRows = data || []
      const notificationIds = notificationRows.map(item => item.id)
      const { data: stateRows, error: stateError } = notificationIds.length
        ? await supabase
          .from('notification_user_states')
          .select('notification_id,is_pinned,is_deleted,unread_override')
          .eq('user_id', userId)
          .in('notification_id', notificationIds)
        : { data: [], error: null }
      if (!active) return
      if (stateError && !isMissingSchemaObject(stateError)) {
        setMessage(`Notification settings could not be loaded: ${stateError.message}`)
        return
      }

      if (stateError) {
        setMessage('Notification actions need the latest database migration. Existing notifications are still shown.')
      }

      const stateById = new Map((stateRows || []).map(state => [state.notification_id, state]))
      const databaseNotifications: NotificationItem[] = notificationRows
        .filter(item => !stateById.get(item.id)?.is_deleted)
        .map(item => {
          const state = stateById.get(item.id)
          return {
            id: item.id,
            user_id: item.user_id,
            title: item.title,
            body: item.body,
            time: item.created_at ? new Date(item.created_at).toLocaleString() : item.time || '',
            unread: state?.unread_override ?? item.unread,
            link_url: item.link_url || undefined,
            isPinned: state?.is_pinned || false,
            isBroadcast: item.user_id === null,
            unreadOverride: state?.unread_override,
          }
        })
      setNotifications(databaseNotifications)
    }

    void loadNotifications()
    return () => { active = false }
  }, [session?.user.id])

  const [chatThreads, setChatThreads] = useState<ChatThread[]>([])
  const [activeChatId, setActiveChatId] = useState<number | null>(1)
  const [chatDraft, setChatDraft] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState<string>('3000')
  const [category, setCategory] = useState('Electronics')
  const [status, setStatus] = useState('Available')
  const [listingType, setListingType] = useState('single')
  const [servicePriceUnit, setServicePriceUnit] = useState<'fixed' | 'from' | 'per_hour' | 'per_day'>('fixed')
  const [serviceAreaId, setServiceAreaId] = useState('')
  const [condition, setCondition] = useState('Used - Good')
  const [deliveryOption, setDeliveryOption] = useState('In-Person Meetup')
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [availableColors, setAvailableColors] = useState<string[]>([])
  const [renewalFrequency, setRenewalFrequency] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('weekly')
  const [publishAs, setPublishAs] = useState<'private' | 'store'>('private')
  const [collectionId, setCollectionId] = useState<string>('')
  const [howItWorks, setHowItWorks] = useState<string>('')
  const [useGlobalRenewal, setUseGlobalRenewal] = useState<boolean>(true)
  const [listingKindFilter, setListingKindFilter] = useState<'all' | 'item' | 'service'>('all')
  const [canMessage, setCanMessage] = useState(true)

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

  const addSearchHistory = (query: string) => {
    const clean = query.trim()
    if (!clean) return
    setSearchHistory(current => {
      const next = [clean, ...current.filter(item => item.toLowerCase() !== clean.toLowerCase())].slice(0, 20)
      window.localStorage.setItem('marketspace-search-history', JSON.stringify(next))
      return next
    })
  }

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

  const persistChatState = async (chatId: number, update: Record<string, boolean>) => {
    if (!session?.user?.id) return true
    const { error } = await supabase.from('chat_user_states').upsert({
      chat_id: chatId,
      user_id: session.user.id,
      ...update,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'chat_id,user_id' })
    if (error) {
      setMessage(`Chat settings could not be saved: ${error.message}`)
      return false
    }
    return true
  }

  const togglePinChat = (chatId: number) => {
    const next = !chatThreads.find(thread => thread.id === chatId)?.isPinned
    void (async () => {
      if (!await persistChatState(chatId, { is_pinned: next })) return
      setChatFlags(prev => ({ ...prev, [chatId]: { ...prev[chatId], isPinned: next } }))
      setChatThreads(prev => prev.map(thread => thread.id === chatId ? { ...thread, isPinned: next } : thread))
    })()
  }

  const setChatUnread = async (chatId: number, unread: boolean) => {
    if (!await persistChatState(chatId, { is_unread: unread })) return
    setChatThreads(previous => previous.map(thread => thread.id === chatId ? { ...thread, unread } : thread))
  }

  const toggleUnreadChat = (chatId: number) => {
    const thread = chatThreads.find(item => item.id === chatId)
    if (thread) void setChatUnread(chatId, !thread.unread)
  }

  const toggleFavoriteChat = (chatId: number) => {
    const next = !chatThreads.find(thread => thread.id === chatId)?.isFavorite
    void (async () => {
      if (!await persistChatState(chatId, { is_favorite: next })) return
      setChatFlags(prev => ({ ...prev, [chatId]: { ...prev[chatId], isFavorite: next } }))
      setChatThreads(prev => prev.map(thread => thread.id === chatId ? { ...thread, isFavorite: next } : thread))
    })()
  }

  const toggleArchiveChat = (chatId: number) => {
    const next = !chatThreads.find(thread => thread.id === chatId)?.isArchived
    void (async () => {
      if (!await persistChatState(chatId, { is_archived: next })) return
      setChatFlags(prev => ({ ...prev, [chatId]: { ...prev[chatId], isArchived: next } }))
      setChatThreads(prev => prev.map(thread => thread.id === chatId ? { ...thread, isArchived: next } : thread))
    })()
  }

  const deleteChat = (chatId: number) => {
    if (chatThreads.find(thread => thread.id === chatId)?.isPinned) {
      setMessage('Unpin this chat before deleting it')
      return
    }
    void (async () => {
      if (!await persistChatState(chatId, { is_deleted: true })) return
      if (!session?.user?.id) {
        setDeletedChatIds((prev) => prev.includes(chatId) ? prev : [...prev, chatId])
      }
      setChatThreads(prev => prev.filter(thread => thread.id !== chatId))
      if (activeChatId === chatId) setActiveChatId(null)
      setMessage('Chat thread deleted')
    })()
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

  const addStoreReview = async (storeId: string | null, rating: number, comment: string, targetUserId?: string | null) => {
    if (!session) {
      setMessage('Please sign in to write a review')
      return
    }
    const newReview: StoreReview = {
      id: Math.random().toString(36).substring(2, 9),
      storeId: storeId ?? null,
      targetUserId: targetUserId ?? null,
      reviewerId: session.user.id,
      reviewerName: profile?.username || session.user.email || 'Anonymous',
      rating,
      comment,
      createdAt: new Date().toISOString(),
    }
    setStoreReviews((prev) => [newReview, ...prev])
    setMessage('Review submitted successfully')

    await supabase.from('reviews').insert({
      reviewer_id: session.user.id,
      store_id: storeId || null,
      target_user_id: targetUserId || null,
      rating,
      comment,
    })
  }

  const replyToStoreReview = (reviewId: string, replyText: string) => {
    setStoreReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, reply: replyText } : r))
    )
    setMessage('Response posted successfully')
  }

  const toggleFollowStore = (storeId: string) => {
    if (!session) {
      setMessage('Please sign in to follow stores')
      return
    }
    const isFollowing = followingIds.includes(storeId)
    setFollowingIds(prev =>
      isFollowing ? prev.filter(id => id !== storeId) : [...prev, storeId]
    )
    void toggleStoreFollowInDb(session.user.id, storeId)
  }

  const toggleNotifyStore = (storeId: string) => {
    setNotifyStoreIds(prev =>
      prev.includes(storeId) ? prev.filter(id => id !== storeId) : [...prev, storeId]
    )
  }

  const userEmail = session?.user?.email ?? profile?.email ?? 'Guest'

  async function fetchStoreReviews() {
    const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false })
    if (error || !data) return

    const reviewerIds = Array.from(new Set(data.map((review) => review.reviewer_id).filter(Boolean)))
    const { data: reviewers } = reviewerIds.length
      ? await supabase.from('public_profiles').select('user_id, username').in('user_id', reviewerIds)
      : { data: [] }
    const storeIds = Array.from(new Set(data.map((review) => review.store_id).filter(Boolean)))
    const { data: reviewedStores } = storeIds.length
      ? await supabase.from('stores').select('id, user_id').in('id', storeIds)
      : { data: [] }
    const reviewerNames = new Map((reviewers ?? []).map((reviewer) => [reviewer.user_id, reviewer.username || 'User']))
    const storeOwners = new Map((reviewedStores ?? []).map((store) => [store.id, store.user_id]))

    setStoreReviews(data.map((review) => ({
      id: review.id,
      storeId: review.store_id,
      targetUserId: review.target_user_id || storeOwners.get(review.store_id),
      reviewerId: review.reviewer_id,
      reviewerName: reviewerNames.get(review.reviewer_id) || 'User',
      rating: review.rating,
      comment: review.comment,
      createdAt: review.created_at,
      reply: review.reply || undefined,
    })))
  }

  async function fetchListings(userId?: string) {
    const fetchListingRows = async (ownerId?: string) => {
      const rows: ListingRow[] = []
      let offset = 0

      while (true) {
        let query = supabase
          .from('listings')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + 999)
        query = ownerId
          ? query.eq('user_id', ownerId)
          : query.eq('moderation_status', 'approved')

        const { data, error } = await query
        if (error) return { rows: null, error }

        const page = (data ?? []) as ListingRow[]
        rows.push(...page)
        if (page.length === 0) break
        offset += page.length
      }

      return { rows, error: null }
    }

    const [publicResult, sellerResult] = await Promise.all([
      fetchListingRows(),
      userId ? fetchListingRows(userId) : Promise.resolve({ rows: [], error: null }),
    ])
    if (publicResult.error) {
      setMessage(`Listings could not be loaded: ${publicResult.error.message}`)
      return
    }
    if (sellerResult.error) {
      setMessage(`Your listings could not be loaded: ${sellerResult.error.message}`)
    }

    const { data: archivedStores, error: archivedStoresError } = await supabase
      .from('stores')
      .select('id')
      .not('archived_at', 'is', null)
    if (archivedStoresError) {
      setMessage(`Archived-store listings could not be filtered: ${archivedStoresError.message}`)
      return
    }
    const archivedStoreIds = new Set((archivedStores ?? []).map((store) => store.id))
    const publicRows = (publicResult.rows ?? []).filter((listing) =>
      !listing.store_id || !archivedStoreIds.has(listing.store_id)
    )

    const { data: profilesData } = await supabase.from('public_profiles').select('user_id, username')
    const sellerMap = new Map<string, string>()
      ; ((profilesData ?? []) as ProfileSummary[]).forEach((profileRow) => {
        if (profileRow.user_id) {
          sellerMap.set(profileRow.user_id, profileRow.username ?? 'Seller')
        }
      })

    const enrichListings = (rows: ListingRow[]) => rows.map((item) => ({
      ...item,
      seller_name: sellerMap.get(item.user_id ?? '') ?? 'Seller',
    }))

    setListings(enrichListings(publicRows))
    if (!sellerResult.error) {
      setMyListings(enrichListings(sellerResult.rows ?? []))
    }
  }

  async function fetchStores() {
    const { data, error } = await supabase.from('public_profiles').select('*').limit(8)
    if (!error) {
      setStores((data ?? []) as Profile[])
    }
  }

  async function loadProfile(userId: string, userObj?: any) {
    let { data } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle()

    const fallbackUsername = userObj?.user_metadata?.username || (userObj?.email ? userObj.email.split('@')[0] : '') || 'User'
    const fallbackEmail = userObj?.email || ''

    if (!data) {
      const newProfile: Profile = {
        user_id: userId,
        username: fallbackUsername,
        email: fallbackEmail,
        phone_verified: false,
      }
      await supabase.from('profiles').upsert(newProfile)
      setProfile(newProfile)
      return newProfile
    }

    if (!data.username && fallbackUsername) {
      data.username = fallbackUsername
      await supabase.from('profiles').update({ username: fallbackUsername }).eq('user_id', userId)
    }

    const loadedProfile = data as Profile
    if (loadedProfile.global_renewal_frequency) setGlobalRenewalFrequency(loadedProfile.global_renewal_frequency)
    if (loadedProfile.global_renewal_day) setGlobalRenewalDay(loadedProfile.global_renewal_day)
    if (typeof loadedProfile.enable_global_renewal === 'boolean') setEnableGlobalRenewalState(loadedProfile.enable_global_renewal)
    setProfile(loadedProfile)
    return loadedProfile
  }

  async function fetchChatThreads() {
    if (!session) return

    const { data: chatsData, error: chatsError } = await supabase
      .from('chats')
      .select('*')
      .or(`buyer_id.eq.${session.user.id},seller_id.eq.${session.user.id}`)

    if (chatsError) {
      setMessage(`Chats could not be loaded: ${chatsError.message}`)
      return
    }

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

    if (messagesError) {
      setMessage(`Chat messages could not be loaded: ${messagesError.message}`)
      return
    }

    const threadMap = new Map<number, ChatMessage[]>()
    messagesData?.forEach((m: any) => {
      const list = threadMap.get(m.chat_id) || []
      list.push({
        id: m.id,
        sender: m.sender_id === session.user.id ? 'me' : 'them',
        content: m.content,
        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })
      threadMap.set(m.chat_id, list)
    })

    const userIds = new Set<string>()
    chatsData.forEach((c) => {
      userIds.add(c.buyer_id)
      userIds.add(c.seller_id)
    })

    const { data: profilesData } = await supabase
      .from('public_profiles')
      .select('user_id, username')
      .in('user_id', Array.from(userIds))

    const nameMap = new Map<string, string>()
    profilesData?.forEach((p: any) => {
      nameMap.set(p.user_id, p.username || 'User')
    })

    const { data: stateRows, error: stateError } = await supabase
      .from('chat_user_states')
      .select('chat_id, is_pinned, is_favorite, is_archived, is_deleted, is_unread')
      .eq('user_id', session.user.id)
      .in('chat_id', chatIds)
    if (stateError && !isMissingSchemaObject(stateError)) {
      setMessage(`Chat settings could not be loaded: ${stateError.message}`)
      return
    }

    const databaseChatFlags: Record<number, { isPinned?: boolean; isFavorite?: boolean; isArchived?: boolean; unread?: boolean }> = {}
    const databaseDeletedIds: number[] = []
    const applyChatStates = (rows: Array<{
      chat_id: number
      is_pinned: boolean
      is_favorite: boolean
      is_archived: boolean
      is_deleted: boolean
      is_unread?: boolean
    }> | null) => rows?.forEach(state => {
      databaseChatFlags[state.chat_id] = {
        isPinned: Boolean(state.is_pinned),
        isFavorite: Boolean(state.is_favorite),
        isArchived: Boolean(state.is_archived),
        unread: Boolean(state.is_unread),
      }
      if (state.is_deleted) databaseDeletedIds.push(Number(state.chat_id))
    })
    if (stateError) {
      setMessage('Unread chat controls need the latest database migration. Existing chats are still shown.')
      const { data: legacyStateRows, error: legacyStateError } = await supabase
        .from('chat_user_states')
        .select('chat_id, is_pinned, is_favorite, is_archived, is_deleted')
        .eq('user_id', session.user.id)
        .in('chat_id', chatIds)
      if (legacyStateError) {
        setMessage(`Chat settings could not be loaded: ${legacyStateError.message}`)
        return
      }
      applyChatStates(legacyStateRows)
    } else {
      applyChatStates(stateRows)
    }

    const threads: ChatThread[] = chatsData.map((c) => {
      const otherId = c.buyer_id === session.user.id ? c.seller_id : c.buyer_id
      const participantName = nameMap.get(otherId) || 'User'
      const msgs = threadMap.get(c.id) || []

      return {
        id: c.id,
        title: c.title || 'Inquiry',
        participant: participantName,
        listingTitle: c.title || 'Marketplace Item',
        unread: false,
        messages: msgs,
        ...databaseChatFlags[c.id],
      }
    })

    const effectiveDeletedIds = new Set(session?.user?.id ? databaseDeletedIds : deletedChatIds)
    setChatThreads(threads
      .filter(thread => !effectiveDeletedIds.has(thread.id))
      .sort((a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned))))
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
      let marketplaceSession = currentSession
      if (currentSession) {
        try {
          if (await isModeratorAccount()) {
            const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })
            setMessage(signOutError
              ? `Moderator account detected, but regular sign-out failed: ${signOutError.message}`
              : 'Moderator account detected. Sign in through the admin portal.')
            navigate('/admin/login', { replace: true })
            marketplaceSession = null
          }
        } catch (error) {
          const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })
          setMessage(signOutError
            ? `Account access could not be verified and sign-out failed: ${signOutError.message}`
            : error instanceof Error ? error.message : 'Account access could not be verified.')
          navigate('/login', { replace: true })
          marketplaceSession = null
        }
      }
      setSession(marketplaceSession)

      let loadedProfile: Profile | null = null
      if (marketplaceSession) {
        loadedProfile = await loadProfile(marketplaceSession.user.id, marketplaceSession.user)
        const { data: followRows } = await supabase.from('store_followers').select('store_id').eq('user_id', marketplaceSession.user.id)
        if (followRows) {
          setFollowingIds(followRows.map((r: any) => r.store_id))
        }
      }

      await Promise.all([fetchListings(marketplaceSession?.user.id), fetchStores(), fetchStoreReviews()])
      setLoading(false)

      const needsOnboarding = marketplaceSession && (
        !loadedProfile?.onboarding_choice
      )

      if (needsOnboarding && (window.location.pathname === '/' || window.location.pathname === '/profile')) {
        navigate('/onboarding')
      }
    }

    void loadInitialData()
  }, [])

  useEffect(() => {
    if (session) {
      void fetchChatThreads()
    }
  }, [session])

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      window.setTimeout(() => {
        void (async () => {
          if (!currentSession) {
            setSession(null)
            setProfile(null)
            setMyListings([])
            setChatThreads([])
            setNotifications(current => current.filter(item => !item.user_id || item.user_id === 'all'))
            return
          }

          try {
            if (await isModeratorAccount()) {
              const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })
              setSession(null)
              setProfile(null)
              setMessage(signOutError
                ? `Moderator account detected, but regular sign-out failed: ${signOutError.message}`
                : 'Moderator account detected. Sign in through the admin portal.')
              navigate('/admin/login', { replace: true })
              return
            }
          } catch (error) {
            const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })
            setSession(null)
            setProfile(null)
            setMessage(signOutError
              ? `Account access could not be verified and sign-out failed: ${signOutError.message}`
              : error instanceof Error ? error.message : 'Account access could not be verified.')
            navigate('/login', { replace: true })
            return
          }

          setSession(currentSession)
          const loadedProfile = await loadProfile(currentSession.user.id, currentSession.user)
          void fetchListings(currentSession.user.id)

          const needsOnboarding = !loadedProfile?.onboarding_choice
          if (needsOnboarding && (window.location.pathname === '/' || window.location.pathname === '/profile')) {
            navigate('/onboarding')
          }
        })()
      }, 0)
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
    try {
      if (await isModeratorAccount()) {
        const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })
        setSession(null)
        setAuthEmail('')
        setAuthPassword('')
        setMessage(signOutError
          ? `Moderator account detected, but regular sign-out failed: ${signOutError.message}`
          : 'Moderator account detected. Sign in through the admin portal.')
        navigate('/admin/login', { replace: true })
        return
      }
    } catch (roleError) {
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })
      setSession(null)
      setAuthEmail('')
      setAuthPassword('')
      setMessage(signOutError
        ? `Account access could not be verified and sign-out failed: ${signOutError.message}`
        : roleError instanceof Error ? roleError.message : 'Account access could not be verified.')
      return
    }

    setSession(data.session)
    setMessage('Welcome back to MarketSpace')
    setAuthEmail('')
    setAuthPassword('')

    // Fetch user profile choice
    const { data: profileRow } = await supabase.from('profiles').select('onboarding_choice').eq('user_id', data.user.id).maybeSingle()
    if (!profileRow?.onboarding_choice) {
      navigate('/onboarding')
    } else {
      navigate('/')
    }
  }

  const handleSignup = async (captchaToken?: string) => {
    setMessage('')
    if (!authEmail.trim() || !authPassword.trim()) {
      setMessage('Please enter a valid email and password.')
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email: authEmail.trim(),
      password: authPassword,
      options: { data: { username: authUsername }, captchaToken },
    })

    if (error) {
      setMessage(error.message)
      return
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        user_id: data.user.id,
        username: authUsername || authEmail.split('@')[0],
        email: authEmail.trim(),
      })
    }

    if (!data.session) {
      setMessage('Registration successful! A confirmation email has been sent. Please confirm your email before logging in.')
      setAuthEmail('')
      setAuthPassword('')
      setAuthUsername('')
      navigate('/login')
      return
    }

    setSession(data.session)
    setMessage('Account created successfully')
    setAuthEmail('')
    setAuthPassword('')
    setAuthUsername('')
    navigate('/onboarding')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
    setNotifications([])
    navigate('/login')
  }

  const handleDeleteAccount = async () => {
    try {
      if (!session?.user?.id) throw new Error('Sign in again before deleting your account.')
      const { error } = await supabase.functions.invoke('account-deletion', { body: {} })
      if (error) throw new Error(await getFunctionErrorMessage(error))

      const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })
      if (signOutError) throw signOutError

      setSession(null)
      setProfile(null)
      setSavedIds([])
      setNotifications([])
      setBusinessProfile(null)
      window.localStorage.removeItem('marketspace-saved')
      window.localStorage.removeItem('marketspace-notify-store-ids')
      setMessage('Your account and associated data have been permanently deleted.')
      navigate('/')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Account deletion could not be completed.'
      setMessage(`Account deletion failed: ${message}`)
      throw new Error(message)
    }
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setPrice('0')
    setCategory('Electronics')
    setStatus('Available')
    setListingType('single')
    setServicePriceUnit('fixed')
    setServiceAreaId('')
    setCondition('Used - Good')
    setDeliveryOption('Meetup')
    setUploadedImages([])
    setAvailableColors([])
    setPublishAs('private')
    setCollectionId('')
    setHowItWorks('')
    setUseGlobalRenewal(true)
  }

  const handleCreateListing = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!session) {
      setMessage('Please sign in to create a listing')
      return
    }

    const effectiveRenewal = useGlobalRenewal ? globalRenewalFrequency : renewalFrequency

    const { error } = await supabase.from('listings').insert({
      user_id: session.user.id,
      title,
      description,
      price: Number(price) || 0,
      category,
      status,
      listing_type: listingType,
      price_unit: listingType === 'service' ? servicePriceUnit : 'fixed',
      service_area_id: listingType === 'service' ? serviceAreaId || null : null,
      condition,
      delivery_option: deliveryOption,
      images: uploadedImages,
      available_colors: availableColors,
      renewal_frequency: effectiveRenewal,
      use_global_renewal: useGlobalRenewal,
      publish_as: publishAs,
      collection_id: publishAs === 'store' ? collectionId.split(',')[0] || null : null,
      collection_ids: publishAs === 'store' ? collectionId.split(',').filter(Boolean) : [],
      how_it_works: howItWorks,
      last_renewed_at: new Date().toISOString(),
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

    const effectiveRenewal = useGlobalRenewal ? globalRenewalFrequency : renewalFrequency

    const { error } = await supabase.from('listings').update({
      title,
      description,
      price: Number(price) || 0,
      category,
      status,
      listing_type: listingType,
      price_unit: listingType === 'service' ? servicePriceUnit : 'fixed',
      service_area_id: listingType === 'service' ? serviceAreaId || null : null,
      condition,
      delivery_option: deliveryOption,
      images: uploadedImages,
      available_colors: availableColors,
      renewal_frequency: effectiveRenewal,
      use_global_renewal: useGlobalRenewal,
      publish_as: publishAs,
      collection_id: publishAs === 'store' ? collectionId.split(',')[0] || null : null,
      collection_ids: publishAs === 'store' ? collectionId.split(',').filter(Boolean) : [],
      how_it_works: howItWorks,
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
    void logAnalyticsEvent({
      event_type: 'listing_click',
      seller_id: listing.user_id,
      listing_id: listing.id,
      actor_id: session?.user?.id
    })
    if (listing.sponsored) {
      void logAnalyticsEvent({
        event_type: 'ad_click',
        seller_id: listing.user_id,
        listing_id: listing.id,
        actor_id: session?.user?.id
      })
    }
    navigate(`/listings/${listing.id}`)
  }

  const openEditListing = (listing: Listing) => {
    setEditingListing(listing)
    setTitle(listing.title)
    setDescription(listing.description)
    setPrice(String(listing.price))
    setCategory(listing.category)
    setStatus(listing.status ?? 'Available')
    setListingType(listing.listing_type ?? 'single')
    setServicePriceUnit(listing.price_unit ?? 'fixed')
    setServiceAreaId(listing.service_area_id ?? '')
    setCondition(listing.condition ?? 'Used - Good')
    setDeliveryOption(listing.delivery_option ?? 'Meetup')
    setUploadedImages(listing.images ?? [])
    setAvailableColors(listing.available_colors ?? [])
    setRenewalFrequency(listing.renewal_frequency ?? 'weekly')
    setPublishAs((listing.publish_as as any) ?? 'private')
    const departmentIds = Array.isArray(listing.collection_ids) && listing.collection_ids.length
      ? listing.collection_ids.map(String)
      : (listing.collection_id ? [listing.collection_id] : [])
    setCollectionId(departmentIds.join(','))
    setHowItWorks(listing.how_it_works ?? '')
    setUseGlobalRenewal(listing.use_global_renewal ?? true)
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
      const targetListing = listings.find((l) => l.id === listingId)
      void logAnalyticsEvent({
        event_type: 'listing_save',
        seller_id: targetListing?.user_id,
        listing_id: listingId,
        actor_id: session.user.id
      })
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

  const clearAllFilters = () => {
    setActiveCategories(['All'])
    setSearchQuery('')
    setPriceRange(3000)
    setDistanceFilter(65)
    setShowOnlyAvailable(false)
    setListingKindFilter('all')
  }

  const handleUpdateListingCollection = async (listingId: number, targetColId: string | null) => {
    const { error } = await supabase
      .from('listings')
      .update({ collection_id: targetColId })
      .eq('id', listingId)

    if (error) {
      setMessage('Failed to update listing department: ' + error.message)
      return
    }

    setMessage('Listing department updated successfully!')
    await fetchListings()
  }

  const markNotificationRead = async (notificationId: string | number, unread: boolean) => {
    const notification = notifications.find(item => String(item.id) === String(notificationId))
    if (!notification) return

    if (session?.user.id && isDatabaseNotificationId(notificationId)) {
      if (notification.user_id === session.user.id) {
        const { error } = await supabase.from('notifications')
          .update({ unread })
          .eq('id', notificationId)
          .eq('user_id', session.user.id)
        if (error) {
          setMessage(`Notification could not be updated: ${error.message}`)
          return
        }
      } else if (notification.isBroadcast) {
        const { error } = await supabase.from('notification_user_states').upsert({
          notification_id: notificationId,
          user_id: session.user.id,
          is_pinned: Boolean(notification.isPinned),
          unread_override: unread,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'notification_id,user_id' })
        if (error) {
          setMessage(`Notification could not be updated: ${error.message}`)
          return
        }
      }
    }

    setNotifications(current => current.map(item => String(item.id) === String(notificationId)
      ? { ...item, unread, unreadOverride: notification.isBroadcast ? unread : item.unreadOverride }
      : item))
  }

  const toggleNotificationPin = async (notificationId: string | number) => {
    const notification = notifications.find(item => String(item.id) === String(notificationId))
    if (!notification) return
    const isPinned = !notification.isPinned

    if (session?.user.id && isDatabaseNotificationId(notificationId)) {
      const { error } = await supabase.from('notification_user_states').upsert({
        notification_id: notificationId,
        user_id: session.user.id,
        is_pinned: isPinned,
        unread_override: notification.isBroadcast ? notification.unreadOverride ?? null : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'notification_id,user_id' })
      if (error) {
        setMessage(`Notification could not be pinned: ${error.message}`)
        return
      }
    }

    setNotifications(current => current.map(item => String(item.id) === String(notificationId)
      ? { ...item, isPinned }
      : item))
  }

  const deleteNotification = async (notificationId: string | number) => {
    const notification = notifications.find(item => String(item.id) === String(notificationId))
    if (!notification) return
    if (notification.isPinned) {
      setMessage('Unpin this notification before deleting it')
      return
    }

    if (session?.user.id && isDatabaseNotificationId(notificationId)) {
      const { data, error } = await supabase.rpc('delete_notification_for_user', {
        p_notification_id: notificationId,
      })
      if (error) {
        setMessage(`Notification could not be deleted: ${error.message}`)
        return
      }
      if (data !== true) {
        setMessage('Notification could not be deleted. Unpin it first if it is pinned.')
        return
      }
    }

    setNotifications(current => current.filter(item => String(item.id) !== String(notificationId)))
  }

  const markAllRead = async () => {
    if (session?.user.id) {
      const ownIds = notifications
        .filter(item => item.user_id === session.user.id && isDatabaseNotificationId(item.id))
        .map(item => item.id as string)
      if (ownIds.length) {
        const { error } = await supabase
        .from('notifications')
        .update({ unread: false })
          .in('id', ownIds)
          .eq('user_id', session.user.id)
        if (error) {
          setMessage(`Notifications could not be marked as read: ${error.message}`)
          return
        }
      }

      const broadcasts = notifications.filter(item => item.isBroadcast && isDatabaseNotificationId(item.id))
      if (broadcasts.length) {
        const { error } = await supabase.from('notification_user_states').upsert(
          broadcasts.map(item => ({
            notification_id: item.id,
            user_id: session.user.id,
            is_pinned: Boolean(item.isPinned),
            unread_override: false,
            updated_at: new Date().toISOString(),
          })),
          { onConflict: 'notification_id,user_id' },
        )
        if (error) {
          setMessage(`Notifications could not be marked as read: ${error.message}`)
          return
        }
      }
    }
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

  const handleStartChat = async (listing: Listing, customMessage?: string, stayInCurrentPage = false) => {
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
      const validListingId = listing.id && Number(listing.id) > 0 ? Number(listing.id) : null
      let query = supabase
        .from('chats')
        .select('*')
        .eq('buyer_id', session.user.id)
        .eq('seller_id', listing.user_id || '')

      if (validListingId) {
        query = query.eq('listing_id', validListingId)
      }

      const { data: existingChats, error: selectError } = await query

      if (selectError) throw selectError

      let chatId: number
      if (existingChats && existingChats.length > 0) {
        chatId = existingChats[0].id
      } else {
        const { data: newChat, error: insertError } = await supabase
          .from('chats')
          .insert({
            listing_id: validListingId,
            buyer_id: session.user.id,
            seller_id: listing.user_id || '',
            title: listing.title || 'Store Inquiry'
          })
          .select()
          .single()

        if (insertError) throw insertError
        chatId = newChat.id
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
      void logAnalyticsEvent({
        event_type: 'chat_inquiry',
        seller_id: listing.user_id || undefined,
        listing_id: listing.id,
        actor_id: session.user.id
      })
      if (!stayInCurrentPage) navigate('/inbox')
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
          (ad) => ad.listingId === listing.id && ad.status === 'Active' && ad.moderation_status === 'approved'
        )
        return {
          ...listing,
          sponsored: isAdActive || false,
        }
      })
      .filter((listing) => {
        const listingPrice = Number(String(listing.price).replace(/[^\d.]/g, ''))

        if (listing.user_id !== session?.user?.id && isListingExpired(listing, globalRenewalFrequency, globalRenewalDay)) {
          return false
        }
        if (listing.status && !['active', 'available'].includes(listing.status.toLowerCase())) {
          return false
        }

        const listingSellerId = listing.user_id || ''
        const sellerBusiness = allBusinesses[listingSellerId]
        const sellerShopName = sellerBusiness?.shopName || ''
        const sellerShopCat = sellerBusiness?.category || ''
        const searchText = `${listing.title} ${listing.description} ${listing.category} ${listing.seller_name || ''} ${sellerShopName} ${sellerShopCat}`.toLowerCase()
        const matchesQuery = !normalizedQuery || searchText.includes(normalizedQuery)
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
          return Number(String(a.price).replace(/[^\d.]/g, '')) - Number(String(a.price).replace(/[^\d.]/g, ''))
        }
        if (sortBy === 'Price: High to Low') {
          return Number(String(b.price).replace(/[^\d.]/g, '')) - Number(String(a.price).replace(/[^\d.]/g, ''))
        }
        return Number(b.id) - Number(a.id)
      })
  }, [listings, searchQuery, activeCategories, priceRange, showOnlyAvailable, sortBy, allBusinesses, listingKindFilter, session])

  // --- ADD THESE MISSING VARIABLES ---
  const savedListings = useMemo(() => {
    return listings.filter((listing) => savedIds.includes(String(listing.id)))
  }, [listings, savedIds])

  const heroStats = useMemo(() => [
    { label: 'Total Listings', value: String(listings.length) },
    { label: 'Saved Items', value: String(savedIds.length) },
    { label: 'Unread Messages', value: String(chatThreads.filter(t => t.unread).length) }
  ], [listings.length, savedIds.length, chatThreads])

  const handleDeleteListing = async (listingId: number) => {
    const { error } = await supabase.rpc('delete_owned_listing', {
      p_listing_id: listingId,
    })
    if (error) throw new Error(`The listing could not be deleted: ${error.message}`)
    setMessage('Listing deleted successfully')
    await fetchListings()
  }

  const handleRenewListing = async (listingId: number) => {
    const nowIso = new Date().toISOString()
    const { error } = await supabase.from('listings').update({
      last_renewed_at: nowIso,
      created_at: nowIso,
      status: 'Available'
    }).eq('id', listingId)
    if (error) {
      setMessage(error.message)
      return
    }
    setMessage('Listing renewed successfully! Active for another 7 days.')
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

  const handleUploadAvatar = async (url: string) => {
    if (!session?.user?.id) throw new Error('Sign in to update your profile photo.')
    const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('user_id', session.user.id)
    if (error) {
      setMessage(error.message)
      throw new Error(error.message)
    }
    setProfile((current) => current ? { ...current, avatar_url: url } : null)
    setMessage('Profile photo updated successfully.')
  }

  const handleUploadCover = async (url: string) => {
    if (!session?.user?.id) throw new Error('Sign in to update your cover photo.')
    const { error } = await supabase.from('profiles').update({ cover_url: url }).eq('user_id', session.user.id)
    if (error) {
      setMessage(error.message)
      throw new Error(error.message)
    }
    setProfile((current) => current ? { ...current, cover_url: url } : null)
    setMessage('Cover photo updated successfully.')
  }

  const handleCreateOrUpdateBusiness = async (updated: BusinessProfile) => {
    if (!session?.user?.id || updated.userId !== session.user.id) {
      throw new Error('You can only save your own store.')
    }

    const savedBusiness = {
      ...updated,
      ads: allBusinesses[updated.userId]?.ads || businessProfile?.ads || [],
    }
    const nextAll = { ...allBusinesses, [updated.userId]: savedBusiness }

    if (session?.user?.id) {
      const { error } = await supabase.from('stores').upsert({
        user_id: updated.userId,
        shop_name: updated.shopName,
        description: updated.description,
        category: updated.category,
        address: updated.address,
        location_id: updated.locationId,
        location_name: updated.locationName,
        whatsapp: updated.whatsapp,
        logo: updated.logo,
        cover: updated.cover,
        accent_color: updated.accentColor,
        announcement_bar: updated.announcementBar,
        collections: updated.collections || [],
        customer_care: updated.customerCare || {},
        catalog: updated.catalog,
        theme_config: updated.themeConfig || {},
      }, { onConflict: 'user_id' })
      if (error) throw error
    }

    setAllBusinesses(nextAll)
    setBusinessProfile(savedBusiness)
    window.localStorage.setItem('marketspace-all-businesses', JSON.stringify(nextAll))
    setMessage('Business profile updated successfully')
    navigate('/profile/store-dashboard')
  }

  const saveAd = async (ad: BusinessAd) => {
    if (!session?.user?.id) throw new Error('Sign in to create an ad.')
    const ownerStore = allBusinesses[session.user.id] || businessProfile
    if (!ownerStore?.storeId) throw new Error('Your approved store could not be found.')

    const adData = Object.fromEntries(
      Object.entries(ad).filter(([key]) => !['id', 'status', 'moderation_status', 'moderation_reason'].includes(key))
    )
    const { error } = await supabase.from('store_ads').insert({
      id: ad.id,
      store_id: ownerStore.storeId,
      user_id: session.user.id,
      status: ad.status,
      ad_data: adData,
    })
    if (error) throw new Error(`The ad could not be submitted: ${error.message}`)
    await loadBusinesses()
    setMessage('Ad submitted for moderation')
  }

  const updateAdStatus = async (adId: string, nextStatus: BusinessAd['status']) => {
    if (!session?.user?.id) throw new Error('Sign in to update this ad.')
    const { data, error } = await supabase.from('store_ads')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', adId)
      .eq('user_id', session.user.id)
      .select('id')
      .maybeSingle()
    if (error) throw new Error(`The ad status could not be updated: ${error.message}`)
    if (!data) throw new Error('This ad could not be found in your store.')
    await loadBusinesses()
  }

  const deleteAd = async (adId: string) => {
    if (!session?.user?.id) throw new Error('Sign in to delete this ad.')
    const { data, error } = await supabase.from('store_ads')
      .delete()
      .eq('id', adId)
      .eq('user_id', session.user.id)
      .select('id')
      .maybeSingle()
    if (error) throw new Error(`The ad could not be deleted: ${error.message}`)
    if (!data) throw new Error('This ad could not be found in your store.')
    await loadBusinesses()
  }

  const removeOwnedStoreFromCache = (userId: string) => {
    try {
      const cached = window.localStorage.getItem('marketspace-all-businesses')
      if (!cached) return
      const businesses = JSON.parse(cached) as Record<string, BusinessProfile>
      delete businesses[userId]
      window.localStorage.setItem('marketspace-all-businesses', JSON.stringify(businesses))
    } catch (cacheError) {
      console.error('Failed to update cached store data:', cacheError)
    }
  }

  const archiveStore = async (storeId: string, archived: boolean) => {
    if (!session?.user?.id) throw new Error('Sign in to update this store.')
    const { error } = await supabase.rpc('archive_owned_store', {
      p_store_id: storeId,
      p_archived: archived,
    })
    if (error) throw new Error(`The store could not be ${archived ? 'disabled' : 'restored'}: ${error.message}`)
    if (archived) removeOwnedStoreFromCache(session.user.id)
    setMessage(archived ? 'Store disabled. It is hidden from shoppers.' : 'Store restored successfully.')
    await Promise.all([loadBusinesses(), fetchListings(session.user.id)])
  }

  const deleteStore = async (storeId: string) => {
    if (!session?.user?.id) throw new Error('Sign in to permanently delete this store.')
    const { error } = await supabase.rpc('delete_archived_owned_store', {
      p_store_id: storeId,
    })
    if (error) throw new Error(`The store could not be permanently deleted: ${error.message}`)
    removeOwnedStoreFromCache(session.user.id)
    setBusinessProfile(null)
    setMessage('Store and its store-owned listings and reviews were permanently deleted.')
    await Promise.all([loadBusinesses(), fetchListings(session.user.id)])
  }

  const handleSaveStoreTheme = async (themeConfig: StoreThemeConfig, storeUserId?: string) => {
    const targetUserId = storeUserId || businessProfile?.userId || session?.user?.id
    if (!targetUserId) return

    const existing: BusinessProfile = allBusinesses[targetUserId] || businessProfile || {
      userId: targetUserId,
      shopName: profile?.username ? `${profile.username}'s Store` : 'Official Store',
      description: 'Official Merchant Storefront',
      category: 'General Merchant',
      address: 'Lusaka, Zambia',
      whatsapp: '',
      logo: profile?.avatar_url || '',
      cover: '/banners/store_banner_apparel.png',
      accentColor: themeConfig.primaryColor || '#2563eb',
      announcementBar: '',
      collections: [],
      customerCare: {},
      catalog: [],
      ads: [],
      themeConfig
    }

    const updated: BusinessProfile = {
      ...existing,
      themeConfig,
      accentColor: themeConfig.primaryColor || existing.accentColor || '#2563eb'
    }

    const nextAll = { ...allBusinesses, [targetUserId]: updated }
    setAllBusinesses(nextAll)
    if (session?.user?.id === targetUserId || !businessProfile) {
      setBusinessProfile(updated)
    }

    try {
      window.localStorage.setItem('marketspace-all-businesses', JSON.stringify(nextAll))
      window.localStorage.setItem(`marketspace-store-theme-${targetUserId}`, JSON.stringify(themeConfig))
    } catch (e) {
      console.error('Failed to save store theme to localStorage:', e)
    }

    if (session?.user?.id) {
      try {
        await supabase.from('stores').upsert({
          user_id: targetUserId,
          shop_name: updated.shopName,
          theme_config: themeConfig,
          accent_color: updated.accentColor,
        }, { onConflict: 'user_id' })
      } catch (err) {
        console.error('Error saving store theme to Supabase:', err)
      }
    }
  }

  const handleSaveStoreTemplate = async (
    templateId: StoreTemplateId,
    content: Record<string, unknown>,
    departments?: Array<{ name: string; image?: string }>,
    storeUserId?: string,
  ) => {
    if (!session?.user.id) throw new Error('Your session expired, please sign in again.')
    const targetUserId = storeUserId || businessProfile?.userId || session.user.id
    if (targetUserId !== session.user.id) throw new Error('You can only customize your own store.')

    const { data, error } = await supabase.functions.invoke<{
      success?: boolean
      templateId?: StoreTemplateId
      content?: Record<string, string>
      departments?: StoreCollection[]
      templateChangedAt?: string
      error?: string
    }>('store-template-save', {
      body: { templateId, content, ...(departments ? { departments } : {}) },
    })
    if (error) throw new Error(await getFunctionErrorMessage(error))
    if (!data?.success || !data.templateId || !data.content) {
      throw new Error(data?.error || 'Store template could not be saved.')
    }

    const existing = allBusinesses[targetUserId] || businessProfile
    if (!existing) throw new Error('Your store profile could not be loaded.')
    const templateContent: StoreTemplateContent = {
      ...(existing.templateContent || {}),
      [templateId]: data.content,
    }
    const updated: BusinessProfile = {
      ...existing,
      templateId: data.templateId,
      templateChangedAt: data.templateChangedAt || existing.templateChangedAt,
      templateContent,
      ...(data.departments ? { collections: data.departments } : {}),
    }
    const nextAll = { ...allBusinesses, [targetUserId]: updated }
    setAllBusinesses(nextAll)
    if (businessProfile?.userId === targetUserId) setBusinessProfile(updated)
    try {
      window.localStorage.setItem('marketspace-all-businesses', JSON.stringify(nextAll))
    } catch (storageError) {
      console.error('Failed to cache the saved store template:', storageError)
    }
  }

  const loadBusinesses = async () => {
    const stored = window.localStorage.getItem('marketspace-all-businesses')
    let baseStores: Record<string, BusinessProfile> = {}
    if (stored) {
      try {
        baseStores = JSON.parse(stored) as Record<string, BusinessProfile>
      } catch {
        setMessage('Cached store data could not be loaded.')
      }
    }
    Object.entries(baseStores).forEach(([ownerId, store]) => {
      store.ads = []
      if (store.archivedAt) delete baseStores[ownerId]
    })
    setAllBusinesses(baseStores)

    const { data, error: storesError } = await supabase.from('stores').select('*')
    if (storesError) {
      setMessage(`Stores could not be loaded: ${storesError.message}`)
      return
    }

    const dbStores: Record<string, BusinessProfile> = {}
    const nonPublicStoreOwners = new Set<string>()
    const archivedStoreOwners = new Set<string>()
    const archivedOwnerStores: BusinessProfile[] = []
    ;(data || []).forEach((s: any) => {
        if (s.status && s.status !== 'approved') {
          nonPublicStoreOwners.add(s.user_id)
          return
        }
        let localTheme: StoreThemeConfig | undefined = undefined
        try {
          const localStr = window.localStorage.getItem(`marketspace-store-theme-${s.user_id}`)
          if (localStr) localTheme = JSON.parse(localStr)
        } catch { }

        const storeProfile: BusinessProfile = {
          userId: s.user_id,
          storeId: s.id,
          archivedAt: s.archived_at || undefined,
          subdomain: s.subdomain || undefined,
          shopName: s.shop_name,
          description: s.description,
          category: s.category,
          address: s.address,
          locationId: s.location_id || undefined,
          locationName: s.location_name || undefined,
          whatsapp: s.whatsapp,
          logo: s.logo,
          cover: s.cover,
          operationType: s.operation_type,
          accentColor: s.accent_color || s.accentColor || '#2563eb',
          announcementBar: s.announcement_bar || s.announcementBar || '',
          collections: s.collections || [],
          customerCare: s.customer_care || s.customerCare || {},
          catalog: s.catalog || [],
          ads: [],
          verifiedId: s.verified_id === true,
          verifiedLocation: s.verified_location === true,
          registeredBusiness: s.registered_business === true,
          probationState: s.probation_state === 'probation' ? 'probation' : 'trusted',
          themeConfig: (s.theme_config && s.theme_config.sections && s.theme_config.sections.length > 0)
            ? s.theme_config
            : (localTheme || s.themeConfig || undefined),
          templateId: s.template_id || undefined,
          templateChangedAt: s.template_changed_at || undefined,
          templateContent: s.template_content || {},
        }
        if (s.archived_at) {
          if (s.user_id === session?.user?.id) {
            archivedOwnerStores.push(storeProfile)
          }
          archivedStoreOwners.add(s.user_id)
          return
        }
        dbStores[s.user_id] = storeProfile
    })
    const archivedOwnerStore = archivedOwnerStores[0] || null
    const { data: adRows, error: adsError } = await supabase
      .from('store_ads')
      .select('id,user_id,status,ad_data,moderation_status,moderation_reason,created_at')
    if (adsError) {
      setAllBusinesses(prev => {
        const next = { ...prev, ...dbStores }
        nonPublicStoreOwners.forEach((ownerId) => delete next[ownerId])
        archivedStoreOwners.forEach((ownerId) => delete next[ownerId])
        return next
      })
      setMessage(`Store ads could not be loaded: ${adsError.message}`)
      return
    }
    const adsByUser = new Map<string, BusinessAd[]>()
    ;(adRows || []).forEach((row) => {
      const ad: BusinessAd = {
        ...(row.ad_data as Omit<BusinessAd, 'id' | 'status'>),
        id: row.id,
        status: row.status,
        moderation_status: row.moderation_status,
        moderation_reason: row.moderation_reason,
        createdAt: row.created_at,
      }
      const userAds = adsByUser.get(row.user_id) || []
      userAds.push(ad)
      adsByUser.set(row.user_id, userAds)
    })
    Object.entries(dbStores).forEach(([userId, store]) => {
      store.ads = adsByUser.get(userId) || []
    })
    if (archivedOwnerStore) {
      archivedOwnerStore.ads = adsByUser.get(archivedOwnerStore.userId) || []
    }
    const storeOwnerIds = new Set((data || []).map((store: any) => store.user_id))
    setAllBusinesses(prev => {
      const next = { ...prev, ...dbStores }
      nonPublicStoreOwners.forEach((ownerId) => delete next[ownerId])
      archivedStoreOwners.forEach((ownerId) => delete next[ownerId])
      if (session?.user?.id && !storeOwnerIds.has(session.user.id)) {
        delete next[session.user.id]
      }
      return next
    })
    if (session?.user?.id) {
      setBusinessProfile(archivedOwnerStore || dbStores[session.user.id] || null)
    }
  }

  useEffect(() => {
    void loadBusinesses()
  }, [session?.user?.id])

  useEffect(() => {
    if (!session?.user?.id) {
      setBusinessProfile(null)
      return
    }
    if (allBusinesses[session.user.id]) {
      setBusinessProfile(allBusinesses[session.user.id])
    } else if (businessProfile?.userId !== session.user.id || !businessProfile?.archivedAt) {
      setBusinessProfile(null)
    }
  }, [session, allBusinesses, businessProfile])

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
    status,
    setStatus,
    listingType,
    setListingType,
    servicePriceUnit,
    setServicePriceUnit,
    serviceAreaId,
    setServiceAreaId,
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
    markNotificationRead,
    toggleNotificationPin,
    deleteNotification,
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
    saveAd,
    updateAdStatus,
    deleteAd,
    archiveStore,
    deleteStore,
    handleSaveStoreTheme,
    handleSaveStoreTemplate,
    handleDeleteListing,
    handleRenewListing,
    handleUpdateListingStatus,
    handleUploadAvatar,
    handleUploadCover,
    handleStartChat,
    availableColors,
    setAvailableColors,
    renewalFrequency,
    setRenewalFrequency,
    publishAs,
    setPublishAs,
    collectionId,
    setCollectionId,
    howItWorks,
    setHowItWorks,
    useGlobalRenewal,
    setUseGlobalRenewal,
    globalRenewalFrequency,
    setGlobalRenewalFrequency: updateGlobalRenewalFrequency,
    globalRenewalDay,
    setGlobalRenewalDay: updateGlobalRenewalDay,
    enableGlobalRenewal,
    setEnableGlobalRenewal,
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
    addSearchHistory,
    clearSearchHistory,
    togglePinChat,
    toggleUnreadChat,
    setChatUnread,
    toggleFavoriteChat,
    toggleArchiveChat,
    deleteChat,
    handleDeleteAccount,
    clearAllFilters,
    handleUpdateListingCollection,
  }
}

export { CATEGORY_OPTIONS, CONDITION_OPTIONS, DELIVERY_OPTIONS }
