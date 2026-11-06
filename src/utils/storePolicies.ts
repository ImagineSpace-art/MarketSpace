export type StorePolicy = {
  id: string
  title: string
  content: string
}

export function normalizeStorePolicies(customerCare: unknown): StorePolicy[] {
  if (!customerCare || typeof customerCare !== 'object') return []
  const care = customerCare as Record<string, unknown>
  if (Array.isArray(care.policies)) {
    return care.policies.flatMap((value, index) => {
      if (!value || typeof value !== 'object') return []
      const policy = value as Record<string, unknown>
      const title = typeof policy.title === 'string' ? policy.title : ''
      const content = typeof policy.content === 'string' ? policy.content : ''
      if (!title.trim() || !content.trim()) return []
      return [{
        id: typeof policy.id === 'string' && policy.id ? policy.id : `policy-${index}`,
        title,
        content,
      }]
    })
  }

  return [
    { title: 'Delivery', content: care.deliveryPolicy },
    { title: 'Returns and exchanges', content: care.returnPolicy },
  ].flatMap((policy, index) => typeof policy.content === 'string' && policy.content.trim()
    ? [{ id: `legacy-policy-${index}`, title: policy.title, content: policy.content }]
    : [])
}

export function validateStorePolicies(policies: StorePolicy[]) {
  if (policies.length > 20) return 'Add no more than 20 store policies.'
  const titles = new Set<string>()
  for (const policy of policies) {
    const title = policy.title.trim()
    const content = policy.content.trim()
    if (!title || !content) return 'Complete or remove each policy you add.'
    if (title.length > 80) return 'Policy titles must be 80 characters or fewer.'
    if (content.length > 2000) return 'Each policy must be 2,000 characters or fewer.'
    const normalizedTitle = title.toLocaleLowerCase()
    if (titles.has(normalizedTitle)) return 'Each policy must have a different title.'
    titles.add(normalizedTitle)
  }
  return ''
}
