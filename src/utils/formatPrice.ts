export function formatZMWPrice(price: string | number | undefined | null): string {
  if (price === undefined || price === null || price === '') return 'ZMW 0'
  const str = String(price).trim()
  
  // Remove existing currency prefixes like ZMW, K, $, EUR, € and commas
  const cleaned = str.replace(/^(ZMW|K|\$|EUR|€|\s)+/i, '').replace(/,/g, '').trim()
  const num = parseFloat(cleaned)
  
  if (isNaN(num)) {
    return str.startsWith('ZMW') ? str : `ZMW ${str}`
  }
  
  return `ZMW ${num.toLocaleString('en-US')}`
}
