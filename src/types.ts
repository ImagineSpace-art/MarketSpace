export type View = 'home' | 'listing' | 'create' | 'edit' | 'saved' | 'notifications' | 'stores' | 'profile' | 'settings' | 'messages' | 'account' | 'login' | 'signup'

export type Listing = {
  id: number
  title: string
  description: string
  price: string
  category: string
  location: string
  status?: string
  listing_type?: string
  condition?: string
  delivery_option?: string
  seller_name?: string
  user_id?: string
}

export type Profile = {
  user_id?: string
  username?: string
  email?: string
  phone_number?: string
}

export type MessageRecord = {
  id: number
  content: string
  sender_id: string
  created_at?: string
}
