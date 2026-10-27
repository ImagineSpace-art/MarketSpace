import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PROFILE_NAVIGATION_ITEMS } from './profileNavigationItems'
import { SETTINGS_SECTIONS } from './settingsNavigationItems'

type SettingsNavigationProps = {
  activeCategory?: string
  onNavigate?: () => void
}

export function SettingsNavigation({ activeCategory, onNavigate }: SettingsNavigationProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const currentCategory = activeCategory || location.pathname.split('/')[2] || 'account'

  return (
    <nav className="settings-navigation" aria-label="Settings sections">
      {SETTINGS_SECTIONS.map((section) => (
        <button
          key={section.id}
          type="button"
          className={`settings-navigation-item${currentCategory === section.id ? ' active' : ''}`}
          aria-current={currentCategory === section.id ? 'page' : undefined}
          onClick={() => {
            navigate(`/settings/${section.id}`)
            onNavigate?.()
          }}
        >
          <span className="material-icons" aria-hidden="true">{section.icon}</span>
          <span>{section.label}</span>
        </button>
      ))}
    </nav>
  )
}

type SettingsNavigationDrawerProps = {
  isOpen: boolean
  onClose: () => void
}

export function SettingsNavigationDrawer({ isOpen, onClose }: SettingsNavigationDrawerProps) {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null
  const isActive = (path: string, exact?: boolean) => (
    exact ? location.pathname === path : location.pathname === path || location.pathname.startsWith(`${path}/`)
  )

  return (
    <div className="shell-settings-navigation">
      <button
        type="button"
        className="shell-settings-navigation-backdrop"
        aria-label="Close settings navigation"
        onClick={onClose}
      />
      <aside className="shell-settings-navigation-drawer" aria-label="Settings navigation">
        <div className="shell-settings-navigation-header">
          <div>
            <p>Account menu</p>
            <h2>Your MarketSpace</h2>
          </div>
          <button type="button" className="settings-navigation-close" onClick={onClose} aria-label="Close settings navigation">
            <span className="material-icons" aria-hidden="true">close</span>
          </button>
        </div>
        <nav className="profile-menu-navigation" aria-label="Profile navigation">
          {PROFILE_NAVIGATION_ITEMS.map((item) => (
            <button
              key={item.path}
              type="button"
              className={`settings-navigation-item${isActive(item.path, 'exact' in item ? item.exact : false) ? ' active' : ''}${'isPrimary' in item && item.isPrimary ? ' primary' : ''}`}
              aria-current={isActive(item.path, 'exact' in item ? item.exact : false) ? 'page' : undefined}
              onClick={() => {
                navigate(item.path)
                onClose()
              }}
            >
              <span className="material-icons" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </div>
  )
}
