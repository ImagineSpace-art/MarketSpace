import { useState, useRef, useEffect } from 'react'
import type { StoreSectionType } from '../../types'
import { AVAILABLE_SECTIONS } from './defaultSections'

// ============================================================
// CURATED MEDIA STORAGE ASSETS (Pre-cached high-res stock)
// ============================================================
export const CURATED_STORAGE_IMAGES = [
  {
    category: 'Technical & Outerwear',
    items: [
      { name: 'Alpine Puffer Down', url: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=1200&auto=format&fit=crop&q=80' },
      { name: 'Tactical GORE-TEX Shell', url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80' },
      { name: 'Ski Visor & Dual Lens', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80' },
      { name: 'Alpaca Heavyweight Wool', url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&auto=format&fit=crop&q=80' },
      { name: 'Modular Cargo Pant', url: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=800&auto=format&fit=crop&q=80' },
    ]
  },
  {
    category: 'Home & Living',
    items: [
      { name: 'Scandinavian Spoke Sofa', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&auto=format&fit=crop&q=80' },
      { name: 'Solid Oak Armchair', url: 'https://images.unsplash.com/photo-1580481077195-7385f50d8830?w=800&auto=format&fit=crop&q=80' },
      { name: 'Handmade Artisan Ceramics', url: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&auto=format&fit=crop&q=80' },
      { name: 'Kinoto Chrome Dome Lamp', url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&auto=format&fit=crop&q=80' },
      { name: 'Walnut Bedside Nightstand', url: 'https://images.unsplash.com/photo-1532323544230-7191fd51bc1b?w=800&auto=format&fit=crop&q=80' },
      { name: 'Cozy Living Space', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80' },
    ]
  },
  {
    category: 'Electronics & Gadgets',
    items: [
      { name: 'Pastel Wireless Earbuds', url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80' },
      { name: 'Studio ANC Headphones', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80' },
      { name: 'Smart Fitness Watch', url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80' },
      { name: 'Minimalist Tech Desk', url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80' },
    ]
  },
  {
    category: 'Beauty, Gifts & Fashion',
    items: [
      { name: 'Luxury Fragrance & Brushes', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80' },
      { name: 'Gold Wrapped Gift Boxes', url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80' },
      { name: 'High-Fashion Editorial Model', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop&q=80' },
      { name: 'Kids Organic Cotton Loungewear', url: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&auto=format&fit=crop&q=80' },
      { name: 'Organic Facial Botanicals', url: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&auto=format&fit=crop&q=80' },
      { name: 'Special Drop Retail Bags', url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=80' },
    ]
  }
]

// ============================================================
// 1. MEDIA STORAGE & FILE DROP MODAL
// ============================================================
interface MediaStorageModalProps {
  isOpen: boolean
  onClose: () => void
  currentImage?: string
  onSelectImage: (imageUrl: string) => void
}

export function MediaStorageModal({ isOpen, onClose, currentImage = '', onSelectImage }: MediaStorageModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'storage' | 'url'>('upload')
  const [urlInput, setUrlInput] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  if (!isOpen) return null

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      if (dataUrl) {
        onSelectImage(dataUrl)
        onClose()
      }
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(5px)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 99999,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-icons" style={{ color: 'var(--primary)', fontSize: '22px' }}>photo_library</span>
            <strong style={{ fontSize: '1.05rem' }}>Select or Upload Image</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ghost-btn"
            style={{ padding: '6px', borderRadius: '8px' }}
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: activeTab === 'upload' ? 'var(--panel)' : 'transparent',
              color: activeTab === 'upload' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'upload' ? '2px solid var(--primary)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span className="material-icons" style={{ fontSize: '18px' }}>cloud_upload</span>
            Drop / Upload File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('storage')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: activeTab === 'storage' ? 'var(--panel)' : 'transparent',
              color: activeTab === 'storage' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'storage' ? '2px solid var(--primary)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span className="material-icons" style={{ fontSize: '18px' }}>collections</span>
            Media Storage Library
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: activeTab === 'url' ? 'var(--panel)' : 'transparent',
              color: activeTab === 'url' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'url' ? '2px solid var(--primary)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span className="material-icons" style={{ fontSize: '18px' }}>link</span>
            Direct URL
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {/* TAB 1: DROP / UPLOAD */}
          {activeTab === 'upload' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: isDragging ? '2px dashed var(--primary)' : '2px dashed var(--border)',
                  backgroundColor: isDragging ? 'rgba(37, 99, 235, 0.08)' : 'var(--surface)',
                  borderRadius: '16px',
                  padding: '48px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.12)', display: 'grid', placeItems: 'center', color: 'var(--primary)' }}>
                  <span className="material-icons" style={{ fontSize: '28px' }}>upload_file</span>
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '4px' }}>
                    Drag & Drop an image file here
                  </strong>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    or click to select from your computer (PNG, JPG, WEBP, GIF)
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      handleFile(e.target.files[0])
                    }
                  }}
                />
              </div>

              {currentImage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <img src={currentImage} alt="Current" style={{ width: '54px', height: '54px', borderRadius: '8px', objectFit: 'cover' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block' }}>Current active image:</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentImage}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CURATED MEDIA STORAGE */}
          {activeTab === 'storage' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {CURATED_STORAGE_IMAGES.map(group => (
                <div key={group.category}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {group.category}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                    {group.items.map(item => (
                      <div
                        key={item.url}
                        onClick={() => {
                          onSelectImage(item.url)
                          onClose()
                        }}
                        style={{
                          borderRadius: '12px',
                          overflow: 'hidden',
                          border: currentImage === item.url ? '2px solid var(--primary)' : '1px solid var(--border)',
                          cursor: 'pointer',
                          background: 'var(--surface)',
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        <div style={{ height: '90px', width: '100%', overflow: 'hidden' }}>
                          <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <span style={{ fontSize: '0.74rem', padding: '6px 8px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: DIRECT URL */}
          {activeTab === 'url' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '6px' }}>
                  Paste Image URL (Unsplash, Cloudinary, etc.)
                </label>
                <input
                  type="text"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="search-input"
                  style={{ width: '100%' }}
                />
              </div>

              {urlInput && (
                <div style={{ height: '180px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img src={urlInput} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as any).style.display = 'none' }} />
                </div>
              )}

              <button
                type="button"
                disabled={!urlInput.trim()}
                onClick={() => {
                  if (urlInput.trim()) {
                    onSelectImage(urlInput.trim())
                    onClose()
                  }
                }}
                className="primary-btn"
                style={{ padding: '10px 20px', alignSelf: 'flex-start', borderRadius: '10px' }}
              >
                Apply Image URL
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 2. LIVE EDITABLE TEXT COMPONENT (With subtle pencil icon)
// ============================================================
interface LiveEditableTextProps {
  value: string
  onChange: (newVal: string) => void
  isLiveEditing?: boolean
  multiline?: boolean
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'
  style?: React.CSSProperties
  className?: string
  placeholder?: string
}

export function LiveEditableText({
  value,
  onChange,
  isLiveEditing = false,
  multiline = false,
  tag = 'span',
  style = {},
  className = '',
  placeholder = 'Click to edit text...'
}: LiveEditableTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')
  const [isHovered, setIsHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)

  useEffect(() => {
    setDraft(value || '')
  }, [value])

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
    }
  }, [isEditing])

  if (!isLiveEditing) {
    const Tag = tag as any
    return <Tag style={style} className={className}>{value || placeholder}</Tag>
  }

  const handleSave = () => {
    setIsEditing(false)
    onChange(draft)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setDraft(value || '')
    }
  }

  if (isEditing) {
    return (
      <div
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', position: 'relative', zIndex: 30, maxWidth: '100%' }}
        onClick={e => e.stopPropagation()}
      >
        {multiline ? (
          <textarea
            ref={inputRef as any}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            className="search-input"
            style={{
              ...style,
              display: 'block',
              width: '100%',
              minWidth: '220px',
              backgroundColor: 'var(--panel)',
              color: 'var(--text)',
              border: '2px solid var(--primary)',
              borderRadius: '8px',
              padding: '6px 10px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)'
            }}
          />
        ) : (
          <input
            ref={inputRef as any}
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className="search-input"
            style={{
              ...style,
              display: 'inline-block',
              width: '100%',
              minWidth: '140px',
              backgroundColor: 'var(--panel)',
              color: 'var(--text)',
              border: '2px solid var(--primary)',
              borderRadius: '8px',
              padding: '4px 8px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)'
            }}
          />
        )}
        <button
          type="button"
          onClick={handleSave}
          title="Save text (Enter)"
          style={{
            padding: '6px 10px',
            backgroundColor: '#10b981',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.78rem',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 2px 6px rgba(16,185,129,0.3)'
          }}
        >
          <span className="material-icons" style={{ fontSize: '16px' }}>check</span>
        </button>
        <button
          type="button"
          onClick={() => { setIsEditing(false); setDraft(value || '') }}
          title="Cancel (Esc)"
          style={{
            padding: '6px 8px',
            backgroundColor: 'var(--surface)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.78rem'
          }}
        >
          <span className="material-icons" style={{ fontSize: '16px' }}>close</span>
        </button>
      </div>
    )
  }

  const Tag = tag as any

  return (
    <span
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={e => {
        e.stopPropagation()
        setIsEditing(true)
      }}
      style={{
        position: 'relative',
        display: 'inline-block',
        cursor: 'text',
        borderRadius: '6px',
        outline: isHovered ? '1.5px dashed rgba(37, 99, 235, 0.7)' : '1.5px dashed transparent',
        outlineOffset: '3px',
        transition: 'outline 0.15s ease'
      }}
      title="Click to edit text"
    >
      <Tag style={style} className={className}>
        {value || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>{placeholder}</span>}
      </Tag>

      {/* Subtle Edit Pencil Icon */}
      {isHovered && (
        <span
          style={{
            position: 'absolute',
            top: '-10px',
            right: '-10px',
            backgroundColor: 'var(--primary)',
            color: '#ffffff',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
            zIndex: 10,
            cursor: 'pointer'
          }}
        >
          <span className="material-icons" style={{ fontSize: '12px' }}>edit</span>
        </span>
      )}
    </span>
  )
}

// ============================================================
// 3. LIVE EDITABLE IMAGE COMPONENT (With file drop & storage)
// ============================================================
interface LiveEditableImageProps {
  currentUrl?: string
  onChangeImage: (newUrl: string) => void
  isLiveEditing?: boolean
  children: React.ReactNode
  style?: React.CSSProperties
  className?: string
  label?: string
}

export function LiveEditableImage({
  currentUrl = '',
  onChangeImage,
  isLiveEditing = false,
  children,
  style = {},
  className = '',
  label = 'Change Photo'
}: LiveEditableImageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  if (!isLiveEditing) {
    return <div style={style} className={className}>{children}</div>
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingFile(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingFile(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingFile(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string
          if (dataUrl) onChangeImage(dataUrl)
        }
        reader.readAsDataURL(file)
      }
    }
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        ...style,
        position: 'relative',
        outline: isDraggingFile
          ? '3px dashed #10b981'
          : isHovered
          ? '2px dashed rgba(37, 99, 235, 0.75)'
          : '2px dashed transparent',
        outlineOffset: '-2px',
        transition: 'outline 0.15s ease'
      }}
      className={className}
    >
      {children}

      {/* Drop overlay active state */}
      {isDraggingFile && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(16, 185, 129, 0.75)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            zIndex: 40,
            borderRadius: 'inherit'
          }}
        >
          <span className="material-icons" style={{ fontSize: '36px' }}>file_download</span>
          <strong style={{ fontSize: '1rem', marginTop: '4px' }}>Drop image file to replace!</strong>
        </div>
      )}

      {/* Hover Action Button */}
      {isHovered && !isDraggingFile && (
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            zIndex: 35
          }}
          onClick={e => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            style={{
              padding: '7px 14px',
              backgroundColor: 'rgba(15, 23, 42, 0.88)',
              color: '#ffffff',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '24px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
              transition: 'transform 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            <span className="material-icons" style={{ fontSize: '15px', color: '#60a5fa' }}>add_photo_alternate</span>
            <span>{label}</span>
          </button>
        </div>
      )}

      {/* Media Storage Modal */}
      <MediaStorageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentImage={currentUrl}
        onSelectImage={onChangeImage}
      />
    </div>
  )
}

// ============================================================
// 4. LIVE SECTION FLOATING ACTION BAR (Up/Down/Add/Delete)
// ============================================================
interface LiveSectionToolbarProps {
  sectionTitle: string
  sectionType: string
  canMoveUp?: boolean
  canMoveDown?: boolean
  onMoveUp?: () => void
  onMoveDown?: () => void
  onDelete?: () => void
  onAddAbove?: () => void
  onAddBelow?: () => void
}

export function LiveSectionToolbar({
  sectionTitle,
  sectionType,
  canMoveUp = true,
  canMoveDown = true,
  onMoveUp,
  onMoveDown,
  onDelete,
  onAddBelow
}: LiveSectionToolbarProps) {
  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        background: 'rgba(15, 23, 42, 0.92)',
        color: '#ffffff',
        backdropFilter: 'blur(10px)',
        padding: '4px 8px',
        borderRadius: '30px',
        border: '1px solid rgba(255,255,255,0.18)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        fontSize: '0.74rem',
        fontWeight: 700
      }}
    >
      <span style={{ color: '#93c5fd', padding: '0 6px', textTransform: 'capitalize' }}>
        {sectionTitle || sectionType.replace('_', ' ')}
      </span>

      <div style={{ height: '14px', width: '1px', background: 'rgba(255,255,255,0.2)', margin: '0 2px' }} />

      {/* Move Up */}
      {onMoveUp && (
        <button
          type="button"
          disabled={!canMoveUp}
          onClick={onMoveUp}
          title="Move section up"
          style={{
            background: 'none',
            border: 'none',
            color: canMoveUp ? '#ffffff' : 'rgba(255,255,255,0.3)',
            cursor: canMoveUp ? 'pointer' : 'not-allowed',
            padding: '3px',
            display: 'grid',
            placeItems: 'center',
            borderRadius: '50%'
          }}
        >
          <span className="material-icons" style={{ fontSize: '17px' }}>arrow_upward</span>
        </button>
      )}

      {/* Move Down */}
      {onMoveDown && (
        <button
          type="button"
          disabled={!canMoveDown}
          onClick={onMoveDown}
          title="Move section down"
          style={{
            background: 'none',
            border: 'none',
            color: canMoveDown ? '#ffffff' : 'rgba(255,255,255,0.3)',
            cursor: canMoveDown ? 'pointer' : 'not-allowed',
            padding: '3px',
            display: 'grid',
            placeItems: 'center',
            borderRadius: '50%'
          }}
        >
          <span className="material-icons" style={{ fontSize: '17px' }}>arrow_downward</span>
        </button>
      )}

      {/* Add Section Below */}
      {onAddBelow && (
        <button
          type="button"
          onClick={onAddBelow}
          title="Add new section below"
          style={{
            background: 'none',
            border: 'none',
            color: '#38bdf8',
            cursor: 'pointer',
            padding: '3px',
            display: 'grid',
            placeItems: 'center',
            borderRadius: '50%'
          }}
        >
          <span className="material-icons" style={{ fontSize: '17px' }}>add</span>
        </button>
      )}

      {/* Delete Section */}
      {onDelete && (
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Are you sure you want to remove the "${sectionTitle}" section?`)) {
              onDelete()
            }
          }}
          title="Remove section from store"
          style={{
            background: 'none',
            border: 'none',
            color: '#f87171',
            cursor: 'pointer',
            padding: '3px',
            display: 'grid',
            placeItems: 'center',
            borderRadius: '50%'
          }}
        >
          <span className="material-icons" style={{ fontSize: '17px' }}>delete_outline</span>
        </button>
      )}
    </div>
  )
}

// ============================================================
// 5. LIVE ADD SECTION PICKER MODAL
// ============================================================
interface LiveAddSectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectSectionType?: (type: StoreSectionType) => void
  onSelectSection?: (type: StoreSectionType) => void
}

export function LiveAddSectionModal({ isOpen, onClose, onSelectSectionType, onSelectSection }: LiveAddSectionModalProps) {
  if (!isOpen) return null

  const handleSelect = (type: StoreSectionType) => {
    if (onSelectSectionType) onSelectSectionType(type)
    if (onSelectSection) onSelectSection(type)
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(5px)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 99999,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--panel)',
          borderRadius: '20px',
          padding: '24px',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.3)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Add Storefront Section</h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Choose a section to insert into your storefront layout:
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ghost-btn"
            style={{ padding: '6px', borderRadius: '8px' }}
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {AVAILABLE_SECTIONS.map(sec => (
            <div
              key={sec.type}
              onClick={() => handleSelect(sec.type)}
              style={{
                padding: '16px',
                borderRadius: '14px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                transition: 'all 0.15s ease'
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
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(37, 99, 235, 0.1)', display: 'grid', placeItems: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                <span className="material-icons" style={{ fontSize: '20px' }}>{sec.icon}</span>
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.92rem', marginBottom: '2px' }}>{sec.name}</strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.35, display: 'block' }}>
                  {sec.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 6. LIVE ADD SECTION DIVIDER (Between sections)
// ============================================================
interface LiveAddSectionDividerProps {
  onAddClick?: () => void
  onAddSection?: (type: StoreSectionType) => void
}

export function LiveAddSectionDivider({ onAddClick, onAddSection }: LiveAddSectionDividerProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleClick = () => {
    if (onAddClick) {
      onAddClick()
    } else if (onAddSection) {
      setIsModalOpen(true)
    }
  }

  return (
    <>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'relative',
          height: isHovered ? '32px' : '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'height 0.2s ease',
          margin: '4px 0'
        }}
        onClick={handleClick}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '2px',
            backgroundColor: isHovered ? 'var(--primary)' : 'transparent',
            transition: 'background-color 0.2s ease'
          }}
        />
        {isHovered && (
          <div
            style={{
              position: 'relative',
              zIndex: 10,
              background: 'var(--primary)',
              color: '#ffffff',
              padding: '4px 14px',
              borderRadius: '20px',
              fontSize: '0.74rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
            }}
          >
            <span className="material-icons" style={{ fontSize: '14px' }}>add</span>
            <span>Add Section Here</span>
          </div>
        )}
      </div>

      {isModalOpen && onAddSection && (
        <LiveAddSectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelectSectionType={(type) => {
            onAddSection(type)
            setIsModalOpen(false)
          }}
        />
      )}
    </>
  )
}

