import { useState } from 'react'
import type { BusinessProfile, Listing, StoreSection, StoreThemeConfig, StoreNavConfig, StoreNavLink, StoreInfoPanelConfig, StoreCartDrawerConfig, StoreCartItem } from '../../types'
import { AVAILABLE_SECTIONS, THEME_PRESETS, HYPER_THEME, XTRA_THEME, DEFAULT_NAVIGATION_CONFIG, DEFAULT_HYPER_SLIDES, type CarouselSlide, type CarouselCard } from './defaultSections'
import { StoreSectionRenderer } from './StoreSectionRenderer'
import { StoreNavbar } from './StoreNavbar'
import { StoreInfoPanel } from './StoreInfoPanel'
import { StoreCartDrawer } from './StoreCartDrawer'

interface StoreThemeCustomizerProps {
  businessProfile: BusinessProfile
  myListings: Listing[]
  onSaveTheme: (config: StoreThemeConfig) => Promise<void> | void
  onClose?: () => void
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile'

const OFFICIAL_PRESETS = [
  {
    key: 'hyper',
    name: 'Hyper',
    tagline: 'Modern Scandinavian Superstore (by Foxecom)',
    description: 'Clean, high-converting modern superstore layout with interactive story bubbles, countdown flash sale ticker, 4-column lifestyle editorial grid, split collection showcase, and slide-out cart drawer.',
    primaryColor: '#18181b',
    accentColor: '#18181b',
    font: 'Inter',
    theme: HYPER_THEME,
    features: ['Modern Scandinavian Superstore', 'Category Story Bubbles', 'Live Countdown Flash Sale', '4-Col Lifestyle Editorial', 'Split Collection Showcase', 'Drawer Cart']
  },
  {
    key: 'xtra',
    name: 'Xtra',
    tagline: 'Multi-Category Retail & Bento Showcase (by Someone You Know)',
    description: 'High-energy superstore featuring 4-tile Bento hero grid, square collection avatars, 3-card triplet lifestyle banners, bottom-card feature highlights, and mint-green split gifts showcase with yellow pill accents.',
    primaryColor: '#1e1b4b',
    accentColor: '#facc15',
    font: 'Outfit',
    theme: XTRA_THEME,
    features: ['4-Tile Bento Hero Grid', 'Square Collection Avatars', '3-Card Triplet Lifestyle Banners', 'Mint Green Gifts Split Promo', 'Yellow Pill Accents & Flash Catalog']
  },
]

export function StoreThemeCustomizer({
  businessProfile,
  myListings,
  onSaveTheme,
  onClose,
}: StoreThemeCustomizerProps) {
  // Initialize theme config from businessProfile or default to Hyper preset
  const [themeConfig, setThemeConfig] = useState<StoreThemeConfig>(() => {
    let conf: StoreThemeConfig
    if (businessProfile.themeConfig && businessProfile.themeConfig.sections?.length > 0) {
      conf = JSON.parse(JSON.stringify(businessProfile.themeConfig))
    } else {
      conf = JSON.parse(JSON.stringify(HYPER_THEME))
    }
    if (!conf.navigation) {
      conf.navigation = JSON.parse(JSON.stringify(DEFAULT_NAVIGATION_CONFIG))
    }
    return conf
  })

  const [activeDevice, setActiveDevice] = useState<DeviceMode>('desktop')
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [activeSettingsTab, setActiveSettingsTab] = useState<'presets' | 'sections' | 'navigation' | 'cart' | 'panel' | 'styles'>('presets')
  const [previewPanelOpen, setPreviewPanelOpen] = useState(false)
  const [previewNotified, setPreviewNotified] = useState(false)
  const [previewCartOpen, setPreviewCartOpen] = useState(false)
  const [previewCartItems, setPreviewCartItems] = useState<StoreCartItem[]>(() => {
    if (myListings && myListings.length > 0) {
      return [{ listing: myListings[0], quantity: 1 }]
    }
    return []
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // Current selected section for inspector
  const selectedSection = themeConfig.sections.find(s => s.id === selectedSectionId) || null

  // Update section settings
  const updateSectionSettings = (id: string, newSettings: Record<string, any>) => {
    setThemeConfig(prev => ({
      ...prev,
      sections: prev.sections.map(s => (s.id === id ? { ...s, settings: { ...s.settings, ...newSettings } } : s))
    }))
  }

  // Apply preset
  const applyPreset = (presetKey: string) => {
    const preset = THEME_PRESETS[presetKey]
    if (!preset) return
    setThemeConfig(JSON.parse(JSON.stringify(preset)))
    setSelectedSectionId(null)
  }

  // Save / Publish
  const handlePublish = async () => {
    setIsSaving(true)
    setSaveMessage(null)
    try {
      await onSaveTheme(themeConfig)
      setSaveMessage('Theme published successfully!')
      setTimeout(() => setSaveMessage(null), 3500)
    } catch (err: any) {
      setSaveMessage(err.message || 'Failed to publish theme')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClearPresetImages = () => {
    setThemeConfig(prev => {
      const nextSections = prev.sections.map(s => {
        const nextSettings = { ...s.settings }
        if (nextSettings.bgImage) nextSettings.bgImage = ''
        if (nextSettings.image) nextSettings.image = ''
        if (nextSettings.spotlightCard?.image) {
          nextSettings.spotlightCard = { ...nextSettings.spotlightCard, image: '' }
        }
        if (Array.isArray(nextSettings.items)) {
          nextSettings.items = nextSettings.items.map((item: any) => ({ ...item, image: '' }))
        }
        return { ...s, settings: nextSettings }
      })
      return { ...prev, sections: nextSections }
    })
    setSaveMessage('Cleared fake sample images! Gallery icons active.')
    setTimeout(() => setSaveMessage(null), 3500)
  }

  // Virtual shop profile reflecting live theme config
  const previewShop: BusinessProfile = {
    ...businessProfile,
    themeConfig,
    accentColor: themeConfig.primaryColor || businessProfile.accentColor
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', color: 'var(--text)', overflow: 'hidden' }}>
      {/* 1. STUDIO TOP BAR */}
      <header
        style={{
          height: '60px',
          padding: '0 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--panel)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 30,
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="ghost-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px' }}
            >
              <span className="material-icons" style={{ fontSize: '18px' }}>arrow_back</span>
              Exit Studio
            </button>
          )}
          <div>
            <strong style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-icons" style={{ color: themeConfig.primaryColor || '#2563eb', fontSize: '22px' }}>palette</span>
              Storefront Customizer
            </strong>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Editing: <strong>{businessProfile.shopName}</strong>
            </span>
          </div>
        </div>

        {/* Device Viewport Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => setActiveDevice('desktop')}
            title="Desktop View"
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: activeDevice === 'desktop' ? 'var(--panel)' : 'transparent',
              color: activeDevice === 'desktop' ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              boxShadow: activeDevice === 'desktop' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <span className="material-icons" style={{ fontSize: '18px' }}>desktop_windows</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDevice('tablet')}
            title="Tablet View"
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: activeDevice === 'tablet' ? 'var(--panel)' : 'transparent',
              color: activeDevice === 'tablet' ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              boxShadow: activeDevice === 'tablet' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <span className="material-icons" style={{ fontSize: '18px' }}>tablet_mac</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDevice('mobile')}
            title="Mobile View"
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: activeDevice === 'mobile' ? 'var(--panel)' : 'transparent',
              color: activeDevice === 'mobile' ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              boxShadow: activeDevice === 'mobile' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <span className="material-icons" style={{ fontSize: '18px' }}>smartphone</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {saveMessage && (
            <span style={{ fontSize: '0.84rem', color: '#10b981', fontWeight: 600 }}>
              {saveMessage}
            </span>
          )}
          <button
            type="button"
            onClick={() => window.open(`/store/${businessProfile.userId}`, '_blank')}
            title="Open Live Store in New Tab"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: 'var(--panel)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.86rem',
              cursor: 'pointer',
            }}
          >
            <span className="material-icons" style={{ fontSize: '18px' }}>open_in_new</span>
            <span>View Live Store</span>
          </button>
          <button
            type="button"
            onClick={handleClearPresetImages}
            title="Clear all fake stock images in the preset, leaving gallery icons"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
            }}
          >
            <span className="material-icons" style={{ fontSize: '18px' }}>hide_image</span>
            <span>Clear Sample Images</span>
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isSaving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 20px',
              backgroundColor: themeConfig.primaryColor || '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 10px rgba(37, 99, 235, 0.3)'
            }}
          >
            <span className="material-icons" style={{ fontSize: '18px' }}>
              {isSaving ? 'sync' : 'publish'}
            </span>
            <span>{isSaving ? 'Publishing...' : 'Publish Theme'}</span>
          </button>
        </div>
      </header>

      {/* 2. STUDIO WORKSPACE (SPLIT SCREEN) */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* LEFT CONTROL SIDEBAR */}
        <aside
          style={{
            width: '360px',
            borderRight: '1px solid var(--border)',
            background: 'var(--panel)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            overflowY: 'auto'
          }}
        >
          {selectedSection ? (
            /* SECTION INSPECTOR PANEL */
            <SectionInspector
              section={selectedSection}
              shop={businessProfile}
              themeConfig={themeConfig}
              onBack={() => setSelectedSectionId(null)}
              onUpdateSettings={settings => updateSectionSettings(selectedSection.id, settings)}
            />
          ) : (
            /* MAIN SECTIONS & STYLES MANAGER */
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Tabs Switcher */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                <button
                  type="button"
                  onClick={() => setActiveSettingsTab('presets')}
                  style={{
                    flex: 1,
                    padding: '12px 6px',
                    border: 'none',
                    background: activeSettingsTab === 'presets' ? 'var(--panel)' : 'transparent',
                    color: activeSettingsTab === 'presets' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    borderBottom: activeSettingsTab === 'presets' ? '2px solid var(--primary)' : 'none'
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '16px' }}>auto_awesome</span>
                  Templates
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSettingsTab('sections')}
                  style={{
                    flex: 1,
                    padding: '12px 6px',
                    border: 'none',
                    background: activeSettingsTab === 'sections' ? 'var(--panel)' : 'transparent',
                    color: activeSettingsTab === 'sections' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    borderBottom: activeSettingsTab === 'sections' ? '2px solid var(--primary)' : 'none'
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '16px' }}>edit_note</span>
                  Edit Content ({themeConfig.sections.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSettingsTab('navigation')}
                  style={{
                    flex: 1,
                    padding: '12px 6px',
                    border: 'none',
                    background: activeSettingsTab === 'navigation' ? 'var(--panel)' : 'transparent',
                    color: activeSettingsTab === 'navigation' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    borderBottom: activeSettingsTab === 'navigation' ? '2px solid var(--primary)' : 'none'
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '16px' }}>storefront</span>
                  Header
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSettingsTab('cart')}
                  style={{
                    flex: 1,
                    padding: '12px 6px',
                    border: 'none',
                    background: activeSettingsTab === 'cart' ? 'var(--panel)' : 'transparent',
                    color: activeSettingsTab === 'cart' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    borderBottom: activeSettingsTab === 'cart' ? '2px solid var(--primary)' : 'none'
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '16px' }}>shopping_bag</span>
                  Cart
                </button>
              </div>

              {/* SECTIONS TAB: EDIT TEXT & IMAGES ONLY (LOCKED LAYOUT) */}
              {activeSettingsTab === 'sections' && (
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
                  <div style={{ padding: '12px 14px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', fontWeight: 800 }}>
                        <span className="material-icons" style={{ fontSize: '18px', color: themeConfig.primaryColor || '#2563eb' }}>
                          {themeConfig.presetName === 'xtra' ? 'grid_view' : 'store'}
                        </span>
                        {themeConfig.presetName === 'xtra' ? 'Xtra Bento Showcase' : 'Hyper Modern Superstore'}
                      </div>
                      <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.12)', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Locked Structure
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      Layout structure is fixed to ensure high-converting design. Click any section below to edit its text copy, pictures, and links.
                    </p>
                  </div>

                  {themeConfig.sections.map((sec) => {
                    const def = AVAILABLE_SECTIONS.find(s => s.type === sec.type)
                    return (
                      <div
                        key={sec.id}
                        onClick={() => setSelectedSectionId(sec.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = themeConfig.primaryColor || '#2563eb'
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'var(--border)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <span className="material-icons" style={{ color: themeConfig.primaryColor || '#2563eb', fontSize: '20px' }}>
                            {def?.icon || 'view_agenda'}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <strong style={{ display: 'block', fontSize: '0.86rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {def?.name || sec.type}
                            </strong>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                              Edit text & images
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                          <span className="material-icons" style={{ fontSize: '18px' }}>chevron_right</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* STYLES TAB */}
              {activeSettingsTab === 'styles' && (
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, marginBottom: '8px' }}>
                      Brand Primary Color
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={themeConfig.primaryColor || '#2563eb'}
                        onChange={e => setThemeConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                        style={{ width: '42px', height: '42px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={themeConfig.primaryColor || '#2563eb'}
                        onChange={e => setThemeConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="search-input"
                        style={{ flex: 1, fontFamily: 'monospace' }}
                      />
                    </div>
                    {/* Quick color palettes */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      {['#2563eb', '#059669', '#e11d48', '#8b5cf6', '#d97706', '#0f172a'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setThemeConfig(prev => ({ ...prev, primaryColor: c }))}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: c,
                            border: themeConfig.primaryColor === c ? '2px solid var(--text)' : '1px solid rgba(0,0,0,0.1)',
                            cursor: 'pointer'
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, marginBottom: '8px' }}>
                      Banner / Header Style
                    </label>
                    <select
                      value={themeConfig.bannerStyle || 'full-bleed'}
                      onChange={e => setThemeConfig(prev => ({ ...prev, bannerStyle: e.target.value as any }))}
                      className="search-input"
                      style={{ width: '100%' }}
                    >
                      <option value="full-bleed">Full Bleed Immersive</option>
                      <option value="contained">Contained Boxed</option>
                      <option value="minimal">Minimal Compact</option>
                    </select>
                  </div>
                </div>
              )}

              {/* NAVIGATION TAB */}
              {activeSettingsTab === 'navigation' && (() => {
                const nav = themeConfig.navigation || DEFAULT_NAVIGATION_CONFIG
                const updateNav = (updater: (prev: StoreNavConfig) => StoreNavConfig) => {
                  setThemeConfig(prev => ({
                    ...prev,
                    navigation: updater(prev.navigation || JSON.parse(JSON.stringify(DEFAULT_NAVIGATION_CONFIG)))
                  }))
                }

                const deleteLink = (id: string) => {
                  updateNav(p => ({ ...p, links: (p.links || []).filter(l => l.id !== id) }))
                }

                const updateLink = (id: string, updates: Partial<StoreNavLink>) => {
                  updateNav(p => ({
                    ...p,
                    links: (p.links || []).map(l => l.id === id ? { ...l, ...updates } : l)
                  }))
                }

                const addLink = () => {
                  const newId = `nav_${Date.now()}`
                  updateNav(p => ({
                    ...p,
                    links: [
                      ...(p.links || []),
                      { id: newId, label: 'New Link', url: '#products', type: 'section' }
                    ]
                  }))
                }

                return (
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, overflowY: 'auto' }}>
                    {/* 1. Navbar Layout */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, marginBottom: '8px' }}>
                        Header Layout
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        {[
                          { id: 'logo-left', label: 'Logo Left', icon: 'view_headline' },
                          { id: 'logo-center', label: 'Centered', icon: 'filter_frames' },
                          { id: 'minimal', label: 'Minimal', icon: 'crop_16_9' },
                        ].map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => updateNav(p => ({ ...p, layout: opt.id as any }))}
                            style={{
                              padding: '10px 6px',
                              borderRadius: '8px',
                              border: (nav.layout || 'logo-left') === opt.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                              background: (nav.layout || 'logo-left') === opt.id ? 'rgba(37, 99, 235, 0.08)' : 'var(--surface)',
                              color: (nav.layout || 'logo-left') === opt.id ? 'var(--primary)' : 'var(--text)',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '0.78rem',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span className="material-icons" style={{ fontSize: '18px' }}>{opt.icon}</span>
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Logo & Store Name Display */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, marginBottom: '8px' }}>
                        Brand Identity Display
                      </label>
                      <select
                        value={nav.logoStyle || 'both'}
                        onChange={e => updateNav(p => ({ ...p, logoStyle: e.target.value as any }))}
                        className="search-input"
                        style={{ width: '100%' }}
                      >
                        <option value="both">Show Both Logo and Store Name</option>
                        <option value="logo-only">Logo Image Only</option>
                        <option value="name-only">Store Name Only (Text)</option>
                      </select>
                    </div>

                    {/* 3. Colors */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, marginBottom: '8px' }}>
                        Navigation Colors
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Background Color</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="color"
                              value={nav.backgroundColor || '#ffffff'}
                              onChange={e => updateNav(p => ({ ...p, backgroundColor: e.target.value }))}
                              style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{nav.backgroundColor || '#ffffff'}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Text & Links Color</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="color"
                              value={nav.textColor || '#0f172a'}
                              onChange={e => updateNav(p => ({ ...p, textColor: e.target.value }))}
                              style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{nav.textColor || '#0f172a'}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Accent / Button Color</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="color"
                              value={nav.accentColor || themeConfig.primaryColor || '#2563eb'}
                              onChange={e => updateNav(p => ({ ...p, accentColor: e.target.value }))}
                              style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{nav.accentColor || themeConfig.primaryColor || '#2563eb'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 4. Top Bar Toggles */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, marginBottom: '8px' }}>
                        Bar Features & Elements
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                          { key: 'isSticky', label: 'Sticky Navigation Bar', desc: 'Stays pinned at top during scroll' },
                          { key: 'showSearch', label: 'In-Store Product Search', desc: 'Allows buyers to search within your store' },
                          { key: 'showCartBtn', label: 'Cart Drawer Button', desc: 'Shows shopping bag button with live item count badge' },
                          { key: 'showNotificationsBtn', label: 'Store Drop Notifications Bell', desc: 'Allows buyers to subscribe to alerts for new drops & deals' },
                          { key: 'showPanelBtn', label: 'Store Info Panel Button', desc: 'Shows Info button to open your brand concierge & guidelines panel' },
                          { key: 'showContactBtn', label: 'Chat / Contact Button', desc: 'Direct message seller button' },
                          { key: 'showFollowBtn', label: 'Follow Store Button', desc: 'Allows buyers to follow for updates' },
                        ].map(item => {
                          const isChecked = (nav as any)[item.key] !== false
                          return (
                            <label
                              key={item.key}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                                cursor: 'pointer'
                              }}
                            >
                              <div>
                                <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>{item.label}</div>
                                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
                              </div>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={e => updateNav(p => ({ ...p, [item.key]: e.target.checked }))}
                                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                              />
                            </label>
                          )
                        })}
                      </div>
                    </div>

                    {/* 5. Menu Links Manager */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div>
                          <span style={{ fontSize: '0.86rem', fontWeight: 700, display: 'block' }}>Navigation Menu Links</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Links that appear on your storefront top bar</span>
                        </div>
                        <button
                          type="button"
                          onClick={addLink}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                            background: 'var(--surface)',
                            color: 'var(--primary)',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            cursor: 'pointer'
                          }}
                        >
                          <span className="material-icons" style={{ fontSize: '15px' }}>add</span>
                          Add Link
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(nav.links || []).map((link, idx) => (
                          <div
                            key={link.id}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '8px',
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', width: '18px' }}>
                                #{idx + 1}
                              </span>
                              <input
                                type="text"
                                value={link.label}
                                placeholder="Link Label"
                                onChange={e => updateLink(link.id, { label: e.target.value })}
                                className="search-input"
                                style={{ flex: 1, padding: '5px 10px', fontSize: '0.85rem' }}
                              />
                              <div style={{ display: 'flex', gap: '2px' }}>
                                <button
                                  type="button"
                                  onClick={() => deleteLink(link.id)}
                                  title="Remove navigation link"
                                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger, #ef4444)', opacity: 0.8 }}
                                >
                                  <span className="material-icons" style={{ fontSize: '18px' }}>delete_outline</span>
                                </button>
                              </div>
                            </div>

                            {/* Destination Selector */}
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <select
                                value={link.url}
                                onChange={e => updateLink(link.id, { url: e.target.value })}
                                className="search-input"
                                style={{ flex: 1, padding: '5px 8px', fontSize: '0.78rem' }}
                              >
                                <option value="#top">Home / Top of Page</option>
                                <option value="#products">All Products / Catalog</option>
                                <option value="#departments">Store Departments</option>
                                <option value="#story">About Us / Story</option>
                                <option value="#testimonials">Customer Reviews</option>
                                <option value="#faq">FAQ & Help</option>
                                {(businessProfile.collections || []).map(col => (
                                  <option key={col.id} value={`col-${col.id}`}>Department: {col.name}</option>
                                ))}
                                {link.url && !['#top', '#products', '#departments', '#story', '#testimonials', '#faq'].includes(link.url) && !link.url.startsWith('col-') && (
                                  <option value={link.url}>Custom: {link.url}</option>
                                )}
                              </select>

                              <input
                                type="text"
                                value={link.url}
                                placeholder="Or URL (#sec or https://)"
                                onChange={e => updateLink(link.id, { url: e.target.value })}
                                className="search-input"
                                style={{ width: '130px', padding: '5px 8px', fontSize: '0.78rem', fontFamily: 'monospace' }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* CART DRAWER TAB */}
              {activeSettingsTab === 'cart' && (() => {
                const cartConf = themeConfig.cartDrawer || {
                  enabled: true,
                  headline: themeConfig?.presetName === 'hyper' ? 'Hardware Cart' : 'Your Cart',
                  freeShippingThreshold: 500,
                  checkoutNote: 'Complimentary packaging and order tracking included.',
                }

                const updateCartConf = (updater: (prev: StoreCartDrawerConfig) => StoreCartDrawerConfig) => {
                  setThemeConfig(prev => {
                    const currentCart = prev.cartDrawer || JSON.parse(JSON.stringify(cartConf))
                    return {
                      ...prev,
                      cartDrawer: updater(currentCart)
                    }
                  })
                }

                return (
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '18px', flex: 1, overflowY: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.88rem' }}>Slide-Out Drawer Cart</strong>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Shopify-style slide-in shopping bag</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreviewCartOpen(true)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: themeConfig.primaryColor || '#2563eb',
                          color: '#ffffff',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                        }}
                      >
                        <span className="material-icons" style={{ fontSize: '16px' }}>shopping_bag</span>
                        Preview Cart
                      </button>
                    </div>

                    {/* Enable Toggle */}
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>Enable Drawer Cart</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Allow visitors to add products & open slide-out cart</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={cartConf.enabled !== false}
                        onChange={e => updateCartConf(p => ({ ...p, enabled: e.target.checked }))}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                      />
                    </label>

                    {/* Drawer Headline */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                        Cart Drawer Headline
                      </label>
                      <input
                        type="text"
                        value={cartConf.headline || ''}
                        placeholder="e.g. Shopping Bag, Hardware Cart, or Your Cart"
                        onChange={e => updateCartConf(p => ({ ...p, headline: e.target.value }))}
                        className="search-input"
                        style={{ width: '100%', padding: '8px 12px' }}
                      />
                    </div>

                    {/* Free Delivery Goal Threshold */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                        Free Delivery Goal Threshold (K)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={cartConf.freeShippingThreshold || 0}
                        placeholder="e.g. 500"
                        onChange={e => updateCartConf(p => ({ ...p, freeShippingThreshold: Number(e.target.value) || 0 }))}
                        className="search-input"
                        style={{ width: '100%', padding: '8px 12px' }}
                      />
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                        Shoppers see an interactive progress bar encouraging them to reach this amount.
                      </span>
                    </div>

                    {/* Checkout Note */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                        Checkout Guarantee / Perk Note
                      </label>
                      <textarea
                        rows={2}
                        value={cartConf.checkoutNote || ''}
                        placeholder="e.g. Free express courier delivery, white-glove packaging, or warranty protection."
                        onChange={e => updateCartConf(p => ({ ...p, checkoutNote: e.target.value }))}
                        className="search-input"
                        style={{ width: '100%', padding: '8px 12px', resize: 'vertical' }}
                      />
                    </div>
                  </div>
                )
              })()}

              {/* STORE PANEL TAB */}
              {activeSettingsTab === 'panel' && (() => {
                const panel = themeConfig.panel || {
                  enabled: true,
                  title: 'Store Information & Guidelines',
                  subtitle: 'Verified merchant standards, customer support, and delivery commitments.',
                  badgeText: 'Verified MarketSpace Store',
                  highlights: [
                    { icon: 'verified', title: 'Authenticity Guarantee', desc: '100% genuine verified products directly from our inventory.' },
                    { icon: 'local_shipping', title: 'Fast Courier Delivery', desc: 'Door-to-door delivery nationwide with tracking available.' },
                    { icon: 'security', title: 'Buyer Protection', desc: 'Pre-purchase inspection allowed upon delivery.' },
                    { icon: 'notifications_active', title: 'Drop & Restock Alerts', desc: 'Instant notification on new catalog additions and deals.' },
                  ]
                }

                const updatePanel = (updater: (prev: StoreInfoPanelConfig) => StoreInfoPanelConfig) => {
                  setThemeConfig(prev => {
                    const currentPanel = prev.panel || JSON.parse(JSON.stringify(panel))
                    return {
                      ...prev,
                      panel: updater(currentPanel)
                    }
                  })
                }

                return (
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '18px', flex: 1, overflowY: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.88rem' }}>Store Info Slide-out Panel</strong>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Verification badge, delivery terms & customer care</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreviewPanelOpen(true)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: themeConfig.primaryColor || '#2563eb',
                          color: '#ffffff',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                        }}
                      >
                        <span className="material-icons" style={{ fontSize: '16px' }}>visibility</span>
                        Preview Panel
                      </button>
                    </div>

                    {/* Enable Toggle */}
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>Enable Store Info Panel</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Allow shoppers to open your slide-out guidelines sheet</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={panel.enabled !== false}
                        onChange={e => updatePanel(p => ({ ...p, enabled: e.target.checked }))}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                      />
                    </label>

                    {/* Panel Header Title */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                        Panel Title
                      </label>
                      <input
                        type="text"
                        value={panel.title || ''}
                        placeholder="e.g. Brand Concierge & Guidelines"
                        onChange={e => updatePanel(p => ({ ...p, title: e.target.value }))}
                        className="search-input"
                        style={{ width: '100%', padding: '8px 12px' }}
                      />
                    </div>

                    {/* Panel Subtitle */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                        Subtitle / Ethos
                      </label>
                      <textarea
                        rows={2}
                        value={panel.subtitle || ''}
                        placeholder="e.g. Verified merchant standards, customer care, and delivery commitments."
                        onChange={e => updatePanel(p => ({ ...p, subtitle: e.target.value }))}
                        className="search-input"
                        style={{ width: '100%', padding: '8px 12px', resize: 'vertical' }}
                      />
                    </div>

                    {/* Badge Text */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                        Merchant Trust Badge
                      </label>
                      <input
                        type="text"
                        value={panel.badgeText || ''}
                        placeholder="e.g. Verified Haute Merchant"
                        onChange={e => updatePanel(p => ({ ...p, badgeText: e.target.value }))}
                        className="search-input"
                        style={{ width: '100%', padding: '8px 12px' }}
                      />
                    </div>

                    {/* 4 Highlights */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '8px' }}>
                        Store Highlights & Guarantees ({panel.highlights?.length || 0})
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {(panel.highlights || []).map((hl, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '8px',
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className="material-icons" style={{ fontSize: '18px', color: themeConfig.primaryColor || '#2563eb' }}>
                                {hl.icon || 'star'}
                              </span>
                              <input
                                type="text"
                                value={hl.title}
                                placeholder="Highlight Title"
                                onChange={e => {
                                  const nextHls = [...(panel.highlights || [])]
                                  nextHls[idx] = { ...nextHls[idx], title: e.target.value }
                                  updatePanel(p => ({ ...p, highlights: nextHls }))
                                }}
                                className="search-input"
                                style={{ flex: 1, padding: '4px 8px', fontSize: '0.82rem', fontWeight: 600 }}
                              />
                            </div>
                            <input
                              type="text"
                              value={hl.desc}
                              placeholder="Description"
                              onChange={e => {
                                const nextHls = [...(panel.highlights || [])]
                                nextHls[idx] = { ...nextHls[idx], desc: e.target.value }
                                updatePanel(p => ({ ...p, highlights: nextHls }))
                              }}
                              className="search-input"
                              style={{ width: '100%', padding: '4px 8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* PRESETS TAB: HYPER & XTRA */}
              {activeSettingsTab === 'presets' && (
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="material-icons" style={{ color: themeConfig.primaryColor || '#2563eb', fontSize: '20px' }}>
                        auto_awesome
                      </span>
                      <strong style={{ fontSize: '0.94rem' }}>Official Theme Preset Templates</strong>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                      Choose between our 2 signature templates: <strong>Hyper</strong> or <strong>Xtra</strong>. The layout architecture is locked to ensure a high-converting, responsive design, while allowing you to edit every picture and text block:
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {OFFICIAL_PRESETS.map(preset => {
                      const isActive = themeConfig.presetName === preset.key
                      return (
                        <div
                          key={preset.key}
                          style={{
                            borderRadius: '14px',
                            border: isActive ? `2px solid ${preset.primaryColor}` : '1px solid var(--border)',
                            background: 'var(--surface)',
                            overflow: 'hidden',
                            boxShadow: isActive ? '0 4px 20px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {/* Theme Header Banner */}
                          <div
                            style={{
                              padding: '12px 16px',
                              background: preset.primaryColor,
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <strong style={{ fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                                  {preset.name}
                                </strong>
                                {isActive && (
                                  <span
                                    style={{
                                      fontSize: '0.7rem',
                                      fontWeight: 800,
                                      padding: '2px 8px',
                                      borderRadius: '12px',
                                      background: 'rgba(255,255,255,0.25)',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.04em',
                                    }}
                                  >
                                    Active
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: '0.74rem', opacity: 0.85 }}>
                                {preset.tagline}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: preset.primaryColor, border: '2px solid #fff' }} />
                              <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: preset.accentColor, border: '2px solid #fff' }} />
                            </div>
                          </div>

                          {/* Theme Details & Features */}
                          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                              {preset.description}
                            </p>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {preset.features.map(f => (
                                <span
                                  key={f}
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    background: 'var(--panel)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text)',
                                  }}
                                >
                                  ✓ {f}
                                </span>
                              ))}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                Font: <strong>{preset.font}</strong> • {preset.theme.sections.length} Sections
                              </span>
                              <button
                                type="button"
                                onClick={() => applyPreset(preset.key)}
                                style={{
                                  padding: '7px 14px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  background: isActive ? 'var(--panel)' : preset.primaryColor,
                                  color: isActive ? 'var(--text)' : '#ffffff',
                                  fontWeight: 700,
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  boxShadow: isActive ? 'none' : '0 2px 8px rgba(0,0,0,0.15)',
                                }}
                              >
                                {isActive ? 'Re-Apply Preset' : 'Activate Theme'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* RIGHT LIVE CANVAS PREVIEW */}
        <main
          style={{
            flex: 1,
            background: 'var(--surface)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            overflowY: 'auto',
            padding: '24px'
          }}
        >
          <div
            style={{
              width: activeDevice === 'desktop' ? '100%' : activeDevice === 'tablet' ? '768px' : '390px',
              maxWidth: '1200px',
              minHeight: '800px',
              background: 'var(--bg)',
              borderRadius: activeDevice === 'desktop' ? '16px' : '28px',
              border: '1px solid var(--border)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {/* Storefront Custom Navigation Bar */}
            <StoreNavbar
              shop={previewShop}
              themeConfig={themeConfig}
              isLiveCanvas={true}
              isNotified={previewNotified}
              onToggleNotify={() => setPreviewNotified(p => !p)}
              onOpenPanel={() => setPreviewPanelOpen(true)}
              cartCount={previewCartItems.reduce((acc, i) => acc + i.quantity, 0)}
              onOpenCart={() => setPreviewCartOpen(true)}
            />

            {/* Store Top Preview Cover Header */}
            <div
              style={{
                position: 'relative',
                height: activeDevice === 'mobile' ? '160px' : '220px',
                backgroundImage: `url(${businessProfile.cover || '/banners/store_banner_electronics.png'})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.7))' }} />
              <div style={{ position: 'absolute', bottom: '16px', left: '20px', display: 'flex', alignItems: 'center', gap: '14px', color: '#ffffff', zIndex: 2 }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: '#fff', overflow: 'hidden', border: `2px solid ${themeConfig.primaryColor || '#2563eb'}` }}>
                  <img src={businessProfile.logo || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=120'} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>{businessProfile.shopName}</h2>
                  <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>{businessProfile.category} • {businessProfile.address}</span>
                </div>
              </div>
            </div>

            {/* Dynamic Storefront Sections */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {themeConfig.sections.map(section => {
                const isSelected = selectedSectionId === section.id
                return (
                  <div
                    key={section.id}
                    onClick={() => {
                      setSelectedSectionId(section.id)
                      setActiveSettingsTab('sections')
                    }}
                    style={{
                      position: 'relative',
                      cursor: 'pointer',
                      borderRadius: '16px',
                      transition: 'outline 0.2s ease',
                      outline: isSelected ? `2.5px solid ${themeConfig.primaryColor || '#2563eb'}` : '2px dashed transparent',
                      outlineOffset: '4px',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.outline = '2px dashed rgba(37, 99, 235, 0.45)'
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.outline = '2px dashed transparent'
                    }}
                    title="Click to edit this section's content and styling"
                  >
                    {isSelected && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-12px',
                          right: '16px',
                          background: themeConfig.primaryColor || '#2563eb',
                          color: '#ffffff',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: '12px',
                          zIndex: 20,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          letterSpacing: '0.02em',
                          textTransform: 'uppercase'
                        }}
                      >
                        <span className="material-icons" style={{ fontSize: '12px' }}>edit</span>
                        Editing Section
                      </div>
                    )}
                    <StoreSectionRenderer
                      section={section}
                      shop={previewShop}
                      listings={myListings}
                      onOpenListing={() => {}}
                      onToggleSave={() => {}}
                      onSelectDepartment={() => {}}
                      isLiveEditing={true}
                      onUpdateSettings={(newSettings) => updateSectionSettings(section.id, newSettings)}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </main>
      </div>

      {/* 4. PREVIEW STORE INFO SLIDE-OUT PANEL */}
      <StoreInfoPanel
        isOpen={previewPanelOpen}
        onClose={() => setPreviewPanelOpen(false)}
        shop={previewShop}
        themeConfig={themeConfig}
        isNotified={previewNotified}
        onToggleNotify={() => setPreviewNotified(p => !p)}
      />

      {/* 5. PREVIEW CART DRAWER */}
      <StoreCartDrawer
        isOpen={previewCartOpen}
        onClose={() => setPreviewCartOpen(false)}
        shop={previewShop}
        themeConfig={themeConfig}
        cartItems={previewCartItems}
        onUpdateQuantity={(id, q) => {
          if (q <= 0) setPreviewCartItems(p => p.filter(i => i.listing.id !== id))
          else setPreviewCartItems(p => p.map(i => i.listing.id === id ? { ...i, quantity: q } : i))
        }}
        onRemoveItem={id => setPreviewCartItems(p => p.filter(i => i.listing.id !== id))}
        onClearCart={() => setPreviewCartItems([])}
      />
    </div>
  )
}

// -------------------------------------------------------------
// SECTION INSPECTOR (Customizes Settings for Selected Section)
// -------------------------------------------------------------

function FormField({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>{label}</label>
      {children}
      {helper && <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{helper}</span>}
    </div>
  )
}

function SectionInspector({
  section,
  shop,
  themeConfig,
  onBack,
  onUpdateSettings
}: {
  section: StoreSection
  shop: BusinessProfile
  themeConfig?: StoreThemeConfig
  onBack: () => void
  onUpdateSettings: (settings: Record<string, any>) => void
}) {
  const def = AVAILABLE_SECTIONS.find(s => s.type === section.type)
  const settings = section.settings || {}

  const handleChange = (field: string, val: any) => {
    onUpdateSettings({ [field]: val })
  }

  const handleNestedChange = (parentField: string, childField: string, val: any) => {
    const parent = { ...(settings[parentField] || {}) }
    parent[childField] = val
    onUpdateSettings({ [parentField]: parent })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Inspector Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface)' }}>
        <button
          type="button"
          onClick={onBack}
          className="ghost-btn"
          style={{ padding: '6px', display: 'flex', alignItems: 'center', borderRadius: '8px' }}
          title="Back to Sections List"
        >
          <span className="material-icons" style={{ fontSize: '18px' }}>arrow_back</span>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ display: 'block', fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {def?.name || section.type}
          </strong>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Edit contents, text, images & styling</span>
        </div>
      </div>

      {/* Inspector Form Controls */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto', flex: 1 }}>

        {/* 1. BENTO GRID */}
        {section.type === 'bento_grid' && (
          <>
            <FormField label="Bento Layout Mode">
              <select
                value={settings.mode || 'hero'}
                onChange={e => handleChange('mode', e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
              >
                <option value="hero">4-Tile Bento Showcase (Xtra / Featured)</option>
                <option value="triplet">3-Card Triplet Lifestyle Banners</option>
              </select>
            </FormField>

            {settings.mode !== 'triplet' ? (
              <>
                {/* Tile 1 */}
                <div style={{ padding: '12px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <strong style={{ fontSize: '0.82rem', color: 'var(--primary)' }}>Tile 1 (Top Left)</strong>
                  <FormField label="Title">
                    <input
                      type="text"
                      value={settings.tile1?.title ?? 'Beauty'}
                      onChange={e => handleNestedChange('tile1', 'title', e.target.value)}
                      className="search-input"
                      style={{ width: '100%', fontSize: '0.82rem' }}
                    />
                  </FormField>
                  <FormField label="Subtitle / Tag">
                    <input
                      type="text"
                      value={settings.tile1?.subtitle ?? 'Free extra gift'}
                      onChange={e => handleNestedChange('tile1', 'subtitle', e.target.value)}
                      className="search-input"
                      style={{ width: '100%', fontSize: '0.82rem' }}
                    />
                  </FormField>
                  <FormField label="Image URL">
                    <input
                      type="text"
                      value={settings.tile1?.image ?? ''}
                      onChange={e => handleNestedChange('tile1', 'image', e.target.value)}
                      className="search-input"
                      style={{ width: '100%', fontSize: '0.82rem' }}
                      placeholder="https://..."
                    />
                  </FormField>
                  <FormField label="Link Destination">
                    <input
                      type="text"
                      value={settings.tile1?.link ?? '#products'}
                      onChange={e => handleNestedChange('tile1', 'link', e.target.value)}
                      className="search-input"
                      style={{ width: '100%', fontSize: '0.82rem' }}
                    />
                  </FormField>
                </div>

                {/* Tile 2 */}
                <div style={{ padding: '12px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <strong style={{ fontSize: '0.82rem', color: 'var(--primary)' }}>Tile 2 (Bottom Left)</strong>
                  <FormField label="Title">
                    <input
                      type="text"
                      value={settings.tile2?.title ?? 'Unique gifts'}
                      onChange={e => handleNestedChange('tile2', 'title', e.target.value)}
                      className="search-input"
                      style={{ width: '100%', fontSize: '0.82rem' }}
                    />
                  </FormField>
                  <FormField label="Subtitle">
                    <input
                      type="text"
                      value={settings.tile2?.subtitle ?? 'Free with every order'}
                      onChange={e => handleNestedChange('tile2', 'subtitle', e.target.value)}
                      className="search-input"
                      style={{ width: '100%', fontSize: '0.82rem' }}
                    />
                  </FormField>
                  <FormField label="Image URL">
                    <input
                      type="text"
                      value={settings.tile2?.image ?? ''}
                      onChange={e => handleNestedChange('tile2', 'image', e.target.value)}
                      className="search-input"
                      style={{ width: '100%', fontSize: '0.82rem' }}
                      placeholder="https://..."
                    />
                  </FormField>
                  <FormField label="Link Destination">
                    <input
                      type="text"
                      value={settings.tile2?.link ?? '#products'}
                      onChange={e => handleNestedChange('tile2', 'link', e.target.value)}
                      className="search-input"
                      style={{ width: '100%', fontSize: '0.82rem' }}
                    />
                  </FormField>
                </div>

                {/* Tile 3 */}
                <div style={{ padding: '12px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <strong style={{ fontSize: '0.82rem', color: 'var(--primary)' }}>Tile 3 (Middle Hero - Highlight Card)</strong>
                  <FormField label="Tag / Badge">
                    <input
                      type="text"
                      value={settings.tile3?.tag ?? 'Super'}
                      onChange={e => handleNestedChange('tile3', 'tag', e.target.value)}
                      className="search-input"
                      style={{ width: '100%', fontSize: '0.82rem' }}
                    />
                  </FormField>
                  <FormField label="Title">
                    <input
                      type="text"
                      value={settings.tile3?.title ?? 'Earbuds'}
                      onChange={e => handleNestedChange('tile3', 'title', e.target.value)}
                      className="search-input"
                      style={{ width: '100%', fontSize: '0.82rem' }}
                    />
                  </FormField>
                  <FormField label="Button Text">
                    <input
                      type="text"
                      value={settings.tile3?.buttonText ?? '$79 Only'}
                      onChange={e => handleNestedChange('tile3', 'buttonText', e.target.value)}
                      className="search-input"
                      style={{ width: '100%', fontSize: '0.82rem' }}
                    />
                  </FormField>
                  <FormField label="Button Link">
                    <input
                      type="text"
                      value={settings.tile3?.buttonLink ?? '#products'}
                      onChange={e => handleNestedChange('tile3', 'buttonLink', e.target.value)}
                      className="search-input"
                      style={{ width: '100%', fontSize: '0.82rem' }}
                    />
                  </FormField>
                  <FormField label="Image URL">
                    <input
                      type="text"
                      value={settings.tile3?.image ?? ''}
                      onChange={e => handleNestedChange('tile3', 'image', e.target.value)}
                      className="search-input"
                      style={{ width: '100%', fontSize: '0.82rem' }}
                      placeholder="https://..."
                    />
                  </FormField>
                  <FormField label="Card Background Color">
                    <input
                      type="color"
                      value={settings.tile3?.bgColor ?? '#e0f2fe'}
                      onChange={e => handleNestedChange('tile3', 'bgColor', e.target.value)}
                      style={{ width: '40px', height: '32px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                    />
                  </FormField>
                </div>

                {/* Tile 4 */}
                <div style={{ padding: '12px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <strong style={{ fontSize: '0.82rem', color: 'var(--primary)' }}>Tile 4 (Right Portrait Card)</strong>
                  <FormField label="Tag / Badge">
                    <input
                      type="text"
                      value={settings.tile4?.tag ?? 'Seen in'}
                      onChange={e => handleNestedChange('tile4', 'tag', e.target.value)}
                      className="search-input"
                      style={{ width: '100%', fontSize: '0.82rem' }}
                    />
                  </FormField>
                  <FormField label="Title">
                    <input
                      type="text"
                      value={settings.tile4?.title ?? 'Fashion'}
                      onChange={e => handleNestedChange('tile4', 'title', e.target.value)}
                      className="search-input"
                      style={{ width: '100%', fontSize: '0.82rem' }}
                    />
                  </FormField>
                  <FormField label="Button Text">
                    <input
                      type="text"
                      value={settings.tile4?.buttonText ?? 'Shop now'}
                      onChange={e => handleNestedChange('tile4', 'buttonText', e.target.value)}
                      className="search-input"
                      style={{ width: '100%', fontSize: '0.82rem' }}
                    />
                  </FormField>
                  <FormField label="Button Link">
                    <input
                      type="text"
                      value={settings.tile4?.buttonLink ?? '#products'}
                      onChange={e => handleNestedChange('tile4', 'buttonLink', e.target.value)}
                      className="search-input"
                      style={{ width: '100%', fontSize: '0.82rem' }}
                    />
                  </FormField>
                  <FormField label="Image URL">
                    <input
                      type="text"
                      value={settings.tile4?.image ?? ''}
                      onChange={e => handleNestedChange('tile4', 'image', e.target.value)}
                      className="search-input"
                      style={{ width: '100%', fontSize: '0.82rem' }}
                      placeholder="https://..."
                    />
                  </FormField>
                </div>
              </>
            ) : (
              /* Triplet Cards Array Editor */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.82rem' }}>Triplet Lifestyle Cards</strong>
                  <button
                    type="button"
                    onClick={() => {
                      const items = [...(settings.tripletItems || settings.items || [])]
                      items.push({
                        id: 'trip_' + Date.now(),
                        title: 'New Highlight',
                        buttonText: 'Shop now',
                        buttonLink: '#products',
                        image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80'
                      })
                      handleChange('tripletItems', items)
                    }}
                    style={{ fontSize: '0.74rem', padding: '4px 8px', borderRadius: '6px', background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                  >
                    + Add Card
                  </button>
                </div>
                {(settings.tripletItems || settings.items || []).map((card: any, idx: number) => (
                  <div key={card.id || idx} style={{ padding: '12px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Card {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const items = (settings.tripletItems || settings.items || []).filter((_: any, i: number) => i !== idx)
                          handleChange('tripletItems', items)
                        }}
                        style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.74rem', fontWeight: 600 }}
                      >
                        Delete
                      </button>
                    </div>
                    <FormField label="Card Title">
                      <input
                        type="text"
                        value={card.title || ''}
                        onChange={e => {
                          const items = [...(settings.tripletItems || settings.items || [])]
                          items[idx] = { ...card, title: e.target.value }
                          handleChange('tripletItems', items)
                        }}
                        className="search-input"
                        style={{ width: '100%', fontSize: '0.8rem' }}
                      />
                    </FormField>
                    <FormField label="Button Text">
                      <input
                        type="text"
                        value={card.buttonText || ''}
                        onChange={e => {
                          const items = [...(settings.tripletItems || settings.items || [])]
                          items[idx] = { ...card, buttonText: e.target.value }
                          handleChange('tripletItems', items)
                        }}
                        className="search-input"
                        style={{ width: '100%', fontSize: '0.8rem' }}
                      />
                    </FormField>
                    <FormField label="Button Link">
                      <input
                        type="text"
                        value={card.buttonLink || ''}
                        onChange={e => {
                          const items = [...(settings.tripletItems || settings.items || [])]
                          items[idx] = { ...card, buttonLink: e.target.value }
                          handleChange('tripletItems', items)
                        }}
                        className="search-input"
                        style={{ width: '100%', fontSize: '0.8rem' }}
                      />
                    </FormField>
                    <FormField label="Image URL">
                      <input
                        type="text"
                        value={card.image || ''}
                        onChange={e => {
                          const items = [...(settings.tripletItems || settings.items || [])]
                          items[idx] = { ...card, image: e.target.value }
                          handleChange('tripletItems', items)
                        }}
                        className="search-input"
                        style={{ width: '100%', fontSize: '0.8rem' }}
                      />
                    </FormField>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* 2. EDITORIAL GRID */}
        {section.type === 'editorial_grid' && (
          <>
            <FormField label="Section Title (Optional)">
              <input
                type="text"
                value={settings.title || ''}
                onChange={e => handleChange('title', e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
                placeholder="e.g. Featured Lookbook"
              />
            </FormField>
            <FormField label="Section Subtitle (Optional)">
              <input
                type="text"
                value={settings.subtitle || ''}
                onChange={e => handleChange('subtitle', e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
                placeholder="e.g. Curated aesthetics and materials"
              />
            </FormField>
            <FormField label="Card Style">
              <select
                value={settings.cardStyle || 'overlay'}
                onChange={e => handleChange('cardStyle', e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
              >
                <option value="overlay">Full-Bleed Image with Floating Pill (Hyper / Modern)</option>
                <option value="card-bottom">Image with White Bottom Container (Xtra)</option>
              </select>
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <strong style={{ fontSize: '0.82rem' }}>Lookbook Cards ({(settings.items || []).length})</strong>
              <button
                type="button"
                onClick={() => {
                  const items = [...(settings.items || [])]
                  items.push({
                    id: 'ed_' + Date.now(),
                    title: 'New Editorial',
                    subtitle: 'Collection item',
                    image: 'https://images.unsplash.com/photo-1580481077195-7385f50d8830?w=800&auto=format&fit=crop&q=80',
                    buttonText: 'Shop',
                    buttonLink: '#products'
                  })
                  handleChange('items', items)
                }}
                style={{ fontSize: '0.74rem', padding: '4px 8px', borderRadius: '6px', background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}
              >
                + Add Card
              </button>
            </div>

            {(settings.items || []).map((item: any, idx: number) => (
              <div key={item.id || idx} style={{ padding: '12px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Card {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const items = (settings.items || []).filter((_: any, i: number) => i !== idx)
                      handleChange('items', items)
                    }}
                    style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.74rem', fontWeight: 600 }}
                  >
                    Delete
                  </button>
                </div>
                <FormField label="Card Title">
                  <input
                    type="text"
                    value={item.title || ''}
                    onChange={e => {
                      const items = [...(settings.items || [])]
                      items[idx] = { ...item, title: e.target.value }
                      handleChange('items', items)
                    }}
                    className="search-input"
                    style={{ width: '100%', fontSize: '0.8rem' }}
                  />
                </FormField>
                <FormField label="Subtitle / Tag">
                  <input
                    type="text"
                    value={item.subtitle || ''}
                    onChange={e => {
                      const items = [...(settings.items || [])]
                      items[idx] = { ...item, subtitle: e.target.value }
                      handleChange('items', items)
                    }}
                    className="search-input"
                    style={{ width: '100%', fontSize: '0.8rem' }}
                  />
                </FormField>
                <FormField label="Image URL">
                  <input
                    type="text"
                    value={item.image || ''}
                    onChange={e => {
                      const items = [...(settings.items || [])]
                      items[idx] = { ...item, image: e.target.value }
                      handleChange('items', items)
                    }}
                    className="search-input"
                    style={{ width: '100%', fontSize: '0.8rem' }}
                  />
                </FormField>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <FormField label="Button Text">
                    <input
                      type="text"
                      value={item.buttonText || ''}
                      onChange={e => {
                        const items = [...(settings.items || [])]
                        items[idx] = { ...item, buttonText: e.target.value }
                        handleChange('items', items)
                      }}
                      className="search-input"
                      style={{ width: '100%', fontSize: '0.8rem' }}
                    />
                  </FormField>
                  <FormField label="Button Link">
                    <input
                      type="text"
                      value={item.buttonLink || ''}
                      onChange={e => {
                        const items = [...(settings.items || [])]
                        items[idx] = { ...item, buttonLink: e.target.value }
                        handleChange('items', items)
                      }}
                      className="search-input"
                      style={{ width: '100%', fontSize: '0.8rem' }}
                    />
                  </FormField>
                </div>
              </div>
            ))}
          </>
        )}

        {/* 3. FEATURED COLLECTION SPLIT */}
        {section.type === 'featured_collection_split' && (
          <>
            <FormField label="Badge Text">
              <input
                type="text"
                value={settings.badge || ''}
                onChange={e => handleChange('badge', e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
              />
            </FormField>
            <FormField label="Title">
              <input
                type="text"
                value={settings.title || ''}
                onChange={e => handleChange('title', e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
              />
            </FormField>
            <FormField label="Subtitle">
              <input
                type="text"
                value={settings.subtitle || ''}
                onChange={e => handleChange('subtitle', e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
              />
            </FormField>
            <FormField label="Description">
              <textarea
                value={settings.description || ''}
                onChange={e => handleChange('description', e.target.value)}
                className="search-input"
                rows={3}
                style={{ width: '100%', fontSize: '0.82rem' }}
              />
            </FormField>
            <FormField label="Showcase Image URL">
              <input
                type="text"
                value={settings.image || ''}
                onChange={e => handleChange('image', e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
              />
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <FormField label="Button Text">
                <input
                  type="text"
                  value={settings.buttonText || ''}
                  onChange={e => handleChange('buttonText', e.target.value)}
                  className="search-input"
                  style={{ width: '100%', fontSize: '0.82rem' }}
                />
              </FormField>
              <FormField label="Button Link">
                <input
                  type="text"
                  value={settings.buttonLink || ''}
                  onChange={e => handleChange('buttonLink', e.target.value)}
                  className="search-input"
                  style={{ width: '100%', fontSize: '0.82rem' }}
                />
              </FormField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <FormField label="Background Color">
                <input
                  type="color"
                  value={settings.bgColor || '#18181b'}
                  onChange={e => handleChange('bgColor', e.target.value)}
                  style={{ width: '44px', height: '34px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                />
              </FormField>
              <FormField label="Text Color">
                <input
                  type="color"
                  value={settings.textColor || '#ffffff'}
                  onChange={e => handleChange('textColor', e.target.value)}
                  style={{ width: '44px', height: '34px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                />
              </FormField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <FormField label="Button Bg Color">
                <input
                  type="color"
                  value={settings.buttonBg || '#ffffff'}
                  onChange={e => handleChange('buttonBg', e.target.value)}
                  style={{ width: '44px', height: '34px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                />
              </FormField>
              <FormField label="Button Text Color">
                <input
                  type="color"
                  value={settings.buttonColor || '#09090b'}
                  onChange={e => handleChange('buttonColor', e.target.value)}
                  style={{ width: '44px', height: '34px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                />
              </FormField>
            </div>

            {/* Swatches List */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <strong style={{ fontSize: '0.82rem' }}>Color / Variation Swatches</strong>
              <button
                type="button"
                onClick={() => {
                  const swatches = [...(settings.swatches || [])]
                  swatches.push({
                    id: 'sw_' + Date.now(),
                    name: 'New Color',
                    hex: '#3b82f6',
                    image: settings.image || ''
                  })
                  handleChange('swatches', swatches)
                }}
                style={{ fontSize: '0.74rem', padding: '4px 8px', borderRadius: '6px', background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}
              >
                + Add Swatch
              </button>
            </div>
            {(settings.swatches || []).map((swatch: any, idx: number) => (
              <div key={swatch.id || idx} style={{ padding: '10px', background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700 }}>Swatch {idx + 1}: {swatch.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const swatches = (settings.swatches || []).filter((_: any, i: number) => i !== idx)
                      handleChange('swatches', swatches)
                    }}
                    style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}
                  >
                    Delete
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', gap: '8px' }}>
                  <input
                    type="text"
                    value={swatch.name || ''}
                    placeholder="Color name"
                    onChange={e => {
                      const swatches = [...(settings.swatches || [])]
                      swatches[idx] = { ...swatch, name: e.target.value }
                      handleChange('swatches', swatches)
                    }}
                    className="search-input"
                    style={{ width: '100%', fontSize: '0.8rem' }}
                  />
                  <input
                    type="color"
                    value={swatch.hex || '#000000'}
                    onChange={e => {
                      const swatches = [...(settings.swatches || [])]
                      swatches[idx] = { ...swatch, hex: e.target.value }
                      handleChange('swatches', swatches)
                    }}
                    style={{ width: '100%', height: '34px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                  />
                </div>
                <input
                  type="text"
                  value={swatch.image || ''}
                  placeholder="Associated Image URL (swaps on click)"
                  onChange={e => {
                    const swatches = [...(settings.swatches || [])]
                    swatches[idx] = { ...swatch, image: e.target.value }
                    handleChange('swatches', swatches)
                  }}
                  className="search-input"
                  style={{ width: '100%', fontSize: '0.8rem' }}
                />
              </div>
            ))}
          </>
        )}

        {/* 4. COUNTDOWN FLASH SALE */}
        {section.type === 'countdown_deal' && (
          <>
            <FormField label="Banner Title">
              <input
                type="text"
                value={settings.title || ''}
                onChange={e => handleChange('title', e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
              />
            </FormField>
            <FormField label="Description">
              <input
                type="text"
                value={settings.description || ''}
                onChange={e => handleChange('description', e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
              />
            </FormField>
            <FormField label="Promo Discount Code">
              <input
                type="text"
                value={settings.promoCode || ''}
                onChange={e => handleChange('promoCode', e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
              />
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <FormField label="Button Text">
                <input
                  type="text"
                  value={settings.buttonText || ''}
                  onChange={e => handleChange('buttonText', e.target.value)}
                  className="search-input"
                  style={{ width: '100%', fontSize: '0.82rem' }}
                />
              </FormField>
              <FormField label="Button Link">
                <input
                  type="text"
                  value={settings.buttonLink || ''}
                  onChange={e => handleChange('buttonLink', e.target.value)}
                  className="search-input"
                  style={{ width: '100%', fontSize: '0.82rem' }}
                />
              </FormField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              <FormField label="Days">
                <input
                  type="number"
                  min="0"
                  value={settings.days ?? 16}
                  onChange={e => handleChange('days', Number(e.target.value))}
                  className="search-input"
                  style={{ width: '100%', fontSize: '0.8rem' }}
                />
              </FormField>
              <FormField label="Hours">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={settings.hours ?? 8}
                  onChange={e => handleChange('hours', Number(e.target.value))}
                  className="search-input"
                  style={{ width: '100%', fontSize: '0.8rem' }}
                />
              </FormField>
              <FormField label="Mins">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={settings.minutes ?? 36}
                  onChange={e => handleChange('minutes', Number(e.target.value))}
                  className="search-input"
                  style={{ width: '100%', fontSize: '0.8rem' }}
                />
              </FormField>
              <FormField label="Secs">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={settings.seconds ?? 49}
                  onChange={e => handleChange('seconds', Number(e.target.value))}
                  className="search-input"
                  style={{ width: '100%', fontSize: '0.8rem' }}
                />
              </FormField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <FormField label="Ticker Background">
                <input
                  type="color"
                  value={settings.bgColor || '#fef08a'}
                  onChange={e => handleChange('bgColor', e.target.value)}
                  style={{ width: '44px', height: '34px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                />
              </FormField>
              <FormField label="Text Color">
                <input
                  type="color"
                  value={settings.textColor || '#0f172a'}
                  onChange={e => handleChange('textColor', e.target.value)}
                  style={{ width: '44px', height: '34px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                />
              </FormField>
            </div>
          </>
        )}

        {/* 5. HERO BANNER */}
        {section.type === 'hero_banner' && (() => {
          const isCarousel = settings.style === 'hyper_coupon' || settings.style === 'ebay_coupon' || section.id === 'sec_hero_hyper' || (!settings.style && themeConfig?.presetName === 'hyper')
          const carouselSlides: CarouselSlide[] = (settings.slides && Array.isArray(settings.slides) && settings.slides.length > 0)
            ? settings.slides
            : DEFAULT_HYPER_SLIDES

          const updateSlideAt = (sIdx: number, patch: Partial<CarouselSlide>) => {
            const next = carouselSlides.map((s, idx) => idx === sIdx ? { ...s, ...patch } : s)
            handleChange('slides', next)
          }

          const updateCardAt = (sIdx: number, cIdx: number, cardPatch: Partial<CarouselCard>) => {
            const next = carouselSlides.map((s, idx) => {
              if (idx !== sIdx) return s
              const nextCards = [...(s.cards || [])]
              while (nextCards.length < 3) {
                nextCards.push({ title: `Card ${nextCards.length + 1}`, image: '', badgeText: 'Featured' })
              }
              nextCards[cIdx] = { ...nextCards[cIdx], ...cardPatch }
              return { ...s, cards: nextCards }
            })
            handleChange('slides', next)
          }

          const handleAddSlide = () => {
            const newSlide: CarouselSlide = {
              id: `slide_${Date.now()}`,
              headline: 'New Seasonal Promotion',
              tagline: 'Discover quality merchandise and fast courier delivery.',
              buttonText: 'Shop Now',
              buttonLink: '#products',
              disclaimer: '*Store warranty and buyer protection included.',
              accentBar: 'linear-gradient(180deg, #3665f3 0%, #254edb 100%)',
              cards: [
                { title: 'Featured Drop 1', image: '', badgeText: 'New Arrival', actionType: 'text' },
                { title: 'Featured Drop 2', image: '', badgeText: 'Top Seller', actionType: 'text' },
                { title: 'Featured Drop 3', image: '', badgeText: 'Special Deal', actionType: 'text' },
              ]
            }
            handleChange('slides', [...carouselSlides, newSlide])
          }

          const handleDeleteSlide = (idx: number) => {
            if (carouselSlides.length <= 1) {
              alert('The carousel needs at least 1 slide.')
              return
            }
            const next = carouselSlides.filter((_, i) => i !== idx)
            handleChange('slides', next)
          }

          const handleMoveSlide = (idx: number, direction: 'up' | 'down') => {
            const targetIdx = direction === 'up' ? idx - 1 : idx + 1
            if (targetIdx < 0 || targetIdx >= carouselSlides.length) return
            const next = [...carouselSlides]
            const temp = next[idx]
            next[idx] = next[targetIdx]
            next[targetIdx] = temp
            handleChange('slides', next)
          }

          return (
            <>
              <FormField label="Hero Banner Style">
                <select
                  value={isCarousel ? 'hyper_coupon' : 'classic'}
                  onChange={e => handleChange('style', e.target.value)}
                  className="search-input"
                  style={{ width: '100%', fontSize: '0.82rem' }}
                >
                  <option value="hyper_coupon">Hyper 3-Picture Carousel (Scrollable Multi-Slide)</option>
                  <option value="classic">Classic Single-Image Banner</option>
                </select>
              </FormField>

              {isCarousel ? (
                /* CAROUSEL SLIDES & 3-PICTURE MANAGER */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                  {/* Status Banner */}
                  <div
                    style={{
                      background: carouselSlides.length > 1 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      border: `1px solid ${carouselSlides.length > 1 ? '#22c55e' : '#f59e0b'}`,
                      borderRadius: '12px',
                      padding: '12px 14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.86rem', color: carouselSlides.length > 1 ? '#15803d' : '#b45309' }}>
                        {carouselSlides.length} Slide{carouselSlides.length === 1 ? '' : 's'} ({carouselSlides.length * 3} Pictures Total)
                      </div>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '9999px',
                          background: carouselSlides.length > 1 ? '#22c55e' : '#f59e0b',
                          color: '#ffffff',
                        }}
                      >
                        {carouselSlides.length > 1 ? 'Auto-Scrolling Active' : 'Static (Won\'t Scroll)'}
                      </span>
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {carouselSlides.length > 1
                        ? 'With 2 or more slides, the carousel will automatically scroll with previous/next arrows and navigation dots.'
                        : 'With 1 slide, the carousel remains static without auto-scroll, arrows, or dots.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSlide}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      background: '#3665f3',
                      color: '#ffffff',
                      borderRadius: '10px',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(54, 101, 243, 0.25)',
                    }}
                  >
                    <span className="material-icons" style={{ fontSize: '18px' }}>add_circle</span>
                    <span>Add New Carousel Slide (+3 Pictures)</span>
                  </button>

                  {/* List of Carousel Slides */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {carouselSlides.map((slide, sIdx) => (
                      <div
                        key={slide.id || sIdx}
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: '14px',
                          background: 'var(--surface)',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                        }}
                      >
                        {/* Slide Top Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: '#191919',
                                color: '#ffffff',
                                display: 'grid',
                                placeItems: 'center',
                                fontSize: '0.76rem',
                                fontWeight: 800,
                              }}
                            >
                              {sIdx + 1}
                            </span>
                            <span style={{ fontWeight: 800, fontSize: '0.86rem' }}>
                              Slide {sIdx + 1}: {slide.headline || 'Untitled Slide'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              type="button"
                              disabled={sIdx === 0}
                              onClick={() => handleMoveSlide(sIdx, 'up')}
                              style={{ background: 'none', border: 'none', cursor: sIdx === 0 ? 'default' : 'pointer', opacity: sIdx === 0 ? 0.3 : 1, color: 'var(--text)' }}
                              title="Move slide up"
                            >
                              <span className="material-icons" style={{ fontSize: '18px' }}>arrow_upward</span>
                            </button>
                            <button
                              type="button"
                              disabled={sIdx === carouselSlides.length - 1}
                              onClick={() => handleMoveSlide(sIdx, 'down')}
                              style={{ background: 'none', border: 'none', cursor: sIdx === carouselSlides.length - 1 ? 'default' : 'pointer', opacity: sIdx === carouselSlides.length - 1 ? 0.3 : 1, color: 'var(--text)' }}
                              title="Move slide down"
                            >
                              <span className="material-icons" style={{ fontSize: '18px' }}>arrow_downward</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSlide(sIdx)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', marginLeft: '6px' }}
                              title="Delete this slide"
                            >
                              <span className="material-icons" style={{ fontSize: '18px' }}>delete</span>
                            </button>
                          </div>
                        </div>

                        {/* Slide Texts */}
                        <FormField label="Slide Headline">
                          <input
                            type="text"
                            value={slide.headline || ''}
                            onChange={e => updateSlideAt(sIdx, { headline: e.target.value })}
                            className="search-input"
                            style={{ width: '100%', fontSize: '0.82rem' }}
                            placeholder="e.g. Claim your in-app $15* off!"
                          />
                        </FormField>

                        <FormField label="Slide Tagline / Subtitle">
                          <input
                            type="text"
                            value={slide.tagline || ''}
                            onChange={e => updateSlideAt(sIdx, { tagline: e.target.value })}
                            className="search-input"
                            style={{ width: '100%', fontSize: '0.82rem' }}
                            placeholder="e.g. Save on your favorites when you spend over $100."
                          />
                        </FormField>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <FormField label="Button Text">
                            <input
                              type="text"
                              value={slide.buttonText || ''}
                              onChange={e => updateSlideAt(sIdx, { buttonText: e.target.value })}
                              className="search-input"
                              style={{ width: '100%', fontSize: '0.82rem' }}
                            />
                          </FormField>
                          <FormField label="Button Link">
                            <input
                              type="text"
                              value={slide.buttonLink || ''}
                              onChange={e => updateSlideAt(sIdx, { buttonLink: e.target.value })}
                              className="search-input"
                              style={{ width: '100%', fontSize: '0.82rem' }}
                            />
                          </FormField>
                        </div>

                        {/* 3 PICTURES PER SLIDE */}
                        <div style={{ marginTop: '8px', borderTop: '1px dashed var(--border)', paddingTop: '10px' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="material-icons" style={{ fontSize: '16px', color: '#3665f3' }}>photo_library</span>
                            <span>Slide Pictures (3 pictures per slide)</span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {[0, 1, 2].map(cIdx => {
                              const card = (slide.cards && slide.cards[cIdx]) || {
                                title: `Item ${cIdx + 1}`,
                                image: '',
                                badgeText: 'Featured'
                              }

                              return (
                                <div
                                  key={cIdx}
                                  style={{
                                    border: '1px solid var(--border)',
                                    borderRadius: '10px',
                                    padding: '10px',
                                    background: 'var(--panel)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)' }}>
                                      Picture {cIdx + 1} of 3
                                    </span>
                                    {card.image && (
                                      <button
                                        type="button"
                                        onClick={() => updateCardAt(sIdx, cIdx, { image: '' })}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}
                                      >
                                        Remove Photo
                                      </button>
                                    )}
                                  </div>

                                  {/* Picture Preview & Upload Row */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div
                                      style={{
                                        width: '54px',
                                        height: '54px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)',
                                        background: '#fafafa',
                                        display: 'grid',
                                        placeItems: 'center',
                                        overflow: 'hidden',
                                        flexShrink: 0,
                                      }}
                                    >
                                      {card.image ? (
                                        <img src={card.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      ) : (
                                        <span className="material-icons" style={{ fontSize: '22px', color: '#94a3b8' }}>image</span>
                                      )}
                                    </div>

                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <label
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: '6px',
                                          padding: '6px 12px',
                                          background: 'var(--surface)',
                                          border: '1px solid var(--border)',
                                          borderRadius: '8px',
                                          fontSize: '0.76rem',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          width: 'fit-content',
                                        }}
                                      >
                                        <span className="material-icons" style={{ fontSize: '15px', color: '#3665f3' }}>upload</span>
                                        <span>Upload Picture</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          style={{ display: 'none' }}
                                          onChange={e => {
                                            const file = e.target.files?.[0]
                                            if (!file) return
                                            const reader = new FileReader()
                                            reader.onload = evt => {
                                              if (evt.target?.result) {
                                                updateCardAt(sIdx, cIdx, { image: evt.target.result as string })
                                              }
                                            }
                                            reader.readAsDataURL(file)
                                          }}
                                        />
                                      </label>

                                      <input
                                        type="text"
                                        value={card.image || ''}
                                        onChange={e => updateCardAt(sIdx, cIdx, { image: e.target.value })}
                                        className="search-input"
                                        style={{ width: '100%', fontSize: '0.74rem', padding: '4px 8px' }}
                                        placeholder="Or paste image URL"
                                      />
                                    </div>
                                  </div>

                                  {/* Card Title & Badge */}
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                    <input
                                      type="text"
                                      value={card.title || ''}
                                      onChange={e => updateCardAt(sIdx, cIdx, { title: e.target.value })}
                                      className="search-input"
                                      style={{ width: '100%', fontSize: '0.74rem' }}
                                      placeholder="Picture Title / Label"
                                    />
                                    <input
                                      type="text"
                                      value={card.badgeText || ''}
                                      onChange={e => updateCardAt(sIdx, cIdx, { badgeText: e.target.value })}
                                      className="search-input"
                                      style={{ width: '100%', fontSize: '0.74rem' }}
                                      placeholder="Badge / Pill text"
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* CLASSIC HERO BANNER SINGLE IMAGE FALLBACK */
                <>
                  <FormField label="Headline">
                    <input
                      type="text"
                      value={settings.headline || ''}
                      onChange={e => handleChange('headline', e.target.value)}
                      className="search-input"
                      style={{ width: '100%', fontSize: '0.82rem' }}
                    />
                  </FormField>
                  <FormField label="Tagline / Subtitle">
                    <textarea
                      value={settings.tagline || ''}
                      onChange={e => handleChange('tagline', e.target.value)}
                      className="search-input"
                      rows={3}
                      style={{ width: '100%', fontSize: '0.82rem' }}
                    />
                  </FormField>
                  <FormField label="Background Image URL">
                    <input
                      type="text"
                      value={settings.bgImage || ''}
                      onChange={e => handleChange('bgImage', e.target.value)}
                      className="search-input"
                      style={{ width: '100%', fontSize: '0.82rem' }}
                    />
                  </FormField>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <FormField label="Primary Button Text">
                      <input
                        type="text"
                        value={settings.buttonText || ''}
                        onChange={e => handleChange('buttonText', e.target.value)}
                        className="search-input"
                        style={{ width: '100%', fontSize: '0.82rem' }}
                      />
                    </FormField>
                    <FormField label="Primary Button Link">
                      <input
                        type="text"
                        value={settings.buttonLink || ''}
                        onChange={e => handleChange('buttonLink', e.target.value)}
                        className="search-input"
                        style={{ width: '100%', fontSize: '0.82rem' }}
                      />
                    </FormField>
                  </div>
                </>
              )}
            </>
          )
        })()}

        {/* 6. CATEGORIES / DEPARTMENTS GRID & STORY BUBBLES */}
        {section.type === 'categories_grid' && (
          <>
            <FormField label="Section Title">
              <input
                type="text"
                value={settings.title || ''}
                onChange={e => handleChange('title', e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
              />
            </FormField>
            <FormField label="Subtitle">
              <input
                type="text"
                value={settings.subtitle || ''}
                onChange={e => handleChange('subtitle', e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
              />
            </FormField>
            <FormField label="Display Layout">
              <select
                value={settings.layout || 'grid'}
                onChange={e => handleChange('layout', e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
              >
                <option value="bubbles">Story Bubbles (Circular Avatars - Hyper)</option>
                <option value="squares">Square Avatars (Rounded Boxes - Xtra)</option>
                <option value="grid">Grid Cards (Showcase Photos)</option>
                <option value="chips">Compact Chips (Pill Badges)</option>
              </select>
            </FormField>

            {(settings.layout === 'bubbles' || settings.layout === 'squares') && (
              <FormField label="Row Layout">
                <select
                  value={settings.rows || 1}
                  onChange={e => handleChange('rows', Number(e.target.value))}
                  className="search-input"
                  style={{ width: '100%', fontSize: '0.82rem' }}
                >
                  <option value={1}>Single Horizontal Scrolling Row</option>
                  <option value={2}>Dual Rows (Wrapping)</option>
                </select>
              </FormField>
            )}

            <FormField label="View All Products Link (Optional)">
              <input
                type="text"
                value={settings.viewAllLink || ''}
                onChange={e => handleChange('viewAllLink', e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
                placeholder="#products"
              />
            </FormField>

            {/* Custom Department / Bubble Items Editor */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <strong style={{ fontSize: '0.82rem' }}>Custom Items / Bubbles ({(settings.items || []).length})</strong>
              <button
                type="button"
                onClick={() => {
                  const items = [...(settings.items || [])]
                  items.push({
                    id: 'cat_' + Date.now(),
                    label: 'New Category',
                    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&auto=format&fit=crop&q=80',
                    link: '#products'
                  })
                  handleChange('items', items)
                }}
                style={{ fontSize: '0.74rem', padding: '4px 8px', borderRadius: '6px', background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}
              >
                + Add Item
              </button>
            </div>
            {(settings.items || []).map((item: any, idx: number) => (
              <div key={item.id || idx} style={{ padding: '10px', background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700 }}>Item {idx + 1}: {item.label}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const items = (settings.items || []).filter((_: any, i: number) => i !== idx)
                      handleChange('items', items)
                    }}
                    style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}
                  >
                    Delete
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '6px' }}>
                  <input
                    type="text"
                    value={item.label || ''}
                    placeholder="Label (e.g. Sale, Lighting)"
                    onChange={e => {
                      const items = [...(settings.items || [])]
                      items[idx] = { ...item, label: e.target.value }
                      handleChange('items', items)
                    }}
                    className="search-input"
                    style={{ width: '100%', fontSize: '0.8rem' }}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(item.isSale)}
                      onChange={e => {
                        const items = [...(settings.items || [])]
                        items[idx] = { ...item, isSale: e.target.checked }
                        handleChange('items', items)
                      }}
                    />
                    Sale Pill
                  </label>
                </div>
                <input
                  type="text"
                  value={item.image || ''}
                  placeholder="Image URL"
                  onChange={e => {
                    const items = [...(settings.items || [])]
                    items[idx] = { ...item, image: e.target.value }
                    handleChange('items', items)
                  }}
                  className="search-input"
                  style={{ width: '100%', fontSize: '0.8rem' }}
                />
                <input
                  type="text"
                  value={item.link || ''}
                  placeholder="Link destination (#products)"
                  onChange={e => {
                    const items = [...(settings.items || [])]
                    items[idx] = { ...item, link: e.target.value }
                    handleChange('items', items)
                  }}
                  className="search-input"
                  style={{ width: '100%', fontSize: '0.8rem' }}
                />
              </div>
            ))}
          </>
        )}

        {/* 7. FEATURED PRODUCTS */}
        {section.type === 'featured_products' && (
          <>
            <FormField label="Section Title">
              <input
                type="text"
                value={settings.title || ''}
                onChange={e => handleChange('title', e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
              />
            </FormField>
            <FormField label="Subtitle">
              <input
                type="text"
                value={settings.subtitle || ''}
                onChange={e => handleChange('subtitle', e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
              />
            </FormField>
            <FormField label="Filter by Department">
              <select
                value={settings.departmentFilter || 'all'}
                onChange={e => handleChange('departmentFilter', e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
              >
                <option value="all">All Store Products</option>
                {(shop.collections || []).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <FormField label="Columns">
                <select
                  value={settings.columns || 4}
                  onChange={e => handleChange('columns', Number(e.target.value))}
                  className="search-input"
                  style={{ width: '100%', fontSize: '0.82rem' }}
                >
                  <option value={2}>2 Columns</option>
                  <option value={3}>3 Columns</option>
                  <option value={4}>4 Columns</option>
                </select>
              </FormField>
              <FormField label="Item Limit">
                <input
                  type="number"
                  min="2"
                  max="24"
                  value={settings.limit || 8}
                  onChange={e => handleChange('limit', Number(e.target.value))}
                  className="search-input"
                  style={{ width: '100%', fontSize: '0.82rem' }}
                />
              </FormField>
            </div>
          </>
        )}

        {/* 8. TESTIMONIALS / REVIEWS */}
        {section.type === 'testimonials' && (
          <>
            <FormField label="Section Title">
              <input
                type="text"
                value={settings.title || ''}
                onChange={e => handleChange('title', e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
              />
            </FormField>
            <FormField label="Section Subtitle">
              <input
                type="text"
                value={settings.subtitle || ''}
                onChange={e => handleChange('subtitle', e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
              />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <strong style={{ fontSize: '0.82rem' }}>Buyer Testimonials ({(settings.quotes || []).length})</strong>
              <button
                type="button"
                onClick={() => {
                  const quotes = [...(settings.quotes || [])]
                  quotes.push({
                    id: 'rev_' + Date.now(),
                    name: 'Verified Customer',
                    role: 'Verified Buyer',
                    rating: 5,
                    text: 'Incredible product quality and super fast response time!'
                  })
                  handleChange('quotes', quotes)
                }}
                style={{ fontSize: '0.74rem', padding: '4px 8px', borderRadius: '6px', background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}
              >
                + Add Review
              </button>
            </div>

            {(settings.quotes || []).map((quote: any, idx: number) => (
              <div key={quote.id || idx} style={{ padding: '10px', background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700 }}>Review {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const quotes = (settings.quotes || []).filter((_: any, i: number) => i !== idx)
                      handleChange('quotes', quotes)
                    }}
                    style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}
                  >
                    Delete
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <FormField label="Customer Name">
                    <input
                      type="text"
                      value={quote.name || ''}
                      onChange={e => {
                        const quotes = [...(settings.quotes || [])]
                        quotes[idx] = { ...quote, name: e.target.value }
                        handleChange('quotes', quotes)
                      }}
                      className="search-input"
                      style={{ width: '100%', fontSize: '0.8rem' }}
                    />
                  </FormField>
                  <FormField label="Role / Badge">
                    <input
                      type="text"
                      value={quote.role || ''}
                      onChange={e => {
                        const quotes = [...(settings.quotes || [])]
                        quotes[idx] = { ...quote, role: e.target.value }
                        handleChange('quotes', quotes)
                      }}
                      className="search-input"
                      style={{ width: '100%', fontSize: '0.8rem' }}
                    />
                  </FormField>
                </div>
                <FormField label="Rating (1-5)">
                  <select
                    value={quote.rating || 5}
                    onChange={e => {
                      const quotes = [...(settings.quotes || [])]
                      quotes[idx] = { ...quote, rating: Number(e.target.value) }
                      handleChange('quotes', quotes)
                    }}
                    className="search-input"
                    style={{ width: '100%', fontSize: '0.8rem' }}
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                    <option value={3}>⭐⭐⭐ (3 Stars)</option>
                  </select>
                </FormField>
                <FormField label="Review Text">
                  <textarea
                    value={quote.text || ''}
                    rows={2}
                    onChange={e => {
                      const quotes = [...(settings.quotes || [])]
                      quotes[idx] = { ...quote, text: e.target.value }
                      handleChange('quotes', quotes)
                    }}
                    className="search-input"
                    style={{ width: '100%', fontSize: '0.8rem' }}
                  />
                </FormField>
              </div>
            ))}
          </>
        )}

        {/* 9. FAQ */}
        {section.type === 'faq' && (
          <>
            <FormField label="Section Title">
              <input
                type="text"
                value={settings.title || ''}
                onChange={e => handleChange('title', e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
              />
            </FormField>
            <FormField label="Section Subtitle">
              <input
                type="text"
                value={settings.subtitle || ''}
                onChange={e => handleChange('subtitle', e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
              />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <strong style={{ fontSize: '0.82rem' }}>Questions & Answers ({(settings.items || []).length})</strong>
              <button
                type="button"
                onClick={() => {
                  const items = [...(settings.items || [])]
                  items.push({
                    id: 'faq_' + Date.now(),
                    question: 'How do I track my order?',
                    answer: 'We provide immediate tracking links via SMS and email after dispatch.'
                  })
                  handleChange('items', items)
                }}
                style={{ fontSize: '0.74rem', padding: '4px 8px', borderRadius: '6px', background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}
              >
                + Add FAQ
              </button>
            </div>

            {(settings.items || []).map((faqItem: any, idx: number) => (
              <div key={faqItem.id || idx} style={{ padding: '10px', background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700 }}>Question {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const items = (settings.items || []).filter((_: any, i: number) => i !== idx)
                      handleChange('items', items)
                    }}
                    style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}
                  >
                    Delete
                  </button>
                </div>
                <FormField label="Question">
                  <input
                    type="text"
                    value={faqItem.question || ''}
                    onChange={e => {
                      const items = [...(settings.items || [])]
                      items[idx] = { ...faqItem, question: e.target.value }
                      handleChange('items', items)
                    }}
                    className="search-input"
                    style={{ width: '100%', fontSize: '0.8rem' }}
                  />
                </FormField>
                <FormField label="Answer">
                  <textarea
                    value={faqItem.answer || ''}
                    rows={2}
                    onChange={e => {
                      const items = [...(settings.items || [])]
                      items[idx] = { ...faqItem, answer: e.target.value }
                      handleChange('items', items)
                    }}
                    className="search-input"
                    style={{ width: '100%', fontSize: '0.8rem' }}
                  />
                </FormField>
              </div>
            ))}
          </>
        )}

        {/* 10. PROMO BANNER */}
        {section.type === 'promo_banner' && (
          <>
            <FormField label="Badge Label">
              <input
                type="text"
                value={settings.badge || ''}
                onChange={e => handleChange('badge', e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
              />
            </FormField>
            <FormField label="Headline / Title">
              <input
                type="text"
                value={settings.title || ''}
                onChange={e => handleChange('title', e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
              />
            </FormField>
            <FormField label="Description">
              <textarea
                value={settings.description || ''}
                onChange={e => handleChange('description', e.target.value)}
                className="search-input"
                rows={3}
                style={{ width: '100%', fontSize: '0.82rem' }}
              />
            </FormField>
            <FormField label="Banner Image URL">
              <input
                type="text"
                value={settings.image || ''}
                onChange={e => handleChange('image', e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
              />
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <FormField label="Button Text">
                <input
                  type="text"
                  value={settings.buttonText || ''}
                  onChange={e => handleChange('buttonText', e.target.value)}
                  className="search-input"
                  style={{ width: '100%', fontSize: '0.82rem' }}
                />
              </FormField>
              <FormField label="Button Link">
                <input
                  type="text"
                  value={settings.buttonLink || ''}
                  onChange={e => handleChange('buttonLink', e.target.value)}
                  className="search-input"
                  style={{ width: '100%', fontSize: '0.82rem' }}
                />
              </FormField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <FormField label="Background Color">
                <input
                  type="color"
                  value={settings.bgColor || '#0f172a'}
                  onChange={e => handleChange('bgColor', e.target.value)}
                  style={{ width: '44px', height: '34px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                />
              </FormField>
              <FormField label="Text Color">
                <input
                  type="color"
                  value={settings.textColor || '#ffffff'}
                  onChange={e => handleChange('textColor', e.target.value)}
                  style={{ width: '44px', height: '34px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                />
              </FormField>
            </div>
          </>
        )}

        {/* 11. RICH TEXT / BRAND STORY */}
        {section.type === 'rich_text' && (
          <>
            <FormField label="Badge / Subtitle (Optional)">
              <input
                type="text"
                value={settings.badge || ''}
                onChange={e => handleChange('badge', e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
              />
            </FormField>
            <FormField label="Heading">
              <input
                type="text"
                value={settings.heading || ''}
                onChange={e => handleChange('heading', e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
              />
            </FormField>
            <FormField label="Content Body">
              <textarea
                value={settings.body || ''}
                onChange={e => handleChange('body', e.target.value)}
                className="search-input"
                rows={5}
                style={{ width: '100%', fontSize: '0.82rem' }}
              />
            </FormField>
            <FormField label="Alignment">
              <select
                value={settings.align || 'center'}
                onChange={e => handleChange('align', e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
              >
                <option value="center">Centered</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </FormField>
          </>
        )}

        {/* 12. ANNOUNCEMENT BAR */}
        {section.type === 'announcement' && (
          <>
            <FormField label="Announcement Message">
              <input
                type="text"
                value={settings.text || ''}
                onChange={e => handleChange('text', e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
              />
            </FormField>
            <FormField label="Link Destination (Optional)">
              <input
                type="text"
                value={settings.link || ''}
                onChange={e => handleChange('link', e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
                placeholder="#products"
              />
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <FormField label="Background Color">
                <input
                  type="color"
                  value={settings.bgColor || '#2563eb'}
                  onChange={e => handleChange('bgColor', e.target.value)}
                  style={{ width: '44px', height: '34px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                />
              </FormField>
              <FormField label="Text Color">
                <input
                  type="color"
                  value={settings.textColor || '#ffffff'}
                  onChange={e => handleChange('textColor', e.target.value)}
                  style={{ width: '44px', height: '34px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                />
              </FormField>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
