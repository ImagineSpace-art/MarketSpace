import { afterAll, describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from 'node:process'

const enabled = env.LISTING_MODERATION_INTEGRATION === '1'

describe.skipIf(!enabled)('individual seller database policy integration', () => {
  const url = env.LISTING_MODERATION_TEST_URL || ''
  const anonKey = env.LISTING_MODERATION_TEST_ANON_KEY || ''
  const serviceKey = env.LISTING_MODERATION_TEST_SERVICE_ROLE_KEY || ''
  const admin = url && serviceKey
    ? createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    : null
  const sellerClients: SupabaseClient[] = []
  const sellerIds: string[] = []
  const listingIds: number[] = []

  async function createSeller(phoneConfirmed: boolean) {
    if (!admin) throw new Error('Set LISTING_MODERATION_TEST_* variables to a disposable local Supabase project.')
    const client = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const email = `individual-policy-${crypto.randomUUID()}@example.test`
    const password = `Mm!${crypto.randomUUID()}9a`
    const phone = `+26097${crypto.randomUUID().replace(/\D/g, '').padEnd(7, '0').slice(0, 7)}`
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      ...(phoneConfirmed ? { phone, phone_confirm: true } : {}),
    })
    if (error || !data.user) throw error || new Error('Individual seller test user could not be created.')
    const { error: profileError } = await admin.from('profiles').upsert({
      user_id: data.user.id,
      email,
      username: 'Individual Seller Policy Test',
    })
    if (profileError) throw profileError
    const { error: signInError } = await client.auth.signInWithPassword({ email, password })
    if (signInError) throw signInError
    sellerClients.push(client)
    sellerIds.push(data.user.id)
    return { client, userId: data.user.id }
  }

  async function createListing(client: SupabaseClient, userId: string, title: string, category = 'Test') {
    const { data, error } = await client.from('listings').insert({
      user_id: userId,
      title,
      description: 'Individual seller policy integration test',
      price: 100,
      category,
      status: 'Available',
      listing_type: 'item',
    }).select('id,seller_type,moderation_status').single()
    if (error || !data) return { data: null, error }
    listingIds.push(data.id)
    return { data, error: null }
  }

  async function approveListing(listingId: number) {
    if (!admin) throw new Error('Supabase service-role client is unavailable.')
    return admin.from('listings')
      .update({ moderation_status: 'approved' })
      .eq('id', listingId)
      .select('id')
      .single()
  }

  afterAll(async () => {
    if (!admin) return
    if (listingIds.length) await admin.from('listings').delete().in('id', listingIds)
    for (const client of sellerClients) await client.auth.signOut()
    for (const userId of sellerIds) await admin.auth.admin.deleteUser(userId)
  }, 30_000)

  it('requires phone confirmation before a user creates their first individual listing', async () => {
    const { client, userId } = await createSeller(false)
    const { data, error } = await createListing(client, userId, 'Phone verification required')
    expect(data).toBeNull()
    expect(error?.message).toContain('Verify your phone number')
  })

  it('requires verification for high-risk categories and caps unverified sellers at three approved active listings', async () => {
    const { client, userId } = await createSeller(true)
    const highRiskListing = await createListing(client, userId, 'Unverified electronics', 'Electronics')
    expect(highRiskListing.data).toBeNull()
    expect(highRiskListing.error?.message).toContain('Identity verification is required')

    const listings = []
    for (let index = 1; index <= 4; index += 1) {
      const result = await createListing(client, userId, `Unverified listing ${index}`)
      expect(result.error).toBeNull()
      expect(result.data?.seller_type).toBe('individual')
      expect(result.data?.moderation_status).toBe('pending')
      if (result.data) listings.push(result.data)
    }

    for (const listing of listings.slice(0, 3)) {
      const { error } = await approveListing(listing.id)
      expect(error).toBeNull()
    }
    const { error: overLimitError } = await approveListing(listings[3].id)
    expect(overLimitError?.message).toContain('active listing limit of 3')
  })

  it('allows verified sellers to list high-risk categories and caps them at ten approved active listings', async () => {
    if (!admin) throw new Error('Supabase service-role client is unavailable.')
    const { client, userId } = await createSeller(true)
    const idHash = crypto.randomUUID().replace(/-/g, '').padEnd(64, '0').slice(0, 64)
    const { error: verificationError } = await admin.from('seller_verifications').insert({
      user_id: userId,
      status: 'approved',
      id_hash: idHash,
    })
    expect(verificationError).toBeNull()

    const listings = []
    const highRiskListing = await createListing(client, userId, 'Verified electronics', 'Electronics')
    expect(highRiskListing.error).toBeNull()
    if (highRiskListing.data) listings.push(highRiskListing.data)
    for (let index = 1; index <= 10; index += 1) {
      const result = await createListing(client, userId, `Verified listing ${index}`)
      expect(result.error).toBeNull()
      if (result.data) listings.push(result.data)
    }
    expect(listings).toHaveLength(11)

    for (const listing of listings.slice(0, 10)) {
      const { error } = await approveListing(listing.id)
      expect(error).toBeNull()
    }
    const { error: overLimitError } = await approveListing(listings[10].id)
    expect(overLimitError?.message).toContain('active listing limit of 10')
  })
})
