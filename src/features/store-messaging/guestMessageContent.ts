export type GuestStoreInquiryCard = {
  listingId?: number
  title?: string
  price?: number
  priceUnit?: string
  image?: string
  colors?: string[]
  size?: string | null
  quantity?: number
  phone?: string
  message?: string | null
  offer?: number | null
  isService?: boolean
  serviceArea?: string | null
}

function parseLegacyInquiry(content: string, listingId?: number) {
  const lines = content.split('\n').map((line) => line.trim())
  const inquiryMatch = /^Inquiry about (.+?)(?: \(ZMW ([\d,]+(?:\.\d{1,2})?)\))?\.$/.exec(lines[0] || '')
  const quantityMatch = /^Quantity:\s*(\d+)(?:;\s*size:\s*(.+?))?\.$/.exec(lines[1] || '')
  if (!inquiryMatch || !quantityMatch) return null

  let index = 2
  let offer: number | null = null
  let phone: string | undefined
  const offerMatch = /^Offer: ZMW ([\d,]+(?:\.\d{1,2})?)\.$/.exec(lines[index] || '')
  if (offerMatch) {
    offer = Number(offerMatch[1].replace(/,/g, ''))
    index++
  }
  const phoneMatch = /^Phone: (.+)\.$/.exec(lines[index] || '')
  if (phoneMatch) {
    phone = phoneMatch[1]
    index++
  }

  const price = inquiryMatch[2] ? Number(inquiryMatch[2].replace(/,/g, '')) : undefined
  return {
    listingId,
    title: inquiryMatch[1],
    ...(Number.isFinite(price) ? { price } : {}),
    quantity: Number(quantityMatch[1]),
    size: quantityMatch[2] || null,
    phone,
    offer,
    message: lines.slice(index).join('\n') || null,
    isService: false,
  } satisfies GuestStoreInquiryCard
}

export function normalizeGuestMessageContent(content: string, listingId?: number) {
  if (content.startsWith('[INQUIRY_CARD]') || content.startsWith('[ORDER_CARD]')) return content
  const legacyInquiry = parseLegacyInquiry(content, listingId)
  return legacyInquiry ? `[INQUIRY_CARD]${JSON.stringify(legacyInquiry)}` : content
}

export function getGuestMessagePreview(content: string) {
  const normalized = normalizeGuestMessageContent(content)
  if (normalized.startsWith('[INQUIRY_CARD]')) {
    try {
      const card = JSON.parse(normalized.slice('[INQUIRY_CARD]'.length)) as GuestStoreInquiryCard
      return card.title ? `Inquiry about ${card.title}` : card.isService ? 'Service inquiry' : 'Listing inquiry'
    } catch {
      return 'Listing inquiry'
    }
  }
  if (normalized.startsWith('[ORDER_CARD]')) return 'Purchase offer details'
  return normalized
}
