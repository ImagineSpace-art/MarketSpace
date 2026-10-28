import { useState, useEffect } from 'react'
import type { StoreSection, BusinessProfile, Listing } from '../../types'
import { Listing as ListingView } from '../Listing'
import { LiveEditableText, LiveEditableImage, LiveSectionToolbar } from './LiveCustomizerControls'
import { DEFAULT_HYPER_SLIDES, type CarouselSlide } from './defaultSections'

interface SectionRendererProps {
  section: StoreSection
  shop: BusinessProfile
  listings: Listing[]
  savedIds?: string[]
  onOpenListing?: (listing: Listing) => void
  onQuickPeek?: (listing: Listing) => void
  onToggleSave?: (listingId: number) => void
  onAddToCart?: (listing: Listing) => void
  onSelectDepartment?: (deptId: string) => void
  isLiveEditing?: boolean
  onUpdateSettings?: (newSettings: Record<string, any>) => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onDeleteSection?: () => void
  onAddSectionBelow?: () => void
  canMoveUp?: boolean
  canMoveDown?: boolean
}

export function StoreSectionRenderer({
  section,
  shop,
  listings,
  savedIds = [],
  onOpenListing = () => {},
  onQuickPeek,
  onToggleSave = () => {},
  onAddToCart = () => {},
  onSelectDepartment = () => {},
  isLiveEditing = false,
  onUpdateSettings,
  onMoveUp,
  onMoveDown,
  onDeleteSection,
  onAddSectionBelow,
  canMoveUp = true,
  canMoveDown = true,
}: SectionRendererProps) {
  if (!section.enabled && !isLiveEditing) return null

  const brandColor = shop.themeConfig?.primaryColor || shop.accentColor || '#2563eb'

  const renderInner = () => {
    switch (section.type) {
      case 'announcement':
        return <AnnouncementSection settings={section.settings} brandColor={brandColor} isLiveEditing={isLiveEditing} onUpdateSettings={onUpdateSettings} />

      case 'hero_banner':
        return <HeroBannerSection settings={section.settings} brandColor={brandColor} isLiveEditing={isLiveEditing} onUpdateSettings={onUpdateSettings} />

      case 'categories_grid':
        return (
          <CategoriesGridSection
            settings={section.settings}
            shop={shop}
            listings={listings}
            brandColor={brandColor}
            onSelectDepartment={onSelectDepartment}
            isLiveEditing={isLiveEditing}
            onUpdateSettings={onUpdateSettings}
          />
        )

      case 'featured_products':
        return (
          <FeaturedProductsSection
            settings={section.settings}
            shop={shop}
            listings={listings}
            savedIds={savedIds}
            onOpenListing={onOpenListing}
            onQuickPeek={onQuickPeek}
            onToggleSave={onToggleSave}
            onAddToCart={onAddToCart}
            isLiveEditing={isLiveEditing}
            onUpdateSettings={onUpdateSettings}
          />
        )

      case 'countdown_deal':
        return <CountdownDealSection settings={section.settings} brandColor={brandColor} isLiveEditing={isLiveEditing} onUpdateSettings={onUpdateSettings} />

      case 'editorial_grid':
        return <EditorialGridSection settings={section.settings} brandColor={brandColor} isLiveEditing={isLiveEditing} onUpdateSettings={onUpdateSettings} />

      case 'featured_collection_split':
        return <FeaturedCollectionSplitSection settings={section.settings} brandColor={brandColor} isLiveEditing={isLiveEditing} onUpdateSettings={onUpdateSettings} />

      case 'bento_grid':
        return <BentoGridSection settings={section.settings} brandColor={brandColor} isLiveEditing={isLiveEditing} onUpdateSettings={onUpdateSettings} />

      case 'promo_banner':
        return <PromoBannerSection settings={section.settings} brandColor={brandColor} isLiveEditing={isLiveEditing} onUpdateSettings={onUpdateSettings} />

      case 'rich_text':
        return <RichTextSection settings={section.settings} brandColor={brandColor} isLiveEditing={isLiveEditing} onUpdateSettings={onUpdateSettings} />

      case 'testimonials':
        return <TestimonialsSection settings={section.settings} brandColor={brandColor} isLiveEditing={isLiveEditing} onUpdateSettings={onUpdateSettings} />

      case 'faq':
        return <FaqSection settings={section.settings} brandColor={brandColor} isLiveEditing={isLiveEditing} onUpdateSettings={onUpdateSettings} />

      default:
        return null
    }
  }

  return (
    <div
      id={section.id}
      data-section-id={section.id}
      style={{
        position: 'relative',
        margin: isLiveEditing ? '10px 0' : undefined,
        outline: isLiveEditing ? '1.5px dashed rgba(37, 99, 235, 0.35)' : 'none',
        outlineOffset: '4px',
        borderRadius: '16px',
        transition: 'outline 0.2s ease',
      }}
    >
      {isLiveEditing && (
        <div style={{ position: 'absolute', top: '-14px', right: '16px', zIndex: 60 }}>
          <LiveSectionToolbar
            sectionTitle={(section as any).name || section.type}
            sectionType={section.type}
            canMoveUp={canMoveUp}
            canMoveDown={canMoveDown}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onDelete={onDeleteSection}
            onAddBelow={onAddSectionBelow}
          />
        </div>
      )}
      {renderInner()}
    </div>
  )
}

// -------------------------------------------------------------
// INDIVIDUAL SECTION IMPLEMENTATIONS
// -------------------------------------------------------------

function AnnouncementSection({
  settings,
  brandColor,
  isLiveEditing,
  onUpdateSettings
}: {
  settings: Record<string, any>
  brandColor: string
  isLiveEditing?: boolean
  onUpdateSettings?: (s: Record<string, any>) => void
}) {
  const bg = settings.bgColor || brandColor
  const textColor = settings.textColor || '#ffffff'

  return (
    <div
      style={{
        padding: '12px 20px',
        backgroundColor: bg,
        color: textColor,
        fontWeight: 600,
        fontSize: '0.9rem',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderRadius: '8px',
        margin: '8px 0'
      }}
    >
      <span className="material-icons" style={{ fontSize: '18px' }}>campaign</span>
      <LiveEditableText
        value={settings.text || 'Welcome to our store!'}
        onChange={val => onUpdateSettings?.({ text: val })}
        isLiveEditing={isLiveEditing}
        style={{ color: textColor, fontWeight: 600 }}
      />
    </div>
  )
}

