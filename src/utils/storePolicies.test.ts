import { describe, expect, it } from 'vitest'
import { normalizeStorePolicies, validateStorePolicies } from './storePolicies'

describe('store policies', () => {
  it('accepts a user-defined list and an empty list', () => {
    expect(validateStorePolicies([])).toBe('')
    expect(validateStorePolicies([{ id: '1', title: 'Pickup', content: 'Collect from the shop.' }])).toBe('')
  })

  it('rejects incomplete, repeated, and oversized policies', () => {
    expect(validateStorePolicies([{ id: '1', title: '', content: 'Details' }])).toContain('Complete or remove')
    expect(validateStorePolicies([
      { id: '1', title: 'Pickup', content: 'At the shop.' },
      { id: '2', title: 'pickup', content: 'At another place.' },
    ])).toContain('different title')
    expect(validateStorePolicies(Array.from({ length: 21 }, (_, index) => ({
      id: String(index),
      title: `Policy ${index}`,
      content: 'Details',
    })))).toContain('no more than 20')
  })

  it('reads legacy delivery and return policies as editable custom policies', () => {
    expect(normalizeStorePolicies({
      deliveryPolicy: 'Delivery details',
      returnPolicy: 'Return details',
    })).toEqual([
      { id: 'legacy-policy-0', title: 'Delivery', content: 'Delivery details' },
      { id: 'legacy-policy-1', title: 'Returns and exchanges', content: 'Return details' },
    ])
  })

  it('prefers the current custom policy list over legacy fields', () => {
    expect(normalizeStorePolicies({
      policies: [{ id: 'custom', title: 'Pickup', content: 'By appointment.' }],
      deliveryPolicy: 'Old delivery details',
    })).toEqual([{ id: 'custom', title: 'Pickup', content: 'By appointment.' }])
  })
})
