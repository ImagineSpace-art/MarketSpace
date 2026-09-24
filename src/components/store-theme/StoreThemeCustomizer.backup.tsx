import { useState } from 'react'
import type { BusinessProfile, Listing, StoreSection, StoreThemeConfig, StoreSectionType } from '../../types'
import { AVAILABLE_SECTIONS, THEME_PRESETS, createNewSection } from './defaultSections'
import { StoreSectionRenderer } from './StoreSectionRenderer'

interface StoreThemeCustomizerProps {
  businessProfile: BusinessProfile
  myListings: Listing[]
  onSaveTheme: (config: StoreThemeConfig) => Promise<void> | void
  onClose?: () => void
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile'

export function StoreThemeCustomizer({
  businessProfile,
  myListings,
  onSaveTheme,
  onClose,
}: StoreThemeCustomizerProps) {
  // Initialize theme config from businessProfile or default to modern preset
  const [themeConfig, setThemeConfig] = useState<StoreThemeConfig>(() => {
    if (businessProfile.themeConfig && businessProfile.themeConfig.sections?.length > 0) {
      return JSON.parse(JSON.stringify(businessProfile.themeConfig))
    }
    return JSON.parse(JSON.stringify(THEME_PRESETS.modern))
  })

  const [activeDevice, setActiveDevice] = useState<DeviceMode>('desktop')
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false)
  const [activeSettingsTab, setActiveSettingsTab] = useState<'sections' | 'styles' | 'presets'>('sections')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // Current selected section for inspector
  const selectedSection = themeConfig.sections.find(s => s.id === selectedSectionId) || null

