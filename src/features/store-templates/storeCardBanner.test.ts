import { describe, expect, it } from 'vitest'
import { getStoreCardBannerPath } from './storeCardBanner'

describe('getStoreCardBannerPath', () => {
  it('uses the Storefront Landing hero image before the legacy store cover', () => {
    expect(getStoreCardBannerPath({
      templateId: 'storefront-landing',
      templateContent: {
        'storefront-landing': { heroImage: 'store-assets/landing-hero.webp' },
        'boutique-grid': { bannerImage: 'store-assets/boutique-banner.webp' },
      },
      cover: 'https://example.com/older-cover.webp',
    })).toBe('store-assets/landing-hero.webp')
  })

  it('uses the Boutique Grid banner image before the legacy store cover', () => {
    expect(getStoreCardBannerPath({
      templateId: 'boutique-grid',
      templateContent: {
        'boutique-grid': { bannerImage: 'store-assets/boutique-banner.webp' },
      },
      cover: 'https://example.com/older-cover.webp',
    })).toBe('store-assets/boutique-banner.webp')
  })

  it('falls back to the store cover when the selected template has no banner', () => {
    expect(getStoreCardBannerPath({
      templateId: 'storefront-landing',
      templateContent: { 'storefront-landing': {} },
      cover: 'https://example.com/store-cover.webp',
    })).toBe('https://example.com/store-cover.webp')
  })
})