function HyperHeroCouponBanner({
  settings,
  brandColor: _brandColor,
  isLiveEditing,
  onUpdateSettings
}: {
  settings: Record<string, any>
  brandColor: string
  isLiveEditing?: boolean
  onUpdateSettings?: (s: Record<string, any>) => void
}) {
  const [copied, setCopied] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)

  const slides: CarouselSlide[] = (settings.slides && Array.isArray(settings.slides) && settings.slides.length > 0)
    ? settings.slides
    : DEFAULT_HYPER_SLIDES

  const totalSlides = slides.length

  const handlePrevSlide = () => {
    if (totalSlides <= 1) return
    setActiveSlide(prev => (prev === 0 ? totalSlides - 1 : prev - 1))
  }

  const handleNextSlide = () => {
    if (totalSlides <= 1) return
    setActiveSlide(prev => (prev + 1) % totalSlides)
  }

  // Depending on how many slides the owner adds, the carousel will or won't scroll:
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % totalSlides)
    }, 5500)
    return () => clearInterval(timer)
  }, [isPaused, totalSlides])

  const safeSlideIdx = activeSlide % Math.max(1, totalSlides)
  const currentSlide: CarouselSlide = slides[safeSlideIdx] || DEFAULT_HYPER_SLIDES[0]
  const couponCode = currentSlide.couponCode || settings.couponCode || 'APP15WEB'

  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(couponCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  const handleCardImageUpload = (cardIdx: number, newImageUrl: string) => {
    if (!onUpdateSettings) return
    const nextSlides = slides.map((s, sIdx) => {
      if (sIdx !== safeSlideIdx) return s
      const updatedCards = [...(s.cards || [])]
      updatedCards[cardIdx] = { ...updatedCards[cardIdx], image: newImageUrl }
      return { ...s, cards: updatedCards }
    })
    onUpdateSettings({ slides: nextSlides })
  }

  const defaultCardColors = [
    { bg: 'linear-gradient(180deg, #3665f3 0%, #254edb 100%)', shadow: '0 4px 14px rgba(54, 101, 243, 0.25)' },
    { bg: 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)', shadow: '0 4px 14px rgba(245, 158, 11, 0.25)' },
    { bg: 'linear-gradient(180deg, #e11d48 0%, #be123c 100%)', shadow: '0 4px 14px rgba(225, 29, 72, 0.25)' },
  ]

  return (
    <div
      style={{
        borderRadius: '20px',
        border: '1px solid #e5e5e5',
        background: '#ffffff',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        position: 'relative',
        display: 'flex',
        flexWrap: 'wrap',
        minHeight: '380px',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Left Accent Bar */}
      <div
        style={{
          width: '28px',
          background: currentSlide.accentBar || 'linear-gradient(180deg, #f59e0b 0%, #ea580c 100%)',
          flexShrink: 0,
          transition: 'background 0.4s ease',
        }}
      />

      {/* Main Slide Body */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'stretch',
          padding: '28px 32px',
          gap: '24px',
          minWidth: 0,
        }}
      >
        {/* Left Column: Headline, Subtitle, CTA Button & Disclaimer */}
        <div
          style={{
            flex: '1 1 360px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            paddingRight: '12px',
          }}
        >
          <div>
            <LiveEditableText
              value={currentSlide.headline}
              onChange={val => {
                if (!onUpdateSettings) return
                const nextSlides = [...slides]
                nextSlides[safeSlideIdx] = { ...nextSlides[safeSlideIdx], headline: val }
                onUpdateSettings({ slides: nextSlides, headline: val })
              }}
              isLiveEditing={isLiveEditing}
              tag="h2"
              style={{
                fontSize: '2.4rem',
                fontWeight: 850,
                color: '#191919',
                margin: '0 0 12px 0',
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
              }}
            />

            <div style={{ margin: '0 0 24px 0' }}>
              <LiveEditableText
                value={currentSlide.tagline}
                onChange={val => {
                  if (!onUpdateSettings) return
                  const nextSlides = [...slides]
                  nextSlides[safeSlideIdx] = { ...nextSlides[safeSlideIdx], tagline: val }
                  onUpdateSettings({ slides: nextSlides, tagline: val })
                }}
                isLiveEditing={isLiveEditing}
                style={{
                  fontSize: '1.05rem',
                  color: '#555555',
                  lineHeight: 1.45,
                  display: 'block',
                }}
              />
            </div>

            <a
              href={currentSlide.buttonLink || '#products'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '13px 30px',
                backgroundColor: '#191919',
                color: '#ffffff',
                borderRadius: '30px',
                fontWeight: 700,
                fontSize: '0.94rem',
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'transform 0.15s, background-color 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.backgroundColor = '#000000'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.backgroundColor = '#191919'
              }}
            >
              <LiveEditableText
                value={currentSlide.buttonText || 'Shop Collection'}
                onChange={val => {
                  if (!onUpdateSettings) return
                  const nextSlides = [...slides]
                  nextSlides[safeSlideIdx] = { ...nextSlides[safeSlideIdx], buttonText: val }
                  onUpdateSettings({ slides: nextSlides, buttonText: val })
                }}
                isLiveEditing={isLiveEditing}
              />
            </a>
          </div>

          {/* Bottom Disclaimer & Clickable Dots */}
          <div style={{ marginTop: '28px' }}>
            {currentSlide.disclaimer && (
              <div
                style={{
                  fontSize: '0.74rem',
                  color: '#888888',
                  marginBottom: '14px',
                  lineHeight: 1.4,
                }}
              >
                {currentSlide.disclaimer}
              </div>
            )}

            {/* Interactive Carousel Pagination Dots - Only visible if totalSlides > 1 */}
            {totalSlides > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {Array.from({ length: totalSlides }).map((_, idx) => {
                  const isActive = idx === safeSlideIdx
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveSlide(idx)}
                      title={`Slide ${idx + 1}`}
                      style={{
                        width: isActive ? '24px' : '8px',
                        height: '8px',
                        borderRadius: '4px',
                        background: isActive ? '#191919' : 'transparent',
                        border: '1.5px solid #191919',
                        padding: 0,
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                      }}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: 3 Step Cards & Carousel Controls */}
        <div
          style={{
            flex: '1 1 540px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          {/* 3 Step Cards Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(Math.max((currentSlide.cards || []).length, 1), 3)}, 1fr)`,
              gap: '14px',
            }}
          >
            {(currentSlide.cards || []).slice(0, 3).map((card, idx) => {
              const cardColor = defaultCardColors[idx % 3]
              return (
                <div
                  key={idx}
                  style={{
                    background: cardColor.bg,
                    color: '#ffffff',
                    borderRadius: '16px',
                    padding: '16px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    minHeight: '270px',
                    boxShadow: cardColor.shadow,
                    overflow: 'hidden',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                >
                  {/* Number Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      color: '#191919',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      display: 'grid',
                      placeItems: 'center',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                      zIndex: 2,
                    }}
                  >
                    {idx + 1}
                  </div>

                  <div style={{ marginTop: '28px', textAlign: 'center', zIndex: 2 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, marginBottom: '8px' }}>
                      {card.title}
                    </div>
                    {/* Dynamic Action Body or Badge */}
                    {card.actionType === 'coupon' || card.couponCode ? (
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        title="Click to copy coupon code"
                        style={{
                          background: '#ffffff',
                          color: '#191919',
                          border: '1.5px dashed #cbd5e1',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          fontSize: '0.92rem',
                          fontWeight: 800,
                          fontFamily: 'monospace',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          width: '100%',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                          transition: 'transform 0.15s, background-color 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f8fafc' }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#ffffff' }}
                      >
                        <span>{copied ? 'COPIED!' : (card.couponCode || couponCode)}</span>
                        <span className="material-icons" style={{ fontSize: '15px', color: copied ? '#16a34a' : '#3665f3' }}>
                          {copied ? 'check' : 'content_copy'}
                        </span>
                      </button>
                    ) : card.actionType === 'qr' ? (
                      <div
                        style={{
                          background: '#ffffff',
                          color: '#191919',
                          borderRadius: '8px',
                          padding: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                        }}
                      >
                        <span className="material-icons" style={{ fontSize: '32px', color: '#191919' }}>
                          qr_code_2
                        </span>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, textAlign: 'left', lineHeight: 1.2 }}>
                          {card.badgeText || 'Scan with camera'}
                        </span>
                      </div>
                    ) : card.actionType === 'badge' ? (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '8px 12px',
                          background: '#ffffff',
                          color: '#e11d48',
                          borderRadius: '12px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                          margin: '4px 0',
                        }}
                      >
                        <span style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
                          {card.badgeText || 'Verified Drop'}
                        </span>
                      </div>
                    ) : (
                      <div style={{ background: '#ffffff', color: '#0369a1', borderRadius: '8px', padding: '7px 10px', fontWeight: 800, fontSize: '0.84rem' }}>
                        {card.badgeText || 'Verified Item'}
                      </div>
                    )}
                  </div>

                  {/* Graphic Cutout / Picture */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'flex-end',
                      height: '110px',
                      position: 'relative',
                      marginTop: '12px',
                    }}
                  >
                    {card.image ? (
                      <img
                        src={card.image}
                        alt={card.imageAlt || card.title}
                        style={{
                          maxHeight: '105px',
                          maxWidth: '90%',
                          objectFit: 'contain',
                          borderRadius: '10px',
                          filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.25))',
                        }}
                      />
                    ) : (
                      <div style={{ width: '80px', height: '80px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', display: 'grid', placeItems: 'center' }}>
                        <span className="material-icons" style={{ fontSize: '32px', color: '#fff' }}>photo</span>
                      </div>
                    )}

                    {/* Store Owner Quick Change Photo button in live editing mode */}
                    {isLiveEditing && (
                      <label
                        style={{
                          position: 'absolute',
                          bottom: '-4px',
                          right: '-4px',
                          background: '#ffffff',
                          color: '#191919',
                          borderRadius: '9999px',
                          padding: '4px 8px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                          zIndex: 10,
                        }}
                        title="Upload a new picture for this card"
                      >
                        <span className="material-icons" style={{ fontSize: '13px', color: '#3665f3' }}>photo_camera</span>
                        <span>Change</span>
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
                                handleCardImageUpload(idx, evt.target.result as string)
                              }
                            }
                            reader.readAsDataURL(file)
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Bottom Right: Interactive Carousel Controls - Only visible if totalSlides > 1 */}
          {totalSlides > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '8px',
                paddingRight: '4px',
              }}
            >
              <button
                type="button"
                onClick={handlePrevSlide}
                aria-label="Previous banner slide"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '1px solid #e5e5e5',
                  background: '#ffffff',
                  color: '#191919',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  transition: 'background-color 0.15s, transform 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f4f4f5' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#ffffff' }}
              >
                <span className="material-icons" style={{ fontSize: '18px' }}>chevron_left</span>
              </button>
              <button
                type="button"
                onClick={handleNextSlide}
                aria-label="Next banner slide"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '1px solid #e5e5e5',
                  background: '#ffffff',
                  color: '#191919',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  transition: 'background-color 0.15s, transform 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f4f4f5' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#ffffff' }}
              >
                <span className="material-icons" style={{ fontSize: '18px' }}>chevron_right</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                aria-label={isPaused ? 'Resume banner carousel' : 'Pause banner carousel'}
                title={isPaused ? 'Resume autoplay' : 'Pause autoplay'}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '1px solid #e5e5e5',
                  background: '#ffffff',
                  color: '#191919',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  transition: 'background-color 0.15s, transform 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f4f4f5' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#ffffff' }}
              >
                <span className="material-icons" style={{ fontSize: '15px' }}>{isPaused ? 'play_arrow' : 'pause'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function HeroBannerSection({
  settings,
  brandColor,
  isLiveEditing,
  onUpdateSettings
}: {
  settings: Record<string, any>
  brandColor: string
  isLiveEditing?: boolean
  onUpdateSettings?: (s: Record<string, any>) => void
}) {
  if (settings.style === 'hyper_coupon' || settings.style === 'ebay_coupon') {
    return (
      <HyperHeroCouponBanner
        settings={settings}
        brandColor={brandColor}
        isLiveEditing={isLiveEditing}
        onUpdateSettings={onUpdateSettings}
      />
    )
  }

  const bgImage = settings.bgImage !== undefined ? settings.bgImage : 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1600&auto=format&fit=crop&q=80'
  const darkness = (settings.overlayDarkness ?? 40) / 100
  const align = settings.align || 'center'
  const height = settings.height === 'large' ? '460px' : settings.height === 'small' ? '280px' : '360px'
  const isPill = settings.buttonStyle === 'pill' || settings.isPill !== false

  return (
    <div
      className="store-zoom-card"
      style={{
        position: 'relative',
        borderRadius: '20px',
        overflow: 'hidden',
        minHeight: height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'center' ? 'center' : 'flex-start',
        justifyContent: 'center',
        padding: '36px 40px',
        color: '#ffffff',
        boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
        margin: '16px 0',
      }}
    >
      {/* Background Image with Zoom & Drag-and-Drop */}
      <LiveEditableImage
        currentUrl={bgImage}
        onChangeImage={url => onUpdateSettings?.({ bgImage: url })}
        isLiveEditing={isLiveEditing}
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
        label="Change Banner Image"
      >
        {bgImage ? (
          <div
            className="store-zoom-img"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${bgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              zIndex: 0,
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 0,
            }}
          >
            <span className="material-icons" style={{ fontSize: '64px', color: 'rgba(255,255,255,0.25)' }}>
              photo_library
            </span>
          </div>
        )}
      </LiveEditableImage>

      {/* Dark tint overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: `rgba(15, 23, 42, ${darkness})`,
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />

      {/* Hero content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '680px',
          textAlign: align === 'center' ? 'center' : 'left'
        }}
      >
        {(settings.subheadline || settings.badge || isLiveEditing) && (
          <div style={{ marginBottom: '8px' }}>
            <LiveEditableText
              value={settings.subheadline || settings.badge || ''}
              onChange={val => onUpdateSettings?.({ subheadline: val, badge: val })}
              isLiveEditing={isLiveEditing}
              placeholder="+ Add Subtitle/Badge"
              style={{
                display: 'inline-block',
                fontSize: '0.9rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.9)',
                textShadow: '0 1px 4px rgba(0,0,0,0.6)'
              }}
            />
          </div>
        )}

        <LiveEditableText
          value={settings.headline || 'Welcome to Our Store'}
          onChange={val => onUpdateSettings?.({ headline: val })}
          isLiveEditing={isLiveEditing}
          tag="h2"
          style={{ fontSize: '2.8rem', fontWeight: 900, margin: '0 0 12px 0', textShadow: '0 2px 10px rgba(0,0,0,0.6)', lineHeight: 1.15, letterSpacing: '-0.02em', color: '#ffffff' }}
        />

        {(settings.tagline || isLiveEditing) && (
          <div style={{ margin: '0 0 24px 0' }}>
            <LiveEditableText
              value={settings.tagline || ''}
              onChange={val => onUpdateSettings?.({ tagline: val })}
              isLiveEditing={isLiveEditing}
              multiline={true}
              placeholder="+ Add Tagline description..."
              style={{ fontSize: '1.05rem', color: '#f1f5f9', textShadow: '0 1px 4px rgba(0,0,0,0.6)', lineHeight: 1.5, display: 'block' }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: align === 'center' ? 'center' : 'flex-start' }}>
          {(settings.buttonText || isLiveEditing) && (
            <a
              href={settings.buttonLink || '#products'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: isPill ? '12px 32px' : '12px 28px',
                backgroundColor: settings.buttonBg || brandColor,
                color: settings.buttonColor || '#ffffff',
                borderRadius: isPill ? '30px' : '12px',
                fontWeight: 700,
                fontSize: '0.92rem',
                textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                transition: 'transform 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <LiveEditableText
                value={settings.buttonText || 'Browse Catalog'}
                onChange={val => onUpdateSettings?.({ buttonText: val })}
                isLiveEditing={isLiveEditing}
              />
              <span className="material-icons" style={{ fontSize: '18px' }}>arrow_forward</span>
            </a>
          )}

          {(settings.secondaryButtonText || isLiveEditing) && (
            <a
              href={settings.secondaryButtonLink || '#products'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: isPill ? '12px 30px' : '12px 26px',
                backgroundColor: 'transparent',
                color: '#ffffff',
                border: '1.5px solid rgba(255,255,255,0.7)',
                borderRadius: isPill ? '30px' : '12px',
                fontWeight: 700,
                fontSize: '0.92rem',
                textDecoration: 'none',
                backdropFilter: 'blur(6px)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'
                e.currentTarget.style.borderColor = '#ffffff'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)'
              }}
            >
              <LiveEditableText
                value={settings.secondaryButtonText || ''}
                onChange={val => onUpdateSettings?.({ secondaryButtonText: val })}
                isLiveEditing={isLiveEditing}
                placeholder="+ Add Secondary Button"
              />
            </a>
          )}
        </div>
      </div>

      {/* Optional slider dots for lifestyle look */}
      <div style={{ position: 'absolute', bottom: '16px', display: 'flex', gap: '8px', zIndex: 2 }}>
        <span style={{ width: '22px', height: '6px', borderRadius: '4px', background: '#ffffff', opacity: 1 }} />
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff', opacity: 0.5 }} />
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff', opacity: 0.5 }} />
      </div>
    </div>
  )
}

function CategoriesGridSection({
  settings,
  shop,
  listings,
  brandColor,
  onSelectDepartment,
  isLiveEditing,
  onUpdateSettings
}: {
  settings: Record<string, any>
  shop: BusinessProfile
  listings: Listing[]
  brandColor: string
  onSelectDepartment: (deptId: string) => void
  isLiveEditing?: boolean
  onUpdateSettings?: (s: Record<string, any>) => void
}) {
  const collections = shop.collections || []
  const title = settings.title
  const subtitle = settings.subtitle
  const isChips = settings.layout === 'chips'
  const isBubbles = settings.layout === 'bubbles' || settings.layout === 'squares'
  const isSquare = settings.layout === 'squares'
  const customItems = settings.items as any[] | undefined

  if (isBubbles) {
    const bubbleItems: any[] = customItems || (collections.length > 0 ? collections.map(c => ({
      id: c.id,
      label: c.name,
      image: c.bannerImage || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&auto=format&fit=crop&q=80',
      link: `#col-${c.id}`
    })) : [
      { id: 'b_sale', label: 'Sale', isSale: true, color: '#dc2626', link: '#products' },
      { id: 'b_1', label: 'Side Tables', image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986b88?w=200&auto=format&fit=crop&q=80', link: '#products' },
      { id: 'b_2', label: 'Lighting', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=200&auto=format&fit=crop&q=80', link: '#products' },
      { id: 'b_3', label: 'Sofa Beds', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&auto=format&fit=crop&q=80', link: '#products' },
      { id: 'b_4', label: 'Sideboards', image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=200&auto=format&fit=crop&q=80', link: '#products' },
      { id: 'b_5', label: 'Armchairs', image: 'https://images.unsplash.com/photo-1580481077195-7385f50d8830?w=200&auto=format&fit=crop&q=80', link: '#products' },
      { id: 'b_6', label: 'Sofas', image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=200&auto=format&fit=crop&q=80', link: '#products' },
      { id: 'b_7', label: 'Coffee Tables', image: 'https://images.unsplash.com/photo-1532323544230-7191fd51bc1b?w=200&auto=format&fit=crop&q=80', link: '#products' },
      { id: 'b_8', label: 'Ceramics', image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=200&auto=format&fit=crop&q=80', link: '#products' },
    ])

    const isDualRow = settings.rows === 2

    return (
      <section style={{ margin: '20px 0 28px 0', padding: '0 4px' }}>
        {(title || isLiveEditing) && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <LiveEditableText
                value={title || ''}
                onChange={val => onUpdateSettings?.({ title: val })}
                isLiveEditing={isLiveEditing}
                tag="h3"
                placeholder="+ Add Section Title"
                style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}
              />
              {(subtitle || isLiveEditing) && (
                <div style={{ margin: '2px 0 0 0' }}>
                  <LiveEditableText
                    value={subtitle || ''}
                    onChange={val => onUpdateSettings?.({ subtitle: val })}
                    isLiveEditing={isLiveEditing}
                    tag="p"
                    placeholder="+ Add Subtitle"
                    style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}
                  />
                </div>
              )}
            </div>
            {settings.viewAllLink && (
              <a href={settings.viewAllLink} style={{ color: 'inherit', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.8 }}>
                <span>View All Products</span>
                <span className="material-icons" style={{ fontSize: '16px' }}>arrow_forward</span>
              </a>
            )}
          </div>
        )}

        <div
          style={{
            display: isSquare ? 'grid' : (isDualRow ? 'grid' : 'flex'),
            gridTemplateColumns: isSquare
              ? 'repeat(auto-fit, minmax(120px, 1fr))'
              : (isDualRow ? 'repeat(auto-fill, minmax(90px, 1fr))' : undefined),
            gap: isSquare ? '18px 14px' : (isDualRow ? '20px 14px' : '20px'),
            overflowX: (isSquare || isDualRow) ? 'visible' : 'auto',
            paddingBottom: '8px',
            scrollbarWidth: 'none',
            justifyContent: (isSquare || isDualRow) ? 'flex-start' : 'center',
            alignItems: 'flex-start',
            flexWrap: (isSquare || isDualRow) ? 'wrap' : 'nowrap'
          }}
        >
          {bubbleItems.map((item: any, idx: number) => (
            <div
              key={item.id || idx}
              style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: isSquare ? '100%' : 'auto' }}
            >
              {isLiveEditing && (
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation()
                    const next = bubbleItems.filter((_: any, i: number) => i !== idx)
                    onUpdateSettings?.({ items: next })
                  }}
                  title="Remove Item"
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                    zIndex: 25,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '12px' }}>close</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (item.id.startsWith('col-')) {
                    onSelectDepartment(item.id.replace('col-', ''))
                  } else if (item.link?.startsWith('#')) {
                    const el = document.querySelector(item.link)
                    if (el) el.scrollIntoView({ behavior: 'smooth' })
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  minWidth: isSquare ? '100px' : '82px',
                  width: isSquare ? '100%' : 'auto',
                  flexShrink: isSquare ? 1 : 0,
                  transition: 'transform 0.18s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {item.isSale ? (
                  <div
                    style={{
                      width: isSquare ? '100%' : '66px',
                      maxWidth: isSquare ? '135px' : '66px',
                      aspectRatio: '1 / 1',
                      height: isSquare ? 'auto' : '66px',
                      borderRadius: isSquare ? '22px' : '50%',
                      background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                      color: '#ffffff',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      letterSpacing: '0.04em',
                      boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                      border: '3px solid #fee2e2'
                    }}
                  >
                    {item.label}
                  </div>
                ) : (
                  <div
                    className="store-zoom-card"
                    style={{
                      width: isSquare ? '100%' : '66px',
                      maxWidth: isSquare ? '135px' : '66px',
                      aspectRatio: '1 / 1',
                      height: isSquare ? 'auto' : '66px',
                      borderRadius: isSquare ? '22px' : '50%',
                      overflow: 'hidden',
                      background: isSquare ? '#f7f7f7' : '#f8fafc',
                      border: isSquare ? '1px solid #e5e5e5' : '1.5px solid rgba(0,0,0,0.08)',
                      boxShadow: isSquare ? '0 1px 4px rgba(0,0,0,0.04)' : '0 2px 8px rgba(0,0,0,0.06)',
                      display: 'grid',
                      placeItems: 'center',
                      position: 'relative',
                      padding: isSquare ? '10px' : '0',
                    }}
                  >
                    <LiveEditableImage
                      currentUrl={item.image}
                      onChangeImage={url => {
                        const next = [...bubbleItems]
                        next[idx] = { ...item, image: url }
                        onUpdateSettings?.({ items: next })
                      }}
                      isLiveEditing={isLiveEditing}
                      style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}
                      label="Photo"
                    >
                      {item.image ? (
                        <img
                          className="store-zoom-img"
                          src={item.image}
                          alt={item.label}
                          style={{
                            width: isSquare ? '85%' : '100%',
                            height: isSquare ? '85%' : '100%',
                            objectFit: isSquare ? 'contain' : 'cover',
                            transition: 'transform 0.2s ease',
                          }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: 'var(--panel)', color: 'var(--text-secondary)' }}>
                          <span className="material-icons" style={{ fontSize: isSquare ? '26px' : '22px', opacity: 0.7 }}>
                            photo_library
                          </span>
                        </div>
                      )}
                    </LiveEditableImage>
                  </div>
                )}

                <LiveEditableText
                  value={item.label}
                  onChange={val => {
                    const next = [...bubbleItems]
                    next[idx] = { ...item, label: val }
                    onUpdateSettings?.({ items: next })
                  }}
                  isLiveEditing={isLiveEditing}
                  style={{
                    fontSize: isSquare ? '0.82rem' : '0.78rem',
                    fontWeight: 600,
                    color: isSquare ? '#191919' : 'var(--text)',
                    textAlign: 'center',
                    lineHeight: 1.25,
                    maxWidth: isSquare ? '120px' : '82px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                />
              </button>
            </div>
          ))}

          {isLiveEditing && (
            <button
              type="button"
              onClick={() => {
                const next = [...bubbleItems, {
                  id: 'cat_' + Date.now(),
                  label: 'New Dept',
                  image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&auto=format&fit=crop&q=80',
                  link: '#products'
                }]
                onUpdateSettings?.({ items: next })
              }}
              style={{
                width: isSquare ? '74px' : '66px',
                height: isSquare ? '74px' : '66px',
                borderRadius: isSquare ? '18px' : '50%',
                border: '2px dashed var(--primary)',
                background: 'rgba(37, 99, 235, 0.06)',
                color: 'var(--primary)',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                marginTop: '4px'
              }}
              title="Add Category / Story Bubble"
            >
              <span className="material-icons" style={{ fontSize: '24px' }}>add</span>
            </button>
          )}
        </div>
      </section>
    )
  }

  if (collections.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', background: 'var(--panel)', borderRadius: '16px', border: '1px solid var(--border)' }}>
        <h3 style={{ margin: '0 0 8px 0' }}>{title || 'Shop by Department'}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          No departments created yet. You can add departments in the Shop Manager.
        </p>
      </div>
    )
  }

  return (
    <section style={{ margin: '24px 0' }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px 0' }}>{title || 'Shop by Department'}</h3>
        {subtitle && <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0 }}>{subtitle}</p>}
      </div>

      {isChips ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {collections.map(col => {
            const count = listings.filter(l => l.collection_id === col.id).length
            return (
              <button
                key={col.id}
                type="button"
                onClick={() => onSelectDepartment(col.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '24px',
                  background: 'var(--panel)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <span className="material-icons" style={{ fontSize: '18px', color: brandColor }}>category</span>
                <span>{col.name}</span>
                <span style={{ fontSize: '0.75rem', background: 'var(--surface)', padding: '2px 8px', borderRadius: '10px' }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {collections.map((col, idx) => {
            const count = listings.filter(l => l.collection_id === col.id).length
            const fallbackGradients = [
              'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
              'linear-gradient(135deg, #064e3b 0%, #10b981 100%)',
              'linear-gradient(135deg, #701a75 0%, #ec4899 100%)',
              'linear-gradient(135deg, #78350f 0%, #f59e0b 100%)',
            ]
            const bgGrad = fallbackGradients[idx % fallbackGradients.length]

            return (
              <div
                key={col.id}
                onClick={() => onSelectDepartment(col.id)}
                style={{
                  background: 'var(--panel)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ height: '90px', background: bgGrad, display: 'grid', placeItems: 'center', color: '#ffffff' }}>
                  <span className="material-icons" style={{ fontSize: '36px' }}>category</span>
                </div>
                <div style={{ padding: '14px' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 700 }}>{col.name}</h4>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {count} {count === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function FeaturedProductsSection({
  settings,
  shop,
  listings,
  savedIds,
  onOpenListing,
  onQuickPeek,
  onToggleSave,
  onAddToCart,
  isLiveEditing,
  onUpdateSettings
}: {
  settings: Record<string, any>
  shop: BusinessProfile
  listings: Listing[]
  savedIds: string[]
  onOpenListing: (listing: Listing) => void
  onQuickPeek?: (listing: Listing) => void
  onToggleSave: (listingId: number) => void
  onAddToCart?: (listing: Listing) => void
  isLiveEditing?: boolean
  onUpdateSettings?: (s: Record<string, any>) => void
}) {
  const title = settings.title || 'New Arrivals'
  const subtitle = settings.subtitle || 'Fresh Scandinavian design pieces now live in the store'
  const deptFilter = settings.departmentFilter || 'all'
  const columns = settings.columns || 4
  const limit = Number(settings.limit) || 8
  const spotlight = settings.spotlightCard as {
    badge?: string
    title?: string
    buttonText?: string
    buttonLink?: string
    image?: string
  } | undefined

  let filtered = listings.filter(l => l.user_id === shop.userId)
  if (deptFilter !== 'all') {
    filtered = filtered.filter(l => l.collection_id === deptFilter)
  }
  const displayItems = filtered.slice(0, limit)

  return (
    <section id="products" style={{ margin: '32px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div>
          <LiveEditableText
            value={title}
            onChange={val => onUpdateSettings?.({ title: val })}
            isLiveEditing={isLiveEditing}
            tag="h3"
            style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 4px 0', letterSpacing: '-0.02em' }}
          />
          {(subtitle || isLiveEditing) && (
            <LiveEditableText
              value={subtitle}
              onChange={val => onUpdateSettings?.({ subtitle: val })}
              isLiveEditing={isLiveEditing}
              placeholder="+ Add Subtitle"
              style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, display: 'block' }}
            />
          )}
        </div>
        <a href="#products" style={{ color: 'inherit', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.8 }}>
          <span>View All {displayItems.length > 0 ? `${displayItems.length} items` : ''}</span>
          <span className="material-icons" style={{ fontSize: '16px' }}>arrow_forward</span>
        </a>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'stretch', flexWrap: spotlight ? 'wrap' : 'nowrap' }}>
        {spotlight && (
          <div
            className="store-zoom-card"
            style={{
              flex: '0 0 280px',
              minHeight: '380px',
              borderRadius: '18px',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '28px 24px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              border: '1px solid rgba(0,0,0,0.06)'
            }}
          >
            <LiveEditableImage
              currentUrl={spotlight.image}
              onChangeImage={url => onUpdateSettings?.({ spotlightCard: { ...spotlight, image: url } })}
              isLiveEditing={isLiveEditing}
              style={{ position: 'absolute', inset: 0, zIndex: 0 }}
              label="Spotlight Photo"
            >
              {spotlight.image ? (
                <div
                  className="store-zoom-img"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${spotlight.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              ) : (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '52px', color: 'rgba(255,255,255,0.25)' }}>
                    photo_library
                  </span>
                </div>
              )}
            </LiveEditableImage>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.65) 100%)', zIndex: 1, pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 2 }}>
              <LiveEditableText
                value={spotlight.badge || 'Promotion'}
                onChange={val => onUpdateSettings?.({ spotlightCard: { ...spotlight, badge: val } })}
                isLiveEditing={isLiveEditing}
                style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#e2e8f0', display: 'inline-block', marginBottom: '6px' }}
              />
              <LiveEditableText
                value={spotlight.title || 'Soft Stools Design'}
                onChange={val => onUpdateSettings?.({ spotlightCard: { ...spotlight, title: val } })}
                isLiveEditing={isLiveEditing}
                tag="h4"
                style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.15 }}
              />
            </div>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <span
                style={{
                  display: 'inline-block',
                  background: '#ffffff',
                  color: '#0f172a',
                  padding: '10px 22px',
                  borderRadius: '24px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                }}
              >
                <LiveEditableText
                  value={spotlight.buttonText || 'Shop Now'}
                  onChange={val => onUpdateSettings?.({ spotlightCard: { ...spotlight, buttonText: val } })}
                  isLiveEditing={isLiveEditing}
                />
              </span>
            </div>
          </div>
        )}

        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(${spotlight ? '190px' : columns === 2 ? '300px' : columns === 3 ? '250px' : '200px'}, 1fr))`,
            gap: '16px'
          }}
        >
          {displayItems.length === 0 ? (
            shop.themeConfig?.presetName === 'hyper' ? (
              [
                {
                  id: 99101,
                  title: 'Bose QuietComfort Ultra Noise Cancelling Headphones, Certified...',
                  price: 190.00,
                  originalPrice: 249.00,
                  image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&auto=format&fit=crop&q=80',
                  shipping: 'Free shipping',
                },
                {
                  id: 99102,
                  title: 'Seagate Exos ST16000NM002G 16TB CMR 7200RPM SATA 6Gb/s...',
                  price: 279.99,
                  originalPrice: 399.99,
                  image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&auto=format&fit=crop&q=80',
                  shipping: 'Free shipping',
                },
                {
                  id: 99103,
                  title: 'Crocs Adult Bayaband Flip Flop Sandals',
                  price: 19.99,
                  originalPrice: 29.99,
                  image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=500&auto=format&fit=crop&q=80',
                  shipping: 'Free shipping',
                },
                {
                  id: 99104,
                  title: 'EcoFlow DELTA Pro 3600Wh Power Station Generator Certified...',
                  price: 1941.43,
                  originalPrice: 2875.00,
                  image: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=500&auto=format&fit=crop&q=80',
                  shipping: 'Free shipping',
                },
                {
                  id: 99105,
                  title: 'Apple iPad 10.2" 9th Gen 2021 64GB WiFi - Very Good - 1 Year Warranty',
                  price: 167.96,
                  originalPrice: 299.00,
                  image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop&q=80',
                  shipping: 'Free shipping',
                },
              ].map(deal => {
                const isSaved = savedIds.includes(String(deal.id))
                return (
                  <div
                    key={deal.id}
                    onClick={() => {
                      const mockListing: any = {
                        id: deal.id,
                        title: deal.title,
                        price: deal.price,
                        images: [deal.image],
                        user_id: shop.userId,
                        category: 'Electronics',
                        description: deal.title + ' in pristine condition. Official warranty included.',
                        condition: 'Refurbished',
                        created_at: new Date().toISOString()
                      }
                      if (onQuickPeek) onQuickPeek(mockListing)
                      else if (onOpenListing) onOpenListing(mockListing)
                    }}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #ebebeb',
                      borderRadius: '12px',
                      padding: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-3px)'
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div>
                      {/* Image Frame */}
                      <div
                        style={{
                          width: '100%',
                          aspectRatio: '1 / 1',
                          background: '#f8fafc',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          position: 'relative',
                          display: 'grid',
                          placeItems: 'center',
                          padding: '8px',
                        }}
                      >
                        <img
                          src={deal.image}
                          alt={deal.title}
                          style={{ width: '90%', height: '90%', objectFit: 'contain' }}
                        />

                        {/* Heart wishlist toggle button */}
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation()
                            onToggleSave(deal.id)
                          }}
                          aria-label={isSaved ? 'Remove from saved' : 'Save this deal'}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: '#ffffff',
                            border: '1px solid #e5e5e5',
                            color: isSaved ? '#e11d48' : '#707070',
                            display: 'grid',
                            placeItems: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                          }}
                        >
                          <span className="material-icons" style={{ fontSize: '16px' }}>
                            {isSaved ? 'favorite' : 'favorite_border'}
                          </span>
                        </button>
                      </div>

                      {/* Title */}
                      <div
                        style={{
                          fontSize: '0.84rem',
                          fontWeight: 500,
                          color: '#191919',
                          lineHeight: 1.35,
                          margin: '10px 0 6px 0',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                        title={deal.title}
                      >
                        {deal.title}
                      </div>
                    </div>

                    {/* Price & Free Shipping */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#191919' }}>
                          ${deal.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {deal.originalPrice && (
                          <span style={{ fontSize: '0.8rem', color: '#707070', textDecoration: 'line-through' }}>
                            ${deal.originalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#707070', marginTop: '2px' }}>
                        {deal.shipping}
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div style={{ gridColumn: '1 / -1', background: 'var(--panel)', padding: '28px', borderRadius: '16px', textAlign: 'center', border: '1px solid var(--border)' }}>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No items available in this section currently.</p>
              </div>
            )
          ) : (
            displayItems.map(item => (
              <ListingView
                key={item.id}
                listing={item}
                saved={savedIds.includes(String(item.id))}
                onOpen={onOpenListing}
                onQuickPeek={onQuickPeek}
                onToggleSave={onToggleSave}
                onAddToCart={onAddToCart}
              />
            ))
          )}
        </div>
      </div>
    </section>
  )
}

function CountdownDealSection({
  settings,
  isLiveEditing,
  onUpdateSettings
}: {
  settings: Record<string, any>
  brandColor: string
  isLiveEditing?: boolean
  onUpdateSettings?: (s: Record<string, any>) => void
}) {
  const [timeLeft, setTimeLeft] = useState({
    days: settings.days ?? 16,
    hours: settings.hours ?? 8,
    minutes: settings.minutes ?? 36,
    seconds: settings.seconds ?? 49
  })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 }
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 }
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 }
        return prev
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const promoCode = settings.promoCode || 'FLASH50'
  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(promoCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    }
  }

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div
      style={{
        margin: '28px 0',
        backgroundColor: settings.bgColor || '#fef08a',
        color: settings.textColor || '#0f172a',
        borderRadius: '16px',
        padding: '18px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        flexWrap: 'wrap',
        boxShadow: '0 4px 20px rgba(254, 240, 138, 0.35)',
        border: '1px solid rgba(250, 204, 21, 0.4)'
      }}
    >
      {/* Left: Tagline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="material-icons" style={{ fontSize: '20px', color: '#b45309' }}>bolt</span>
        <LiveEditableText
          value={settings.title || 'Flash Sale ending soon!'}
          onChange={val => onUpdateSettings?.({ title: val })}
          isLiveEditing={isLiveEditing}
          style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.01em' }}
        />
      </div>

      {/* Center: Flip Clock Digits */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '-0.02em' }}>{pad(timeLeft.days)}</span>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.65 }}>D</span>
        </div>
        <span style={{ fontWeight: 800, fontSize: '1.2rem', opacity: 0.4 }}>:</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '-0.02em' }}>{pad(timeLeft.hours)}</span>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.65 }}>H</span>
        </div>
        <span style={{ fontWeight: 800, fontSize: '1.2rem', opacity: 0.4 }}>:</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '-0.02em' }}>{pad(timeLeft.minutes)}</span>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.65 }}>M</span>
        </div>
        <span style={{ fontWeight: 800, fontSize: '1.2rem', opacity: 0.4 }}>:</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '-0.02em' }}>{pad(timeLeft.seconds)}</span>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.65 }}>S</span>
        </div>
      </div>

      {/* Right: Message & Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <LiveEditableText
          value={settings.description || 'Save more than ever on these exclusive pieces'}
          onChange={val => onUpdateSettings?.({ description: val })}
          isLiveEditing={isLiveEditing}
          style={{ fontSize: '0.86rem', fontWeight: 600, opacity: 0.85 }}
        />
        <button
          type="button"
          onClick={handleCopyCode}
          style={{
            backgroundColor: '#09090b',
            color: '#ffffff',
            border: 'none',
            padding: '9px 18px',
            borderRadius: '24px',
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transition: 'transform 0.15s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          <span>{copied ? 'Copied code!' : ''}</span>
          {!copied && (
            <LiveEditableText
              value={settings.buttonText || `Use Code ${promoCode}`}
              onChange={val => onUpdateSettings?.({ buttonText: val })}
              isLiveEditing={isLiveEditing}
            />
          )}
          <span className="material-icons" style={{ fontSize: '15px' }}>{copied ? 'check' : 'content_copy'}</span>
        </button>
      </div>
    </div>
  )
}

function EditorialGridSection({
  settings,
  brandColor,
  isLiveEditing,
  onUpdateSettings
}: {
  settings: Record<string, any>
  brandColor: string
  isLiveEditing?: boolean
  onUpdateSettings?: (s: Record<string, any>) => void
}) {
  const items = settings.items || [
    {
      id: 'ed_1',
      title: 'Material Natural',
      subtitle: 'Solid Oak Frame',
      image: 'https://images.unsplash.com/photo-1580481077195-7385f50d8830?w=800&auto=format&fit=crop&q=80',
      buttonText: 'Shop',
      buttonLink: '#products'
    },
    {
      id: 'ed_2',
      title: 'Authentic Design',
      subtitle: 'Artisan Candles & Decor',
      image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&auto=format&fit=crop&q=80',
      buttonText: 'Shop',
      buttonLink: '#products'
    },
    {
      id: 'ed_3',
      title: 'Kinoto Lighting',
      subtitle: 'Modern Chrome Dome',
      image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&auto=format&fit=crop&q=80',
      buttonText: 'Shop',
      buttonLink: '#products'
    },
    {
      id: 'ed_4',
      title: 'Nightstand',
      subtitle: 'Walnut Bedside Storage',
      image: 'https://images.unsplash.com/photo-1532323544230-7191fd51bc1b?w=800&auto=format&fit=crop&q=80',
      buttonText: 'Shop',
      buttonLink: '#products'
    }
  ]

  return (
    <section style={{ margin: '32px 0' }}>
      {(settings.title || settings.subtitle || isLiveEditing) && (
        <div style={{ marginBottom: '20px', textAlign: settings.align === 'center' ? 'center' : 'left' }}>
          <LiveEditableText
            value={settings.title || ''}
            onChange={val => onUpdateSettings?.({ title: val })}
            isLiveEditing={isLiveEditing}
            tag="h3"
            placeholder="+ Add Lookbook Title"
            style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em', display: 'block' }}
          />
          {(settings.subtitle || isLiveEditing) && (
            <LiveEditableText
              value={settings.subtitle || ''}
              onChange={val => onUpdateSettings?.({ subtitle: val })}
              isLiveEditing={isLiveEditing}
              placeholder="+ Add Subtitle"
              style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0, display: 'block' }}
            />
          )}
        </div>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(${settings.columns === 3 ? '280px' : '240px'}, 1fr))`,
          gap: '20px'
        }}
      >
        {items.map((item: any, idx: number) => (
          settings.cardStyle === 'card-bottom' ? (
            <div
              key={item.id || idx}
              className="store-zoom-card"
              style={{
                borderRadius: '20px',
                overflow: 'hidden',
                background: 'var(--panel)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                position: 'relative'
              }}
            >
              {isLiveEditing && (
                <button
                  type="button"
                  onClick={() => {
                    const next = items.filter((_: any, i: number) => i !== idx)
                    onUpdateSettings?.({ items: next })
                  }}
                  title="Remove Card"
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                    zIndex: 30,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '14px' }}>close</span>
                </button>
              )}
              <div style={{ height: '220px', overflow: 'hidden', position: 'relative' }}>
                <LiveEditableImage
                  currentUrl={item.image}
                  onChangeImage={url => {
                    const next = [...items]
                    next[idx] = { ...item, image: url }
                    onUpdateSettings?.({ items: next })
                  }}
                  isLiveEditing={isLiveEditing}
                  style={{ width: '100%', height: '100%' }}
                  label="Card Image"
                >
                  {item.image ? (
                    <div
                      className="store-zoom-img"
                      style={{
                        width: '100%',
                        height: '100%',
                        backgroundImage: `url(${item.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: 'var(--panel)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      <span className="material-icons" style={{ fontSize: '42px', opacity: 0.5 }}>
                        photo_library
                      </span>
                    </div>
                  )}
                </LiveEditableImage>
              </div>
              <div style={{ padding: '22px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <LiveEditableText
                  value={item.title}
                  onChange={val => {
                    const next = [...items]
                    next[idx] = { ...item, title: val }
                    onUpdateSettings?.({ items: next })
                  }}
                  isLiveEditing={isLiveEditing}
                  tag="h4"
                  style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}
                />
                <LiveEditableText
                  value={item.subtitle}
                  onChange={val => {
                    const next = [...items]
                    next[idx] = { ...item, subtitle: val }
                    onUpdateSettings?.({ items: next })
                  }}
                  isLiveEditing={isLiveEditing}
                  style={{ margin: '0 0 12px 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}
                />
                <span
                  style={{
                    color: brandColor,
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <LiveEditableText
                    value={item.buttonText || 'Shop Now'}
                    onChange={val => {
                      const next = [...items]
                      next[idx] = { ...item, buttonText: val }
                      onUpdateSettings?.({ items: next })
                    }}
                    isLiveEditing={isLiveEditing}
                  />
                  <span className="material-icons" style={{ fontSize: '16px' }}>arrow_forward</span>
                </span>
              </div>
            </div>
          ) : (
            <div
              key={item.id || idx}
              className="store-zoom-card"
              style={{
                position: 'relative',
                height: '380px',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '16px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              {isLiveEditing && (
                <button
                  type="button"
                  onClick={() => {
                    const next = items.filter((_: any, i: number) => i !== idx)
                    onUpdateSettings?.({ items: next })
                  }}
                  title="Remove Card"
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                    zIndex: 30,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '14px' }}>close</span>
                </button>
              )}
              <LiveEditableImage
                currentUrl={item.image}
                onChangeImage={url => {
                  const next = [...items]
                  next[idx] = { ...item, image: url }
                  onUpdateSettings?.({ items: next })
                }}
                isLiveEditing={isLiveEditing}
                style={{ position: 'absolute', inset: 0, zIndex: 0 }}
                label="Card Image"
              >
                <div
                  className="store-zoom-img"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${item.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    zIndex: 0
                  }}
                />
              </LiveEditableImage>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 55%)', zIndex: 1, pointerEvents: 'none' }} />

              {/* Bottom floating info badge */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  background: 'rgba(255,255,255,0.92)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
                }}
              >
                <div style={{ overflow: 'hidden' }}>
                  <LiveEditableText
                    value={item.title}
                    onChange={val => {
                      const next = [...items]
                      next[idx] = { ...item, title: val }
                      onUpdateSettings?.({ items: next })
                    }}
                    isLiveEditing={isLiveEditing}
                    tag="h5"
                    style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  />
                  <LiveEditableText
                    value={item.subtitle || 'Shop Now'}
                    onChange={val => {
                      const next = [...items]
                      next[idx] = { ...item, subtitle: val }
                      onUpdateSettings?.({ items: next })
                    }}
                    isLiveEditing={isLiveEditing}
                    style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 500, display: 'block' }}
                  />
                </div>
                <span
                  style={{
                    background: '#0f172a',
                    color: '#ffffff',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    flexShrink: 0
                  }}
                >
                  <LiveEditableText
                    value={item.buttonText || 'Shop'}
                    onChange={val => {
                      const next = [...items]
                      next[idx] = { ...item, buttonText: val }
                      onUpdateSettings?.({ items: next })
                    }}
                    isLiveEditing={isLiveEditing}
                  />
                </span>
              </div>
            </div>
          )
        ))}

        {isLiveEditing && (
          <button
            type="button"
            onClick={() => {
              const next = [...items, {
                id: 'ed_' + Date.now(),
                title: 'New Spotlight',
                subtitle: 'Collection item',
                image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80',
                buttonText: 'Shop',
                buttonLink: '#products'
              }]
              onUpdateSettings?.({ items: next })
            }}
            style={{
              minHeight: '220px',
              borderRadius: '20px',
              border: '2px dashed var(--primary)',
              background: 'rgba(37, 99, 235, 0.04)',
              color: 'var(--primary)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.95rem'
            }}
          >
            <span className="material-icons" style={{ fontSize: '28px' }}>add_photo_alternate</span>
            <span>+ Add Lookbook Card</span>
          </button>
        )}
      </div>
    </section>
  )
}

function HyperPurplePromoBanner({
  settings,
  isLiveEditing,
  onUpdateSettings
}: {
  settings: Record<string, any>
  isLiveEditing?: boolean
  onUpdateSettings?: (s: Record<string, any>) => void
}) {
  return (
    <section
      style={{
        margin: '28px 0',
        borderRadius: '20px',
        backgroundColor: '#5c2dd5',
        color: '#ffffff',
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(92, 45, 213, 0.22)',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '36px 40px',
          gap: '32px',
        }}
      >
        {/* Left Side: Text and CTA */}
        <div style={{ flex: '1 1 340px', maxWidth: '440px' }}>
          <LiveEditableText
            value={settings.title || 'Shop the world. Ship for free.'}
            onChange={val => onUpdateSettings?.({ title: val })}
            isLiveEditing={isLiveEditing}
            tag="h2"
            style={{
              fontSize: '2.5rem',
              fontWeight: 850,
              margin: '0 0 14px 0',
              lineHeight: 1.12,
              letterSpacing: '-0.02em',
              color: '#ffffff',
            }}
          />

          <div style={{ margin: '0 0 28px 0' }}>
            <LiveEditableText
              value={settings.subtitle || 'Discover international finds with free shipping included.'}
              onChange={val => onUpdateSettings?.({ subtitle: val })}
              isLiveEditing={isLiveEditing}
              style={{
                fontSize: '1.05rem',
                color: '#ede9fe',
                lineHeight: 1.45,
                display: 'block',
              }}
            />
          </div>

          <a
            href={settings.buttonLink || '#products'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 28px',
              backgroundColor: '#ffffff',
              color: '#191919',
              borderRadius: '30px',
              fontWeight: 700,
              fontSize: '0.92rem',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              transition: 'transform 0.15s, background-color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.backgroundColor = '#f4f4f5'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.backgroundColor = '#ffffff'
            }}
          >
            <LiveEditableText
              value={settings.buttonText || 'Shop now'}
              onChange={val => onUpdateSettings?.({ buttonText: val })}
              isLiveEditing={isLiveEditing}
            />
          </a>
        </div>

        {/* Right Side: Collage of World Finds Cards */}
        <div
          style={{
            flex: '1 1 480px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            maxWidth: '560px',
          }}
        >
          {/* Column 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Sneaker Tile */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                overflow: 'hidden',
                height: '170px',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                padding: '10px',
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1552346154-21d32810aba3?w=360&auto=format&fit=crop&q=80"
                alt="Sneakers"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>

            {/* Wolverine Collectible Tile */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                overflow: 'hidden',
                height: '130px',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                padding: '10px',
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=360&auto=format&fit=crop&q=80"
                alt="Collectibles"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
          </div>

          {/* Column 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Zebra Handbag Tile */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                overflow: 'hidden',
                height: '110px',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                padding: '8px',
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=360&auto=format&fit=crop&q=80"
                alt="Luxury Handbag"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>

            {/* Happy Customer with Packages */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                overflow: 'hidden',
                height: '190px',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=360&auto=format&fit=crop&q=80"
                alt="Happy Shopper"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>

          {/* Column 3 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Gengar Figurine Tile */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                overflow: 'hidden',
                height: '130px',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                padding: '8px',
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=360&auto=format&fit=crop&q=80"
                alt="Anime Figurine"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>

            {/* Smartphone Display Tile */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                overflow: 'hidden',
                height: '170px',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                padding: '8px',
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=360&auto=format&fit=crop&q=80"
                alt="Smartphones"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeaturedCollectionSplitSection({
  settings,
  brandColor: _brandColor,
  isLiveEditing,
  onUpdateSettings
}: {
  settings: Record<string, any>
  brandColor: string
  isLiveEditing?: boolean
  onUpdateSettings?: (s: Record<string, any>) => void
}) {
  if (settings.style === 'purple_promo' || settings.bgColor === '#5c2dd5') {
    return (
      <HyperPurplePromoBanner
        settings={settings}
        isLiveEditing={isLiveEditing}
        onUpdateSettings={onUpdateSettings}
      />
    )
  }

  const [activeSwatch, setActiveSwatch] = useState(0)
  const isDark = settings.theme === 'dark' || settings.bgColor === '#09090b' || settings.bgColor === '#000000'
  const bg = settings.bgColor || (isDark ? '#09090b' : 'var(--panel)')
  const textColor = settings.textColor || (isDark ? '#ffffff' : 'var(--text)')
  const buttonBg = settings.buttonBg || (isDark ? '#ffffff' : '#09090b')
  const buttonColor = settings.buttonColor || (isDark ? '#09090b' : '#ffffff')

  const swatches = settings.swatches || [
    { name: 'Oatmeal Tweed', color: '#e2dacf', image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1000&auto=format&fit=crop&q=80' },
    { name: 'Natural Oak', color: '#c9b097', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1000&auto=format&fit=crop&q=80' },
    { name: 'Warm Charcoal', color: '#4a4a4a', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1000&auto=format&fit=crop&q=80' },
    { name: 'Cognac Leather', color: '#9c5a32', image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1000&auto=format&fit=crop&q=80' },
  ]

  const currentImage = swatches[activeSwatch]?.image || settings.image || 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1000&auto=format&fit=crop&q=80'

  return (
    <section style={{ margin: '40px 0' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '40px',
          alignItems: 'center',
          background: bg,
          color: textColor,
          borderRadius: '24px',
          padding: '36px',
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--border)'
        }}
      >
        {/* Left Column: Details & Swatches */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <LiveEditableText
            value={settings.badge || 'Featured Collection'}
            onChange={val => onUpdateSettings?.({ badge: val })}
            isLiveEditing={isLiveEditing}
            style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.7 }}
          />
          <LiveEditableText
            value={settings.title || 'Heritage Living'}
            onChange={val => onUpdateSettings?.({ title: val })}
            isLiveEditing={isLiveEditing}
            tag="h2"
            style={{ fontSize: '2.4rem', fontWeight: 900, margin: 0, letterSpacing: '-0.03em', lineHeight: 1.15 }}
          />
          <LiveEditableText
            value={settings.subtitle || 'The Haven Collection — Solace Series'}
            onChange={val => onUpdateSettings?.({ subtitle: val })}
            isLiveEditing={isLiveEditing}
            tag="h4"
            style={{ fontSize: '1.25rem', fontWeight: 600, opacity: 0.8, margin: 0 }}
          />

          {/* Swatch Selectors */}
          {swatches.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0', flexWrap: 'wrap' }}>
              {swatches.map((swatch: any, idx: number) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setActiveSwatch(idx)}
                    title={swatch.name}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: swatch.color,
                      border: activeSwatch === idx ? (isDark ? '2px solid #ffffff' : '2px solid #09090b') : '1px solid rgba(0,0,0,0.15)',
                      boxShadow: activeSwatch === idx ? '0 0 0 2px rgba(255,255,255,0.4)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  />
                  {isLiveEditing && swatches.length > 1 && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        const next = swatches.filter((_: any, i: number) => i !== idx)
                        onUpdateSettings?.({ swatches: next })
                        if (activeSwatch >= next.length) setActiveSwatch(0)
                      }}
                      title="Remove Swatch"
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '16px',
                        height: '16px',
                        cursor: 'pointer',
                        display: 'grid',
                        placeItems: 'center',
                        zIndex: 10
                      }}
                    >
                      <span className="material-icons" style={{ fontSize: '10px' }}>close</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <LiveEditableText
            value={settings.description || 'Designed for tactile comfort and versatile spatial layouts.'}
            onChange={val => onUpdateSettings?.({ description: val })}
            isLiveEditing={isLiveEditing}
            multiline={true}
            style={{ fontSize: '0.98rem', opacity: 0.85, lineHeight: 1.6, margin: 0, display: 'block' }}
          />

          <div style={{ marginTop: '8px' }}>
            <span
              style={{
                display: 'inline-block',
                background: buttonBg,
                color: buttonColor,
                padding: '12px 30px',
                borderRadius: '30px',
                fontWeight: 700,
                fontSize: '0.92rem',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
              }}
            >
              <LiveEditableText
                value={settings.buttonText || 'Shop Collection'}
                onChange={val => onUpdateSettings?.({ buttonText: val })}
                isLiveEditing={isLiveEditing}
              />
            </span>
          </div>
        </div>

        {/* Right Column: Hero Showcase Image with Zoom and Editable Image */}
        <div
          className="store-zoom-card"
          style={{
            height: '420px',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            position: 'relative'
          }}
        >
          <LiveEditableImage
            currentUrl={currentImage}
            onChangeImage={url => {
              if (swatches[activeSwatch]) {
                const nextSwatches = [...swatches]
                nextSwatches[activeSwatch] = { ...nextSwatches[activeSwatch], image: url }
                onUpdateSettings?.({ swatches: nextSwatches, image: url })
              } else {
                onUpdateSettings?.({ image: url })
              }
            }}
            isLiveEditing={isLiveEditing}
            style={{ width: '100%', height: '100%' }}
            label="Showcase Image"
          >
            {currentImage ? (
              <img
                className="store-zoom-img"
                src={currentImage}
                alt={settings.title || 'Collection Showcase'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'var(--panel)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)'
                }}
              >
                <span className="material-icons" style={{ fontSize: '56px', opacity: 0.4 }}>
                  photo_library
                </span>
              </div>
            )}
          </LiveEditableImage>
        </div>
      </div>
    </section>
  )
}

function BentoGridSection({
  settings,
  isLiveEditing,
  onUpdateSettings
}: {
  settings: Record<string, any>
  brandColor: string
  isLiveEditing?: boolean
  onUpdateSettings?: (s: Record<string, any>) => void
}) {
  const mode = settings.mode || 'hero' // 'hero' | 'triplet'

  if (mode === 'triplet') {
    const tripletItems = settings.tripletItems || settings.items || [
      {
        id: 'trip_1',
        title: 'Kids homewear',
        buttonText: 'Discover now',
        buttonLink: '#products',
        image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&auto=format&fit=crop&q=80',
      },
      {
        id: 'trip_2',
        title: 'Fashion',
        buttonText: 'Explore',
        buttonLink: '#products',
        image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80',
      },
      {
        id: 'trip_3',
        title: 'Home & living',
        buttonText: 'Shop now',
        buttonLink: '#products',
        image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
      }
    ]

    return (
      <section style={{ margin: '36px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {tripletItems.map((item: any, idx: number) => (
            <div
              key={item.id || idx}
              className="store-zoom-card"
              style={{
                position: 'relative',
                height: '340px',
                borderRadius: '24px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                padding: '24px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              {isLiveEditing && (
                <button
                  type="button"
                  onClick={() => {
                    const next = tripletItems.filter((_: any, i: number) => i !== idx)
                    onUpdateSettings?.({ tripletItems: next })
                  }}
                  title="Remove Card"
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                    zIndex: 30,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '14px' }}>close</span>
                </button>
              )}
              <LiveEditableImage
                currentUrl={item.image}
                onChangeImage={url => {
                  const next = [...tripletItems]
                  next[idx] = { ...item, image: url }
                  onUpdateSettings?.({ tripletItems: next })
                }}
                isLiveEditing={isLiveEditing}
                style={{ position: 'absolute', inset: 0, zIndex: 0 }}
                label="Card Image"
              >
                <div
                  className="store-zoom-img"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${item.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    zIndex: 0
                  }}
                />
              </LiveEditableImage>
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.3)', zIndex: 1, pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 2 }}>
                <LiveEditableText
                  value={item.title}
                  onChange={val => {
                    const next = [...tripletItems]
                    next[idx] = { ...item, title: val }
                    onUpdateSettings?.({ tripletItems: next })
                  }}
                  isLiveEditing={isLiveEditing}
                  tag="h3"
                  style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff', margin: '0 0 16px 0', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
                />
                <span
                  style={{
                    display: 'inline-block',
                    backgroundColor: item.buttonBg || '#facc15',
                    color: item.buttonColor || '#0f172a',
                    padding: '10px 24px',
                    borderRadius: '30px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  }}
                >
                  <LiveEditableText
                    value={item.buttonText || 'Discover now'}
                    onChange={val => {
                      const next = [...tripletItems]
                      next[idx] = { ...item, buttonText: val }
                      onUpdateSettings?.({ tripletItems: next })
                    }}
                    isLiveEditing={isLiveEditing}
                  />
                </span>
              </div>
            </div>
          ))}

          {isLiveEditing && (
            <button
              type="button"
              onClick={() => {
                const next = [...tripletItems, {
                  id: 'trip_' + Date.now(),
                  title: 'New Triplet',
                  buttonText: 'Shop Now',
                  buttonLink: '#products',
                  image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
                }]
                onUpdateSettings?.({ tripletItems: next })
              }}
              style={{
                minHeight: '260px',
                borderRadius: '24px',
                border: '2px dashed var(--primary)',
                background: 'rgba(37, 99, 235, 0.04)',
                color: 'var(--primary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.95rem'
              }}
            >
              <span className="material-icons" style={{ fontSize: '28px' }}>add_photo_alternate</span>
              <span>+ Add Triplet Card</span>
            </button>
          )}
        </div>
      </section>
    )
  }

  // mode === 'hero' (4-tile Bento layout from Xtra)
  const t1 = settings.tile1 || {
    title: 'Beauty',
    subtitle: 'Free extra gift',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
    link: '#products'
  }
  const t2 = settings.tile2 || {
    title: 'Unique gifts',
    subtitle: 'Free with every order',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80',
    link: '#products'
  }
  const t3 = settings.tile3 || {
    tag: 'Super',
    title: 'Earbuds',
    buttonText: '$79 Only',
    buttonLink: '#products',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
    bgColor: '#e0f2fe'
  }
  const t4 = settings.tile4 || {
    tag: 'Seen in',
    title: 'Fashion',
    buttonText: 'Shop now',
    buttonLink: '#products',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop&q=80'
  }

  return (
    <section style={{ margin: '16px 0 32px 0' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          alignItems: 'stretch'
        }}
      >
        {/* Column 1: Stacked 2 cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Tile 1 */}
          <div
            className="store-zoom-card"
            style={{
              flex: 1,
              minHeight: '210px',
              borderRadius: '20px',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              padding: '24px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
            }}
          >
            <LiveEditableImage
              currentUrl={t1.image}
              onChangeImage={url => onUpdateSettings?.({ tile1: { ...t1, image: url } })}
              isLiveEditing={isLiveEditing}
              style={{ position: 'absolute', inset: 0, zIndex: 0 }}
              label="Tile 1 Image"
            >
              {t1.image ? (
                <div
                  className="store-zoom-img"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${t1.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    zIndex: 0
                  }}
                />
              ) : (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 0
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '42px', color: 'rgba(255,255,255,0.25)' }}>
                    photo_library
                  </span>
                </div>
              )}
            </LiveEditableImage>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.1) 60%)', zIndex: 1, pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 2, color: '#ffffff' }}>
              <LiveEditableText
                value={t1.title}
                onChange={val => onUpdateSettings?.({ tile1: { ...t1, title: val } })}
                isLiveEditing={isLiveEditing}
                tag="h4"
                style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0 0 4px 0' }}
              />
              <LiveEditableText
                value={t1.subtitle}
                onChange={val => onUpdateSettings?.({ tile1: { ...t1, subtitle: val } })}
                isLiveEditing={isLiveEditing}
                style={{ fontSize: '0.85rem', margin: 0, opacity: 0.9, display: 'block' }}
              />
            </div>
          </div>

          {/* Tile 2 */}
          <div
            className="store-zoom-card"
            style={{
              flex: 1,
              minHeight: '210px',
              borderRadius: '20px',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              padding: '24px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
            }}
          >
            <LiveEditableImage
              currentUrl={t2.image}
              onChangeImage={url => onUpdateSettings?.({ tile2: { ...t2, image: url } })}
              isLiveEditing={isLiveEditing}
              style={{ position: 'absolute', inset: 0, zIndex: 0 }}
              label="Tile 2 Image"
            >
              {t2.image ? (
                <div
                  className="store-zoom-img"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${t2.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    zIndex: 0
                  }}
                />
              ) : (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 0
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '42px', color: 'rgba(255,255,255,0.25)' }}>
                    photo_library
                  </span>
                </div>
              )}
            </LiveEditableImage>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 60%)', zIndex: 1, pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 2, color: '#ffffff' }}>
              <LiveEditableText
                value={t2.title}
                onChange={val => onUpdateSettings?.({ tile2: { ...t2, title: val } })}
                isLiveEditing={isLiveEditing}
                tag="h4"
                style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0 0 4px 0' }}
              />
              <LiveEditableText
                value={t2.subtitle}
                onChange={val => onUpdateSettings?.({ tile2: { ...t2, subtitle: val } })}
                isLiveEditing={isLiveEditing}
                style={{ fontSize: '0.85rem', margin: 0, opacity: 0.9, display: 'block' }}
              />
            </div>
          </div>
        </div>

        {/* Column 2: Center Feature (e.g. Super Earbuds) */}
        <div
          className="store-zoom-card"
          style={{
            minHeight: '436px',
            borderRadius: '20px',
            overflow: 'hidden',
            position: 'relative',
            backgroundColor: t3.bgColor || '#e0f2fe',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            padding: '28px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
          }}
        >
          <LiveEditableImage
            currentUrl={t3.image}
            onChangeImage={url => onUpdateSettings?.({ tile3: { ...t3, image: url } })}
            isLiveEditing={isLiveEditing}
            style={{ position: 'absolute', inset: 0, zIndex: 0 }}
            label="Center Image"
          >
            {t3.image ? (
              <div
                className="store-zoom-img"
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url(${t3.image})`,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center 65%',
                  zIndex: 0
                }}
              />
            ) : (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 0
                }}
              >
                <span className="material-icons" style={{ fontSize: '64px', color: '#0284c7', opacity: 0.35 }}>
                  photo_library
                </span>
              </div>
            )}
          </LiveEditableImage>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <LiveEditableText
              value={t3.tag || ''}
              onChange={val => onUpdateSettings?.({ tile3: { ...t3, tag: val } })}
              isLiveEditing={isLiveEditing}
              placeholder="+ Add Tag"
              style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}
            />
            <LiveEditableText
              value={t3.title}
              onChange={val => onUpdateSettings?.({ tile3: { ...t3, title: val } })}
              isLiveEditing={isLiveEditing}
              tag="h3"
              style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0f172a', margin: '2px 0 14px 0', lineHeight: 1.1 }}
            />
            <span
              style={{
                display: 'inline-block',
                backgroundColor: '#facc15',
                color: '#0f172a',
                padding: '8px 22px',
                borderRadius: '30px',
                fontWeight: 700,
                fontSize: '0.85rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
              }}
            >
              <LiveEditableText
                value={t3.buttonText || '$79 Only'}
                onChange={val => onUpdateSettings?.({ tile3: { ...t3, buttonText: val } })}
                isLiveEditing={isLiveEditing}
              />
            </span>
          </div>
        </div>

        {/* Column 3: Seen in Fashion (Large Portrait) */}
        <div
          className="store-zoom-card"
          style={{
            minHeight: '436px',
            borderRadius: '20px',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '28px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
          }}
        >
          <LiveEditableImage
            currentUrl={t4.image}
            onChangeImage={url => onUpdateSettings?.({ tile4: { ...t4, image: url } })}
            isLiveEditing={isLiveEditing}
            style={{ position: 'absolute', inset: 0, zIndex: 0 }}
            label="Portrait Image"
          >
            {t4.image ? (
              <div
                className="store-zoom-img"
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url(${t4.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center 20%',
                  zIndex: 0
                }}
              />
            ) : (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 0
                }}
              >
                <span className="material-icons" style={{ fontSize: '64px', color: 'rgba(255,255,255,0.25)' }}>
                  photo_library
                </span>
              </div>
            )}
          </LiveEditableImage>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.2) 100%)', zIndex: 1, pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 2, color: '#ffffff' }}>
            <LiveEditableText
              value={t4.tag || ''}
              onChange={val => onUpdateSettings?.({ tile4: { ...t4, tag: val } })}
              isLiveEditing={isLiveEditing}
              placeholder="+ Add Tag"
              style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}
            />
            <LiveEditableText
              value={t4.title}
              onChange={val => onUpdateSettings?.({ tile4: { ...t4, title: val } })}
              isLiveEditing={isLiveEditing}
              tag="h3"
              style={{ fontSize: '2.2rem', fontWeight: 900, margin: '2px 0 14px 0', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
            />
            <span
              style={{
                display: 'inline-block',
                backgroundColor: '#facc15',
                color: '#0f172a',
                padding: '8px 22px',
                borderRadius: '30px',
                fontWeight: 700,
                fontSize: '0.85rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              <LiveEditableText
                value={t4.buttonText || 'Shop now'}
                onChange={val => onUpdateSettings?.({ tile4: { ...t4, buttonText: val } })}
                isLiveEditing={isLiveEditing}
              />
            </span>
          </div>

          {/* Floating mini cart button at bottom right */}
          <div style={{ position: 'relative', zIndex: 2, alignSelf: 'flex-end' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                color: '#ffffff',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 4px 12px rgba(16,185,129,0.4)',
                cursor: 'pointer'
              }}
            >
              <span className="material-icons" style={{ fontSize: '18px' }}>shopping_bag</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function HyperTrustBanner({
  settings,
  isLiveEditing,
  onUpdateSettings
}: {
  settings: Record<string, any>
  isLiveEditing?: boolean
  onUpdateSettings?: (s: Record<string, any>) => void
}) {
  return (
    <div
      style={{
        margin: '20px 0',
        borderRadius: '16px',
        border: '1px solid #e5e5e5',
        background: '#f9f9f9',
        padding: '24px 36px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}
    >
      <div>
        <LiveEditableText
          value={settings.title || 'Shopping made easy'}
          onChange={val => onUpdateSettings?.({ title: val })}
          isLiveEditing={isLiveEditing}
          tag="h3"
          style={{
            fontSize: '1.45rem',
            fontWeight: 800,
            color: '#191919',
            margin: '0 0 4px 0',
            letterSpacing: '-0.02em',
          }}
        />
        <LiveEditableText
          value={settings.description || 'enjoy reliability, secure deliveries and hassle-free returns.'}
          onChange={val => onUpdateSettings?.({ description: val })}
          isLiveEditing={isLiveEditing}
          style={{
            fontSize: '0.92rem',
            color: '#555555',
            margin: 0,
          }}
        />
      </div>

      <a
        href={settings.buttonLink || '#products'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '10px 24px',
          backgroundColor: '#191919',
          color: '#ffffff',
          borderRadius: '24px',
          fontWeight: 700,
          fontSize: '0.88rem',
          textDecoration: 'none',
          transition: 'background-color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#000000' }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#191919' }}
      >
        <LiveEditableText
          value={settings.buttonText || 'Start now'}
          onChange={val => onUpdateSettings?.({ buttonText: val })}
          isLiveEditing={isLiveEditing}
        />
      </a>
    </div>
  )
}

function HyperDarkAccessoriesBanner({
  settings,
  isLiveEditing,
  onUpdateSettings
}: {
  settings: Record<string, any>
  isLiveEditing?: boolean
  onUpdateSettings?: (s: Record<string, any>) => void
}) {
  return (
    <div
      style={{
        margin: '28px 0',
        borderRadius: '20px',
        backgroundColor: '#191919',
        color: '#ffffff',
        overflow: 'hidden',
        position: 'relative',
        padding: '40px 48px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
      }}
    >
      {/* Left text & button */}
      <div style={{ flex: '1 1 340px', maxWidth: '420px' }}>
        <LiveEditableText
          value={settings.title || 'Endless accessories. Epic prices.'}
          onChange={val => onUpdateSettings?.({ title: val })}
          isLiveEditing={isLiveEditing}
          tag="h2"
          style={{
            fontSize: '2.5rem',
            fontWeight: 850,
            color: '#ffffff',
            margin: '0 0 12px 0',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
          }}
        />

        <div style={{ margin: '0 0 26px 0' }}>
          <LiveEditableText
            value={settings.description || 'Browse millions of upgrades for your ride.'}
            onChange={val => onUpdateSettings?.({ description: val })}
            isLiveEditing={isLiveEditing}
            style={{
              fontSize: '1rem',
              color: '#a1a1aa',
              margin: 0,
            }}
          />
        </div>

        <a
          href={settings.buttonLink || '#products'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 28px',
            backgroundColor: '#ffffff',
            color: '#191919',
            borderRadius: '30px',
            fontWeight: 700,
            fontSize: '0.92rem',
            textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transition: 'transform 0.15s, background-color 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.backgroundColor = '#f4f4f5'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.backgroundColor = '#ffffff'
          }}
        >
          <LiveEditableText
            value={settings.buttonText || 'Shop now'}
            onChange={val => onUpdateSettings?.({ buttonText: val })}
            isLiveEditing={isLiveEditing}
          />
        </a>
      </div>

      {/* Right accessories floating cards */}
      <div
        style={{
          flex: '1 1 420px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '10px 0',
        }}
      >
        {/* Card 1: Racing Seat */}
        <div
          style={{
            width: '135px',
            height: '185px',
            borderRadius: '18px',
            background: '#ffffff',
            padding: '12px',
            display: 'grid',
            placeItems: 'center',
            transform: 'rotate(-4deg)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}
        >
          <img
            src="https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=300&auto=format&fit=crop&q=80"
            alt="Sport Seat"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        {/* Card 2: Floor Mats */}
        <div
          style={{
            width: '145px',
            height: '200px',
            borderRadius: '18px',
            background: '#ffffff',
            padding: '12px',
            display: 'grid',
            placeItems: 'center',
            transform: 'rotate(2deg) translateY(-8px)',
            boxShadow: '0 12px 28px rgba(0,0,0,0.35)',
          }}
        >
          <img
            src="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=300&auto=format&fit=crop&q=80"
            alt="All-Weather Floor Mats"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        {/* Card 3: Bull Bar / Bumper Guard */}
        <div
          style={{
            width: '135px',
            height: '185px',
            borderRadius: '18px',
            background: '#ffffff',
            padding: '12px',
            display: 'grid',
            placeItems: 'center',
            transform: 'rotate(6deg)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}
        >
          <img
            src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=300&auto=format&fit=crop&q=80"
            alt="Bumper Guard"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
      </div>
    </div>
  )
}

function PromoBannerSection({
  settings,
  brandColor,
  isLiveEditing,
  onUpdateSettings
}: {
  settings: Record<string, any>
  brandColor: string
  isLiveEditing?: boolean
  onUpdateSettings?: (s: Record<string, any>) => void
}) {
  if (settings.style === 'trust_banner') {
    return (
      <HyperTrustBanner
        settings={settings}
        isLiveEditing={isLiveEditing}
        onUpdateSettings={onUpdateSettings}
      />
    )
  }

  if (settings.style === 'dark_accessories') {
    return (
      <HyperDarkAccessoriesBanner
        settings={settings}
        isLiveEditing={isLiveEditing}
        onUpdateSettings={onUpdateSettings}
      />
    )
  }

  const bg = settings.bgColor || '#1e293b'
  const textColor = settings.textColor || '#ffffff'
  const image = settings.image !== undefined ? settings.image : 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=80'

  return (
    <div
      className="store-zoom-card"
      style={{
        background: bg,
        color: textColor,
        borderRadius: '20px',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        margin: '24px 0',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        border: '1px solid rgba(255,255,255,0.08)',
        position: 'relative'
      }}
    >
      <div style={{ padding: '36px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
        {(settings.badge || isLiveEditing) && (
          <span
            style={{
              display: 'inline-block',
              alignSelf: 'flex-start',
              padding: '4px 12px',
              borderRadius: '20px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              fontSize: '0.78rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '12px'
            }}
          >
            <LiveEditableText
              value={settings.badge || 'Limited Time'}
              onChange={val => onUpdateSettings?.({ badge: val })}
              isLiveEditing={isLiveEditing}
            />
          </span>
        )}
        <LiveEditableText
          value={settings.title || 'Mid-Season Mega Sale'}
          onChange={val => onUpdateSettings?.({ title: val })}
          isLiveEditing={isLiveEditing}
          tag="h3"
          style={{ fontSize: '2.2rem', fontWeight: 900, margin: '0 0 12px 0', lineHeight: 1.15, letterSpacing: '-0.02em' }}
        />
        <LiveEditableText
          value={settings.description || 'Save up to 40% on selected catalog highlights. In-store inspection & prompt shipping.'}
          onChange={val => onUpdateSettings?.({ description: val })}
          isLiveEditing={isLiveEditing}
          multiline={true}
          style={{ fontSize: '0.98rem', opacity: 0.85, lineHeight: 1.6, margin: '0 0 24px 0', maxWidth: '440px', display: 'block' }}
        />

        {(settings.buttonText || isLiveEditing) && (
          <span
            style={{
              alignSelf: 'flex-start',
              padding: '10px 22px',
              backgroundColor: brandColor,
              color: '#ffffff',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.9rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
          >
            <LiveEditableText
              value={settings.buttonText || 'Explore Deals'}
              onChange={val => onUpdateSettings?.({ buttonText: val })}
              isLiveEditing={isLiveEditing}
            />
          </span>
        )}
      </div>

      <div style={{ position: 'relative', minHeight: '220px' }}>
        <LiveEditableImage
          currentUrl={image}
          onChangeImage={url => onUpdateSettings?.({ image: url })}
          isLiveEditing={isLiveEditing}
          style={{ width: '100%', height: '100%' }}
          label="Banner Photo"
        >
          {image ? (
            <div
              className="store-zoom-img"
              style={{
                width: '100%',
                height: '100%',
                minHeight: '220px',
                backgroundImage: `url(${image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                minHeight: '220px',
                background: 'rgba(0,0,0,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.3)'
              }}
            >
              <span className="material-icons" style={{ fontSize: '56px' }}>
                photo_library
              </span>
            </div>
          )}
        </LiveEditableImage>
      </div>
    </div>
  )
}

function RichTextSection({
  settings,
  isLiveEditing,
  onUpdateSettings
}: {
  settings: Record<string, any>
  brandColor: string
  isLiveEditing?: boolean
  onUpdateSettings?: (s: Record<string, any>) => void
}) {
  const align = settings.align || 'center'

  return (
    <div
      style={{
        background: 'var(--panel)',
        borderRadius: '18px',
        padding: '36px 32px',
        margin: '24px 0',
        border: '1px solid var(--border)',
        textAlign: align as any
      }}
    >
      <LiveEditableText
        value={settings.heading || 'About Our Brand'}
        onChange={val => onUpdateSettings?.({ heading: val })}
        isLiveEditing={isLiveEditing}
        tag="h3"
        style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 14px 0', display: 'block' }}
      />
      <LiveEditableText
        value={settings.body || 'We are passionate about delivering top quality products with exceptional customer care.'}
        onChange={val => onUpdateSettings?.({ body: val })}
        isLiveEditing={isLiveEditing}
        multiline={true}
        style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 auto', maxWidth: '750px', display: 'block' }}
      />
    </div>
  )
}

function TestimonialsSection({
  settings,
  brandColor,
  isLiveEditing,
  onUpdateSettings
}: {
  settings: Record<string, any>
  brandColor: string
  isLiveEditing?: boolean
  onUpdateSettings?: (s: Record<string, any>) => void
}) {
  const title = settings.title || 'What Our Customers Say'
  const quotes: any[] = settings.quotes || [
    { id: 'q1', name: 'Sarah Jenkins', role: 'Interior Stylist', text: 'The quality of craftsmanship exceeded all my expectations.', rating: 5 },
    { id: 'q2', name: 'Marcus Vance', role: 'Verified Buyer', text: 'Fast delivery, eco-friendly packaging, and stunning aesthetic pieces.', rating: 5 }
  ]

  return (
    <section style={{ margin: '28px 0' }}>
      <LiveEditableText
        value={title}
        onChange={val => onUpdateSettings?.({ title: val })}
        isLiveEditing={isLiveEditing}
        tag="h3"
        style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 16px 0', textAlign: 'center', display: 'block' }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {quotes.map((q: any, idx: number) => (
          <div
            key={q.id || idx}
            style={{
              background: 'var(--panel)',
              borderRadius: '16px',
              padding: '22px',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px',
              position: 'relative'
            }}
          >
            {isLiveEditing && (
              <button
                type="button"
                onClick={() => {
                  const next = quotes.filter((_: any, i: number) => i !== idx)
                  onUpdateSettings?.({ quotes: next })
                }}
                title="Remove Review"
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  zIndex: 10
                }}
              >
                <span className="material-icons" style={{ fontSize: '12px' }}>close</span>
              </button>
            )}
            <div>
              <div style={{ display: 'flex', gap: '2px', color: '#f59e0b', marginBottom: '8px' }}>
                {Array.from({ length: q.rating || 5 }).map((_, i) => (
                  <span key={i} className="material-icons" style={{ fontSize: '18px' }}>star</span>
                ))}
              </div>
              <LiveEditableText
                value={q.text}
                onChange={val => {
                  const next = [...quotes]
                  next[idx] = { ...q, text: val }
                  onUpdateSettings?.({ quotes: next })
                }}
                isLiveEditing={isLiveEditing}
                multiline={true}
                style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5, display: 'block' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: brandColor, color: '#ffffff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                {q.name ? q.name.charAt(0).toUpperCase() : 'C'}
              </div>
              <div>
                <LiveEditableText
                  value={q.name}
                  onChange={val => {
                    const next = [...quotes]
                    next[idx] = { ...q, name: val }
                    onUpdateSettings?.({ quotes: next })
                  }}
                  isLiveEditing={isLiveEditing}
                  style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700 }}
                />
                <LiveEditableText
                  value={q.role || 'Verified Customer'}
                  onChange={val => {
                    const next = [...quotes]
                    next[idx] = { ...q, role: val }
                    onUpdateSettings?.({ quotes: next })
                  }}
                  isLiveEditing={isLiveEditing}
                  style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}
                />
              </div>
            </div>
          </div>
        ))}

        {isLiveEditing && (
          <button
            type="button"
            onClick={() => {
              const next = [...quotes, {
                id: 'q_' + Date.now(),
                name: 'Happy Customer',
                role: 'Verified Buyer',
                text: 'Absolutely love my purchase! High quality and fast delivery.',
                rating: 5
              }]
              onUpdateSettings?.({ quotes: next })
            }}
            style={{
              minHeight: '140px',
              borderRadius: '16px',
              border: '2px dashed var(--primary)',
              background: 'rgba(37, 99, 235, 0.04)',
              color: 'var(--primary)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.92rem'
            }}
          >
            <span className="material-icons" style={{ fontSize: '24px' }}>add_comment</span>
            <span>+ Add Review</span>
          </button>
        )}
      </div>
    </section>
  )
}

function FaqSection({
  settings,
  brandColor,
  isLiveEditing,
  onUpdateSettings
}: {
  settings: Record<string, any>
  brandColor: string
  isLiveEditing?: boolean
  onUpdateSettings?: (s: Record<string, any>) => void
}) {
  const title = settings.title || 'Frequently Asked Questions'
  const items: any[] = settings.items || [
    { id: 'f1', question: 'How long does shipping take?', answer: 'Standard shipping takes 3-5 business days. Express shipping is 1-2 days.' },
    { id: 'f2', question: 'What is your return policy?', answer: 'We offer a 30-day money-back guarantee on all undamaged items.' }
  ]
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <section style={{ margin: '28px 0', background: 'var(--panel)', borderRadius: '18px', padding: '28px', border: '1px solid var(--border)' }}>
      <LiveEditableText
        value={title}
        onChange={val => onUpdateSettings?.({ title: val })}
        isLiveEditing={isLiveEditing}
        tag="h3"
        style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 20px 0', display: 'block' }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.map((item, idx) => {
          const isOpen = openIdx === idx
          return (
            <div
              key={item.id || idx}
              style={{
                border: '1px solid var(--border)',
                borderRadius: '12px',
                overflow: 'hidden',
                background: isOpen ? 'var(--surface)' : 'transparent',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              {isLiveEditing && (
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation()
                    const next = items.filter((_: any, i: number) => i !== idx)
                    onUpdateSettings?.({ items: next })
                  }}
                  title="Remove FAQ Item"
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '44px',
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                    zIndex: 10
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '12px' }}>close</span>
                </button>
              )}
              <div
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text)',
                  fontSize: '0.96rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <LiveEditableText
                  value={item.question}
                  onChange={val => {
                    const next = [...items]
                    next[idx] = { ...item, question: val }
                    onUpdateSettings?.({ items: next })
                  }}
                  isLiveEditing={isLiveEditing}
                  style={{ flex: 1, paddingRight: '24px' }}
                />
                <span className="material-icons" style={{ fontSize: '20px', color: brandColor, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
                  expand_more
                </span>
              </div>
              {isOpen && (
                <div style={{ padding: '0 16px 16px 16px', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  <LiveEditableText
                    value={item.answer}
                    onChange={val => {
                      const next = [...items]
                      next[idx] = { ...item, answer: val }
                      onUpdateSettings?.({ items: next })
                    }}
                    isLiveEditing={isLiveEditing}
                    multiline={true}
                    style={{ display: 'block' }}
                  />
                </div>
              )}
            </div>
          )
        })}

        {isLiveEditing && (
          <button
            type="button"
            onClick={() => {
              const next = [...items, {
                id: 'faq_' + Date.now(),
                question: 'What is another frequent question?',
                answer: 'Provide clear, helpful information for your shoppers here.'
              }]
              onUpdateSettings?.({ items: next })
            }}
            style={{
              padding: '14px',
              borderRadius: '12px',
              border: '2px dashed var(--primary)',
              background: 'rgba(37, 99, 235, 0.04)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.9rem',
              marginTop: '6px'
            }}
          >
            <span className="material-icons" style={{ fontSize: '20px' }}>add_circle_outline</span>
            <span>+ Add FAQ Item</span>
          </button>
        )}
      </div>
    </section>
  )
}
