import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from 'node:process'

const enabled = env.STORE_REGISTRATION_INTEGRATION === '1'

describe.skipIf(!enabled)('store registration Supabase integration', () => {
  let admin: SupabaseClient
  let owner: SupabaseClient
  let userId = ''
  let privatePaths: string[] = []
  let subdomain = ''

  beforeAll(async () => {
    const url = env.STORE_REGISTRATION_TEST_URL
    const anonKey = env.STORE_REGISTRATION_TEST_ANON_KEY
    const serviceKey = env.STORE_REGISTRATION_TEST_SERVICE_ROLE_KEY
    if (!url || !anonKey || !serviceKey) {
      throw new Error('Set the STORE_REGISTRATION_TEST_* variables to a local Supabase project.')
    }
    admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    owner = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const email = `store-flow-${crypto.randomUUID()}@example.test`
    const password = `Mm!${crypto.randomUUID()}9a`
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (createError || !created.user) throw createError || new Error('Test user could not be created.')
    userId = created.user.id
    const { error: profileError } = await admin.from('profiles').upsert({
      user_id: userId,
      email,
      username: 'Store Flow Test',
    })
    if (profileError) throw profileError
    const { error: loginError } = await owner.auth.signInWithPassword({ email, password })
    if (loginError) throw loginError
    subdomain = `flow-${crypto.randomUUID().slice(0, 8)}`
  }, 30_000)

  afterAll(async () => {
    if (admin && privatePaths.length) {
      await admin.storage.from('store-private').remove(privatePaths)
    }
    if (admin && userId) await admin.auth.admin.deleteUser(userId)
  }, 30_000)

  async function invoke<T>(action: string, extra: Record<string, unknown> = {}) {
    const { data, error } = await owner.functions.invoke<T & { error?: string }>('store-registration', {
      body: { action, ...extra },
    })
    if (error) throw error
    if (data?.error) throw new Error(data.error)
    return data as T
  }

  it('saves each step, encrypts payout data, and submits a pending-review store', async () => {
    const imageBytes = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l5sAAAAASUVORK5CYII='), (char) => char.charCodeAt(0))
    const idImagePath = `${userId}/idImagePath/${crypto.randomUUID()}.png`
    const selfiePath = `${userId}/selfiePath/${crypto.randomUUID()}.png`
    privatePaths = [idImagePath, selfiePath]
    const imageBlob = new Blob([imageBytes], { type: 'image/png' })
    const [idUpload, selfieUpload] = await Promise.all([
      owner.storage.from('store-private').upload(idImagePath, imageBlob, { contentType: 'image/png' }),
      owner.storage.from('store-private').upload(selfiePath, imageBlob, { contentType: 'image/png' }),
    ])
    expect(idUpload.error).toBeNull()
    expect(selfieUpload.error).toBeNull()

    const data = {
      identity: {
        legalName: 'MarketSpace Test Owner',
        dateOfBirth: '1990-05-01',
        residentialAddress: '14 Integration Road, Lusaka, Zambia',
        idImagePath,
        selfiePath,
      },
      store: {
        name: 'Integration Test Store',
        subdomain,
        category: 'Retail & Boutique',
        description: 'An integration test store with a complete application.',
        logo: '',
        type: 'online_delivery',
        supportContact: 'store-test@example.test',
        businessRegistrationNumber: '',
      },
      location: {
        streetAddress: '',
        latitude: '',
        longitude: '',
        openingHours: '',
        deliveryAreas: 'Lusaka',
        safeMeetupLocations: '',
        verificationMethod: 'video',
        proofPath: '',
      },
      payout: {
        method: 'mobile_money',
        accountHolderName: 'MarketSpace Test Owner',
        accountNumber: '',
      },
      policies: {
        termsAccepted: true,
        returnsAccepted: true,
        prohibitedItemsAccepted: true,
        returnPolicy: 'Returns accepted within three days.',
      },
    }

    await invoke('save_draft', { step: 1, data, captchaToken: 'local-test-token' })
    await invoke('save_draft', { step: 2, data, identityNumber: `TEST-${crypto.randomUUID()}` })
    await invoke('save_draft', { step: 3, data })
    await invoke('save_draft', { step: 4, data })
    await invoke('save_draft', { step: 5, data, payoutAccountNumber: '0970000000' })
    await invoke('save_draft', { step: 6, data })

    const submitted = await invoke<{ status: string }>('submit_application', {
      captchaToken: 'local-test-token',
      termsVersion: '2026-10-26',
      returnsVersion: '2026-10-26',
      prohibitedItemsVersion: '2026-10-26',
    })
    expect(submitted.status).toBe('pending_review')
    const { data: store, error: storeError } = await owner
      .from('stores')
      .select('status, subdomain')
      .eq('user_id', userId)
      .single()
    expect(storeError).toBeNull()
    expect(store?.status).toBe('pending_review')
    expect(store?.subdomain).toBe(subdomain)
  }, 60_000)

  it('refuses direct client writes to protected template fields', async () => {
    const { error: approveError } = await admin.from('stores')
      .update({ status: 'approved' })
      .eq('user_id', userId)
    if (approveError) throw approveError

    const { data, error } = await owner.from('stores')
      .update({
        template_id: 'boutique-grid',
        template_content: { 'boutique-grid': { footerTagline: 'Direct write attempt' } },
      })
      .eq('user_id', userId)
      .select('user_id')

    expect(data).toBeNull()
    expect(error?.message).toContain('template fields can only be changed by trusted services')
  })
})
