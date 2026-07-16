import { useEffect, useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabaseClient'
import { CATEGORY_OPTIONS, CONDITION_OPTIONS, DELIVERY_OPTIONS } from './constants'
import type { Listing, Profile, View } from '../../types'

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
}

const seedThreads: ChatThread[] = [
  {
    id: 1,
    title: 'About the mountain bike',
    participant: 'Ava',
    listingTitle: 'Mountain bike',
    unread: true,
    messages: [
      { id: 1, sender: 'them', content: 'Is the bike still available?', time: '9:41 AM' },
      { id: 2, sender: 'me', content: 'Yes, it is. Would you like to see it today?', time: '9:43 AM' },
    ],
  },
  {
    id: 2,
    title: 'Coffee table pickup',
    participant: 'Noah',
    listingTitle: 'Coffee table',
    unread: false,
    messages: [{ id: 1, sender: 'them', content: 'Can I pick it up after work?', time: 'Yesterday' }],
  },
]

const seedNotifications: NotificationItem[] = [
  { id: 1, title: 'New question on your listing', body: 'A buyer asked about the condition.', time: '2m ago', unread: true },
  { id: 2, title: 'Saved item went live', body: 'A matching item was posted near you.', time: '1h ago', unread: true },
  { id: 3, title: 'Your post got a boost', body: 'Your listing reached more buyers today.', time: 'Yesterday', unread: false },
]

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
  priceRange: string
  setPriceRange: Dispatch<SetStateAction<string>>
  distanceFilter: string
  setDistanceFilter: Dispatch<SetStateAction<string>>
  sortBy: string
  setSortBy: Dispatch<SetStateAction<string>>
  showOnlyAvailable: boolean
  setShowOnlyAvailable: Dispatch<SetStateAction<boolean>>
  savedIds: string[]
  setSavedIds: Dispatch<SetStateAction<string[]>>
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
  const [priceRange, setPriceRange] = useState('Any price')
  const [distanceFilter, setDistanceFilter] = useState('Within 65 km')
  const [sortBy, setSortBy] = useState('Newest')
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true)
  const [savedIds, setSavedIds] = useState<string[]>(getStoredSavedIds)
  const [notifications, setNotifications] = useState<NotificationItem[]>(seedNotifications)
  const [chatThreads, setChatThreads] = useState<ChatThread[]>(seedThreads)
  const [activeChatId, setActiveChatId] = useState<number | null>(1)
  const [chatDraft, setChatDraft] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('Electronics')
  const [location, setLocation] = useState('Lusaka')
  const [status, setStatus] = useState('Available')
  const [listingType, setListingType] = useState('single')
  const [condition, setCondition] = useState('Used - Good')
  const [deliveryOption, setDeliveryOption] = useState('Meetup')
  const [canMessage, setCanMessage] = useState(true)

  const userEmail = session?.user?.email ?? profile?.email ?? 'Guest'

  async function fetchListings() {
    const { data, error } = await supabase.from('listings').select('*').order('created_at', { ascending: false })
    if (error) return

    const { data: profilesData } = await supabase.from('profiles').select('user_id, username')
    const sellerMap = new Map<string, string>()
    ;((profilesData ?? []) as ProfileSummary[]).forEach((profileRow) => {
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
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
      if (currentSession) {
        void loadProfile(currentSession.user.id)
        void fetchListings()
        setView('home')
      } else {
        setProfile(null)
        setView('login')
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
    setView('home')
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
    setView('home')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
    setView('login')
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setPrice('')
    setCategory('Electronics')
    setLocation('Lusaka')
    setStatus('Available')
    setListingType('single')
    setCondition('Used - Good')
    setDeliveryOption('Meetup')
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
      price,
      category,
      location,
      status,
      listing_type: listingType,
      condition,
      delivery_option: deliveryOption,
      images: [],
      colors: [],
      available_colors: [],
      color: null,
    })

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Listing posted successfully')
    resetForm()
    await fetchListings()
    setView('home')
  }

  const handleUpdateListing = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingListing) return

    const { error } = await supabase.from('listings').update({
      title,
      description,
      price,
      category,
      location,
      status,
      listing_type: listingType,
      condition,
      delivery_option: deliveryOption,
    }).eq('id', editingListing.id)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Listing updated successfully')
    await fetchListings()
    setView('home')
  }

  const openListing = (listing: Listing) => {
    setSelectedListing(listing)
    setView('listing')
  }

  const openEditListing = (listing: Listing) => {
    setEditingListing(listing)
    setTitle(listing.title)
    setDescription(listing.description)
    setPrice(listing.price)
    setCategory(listing.category)
    setLocation(listing.location)
    setStatus(listing.status ?? 'Available')
    setListingType(listing.listing_type ?? 'single')
    setCondition(listing.condition ?? 'Used - Good')
    setDeliveryOption(listing.delivery_option ?? 'Meetup')
    setView('edit')
  }

  const toggleSave = (listingId: number) => {
    const id = String(listingId)
    setSavedIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]))
    setMessage('Saved to your watchlist')
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

  const sendInboxMessage = () => {
    if (!chatDraft.trim()) return
    const activeThread = chatThreads.find((thread) => thread.id === activeChatId)
    if (!activeThread) return

    const nextThread = {
      ...activeThread,
      unread: false,
      messages: [
        ...activeThread.messages,
        { id: Date.now(), sender: 'me' as const, content: chatDraft.trim(), time: 'Now' },
      ],
    }

    setChatThreads((current) => current.map((thread) => (thread.id === activeChatId ? nextThread : thread)))
    setChatDraft('')
    setMessage('Message sent')
  }

  const filteredListings = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    const priceLimitMap: Record<string, [number, number]> = {
      'Under ZMW500': [0, 500],
      'ZMW500 - ZMW1,500': [500, 1500],
      'ZMW1,500+': [1500, Number.POSITIVE_INFINITY],
    }
    const activePriceLimit = priceLimitMap[priceRange]

    return [...listings]
      .filter((listing) => {
        const listingPrice = Number(listing.price.replace(/[^\d.]/g, ''))
        const matchesQuery = !normalizedQuery || `${listing.title} ${listing.description}`.toLowerCase().includes(normalizedQuery)
        const matchesCategory = activeCategories.includes('All') || activeCategories.includes(listing.category)
        const matchesPrice = !activePriceLimit || (listingPrice >= activePriceLimit[0] && listingPrice <= activePriceLimit[1])
        const matchesAvailability = !showOnlyAvailable || (listing.status ?? 'Available') === 'Available'
        return matchesQuery && matchesCategory && matchesPrice && matchesAvailability
      })
      .sort((a, b) => {
        if (sortBy === 'Price: Low to High') {
          return Number(a.price.replace(/[^\d.]/g, '')) - Number(b.price.replace(/[^\d.]/g, ''))
        }
        if (sortBy === 'Price: High to Low') {
          return Number(b.price.replace(/[^\d.]/g, '')) - Number(a.price.replace(/[^\d.]/g, ''))
        }
        return Number(b.id) - Number(a.id)
      })
  }, [listings, searchQuery, activeCategories, priceRange, showOnlyAvailable, sortBy])

  const savedListings = useMemo(() => listings.filter((listing) => savedIds.includes(String(listing.id))), [listings, savedIds])
  const myListings = useMemo(() => listings.filter((listing) => listing.user_id === session?.user?.id), [listings, session])

  const heroStats = useMemo(() => [
    { label: 'Live listings', value: filteredListings.length.toString() },
    { label: 'Saved items', value: savedListings.length.toString() },
    { label: 'Unread alerts', value: notifications.filter((item) => item.unread).length.toString() },
  ], [filteredListings.length, savedListings.length, notifications])

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
  }
}

export { CATEGORY_OPTIONS, CONDITION_OPTIONS, DELIVERY_OPTIONS }
