import { describe, expect, it } from 'vitest'
import {
  STORE_ACCENT_PALETTE,
  getStoreTemplateSlots,
  validateDepartmentNames,
  validateStoreTemplateContent,
} from './storeTemplateSchema'

describe('store template slot validation', () => {
  const userId = 'seller-123'

  it('accepts valid content and trims text', () => {
    const result = validateStoreTemplateContent('boutique-grid', {
      bannerTitle: '  My shop  ',
      bannerImage: `${userId}/hero.webp`,
      instagramUrl: 'https://instagram.com/example',
      accentColor: STORE_ACCENT_PALETTE[0],
    }, userId)

    expect(result.errors).toEqual([])
    expect(result.content).toEqual({
      bannerTitle: 'My shop',
      bannerImage: `${userId}/hero.webp`,
      instagramUrl: 'https://instagram.com/example',
      accentColor: STORE_ACCENT_PALETTE[0],
    })
  })

  it('rejects overlong text, unsafe URLs, and unapproved colors', () => {
    const result = validateStoreTemplateContent('boutique-grid', {
      bannerTitle: 'x'.repeat(41),
      instagramUrl: 'javascript:alert(1)',
      facebookUrl: 'data:text/html,hi',
      accentColor: '#ffffff',
    }, userId)

    expect(result.errors).toHaveLength(4)
  })

  it('requires an image path in the current seller folder', () => {
    const result = validateStoreTemplateContent('storefront-landing', {
      heroImage: 'another-user/hero.webp',
      storyImage: `${userId}/../shared.png`,
      promoImage: 'data:image/png;base64,abc',
    }, userId)

    expect(result.errors).toHaveLength(3)
  })

  it('checks store names and tagline text for prohibited content', () => {
    const result = validateStoreTemplateContent('boutique-grid', {
      footerTagline: 'Our counterfeit collection',
    }, userId, 'Safe Shop')

    const badStoreName = validateStoreTemplateContent('boutique-grid', {}, userId, 'Fake ID Store')
    expect(result.errors).toEqual(['footerTagline contains prohibited content.'])
    expect(badStoreName.errors).toEqual(['The store name contains prohibited content.'])
  })

  it('keeps script-like input as plain slot data without interpreting it', () => {
    const text = '<script>alert(1)</script>'
    const result = validateStoreTemplateContent('boutique-grid', { shopHeading: text }, userId)

    expect(result.errors).toEqual([])
    expect(result.content.shopHeading).toBe(text)
  })

  it('limits departments and enforces length, uniqueness, and prohibited words', () => {
    expect(validateDepartmentNames(['  New  ', 'new']).errors)
      .toContain('Department names must be unique within a store.')
    expect(validateDepartmentNames(['x'.repeat(31)]).errors)
      .toContain('Department names must contain 1 to 30 characters.')
    expect(validateDepartmentNames(['Stolen goods']).errors)
      .toContain('Department names cannot contain prohibited content.')
    expect(validateDepartmentNames(Array.from({ length: 31 }, (_, index) => `Dept ${index}`)).errors)
      .toContain('A store can have no more than 30 departments.')
  })

  it('rejects unknown slots and non-string values', () => {
    const result = validateStoreTemplateContent('boutique-grid', {
      arbitraryHtml: '<script>alert(1)</script>',
      shopHeading: { value: 'not text' },
    }, userId)

    expect(result.errors).toEqual([
      'Unknown slot: arbitraryHtml.',
      'shopHeading must be a string.',
    ])
  })

  it('exposes the shared slot schema to the frontend in template order', () => {
    expect(getStoreTemplateSlots('boutique-grid').map(({ id }) => id)).toEqual([
      'logoImage',
      'bannerImage',
      'bannerTitle',
      'bannerSubtitle',
      'shopHeading',
      'aboutText',
      'footerTagline',
      'instagramUrl',
      'facebookUrl',
      'tiktokUrl',
      'whatsappNumber',
      'accentColor',
    ])
  })
})
