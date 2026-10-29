import { useState, type ChangeEvent, type FormEvent } from 'react'
import type { BusinessProfile, Listing } from '../types'
import { getStoreTemplateSlots, STORE_ACCENT_PALETTE, type StoreTemplateContent } from '../features/store-templates/storeTemplateSchema'
import { getStoreTemplateImageUrl, uploadStoreTemplateImage } from '../features/store-templates/storeTemplateAssets'
import { BoutiqueGridTemplate } from './BoutiqueGridTemplate'
import './StoreTemplates.css'

type Props = {
  businessProfile: BusinessProfile
  myListings: Listing[]
  onSave: (content: StoreTemplateContent) => Promise<void>
  onClose?: () => void
}

const FIELD_LABELS: Record<string, string> = {
  logoImage: 'Store logo',
  bannerImage: 'Banner image',
  bannerTitle: 'Banner title',
  bannerSubtitle: 'Banner subtitle',
  shopHeading: 'Shop heading',
  aboutText: 'About the store',
  footerTagline: 'Footer tagline',
  instagramUrl: 'Instagram URL',
  facebookUrl: 'Facebook URL',
  tiktokUrl: 'TikTok URL',
  whatsappNumber: 'WhatsApp number',
  accentColor: 'Accent colour',
}

const FIELD_GROUPS: Array<{ title: string; slots: string[] }> = [
  { title: 'Store banner', slots: ['logoImage', 'bannerImage', 'bannerTitle', 'bannerSubtitle'] },
  { title: 'Shop', slots: ['shopHeading', 'accentColor'] },
  { title: 'About', slots: ['aboutText'] },
  { title: 'Footer and contact', slots: ['footerTagline', 'instagramUrl', 'facebookUrl', 'tiktokUrl', 'whatsappNumber'] },
]

function imageUrl(path: string | undefined, fallback: string) {
  if (!path) return fallback
  if (/^(https?:\/\/|data:image\/)/i.test(path)) return path
  return getStoreTemplateImageUrl(path)
}

export function StoreTemplateEditor({ businessProfile, myListings, onSave, onClose }: Props) {
  const savedContent = businessProfile.templateContent?.['boutique-grid']
  const [content, setContent] = useState<StoreTemplateContent>(
    savedContent && typeof savedContent === 'object' && !Array.isArray(savedContent)
      ? savedContent as StoreTemplateContent
      : {},
  )
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const slots = getStoreTemplateSlots('boutique-grid')
  const slotMap = new Map(slots.map(slot => [slot.id, slot]))

  const updateValue = (slot: string, value: string) => {
    setContent(previous => ({ ...previous, [slot]: value }))
  }

  const handleImageChange = async (slot: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setMessage('')
    setUploadingSlot(slot)
    try {
      updateValue(slot, await uploadStoreTemplateImage(file))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Image upload failed.')
    } finally {
      setUploadingSlot(null)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setIsSaving(true)
    try {
      await onSave(content)
      setMessage('Boutique Grid saved and published.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Store template could not be saved.')
    } finally {
      setIsSaving(false)
    }
  }

  const renderField = (slotId: string) => {
    const slot = slotMap.get(slotId)
    if (!slot) return null
    const value = content[slotId] || ''

    if (slot.type === 'image') {
      const fallback = slotId === 'bannerImage'
        ? '/illustrations/banner_summer_collection.jpg'
        : '/favicon.svg'
      return (
        <label className="template-image-field" key={slotId}>
          <span>{FIELD_LABELS[slotId]}</span>
          <img src={imageUrl(value, fallback)} alt="" />
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => void handleImageChange(slotId, event)} />
          <small>{uploadingSlot === slotId ? 'Uploading and optimizing…' : 'JPEG, PNG or WebP · up to 5 MB'}</small>
        </label>
      )
    }

    if (slot.type === 'color') {
      return (
        <fieldset className="template-color-field" key={slotId}>
          <legend>{FIELD_LABELS[slotId]}</legend>
          <div>
            {STORE_ACCENT_PALETTE.map(color => (
              <button
                type="button"
                key={color}
                className={value === color ? 'selected' : ''}
                style={{ backgroundColor: color }}
                aria-label={`Use ${color}`}
                aria-pressed={value === color}
                onClick={() => updateValue(slotId, color)}
              />
            ))}
          </div>
        </fieldset>
      )
    }

    const label = FIELD_LABELS[slotId]
    const inputProps = {
      value,
      maxLength: slot.maxLength,
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateValue(slotId, event.target.value),
    }
    return (
      <label className="template-text-field" key={slotId}>
        <span>{label}{slot.maxLength ? ` · ${slot.maxLength} characters max` : ''}</span>
        {slotId === 'aboutText' ? (
          <textarea {...inputProps} rows={5} />
        ) : (
          <input
            {...inputProps}
            type={slot.type === 'link' ? 'url' : 'text'}
            placeholder={slot.type === 'link' ? 'https://…' : slot.type === 'phone' ? '+260…' : ''}
          />
        )}
      </label>
    )
  }

  return (
    <main className="store-template-editor">
      <header className="template-editor-header">
        <div>
          <p className="eyebrow">Storefront template</p>
          <h1>Boutique Grid</h1>
          <p>Fill in the storefront details and preview the finished shop as you go.</p>
        </div>
        {onClose && <button type="button" className="ghost-btn" onClick={onClose}>Back to dashboard</button>}
      </header>
      <div className="template-editor-layout">
        <form className="template-editor-form" onSubmit={event => void handleSubmit(event)}>
          {FIELD_GROUPS.map(group => (
            <section key={group.title} className="template-editor-group">
              <h2>{group.title}</h2>
              {group.slots.map(renderField)}
            </section>
          ))}
          {message && <p className="template-editor-message" role="status">{message}</p>}
          <button className="primary-btn" type="submit" disabled={isSaving || Boolean(uploadingSlot)}>
            {isSaving ? 'Saving…' : 'Save and publish'}
          </button>
        </form>
        <section className="template-editor-preview" aria-label="Live storefront preview">
          <BoutiqueGridTemplate
            shop={businessProfile}
            listings={myListings}
            content={content}
            preview
          />
        </section>
      </div>
    </main>
  )
}
