import type { BusinessProfile } from '../../types'

export function getStoreCardBannerPath(
  store: Pick<BusinessProfile, 'templateId' | 'templateContent' | 'cover'>,
): string {
  const templateBanner = store.templateId === 'storefront-landing'
    ? store.templateContent?.['storefront-landing']?.heroImage
    : store.templateContent?.['boutique-grid']?.bannerImage
  return templateBanner || store.cover || ''
}
