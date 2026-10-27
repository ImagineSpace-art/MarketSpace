export const PROFILE_NAVIGATION_ITEMS = [
  { path: '/settings', label: 'Settings', icon: 'settings' },
  { path: '/profile/create', label: 'Create new listing', icon: 'add_circle', isPrimary: true },
  { path: '/profile/create-ad', label: 'Create ad', icon: 'campaign' },
  { path: '/profile', label: 'Seller dashboard', icon: 'dashboard', exact: true },
  { path: '/profile/store-dashboard', label: 'Store dashboard', icon: 'storefront' },
  { path: '/profile/store-insights', label: 'Store insights', icon: 'insights' },
  { path: '/profile/saved-listings', label: 'Saved listings', icon: 'bookmark' },
  { path: '/profile/notifications', label: 'Notifications', icon: 'notifications' },
] as const