  // Reorder sections
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const nextSections = [...themeConfig.sections]
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= nextSections.length) return

    const temp = nextSections[index]
    nextSections[index] = nextSections[targetIdx]
    nextSections[targetIdx] = temp
    setThemeConfig(prev => ({ ...prev, sections: nextSections }))
  }

  // Toggle section enabled
  const toggleSectionEnabled = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setThemeConfig(prev => ({
      ...prev,
      sections: prev.sections.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    }))
  }

  // Remove section
  const removeSection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setThemeConfig(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== id)
    }))
    if (selectedSectionId === id) setSelectedSectionId(null)
  }

  // Add new section
  const handleAddSection = (type: StoreSectionType) => {
    const newSec = createNewSection(type)
    setThemeConfig(prev => ({
      ...prev,
      sections: [...prev.sections, newSec]
    }))
    setSelectedSectionId(newSec.id)
    setIsAddSectionOpen(false)
  }

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {saveMessage && (
            <span style={{ fontSize: '0.84rem', color: '#10b981', fontWeight: 600 }}>
              {saveMessage}
            </span>
          )}
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
                  onClick={() => setActiveSettingsTab('sections')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: 'none',
                    background: activeSettingsTab === 'sections' ? 'var(--panel)' : 'transparent',
                    color: activeSettingsTab === 'sections' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    borderBottom: activeSettingsTab === 'sections' ? '2px solid var(--primary)' : 'none'
                  }}
                >
                  Sections ({themeConfig.sections.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSettingsTab('styles')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: 'none',
                    background: activeSettingsTab === 'styles' ? 'var(--panel)' : 'transparent',
                    color: activeSettingsTab === 'styles' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    borderBottom: activeSettingsTab === 'styles' ? '2px solid var(--primary)' : 'none'
                  }}
                >
                  Theme Styles
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSettingsTab('presets')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: 'none',
                    background: activeSettingsTab === 'presets' ? 'var(--panel)' : 'transparent',
                    color: activeSettingsTab === 'presets' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    borderBottom: activeSettingsTab === 'presets' ? '2px solid var(--primary)' : 'none'
                  }}
                >
                  Presets
                </button>
              </div>

              {/* SECTIONS TAB */}
              {activeSettingsTab === 'sections' && (
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      DRAG & ORDER SECTIONS
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddSectionOpen(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--primary)',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: 'pointer'
                      }}
                    >
                      <span className="material-icons" style={{ fontSize: '16px' }}>add</span>
                      Add Section
                    </button>
                  </div>

                  {themeConfig.sections.map((sec, idx) => {
                    const def = AVAILABLE_SECTIONS.find(s => s.type === sec.type)
                    return (
                      <div
                        key={sec.id}
                        onClick={() => setSelectedSectionId(sec.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          background: sec.enabled ? 'var(--surface)' : 'rgba(0,0,0,0.05)',
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                          opacity: sec.enabled ? 1 : 0.5,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <span className="material-icons" style={{ color: themeConfig.primaryColor || '#2563eb', fontSize: '20px' }}>
                            {def?.icon || 'view_agenda'}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <strong style={{ display: 'block', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {def?.name || sec.type}
                            </strong>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                              {sec.type}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {/* Reorder arrows */}
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); moveSection(idx, 'up') }}
                            disabled={idx === 0}
                            title="Move Up"
                            style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: idx === 0 ? 'default' : 'pointer', padding: '2px', opacity: idx === 0 ? 0.2 : 1 }}
                          >
                            <span className="material-icons" style={{ fontSize: '16px' }}>arrow_upward</span>
                          </button>
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); moveSection(idx, 'down') }}
                            disabled={idx === themeConfig.sections.length - 1}
                            title="Move Down"
                            style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: idx === themeConfig.sections.length - 1 ? 'default' : 'pointer', padding: '2px', opacity: idx === themeConfig.sections.length - 1 ? 0.2 : 1 }}
                          >
                            <span className="material-icons" style={{ fontSize: '16px' }}>arrow_downward</span>
                          </button>

                          {/* Visibility toggle */}
                          <button
                            type="button"
                            onClick={e => toggleSectionEnabled(sec.id, e)}
                            title={sec.enabled ? 'Hide Section' : 'Show Section'}
                            style={{ border: 'none', background: 'transparent', color: sec.enabled ? 'var(--text)' : 'var(--text-secondary)', cursor: 'pointer', padding: '2px' }}
                          >
                            <span className="material-icons" style={{ fontSize: '18px' }}>
                              {sec.enabled ? 'visibility' : 'visibility_off'}
                            </span>
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={e => removeSection(sec.id, e)}
                            title="Delete Section"
                            style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                          >
                            <span className="material-icons" style={{ fontSize: '18px' }}>delete_outline</span>
                          </button>
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

              {/* PRESETS TAB */}
              {activeSettingsTab === 'presets' && (
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Select a ready-made theme layout starter. This will configure sections, styles, and colors to match the theme vibe:
                  </p>
                  {Object.entries(THEME_PRESETS).map(([key, preset]) => (
                    <div
                      key={key}
                      onClick={() => applyPreset(key)}
                      style={{
                        padding: '14px',
                        borderRadius: '12px',
                        background: 'var(--surface)',
                        border: themeConfig.presetName === key ? `2px solid ${preset.primaryColor}` : '1px solid var(--border)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.94rem', textTransform: 'capitalize' }}>
                          {key} Theme
                        </strong>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {preset.sections.length} curated sections
                        </span>
                      </div>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: preset.primaryColor }} />
                    </div>
                  ))}
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
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
              {themeConfig.sections.map(section => (
                <StoreSectionRenderer
                  key={section.id}
                  section={section}
                  shop={previewShop}
                  listings={myListings}
                  onOpenListing={() => {}}
                  onToggleSave={() => {}}
                  onSelectDepartment={() => {}}
                />
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* 3. ADD SECTION MODAL / DRAWER */}
      {isAddSectionOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 100,
            padding: '20px'
          }}
          onClick={() => setIsAddSectionOpen(false)}
        >
          <div
            style={{
              background: 'var(--panel)',
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '650px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              border: '1px solid var(--border)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Add Section</h3>
              <button
                type="button"
                onClick={() => setIsAddSectionOpen(false)}
                className="ghost-btn"
                style={{ padding: '6px' }}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0 0 16px 0' }}>
              Choose a modular section to add to your storefront layout:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {AVAILABLE_SECTIONS.map(sec => (
                <div
                  key={sec.type}
                  onClick={() => handleAddSection(sec.type)}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'transform 0.15s ease, border-color 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--primary)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-icons" style={{ color: themeConfig.primaryColor || '#2563eb', fontSize: '22px' }}>
                      {sec.icon}
                    </span>
                    <strong style={{ fontSize: '0.94rem' }}>{sec.name}</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {sec.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// -------------------------------------------------------------
// SECTION INSPECTOR (Customizes Settings for Selected Section)
// -------------------------------------------------------------

function SectionInspector({
  section,
  shop,
  onBack,
  onUpdateSettings
}: {
  section: StoreSection
  shop: BusinessProfile
  onBack: () => void
  onUpdateSettings: (settings: Record<string, any>) => void
}) {
  const def = AVAILABLE_SECTIONS.find(s => s.type === section.type)
  const settings = section.settings || {}

  const handleChange = (field: string, val: any) => {
    onUpdateSettings({ [field]: val })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Inspector Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          type="button"
          onClick={onBack}
          className="ghost-btn"
          style={{ padding: '4px', display: 'flex', alignItems: 'center' }}
        >
          <span className="material-icons">arrow_back</span>
        </button>
        <div>
          <strong style={{ display: 'block', fontSize: '0.94rem' }}>{def?.name || section.type}</strong>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Configure section settings</span>
        </div>
      </div>

      {/* Inspector Form Controls */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1 }}>
        {/* HERO BANNER SETTINGS */}
        {section.type === 'hero_banner' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Headline</label>
              <input
                type="text"
                value={settings.headline || ''}
                onChange={e => handleChange('headline', e.target.value)}
                className="search-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Tagline</label>
              <textarea
                value={settings.tagline || ''}
                onChange={e => handleChange('tagline', e.target.value)}
                className="search-input"
                rows={3}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Button Text</label>
              <input
                type="text"
                value={settings.buttonText || ''}
                onChange={e => handleChange('buttonText', e.target.value)}
                className="search-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Background Image URL</label>
              <input
                type="text"
                value={settings.bgImage || ''}
                onChange={e => handleChange('bgImage', e.target.value)}
                className="search-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Alignment</label>
              <select
                value={settings.align || 'center'}
                onChange={e => handleChange('align', e.target.value)}
                className="search-input"
                style={{ width: '100%' }}
              >
                <option value="center">Centered</option>
                <option value="left">Left Aligned</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                Overlay Darkness: {settings.overlayDarkness ?? 50}%
              </label>
              <input
                type="range"
                min="0"
                max="90"
                value={settings.overlayDarkness ?? 50}
                onChange={e => handleChange('overlayDarkness', Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </>
        )}

        {/* FEATURED PRODUCTS SETTINGS */}
        {section.type === 'featured_products' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Section Title</label>
              <input
                type="text"
                value={settings.title || ''}
                onChange={e => handleChange('title', e.target.value)}
                className="search-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Subtitle</label>
              <input
                type="text"
                value={settings.subtitle || ''}
                onChange={e => handleChange('subtitle', e.target.value)}
                className="search-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Filter by Department</label>
              <select
                value={settings.departmentFilter || 'all'}
                onChange={e => handleChange('departmentFilter', e.target.value)}
                className="search-input"
                style={{ width: '100%' }}
              >
                <option value="all">All Store Products</option>
                {(shop.collections || []).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Columns</label>
              <select
                value={settings.columns || 4}
                onChange={e => handleChange('columns', Number(e.target.value))}
                className="search-input"
                style={{ width: '100%' }}
              >
                <option value={2}>2 Columns</option>
                <option value={3}>3 Columns</option>
                <option value={4}>4 Columns</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Item Limit</label>
              <input
                type="number"
                min="2"
                max="24"
                value={settings.limit || 8}
                onChange={e => handleChange('limit', Number(e.target.value))}
                className="search-input"
                style={{ width: '100%' }}
              />
            </div>
          </>
        )}

        {/* PROMO BANNER SETTINGS */}
        {section.type === 'promo_banner' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Badge Label</label>
              <input
                type="text"
                value={settings.badge || ''}
                onChange={e => handleChange('badge', e.target.value)}
                className="search-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Headline</label>
              <input
                type="text"
                value={settings.title || ''}
                onChange={e => handleChange('title', e.target.value)}
                className="search-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Description</label>
              <textarea
                value={settings.description || ''}
                onChange={e => handleChange('description', e.target.value)}
                className="search-input"
                rows={3}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Button Text</label>
              <input
                type="text"
                value={settings.buttonText || ''}
                onChange={e => handleChange('buttonText', e.target.value)}
                className="search-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Banner Image URL</label>
              <input
                type="text"
                value={settings.image || ''}
                onChange={e => handleChange('image', e.target.value)}
                className="search-input"
                style={{ width: '100%' }}
              />
            </div>
          </>
        )}

        {/* RICH TEXT SETTINGS */}
        {section.type === 'rich_text' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Heading</label>
              <input
                type="text"
                value={settings.heading || ''}
                onChange={e => handleChange('heading', e.target.value)}
                className="search-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Content Body</label>
              <textarea
                value={settings.body || ''}
                onChange={e => handleChange('body', e.target.value)}
                className="search-input"
                rows={5}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Alignment</label>
              <select
                value={settings.align || 'center'}
                onChange={e => handleChange('align', e.target.value)}
                className="search-input"
                style={{ width: '100%' }}
              >
                <option value="center">Centered</option>
                <option value="left">Left</option>
              </select>
            </div>
          </>
        )}

        {/* CATEGORIES GRID SETTINGS */}
        {section.type === 'categories_grid' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Title</label>
              <input
                type="text"
                value={settings.title || ''}
                onChange={e => handleChange('title', e.target.value)}
                className="search-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Subtitle</label>
              <input
                type="text"
                value={settings.subtitle || ''}
                onChange={e => handleChange('subtitle', e.target.value)}
                className="search-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Layout</label>
              <select
                value={settings.layout || 'grid'}
                onChange={e => handleChange('layout', e.target.value)}
                className="search-input"
                style={{ width: '100%' }}
              >
                <option value="grid">Grid Cards</option>
                <option value="chips">Compact Chips</option>
              </select>
            </div>
          </>
        )}

        {/* ANNOUNCEMENT SETTINGS */}
        {section.type === 'announcement' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Announcement Text</label>
              <input
                type="text"
                value={settings.text || ''}
                onChange={e => handleChange('text', e.target.value)}
                className="search-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Background Color</label>
              <input
                type="color"
                value={settings.bgColor || '#2563eb'}
                onChange={e => handleChange('bgColor', e.target.value)}
                style={{ width: '40px', height: '40px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
