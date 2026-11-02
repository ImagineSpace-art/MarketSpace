import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from 'node:process'

const enabled = env.LISTING_MODERATION_INTEGRATION === '1'

describe.skipIf(!enabled)('listing moderation Supabase integration', () => {
  let admin: SupabaseClient
  let seller: SupabaseClient
  let noStoreSeller: SupabaseClient
  let probationSeller: SupabaseClient
  let sellerId = ''
  let noStoreSellerId = ''
  let probationSellerId = ''
  let trustedStoreId = ''
  let probationStoreId = ''
  let listingIds: number[] = []

  async function createSeller(client: SupabaseClient) {
    const email = `listing-moderation-${crypto.randomUUID()}@example.test`
    const password = `Mm!${crypto.randomUUID()}9a`
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
    if (error || !data.user) throw error || new Error('Listing moderation test user could not be created.')
    const { error: profileError } = await admin.from('profiles').upsert({
      user_id: data.user.id,
      email,
      username: 'Listing Moderation Test',
    })
    if (profileError) throw profileError
    const { error: signInError } = await client.auth.signInWithPassword({ email, password })
    if (signInError) throw signInError
    return data.user.id
  }

  async function createStore(userId: string, label: string, probationState: 'trusted' | 'probation', limit: number) {
    const { data, error } = await admin.from('stores').insert({
      user_id: userId,
      shop_name: `Listing Moderation ${label}`,
      status: 'approved',
      probation_state: probationState,
      active_listing_limit: limit,
      subdomain: `listing-test-${crypto.randomUUID().slice(0, 8)}`,
    }).select('id').single()
    if (error || !data) throw error || new Error('Listing moderation test store could not be created.')
    return data.id
  }

  async function createListing(client: SupabaseClient, userId: string, title: string, storeId?: string | null) {
    const { data, error } = await client.from('listings').insert({
      user_id: userId,
      store_id: storeId ?? null,
      title,
      description: 'Listing moderation integration test',
      price: 100,
      category: 'Test',
      status: 'Available',
      listing_type: 'item',
    }).select('*').single()
    if (error || !data) throw error || new Error('Listing moderation test listing could not be created.')
    listingIds.push(data.id)
    return data
  }

  async function invokeReviewQueue(client: SupabaseClient) {
    const { data, error } = await client.functions.invoke<{ error?: string }>('listing-review', {
      body: { action: 'pending_listings' },
    })
    if (!error) return { status: 200, data }
    if (error.context instanceof Response) {
      return { status: error.context.status, data: await error.context.clone().json() as { error?: string } }
    }
    throw error
  }

  beforeAll(async () => {
    const url = env.LISTING_MODERATION_TEST_URL
    const anonKey = env.LISTING_MODERATION_TEST_ANON_KEY
    const serviceKey = env.LISTING_MODERATION_TEST_SERVICE_ROLE_KEY
    if (!url || !anonKey || !serviceKey) {
      throw new Error('Set LISTING_MODERATION_TEST_* variables to a disposable local Supabase project.')
    }
    admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    seller = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
    noStoreSeller = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
    sellerId = await createSeller(seller)
    noStoreSellerId = await createSeller(noStoreSeller)
    trustedStoreId = await createStore(sellerId, 'Trusted', 'trusted', 10)

    probationSeller = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const probationEmail = `listing-probation-${crypto.randomUUID()}@example.test`
    const probationPassword = `Mm!${crypto.randomUUID()}9a`
    const { data: probationUser, error: probationError } = await admin.auth.admin.createUser({
      email: probationEmail,
      password: probationPassword,
      email_confirm: true,
    })
    if (probationError || !probationUser.user) throw probationError || new Error('Probation test user could not be created.')
    probationSellerId = probationUser.user.id
    const { error: probationProfileError } = await admin.from('profiles').upsert({
      user_id: probationSellerId,
      email: probationEmail,
      username: 'Listing Probation Test',
    })
    if (probationProfileError) throw probationProfileError
    const { error: probationSignInError } = await probationSeller.auth.signInWithPassword({
      email: probationEmail,
      password: probationPassword,
    })
    if (probationSignInError) throw probationSignInError
    probationStoreId = await createStore(probationSellerId, 'Probation', 'probation', 0)
    const probationListing = await createListing(probationSeller, probationSellerId, 'Probation listing', trustedStoreId)
    expect(probationListing.store_id).toBe(probationStoreId)
    expect(probationListing.moderation_status).toBe('pending')
  }, 30_000)

  afterAll(async () => {
    if (!admin) return
    if (listingIds.length) await admin.from('listings').delete().in('id', listingIds)
    if (trustedStoreId) await admin.from('stores').delete().eq('id', trustedStoreId)
    if (probationStoreId) await admin.from('stores').delete().eq('id', probationStoreId)
    if (sellerId) await admin.auth.admin.deleteUser(sellerId)
    if (noStoreSellerId) await admin.auth.admin.deleteUser(noStoreSellerId)
    if (probationSellerId) await admin.auth.admin.deleteUser(probationSellerId)
  }, 30_000)

  it('assigns the caller store server-side and auto-approves trusted store listings', async () => {
    const listing = await createListing(seller, sellerId, 'Trusted listing', null)
    expect(listing.store_id).toBe(trustedStoreId)
    expect(listing.moderation_status).toBe('approved')
  })

  it('keeps listings without an approved store pending and private from anonymous reads', async () => {
    const individual = createClient(
      env.LISTING_MODERATION_TEST_URL!,
      env.LISTING_MODERATION_TEST_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    const listing = await createListing(noStoreSeller, noStoreSellerId, 'Pending listing without store')
    expect(listing.store_id).toBeNull()
    expect(listing.moderation_status).toBe('pending')

    const { data: ownerRows, error: ownerError } = await noStoreSeller.from('listings').select('id,moderation_status').eq('id', listing.id)
    expect(ownerError).toBeNull()
    expect(ownerRows).toHaveLength(1)

    const { data: publicRows, error: publicError } = await individual.from('listings').select('id').eq('id', listing.id)
    expect(publicError).toBeNull()
    expect(publicRows).toEqual([])

    const { error: moderationError } = await noStoreSeller.from('listings')
      .update({ moderation_status: 'approved' })
      .eq('id', listing.id)
    expect(moderationError).not.toBeNull()

    const { error: rejectError } = await admin.from('listings')
      .update({ moderation_status: 'rejected', moderation_reason: 'Integration test reason' })
      .eq('id', listing.id)
    expect(rejectError).toBeNull()
    const { data: rejectedPublicRows, error: rejectedPublicError } = await individual.from('listings')
      .select('id')
      .eq('id', listing.id)
    expect(rejectedPublicError).toBeNull()
    expect(rejectedPublicRows).toEqual([])
    const { data: rejectedOwnerRows } = await noStoreSeller.from('listings')
      .select('moderation_status,moderation_reason')
      .eq('id', listing.id)
    expect(rejectedOwnerRows?.[0]).toMatchObject({
      moderation_status: 'rejected',
      moderation_reason: 'Integration test reason',
    })

    const { data: resubmittedRows, error: resubmitError } = await noStoreSeller.from('listings')
      .update({ title: 'Corrected rejected listing' })
      .eq('id', listing.id)
      .select('moderation_status,moderation_reason,reviewed_by,reviewed_at')
    expect(resubmitError).toBeNull()
    expect(resubmittedRows?.[0]).toMatchObject({
      moderation_status: 'pending',
      moderation_reason: null,
      reviewed_by: null,
      reviewed_at: null,
    })
  })

  it('refuses listing queue access for a signed-in non-moderator', async () => {
    const result = await invokeReviewQueue(noStoreSeller)
    expect(result.status).toBe(403)
    expect(result.data?.error).toContain('not authorized')
  })

  it('keeps moderators subject to owner protections and prevents self-review', async () => {
    const listing = await createListing(noStoreSeller, noStoreSellerId, 'Moderator-owned listing')
    const { error: moderatorError } = await admin.from('store_admins').insert({ user_id: noStoreSellerId })
    expect(moderatorError).toBeNull()

    const { error: ownerUpdateError } = await noStoreSeller.from('listings')
      .update({ moderation_status: 'approved' })
      .eq('id', listing.id)
    expect(ownerUpdateError).not.toBeNull()

    const { error: selfReviewError } = await admin.rpc('review_listing_moderation', {
      p_listing_id: listing.id,
      p_reviewer_id: noStoreSellerId,
      p_decision: 'approved',
      p_reason: '',
    })
    expect(selfReviewError?.message).toContain('cannot review their own listings')
    await admin.from('store_admins').delete().eq('user_id', noStoreSellerId)
  })

  it('keeps trusted store edits approved after rechecking the trust rule', async () => {
    const listing = await createListing(seller, sellerId, 'Approved before edit', trustedStoreId)
    const { error: approvalError } = await admin.from('listings')
      .update({ moderation_status: 'approved' })
      .eq('id', listing.id)
    expect(approvalError).toBeNull()

    const { data, error } = await seller.from('listings')
      .update({ title: 'Edited listing title' })
      .eq('id', listing.id)
      .select('moderation_status')
      .single()
    expect(error).toBeNull()
    expect(data?.moderation_status).toBe('approved')
  })

  it('returns an approved listing without a trusted store to pending review after an edit', async () => {
    const listing = await createListing(noStoreSeller, noStoreSellerId, 'Approved before edit')
    const { error: approvalError } = await admin.from('listings')
      .update({ moderation_status: 'approved' })
      .eq('id', listing.id)
    expect(approvalError).toBeNull()

    const { data, error } = await noStoreSeller.from('listings')
      .update({ title: 'Edited individual listing' })
      .eq('id', listing.id)
      .select('moderation_status')
      .single()
    expect(error).toBeNull()
    expect(data?.moderation_status).toBe('pending')
  })

  it('does not reopen removed listings after an owner edits their content', async () => {
    const listing = await createListing(noStoreSeller, noStoreSellerId, 'Removed listing')
    const { error: removeError } = await admin.from('listings')
      .update({ moderation_status: 'removed' })
      .eq('id', listing.id)
    expect(removeError).toBeNull()

    const { data, error } = await noStoreSeller.from('listings')
      .update({ title: 'Edited removed listing' })
      .eq('id', listing.id)
      .select('moderation_status')
      .single()
    expect(error).toBeNull()
    expect(data?.moderation_status).toBe('removed')
  })

  it('requires review for stores in probation and enforces the active-listing cap on approval', async () => {
    const listing = await createListing(probationSeller, probationSellerId, 'Probation review cap', trustedStoreId)
    expect(listing.store_id).toBe(probationStoreId)
    expect(listing.moderation_status).toBe('pending')

    const { error } = await admin.from('listings')
      .update({ moderation_status: 'approved' })
      .eq('id', listing.id)
    expect(error).not.toBeNull()
    expect(error?.message).toContain('active listing limit')
  })

  it('requires review for a trusted store after an upheld seller report', async () => {
    const { error: reportError } = await admin.from('store_reports').insert({
      store_id: trustedStoreId,
      reporter_id: noStoreSellerId,
      reason: 'other',
      details: 'Listing moderation integration test',
      status: 'upheld',
      reviewed_by: noStoreSellerId,
      reviewed_at: new Date().toISOString(),
    })
    expect(reportError).toBeNull()

    const listing = await createListing(seller, sellerId, 'Reported trusted seller listing', null)
    expect(listing.store_id).toBe(trustedStoreId)
    expect(listing.moderation_status).toBe('pending')
  })

  it('allows only the listing owner to delete a listing', async () => {
    const listing = await createListing(seller, sellerId, 'Owner deletion test', trustedStoreId)

    const { error: otherUserError } = await noStoreSeller.rpc('delete_owned_listing', {
      p_listing_id: listing.id,
    })
    expect(otherUserError).not.toBeNull()
    expect(otherUserError?.message).toContain('not found for the signed-in user')

    const { error: ownerError } = await seller.rpc('delete_owned_listing', {
      p_listing_id: listing.id,
    })
    expect(ownerError).toBeNull()

    const { data: remainingRows, error: verifyError } = await admin.from('listings')
      .select('id')
      .eq('id', listing.id)
    expect(verifyError).toBeNull()
    expect(remainingRows).toEqual([])
  })
})
