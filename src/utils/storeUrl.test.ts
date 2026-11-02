import { describe, expect, it } from 'vitest'
import { getStoreSubdomain, getStoreUrl } from './storeUrl'

describe('store URLs', () => {
  it('creates a localhost subdomain URL and carries over the dev-server port', () => {
    expect(getStoreUrl('user-1', 'Elizabeth-Chishimba-Beauty', 'localhost', 'http://localhost:5173'))
      .toBe('http://elizabeth-chishimba-beauty.localhost:5173/')
  })

  it('supports a configured domain with a port', () => {
    expect(getStoreUrl('user-1', 'shop', 'localhost:5173', 'http://localhost:5173'))
      .toBe('http://shop.localhost:5173/')
  })

  it('uses the ID route when a store has no subdomain or domain configuration', () => {
    expect(getStoreUrl('user-1', undefined, 'localhost', 'http://localhost:5173'))
      .toBe('/store/user-1')
    expect(getStoreUrl('user-1', 'shop', '', 'http://localhost:5173'))
      .toBe('/store/user-1')
  })

  it('extracts tenant slugs even when the configured domain includes a port', () => {
    expect(getStoreSubdomain('shop.localhost', 'localhost:5173')).toBe('shop')
    expect(getStoreSubdomain('localhost', 'localhost:5173')).toBe('')
  })
})
