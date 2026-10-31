import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from 'node:process'

const enabled = env.AD_MODERATION_INTEGRATION === '1'

describe.skipIf(!enabled)('ad moderation Supabase integration', () => {
  let admin: SupabaseClient
  let owner: SupabaseClient
  let otherUser: SupabaseClient
  let ownerId = ''
  let otherUserId = ''
  let storeId = ''
  const adIds: string[] = []
  const engagementAdIds: string[] = []

  async function createUser(client: SupabaseClient, prefix: string) {
    const email = `${prefix}-${crypto.randomUUID()}@example.test`
    const password = `Aa!${crypto.randomUUID()}9z`
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
    if (error || !data.user) throw error || new Error('Ad moderation test user could not be created.')
    const { error: profileError } = await admin.from('profiles').upsert({
      user_id: data.user.id,
      email,
      username: prefix,
    })
    if (profileError) throw profileError
    const { error: signInError } = await client.auth.signInWithPassword({ email, password })
    if (signInError) throw signInError
    return data.user.id
  }

  beforeAll(async () => {
    const url = env.AD_MODERATION_TEST_URL
    const anonKey = env.AD_MODERATION_TEST_ANON_KEY
    const serviceKey = env.AD_MODERATION_TEST_SERVICE_ROLE_KEY
    if (!url || !anonKey || !serviceKey) {
      throw new Error('Set AD_MODERATION_TEST_* variables to a disposable local Supabase project.')
    }
    admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    owner = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
    otherUser = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
    ownerId = await createUser(owner, 'ad-moderation-owner')
    otherUserId = await createUser(otherUser, 'ad-moderation-other')

    const { data: store, error } = await admin.from('stores').insert({
      user_id: ownerId,
      shop_name: `Ad Moderation ${crypto.randomUUID()}`,
      status: 'approved',
      probation_state: 'probation',
      subdomain: `ad-test-${crypto.randomUUID().slice(0, 8)}`,
      ads: [],
    }).select('id').single()
    if (error || !store) throw error || new Error('Ad moderation test store could not be created.')
    storeId = store.id
  })

  afterAll(async () => {
    if (engagementAdIds.length) {
      await admin.from('ad_likes').delete().in('ad_id', engagementAdIds)
      await admin.from('ad_comments').delete().in('ad_id', engagementAdIds)
    }
    if (adIds.length) await admin.from('store_ads').delete().in('id', adIds)
    if (storeId) await admin.from('stores').delete().eq('id', storeId)
    if (ownerId) await admin.auth.admin.deleteUser(ownerId)
    if (otherUserId) await admin.auth.admin.deleteUser(otherUserId)
  })

  it('hides pending ads from other signed-in users while the owner can read them', async () => {
    const id = crypto.randomUUID()
    adIds.push(id)
    const { data: created, error: insertError } = await owner.from('store_ads').insert({
      id,
      store_id: storeId,
      user_id: ownerId,
      status: 'Active',
      ad_data: { headline: 'Pending test ad' },
    }).select('id,moderation_status').single()
    expect(insertError).toBeNull()
    expect(created?.moderation_status).toBe('pending')

    const { data: ownerRows, error: ownerError } = await owner.from('store_ads')
      .select('id').eq('id', id)
    const { data: otherRows, error: otherError } = await otherUser.from('store_ads')
      .select('id').eq('id', id)
    expect(ownerError).toBeNull()
    expect(otherError).toBeNull()
    expect(ownerRows).toHaveLength(1)
    expect(otherRows).toHaveLength(0)
  })

  it('does not allow an owner to set moderation status', async () => {
    const id = crypto.randomUUID()
    adIds.push(id)
    const { error: insertError } = await owner.from('store_ads').insert({
      id,
      store_id: storeId,
      user_id: ownerId,
      ad_data: { headline: 'Status protection test' },
    })
    expect(insertError).toBeNull()
    const { error } = await owner.from('store_ads')
      .update({ moderation_status: 'approved' })
      .eq('id', id)
    expect(error).not.toBeNull()

    const { data } = await owner.from('store_ads')
      .select('moderation_status').eq('id', id).single()
    expect(data?.moderation_status).toBe('pending')
  })

  it('rejects oversized or unsafe ad payloads', async () => {
    const oversizedId = crypto.randomUUID()
    const unsafeId = crypto.randomUUID()
    adIds.push(oversizedId, unsafeId)
    const { error: oversizedError } = await owner.from('store_ads').insert({
      id: oversizedId,
      store_id: storeId,
      user_id: ownerId,
      ad_data: { headline: 'x'.repeat(20_000) },
    })
    const { error: unsafeError } = await owner.from('store_ads').insert({
      id: unsafeId,
      store_id: storeId,
      user_id: ownerId,
      ad_data: { destinationUrl: 'javascript:alert(1)' },
    })
    expect(oversizedError).not.toBeNull()
    expect(unsafeError).not.toBeNull()
  })

  it('returns an approved ad to pending when a probation-store owner edits it', async () => {
    const id = crypto.randomUUID()
    adIds.push(id)
    const { error: seedError } = await admin.from('store_ads').insert({
      id,
      store_id: storeId,
      user_id: ownerId,
      status: 'Active',
      ad_data: { headline: 'Approved before edit' },
      moderation_status: 'approved',
    })
    expect(seedError).toBeNull()

    const { error } = await owner.from('store_ads')
      .update({ ad_data: { headline: 'Edited ad' } })
      .eq('id', id)
    expect(error).toBeNull()
    const { data } = await owner.from('store_ads')
      .select('moderation_status,moderation_reason,reviewed_at').eq('id', id).single()
    expect(data).toMatchObject({
      moderation_status: 'pending',
      moderation_reason: null,
      reviewed_at: null,
    })
  })

  it('preserves likes and comments by migrating legacy ad ids unchanged', async () => {
    const id = `legacy-${crypto.randomUUID()}`
    engagementAdIds.push(id)
    const { error: legacyError } = await admin.from('stores')
      .update({ ads: [{ id, status: 'Active', headline: 'Legacy ad to migrate' }] })
      .eq('id', storeId)
    expect(legacyError).toBeNull()

    const { error: likeError } = await admin.from('ad_likes').insert({
      ad_id: id,
      user_id: otherUserId,
    })
    expect(likeError).toBeNull()
    const { error: commentError } = await admin.from('ad_comments').insert({
      ad_id: id,
      user_id: otherUserId,
      content: 'Legacy engagement stays attached.',
    })
    expect(commentError).toBeNull()

    const { error: migrationError } = await admin.rpc('migrate_legacy_store_ads', {
      p_store_id: storeId,
    })
    expect(migrationError).toBeNull()

    const { data: migrated, error: adError } = await admin.from('store_ads')
      .select('id,moderation_status,ad_data').eq('id', id).single()
    expect(adError).toBeNull()
    expect(migrated).toMatchObject({
      id,
      moderation_status: 'approved',
      ad_data: { headline: 'Legacy ad to migrate' },
    })
    const { data: likes } = await admin.from('ad_likes').select('ad_id').eq('ad_id', id)
    const { data: comments } = await admin.from('ad_comments').select('ad_id').eq('ad_id', id)
    expect(likes).toEqual([{ ad_id: id }])
    expect(comments).toHaveLength(1)
    expect(comments?.[0].ad_id).toBe(id)
  })

  it('generates a safe id for a legacy ad that had no id', async () => {
    const headline = `Legacy ad without id ${crypto.randomUUID()}`
    const { error: legacyError } = await admin.from('stores')
      .update({ ads: [{ status: 'Active', headline }] })
      .eq('id', storeId)
    expect(legacyError).toBeNull()

    const { error: migrationError } = await admin.rpc('migrate_legacy_store_ads', {
      p_store_id: storeId,
    })
    expect(migrationError).toBeNull()

    const { data: migrated, error: adError } = await admin.from('store_ads')
      .select('id,ad_data')
      .eq('store_id', storeId)
      .eq('ad_data->>headline', headline)
      .single()
    expect(adError).toBeNull()
    expect(migrated?.id).toMatch(/^legacy-/)
    if (migrated?.id) adIds.push(migrated.id)
  })

  it('prevents a moderator from reviewing their own ad', async () => {
    const id = crypto.randomUUID()
    adIds.push(id)
    const { error: insertError } = await owner.from('store_ads').insert({
      id,
      store_id: storeId,
      user_id: ownerId,
      ad_data: { headline: 'Own ad review test' },
    })
    expect(insertError).toBeNull()
    const { error: moderatorError } = await admin.from('store_admins').insert({ user_id: ownerId })
    expect(moderatorError).toBeNull()

    const { error: reviewError } = await admin.rpc('review_store_ad_moderation', {
      p_ad_id: id,
      p_reviewer_id: ownerId,
      p_decision: 'approved',
      p_reason: '',
    })
    expect(reviewError?.message).toContain('cannot review their own ads')
    await admin.from('store_admins').delete().eq('user_id', ownerId)
  })

  it('notifies the seller after an ad approval or rejection', async () => {
    const id = crypto.randomUUID()
    adIds.push(id)
    const { error: insertError } = await owner.from('store_ads').insert({
      id,
      store_id: storeId,
      user_id: ownerId,
      ad_data: { headline: 'Seller notification test' },
    })
    expect(insertError).toBeNull()
    const { error: moderatorError } = await admin.from('store_admins').insert({ user_id: otherUserId })
    expect(moderatorError).toBeNull()

    const { error: reviewError } = await admin.rpc('review_store_ad_moderation', {
      p_ad_id: id,
      p_reviewer_id: otherUserId,
      p_decision: 'approved',
      p_reason: '',
    })
    expect(reviewError).toBeNull()
    const { data: notifications, error: notificationError } = await admin.from('notifications')
      .select('title,body')
      .eq('user_id', ownerId)
      .eq('title', 'Ad approved')
    expect(notificationError).toBeNull()
    expect(notifications?.some(item => item.body.includes('Seller notification test'))).toBe(true)
    await admin.from('store_admins').delete().eq('user_id', otherUserId)
  })
})
