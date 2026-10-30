import { useState, type ChangeEvent, type FormEvent } from 'react'
import type { BusinessProfile, Listing } from '../types'
import { getStoreTemplateSlots, STORE_ACCENT_PALETTE, type StoreTemplateContent, type StoreTemplateId } from '../features/store-templates/storeTemplateSchema'
import { getStoreTemplateImageUrl, uploadStoreTemplateImage } from '../features/store-templates/storeTemplateAssets'
import { BoutiqueGridTemplate } from './BoutiqueGridTemplate'
import { StorefrontLandingTemplate } from './StorefrontLandingTemplate'
import './StoreTemplates.css'

type Props = {
  businessProfile: BusinessProfile
  myListings: Listing[]
  onSave: (content: StoreTemplateContent, departments: Array<{ name: string; image?: string }>, templateId: StoreTemplateId) => Promise<void>
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
  announcementText: 'Announcement', heroImage: 'Hero image', heroHeadline: 'Hero headline',
  heroSubheadline: 'Hero subheadline', heroButtonLabel: 'Hero button', promoImage: 'Promotion image',
  promoHeading: 'Promotion heading', promoText: 'Promotion text', promoButtonLabel: 'Promotion button',
  storyHeading: 'Story heading', storyText: 'Story text', storyImage: 'Story image',
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
  const [templateId, setTemplateId] = useState<StoreTemplateId>(
    businessProfile.templateId === 'storefront-landing' ? 'storefront-landing' : 'boutique-grid',
  )
  const savedContent = businessProfile.templateContent?.[templateId]
  const [content, setContent] = useState<StoreTemplateContent>(
    savedContent && typeof savedContent === 'object' && !Array.isArray(savedContent)
      ? savedContent as StoreTemplateContent
      : {},
  )
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [departments, setDepartments] = useState<string[]>(() => (businessProfile.collections || []).map(collection => collection.name))
  const [departmentImages, setDepartmentImages] = useState<Record<string, string>>(() => Object.fromEntries(
    (businessProfile.collections || []).filter(collection => collection.bannerImage).map(collection => [collection.name, collection.bannerImage as string]),
  ))
  const [departmentName, setDepartmentName] = useState('')
  const slots = getStoreTemplateSlots(templateId)
  const slotMap = new Map(slots.map(slot => [slot.id, slot]))
  const fieldGroups: Array<{ title: string; slots: string[] }> = templateId === 'storefront-landing'
    ? [
        { title: 'Announcement', slots: ['announcementText'] },
        { title: 'Hero', slots: ['heroImage', 'heroHeadline', 'heroSubheadline', 'heroButtonLabel', 'accentColor'] },
        { title: 'Promotion', slots: ['promoImage', 'promoHeading', 'promoText', 'promoButtonLabel'] },
        { title: 'Store story', slots: ['storyImage', 'storyHeading', 'storyText'] },
        { title: 'Footer and contact', slots: ['footerTagline', 'instagramUrl', 'facebookUrl', 'tiktokUrl', 'whatsappNumber'] },
      ]
    : FIELD_GROUPS

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

  const selectTemplate = (nextTemplateId: StoreTemplateId) => {
    setTemplateId(nextTemplateId)
    const nextSavedContent = businessProfile.templateContent?.[nextTemplateId]
    setContent(nextSavedContent && typeof nextSavedContent === 'object' && !Array.isArray(nextSavedContent)
      ? nextSavedContent as StoreTemplateContent
      : {})
    setMessage('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setIsSaving(true)
    try {
      await onSave(
        content,
        departments.map(name => ({ name, image: departmentImages[name] || undefined })),
        templateId,
      )
      setMessage(`${templateId === 'storefront-landing' ? 'Storefront Landing' : 'Boutique Grid'} saved and published.`)
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
          <h1>{templateId === 'storefront-landing' ? 'Storefront Landing' : 'Boutique Grid'}</h1>
          <p>Fill in the storefront details and preview the finished shop as you go.</p>
        </div>
        {onClose && <button type="button" className="ghost-btn" onClick={onClose}>Back to dashboard</button>}
      </header>
      <fieldset className="template-picker">
        <legend>Choose a storefront template</legend>
        <div>
          <label className={templateId === 'boutique-grid' ? 'selected' : ''}>
            <input
              type="radio"
              name="store-template"
              value="boutique-grid"
              checked={templateId === 'boutique-grid'}
              onChange={() => selectTemplate('boutique-grid')}
            />
            <strong>Boutique Grid</strong>
            <span>Editorial storefront with department sections.</span>
          </label>
          <label className={templateId === 'storefront-landing' ? 'selected' : ''}>
            <input
              type="radio"
              name="store-template"
              value="storefront-landing"
              checked={templateId === 'storefront-landing'}
              onChange={() => selectTemplate('storefront-landing')}
            />
            <strong>Storefront Landing</strong>
            <span>Fashion-inspired landing page with a promotional story.</span>
          </label>
        </div>
      </fieldset>
      <div className="template-editor-layout">
        <form className="template-editor-form" onSubmit={event => void handleSubmit(event)}>
          {fieldGroups.map(group => (
            <section key={group.title} className="template-editor-group">
              <h2>{group.title}</h2>
              {group.slots.map(renderField)}
            </section>
          ))}
          <section className="template-editor-group">
            <h2>Departments</h2>
            <p>Choose departments for store filters. Listings can belong to more than one.</p>
            <div className="template-department-add">
              <input
                value={departmentName}
                maxLength={30}
                onChange={event => setDepartmentName(event.target.value)}
                placeholder="Department name"
              />
              <button
                type="button"
                className="secondary-btn"
                disabled={departments.length >= 30}
                onClick={() => {
                  const name = departmentName.trim()
                  if (!name || departments.some(item => item.toLocaleLowerCase() === name.toLocaleLowerCase())) {
                    setMessage('Departments must have unique names of 1 to 30 characters.')
                    return
                  }
                  setDepartments(previous => [...previous, name])
                  setDepartmentName('')
                  setMessage('')
                }}
              >Add</button>
            </div>
            <div className="template-department-list">
              {departments.map(name => (
                <div className="template-department-item" key={name}>
                  <strong>{name}</strong>
                  {templateId === 'storefront-landing' && (
                    <label>
                      <span>Department image</span>
                      <img src={imageUrl(departmentImages[name], '/favicon.svg')} alt="" />
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={async event => {
                          const file = event.target.files?.[0]
                          event.target.value = ''
                          if (!file) return
                          try {
                            setUploadingSlot(`department:${name}`)
                            const image = await uploadStoreTemplateImage(file)
                            setDepartmentImages(previous => ({ ...previous, [name]: image }))
                          } catch (error) {
                            setMessage(error instanceof Error ? error.message : 'Department image upload failed.')
                          } finally {
                            setUploadingSlot(null)
                          }
                        }}
                      />
                    </label>
                  )}
                  <button type="button" aria-label={`Remove ${name}`} onClick={() => setDepartments(previous => previous.filter(item => item !== name))}>×</button>
                </div>
              ))}
            </div>
          </section>
          {message && <p className="template-editor-message" role="status">{message}</p>}
          <button className="primary-btn" type="submit" disabled={isSaving || Boolean(uploadingSlot)}>
            {isSaving ? 'Saving…' : 'Save and publish'}
          </button>
        </form>
        <section className="template-editor-preview" aria-label="Live storefront preview">
          {templateId === 'storefront-landing' ? (
            <StorefrontLandingTemplate shop={businessProfile} listings={myListings} content={content} preview />
          ) : (
            <BoutiqueGridTemplate shop={businessProfile} listings={myListings} content={content} preview />
          )}
        </section>
      </div>
    </main>
  )
}
