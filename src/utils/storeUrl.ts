const configuredStoreDomain = import.meta.env.VITE_STORE_DOMAIN || ''

function isLocalhost(hostname: string) {
  return hostname === 'localhost' || hostname.endsWith('.localhost')
}

export function getStoreUrl(
  userId: string,
  subdomain?: string,
  configuredDomain = configuredStoreDomain,
  currentOrigin = window.location.origin,
) {
  const storePath = `/store/${encodeURIComponent(userId)}`
  const slug = subdomain?.trim().toLowerCase()
  const domain = configuredDomain.trim()

  if (!slug || !/^[a-z0-9-]+$/.test(slug) || !domain) return storePath

  const hasProtocol = /^https?:\/\//i.test(domain)
  const domainUrl = new URL(hasProtocol ? domain : `http://${domain}`)
  const hostname = domainUrl.hostname.toLowerCase()
  const localDomain = isLocalhost(hostname)
  const protocol = hasProtocol
    ? domainUrl.protocol
    : localDomain
      ? new URL(currentOrigin).protocol
      : 'https:'
  const port = domainUrl.port || (localDomain ? new URL(currentOrigin).port : '')

  return `${protocol}//${slug}.${hostname}${port ? `:${port}` : ''}/`
}

export function getStoreSubdomain(hostname: string, configuredDomain = configuredStoreDomain) {
  const domain = configuredDomain.trim()
  if (!domain) return ''

  const domainUrl = new URL(/^https?:\/\//i.test(domain) ? domain : `http://${domain}`)
  const domainHostname = domainUrl.hostname.toLowerCase()
  const normalizedHostname = hostname.toLowerCase()
  const suffix = `.${domainHostname}`

  return normalizedHostname.endsWith(suffix)
    ? normalizedHostname.slice(0, -suffix.length)
    : ''
}
