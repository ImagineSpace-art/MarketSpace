import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from 'node:process'

const enabled = env.SELLER_VERIFICATION_INTEGRATION === '1'

describe.skipIf(!enabled)('seller verification Supabase integration', () => {
  let admin: SupabaseClient
  let seller: SupabaseClient
  let moderator: SupabaseClient
  let sellerId = ''
  let moderatorId = ''
  const imagePaths: string[] = []

  async function invoke(client: SupabaseClient, body: Record<string, unknown>) {
    const { data, error } = await client.functions.invoke<Record<string, unknown>>('seller-verification', { body })
    if (!error) return { status: 200, data }
    if (error.context instanceof Response) {
      return { status: error.context.status, data: await error.context.clone().json() as Record<string, unknown> }
    }
    throw error
  }

  async function uploadImage(path: string) {
    const { error } = await seller.storage.from('store-private').upload(
      path,
      new Blob(['seller verification image'], { type: 'image/jpeg' }),
      { contentType: 'image/jpeg', upsert: false },
    )
    if (error) throw error
    imagePaths.push(path)
  }

  beforeAll(async () => {
    const url = env.SELLER_VERIFICATION_TEST_URL
    const anonKey = env.SELLER_VERIFICATION_TEST_ANON_KEY
    const serviceKey = env.SELLER_VERIFICATION_TEST_SERVICE_ROLE_KEY
    if (!url || !anonKey || !serviceKey) {
      throw new Error('Set SELLER_VERIFICATION_TEST_* variables to a disposable local Supabase project.')
    }
    admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    seller = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
    moderator = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })

    const email = `seller-verification-${crypto.randomUUID()}@example.test`
    const password = `Sv!${crypto.randomUUID()}9a`
    const phone = `+26097${crypto.randomUUID().replace(/\D/g, '').padEnd(7, '0').slice(0, 7)}`
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      phone,
      phone_confirm: true,
    })
    if (error || !data.user) throw error || new Error('Seller verification test user could not be created.')
    sellerId = data.user.id
    const { error: profileError } = await admin.from('profiles').upsert({
      user_id: sellerId,
      email,
      username: 'Seller Verification Test',
    })
    if (profileError) throw profileError
    const { error: signInError } = await seller.auth.signInWithPassword({ email, password })
    if (signInError) throw signInError

    const moderatorEmail = `seller-verification-moderator-${crypto.randomUUID()}@example.test`
    const moderatorPassword = `Sv!${crypto.randomUUID()}9a`
    const { data: moderatorData, error: moderatorError } = await admin.auth.admin.createUser({
      email: moderatorEmail,
      password: moderatorPassword,
      email_confirm: true,
    })
    if (moderatorError || !moderatorData.user) {
      throw moderatorError || new Error('Seller verification moderator test user could not be created.')
    }
    moderatorId = moderatorData.user.id
    const { error: moderatorProfileError } = await admin.from('profiles').upsert({
      user_id: moderatorId,
      email: moderatorEmail,
      username: 'Seller Verification Moderator',
    })
    if (moderatorProfileError) throw moderatorProfileError
    const { error: moderatorAssignmentError } = await admin.from('store_admins').insert({ user_id: moderatorId })
    if (moderatorAssignmentError) throw moderatorAssignmentError
    const { error: moderatorSignInError } = await moderator.auth.signInWithPassword({
      email: moderatorEmail,
      password: moderatorPassword,
    })
    if (moderatorSignInError) throw moderatorSignInError
  }, 30_000)

  afterAll(async () => {
    if (admin && imagePaths.length) {
      await admin.storage.from('store-private').remove(imagePaths)
    }
    if (admin && sellerId) await admin.from('store_admins').delete().eq('user_id', sellerId)
    if (admin && moderatorId) await admin.from('store_admins').delete().eq('user_id', moderatorId)
    if (admin && sellerId) {
      await admin.from('seller_verifications').delete().eq('user_id', sellerId)
      await admin.auth.admin.deleteUser(sellerId)
    }
    if (admin && moderatorId) await admin.auth.admin.deleteUser(moderatorId)
  }, 30_000)

  it('submits private images, exposes only the owner status, and preserves referenced images on rejected retries', async () => {
    const initialStatus = await invoke(seller, { action: 'status' })
    expect(initialStatus.status).toBe(200)
    expect(initialStatus.data.verification).toMatchObject({
      status: 'none',
      reason: null,
      reviewedAt: null,
      submittedAt: null,
    })

    const missingConsent = await invoke(seller, {
      action: 'submit',
      idNumber: '123456789',
      consentAccepted: false,
    })
    expect(missingConsent.status).toBe(400)

    const invalidNrc = await invoke(seller, {
      action: 'submit',
      idNumber: '12345A789',
      consentAccepted: true,
    })
    expect(invalidNrc.status).toBe(400)

    const idImagePath = `${sellerId}/seller-verification/id/${crypto.randomUUID()}.jpg`
    const selfiePath = `${sellerId}/seller-verification/selfie/${crypto.randomUUID()}.jpg`
    await uploadImage(idImagePath)
    await uploadImage(selfiePath)

    const submission = await invoke(seller, {
      action: 'submit',
      idNumber: '123456789',
      idImagePath,
      selfiePath,
      consentAccepted: true,
    })
    expect(submission.status).toBe(200)
    expect(submission.data).toMatchObject({ success: true, status: 'pending' })

    const { data: ownRows, error: ownReadError } = await seller
      .from('seller_verifications')
      .select('status, id_image_path, selfie_path, consented_at')
      .eq('user_id', sellerId)
    expect(ownReadError).toBeNull()
    expect(ownRows).toHaveLength(1)
    expect(ownRows?.[0]).toMatchObject({
      status: 'pending',
      id_image_path: idImagePath,
      selfie_path: selfiePath,
    })
    expect(ownRows?.[0].consented_at).toBeTruthy()

    const { error: directWriteError } = await seller.from('seller_verifications')
      .update({ status: 'approved' })
      .eq('user_id', sellerId)
    expect(directWriteError).not.toBeNull()

    const { error: protectedDeleteError } = await seller.storage.from('store-private').remove([idImagePath])
    expect(protectedDeleteError).not.toBeNull()

    const retry = await invoke(seller, {
      action: 'submit',
      idNumber: '987654321',
      idImagePath,
      selfiePath,
      consentAccepted: true,
    })
    expect(retry.status).toBe(409)
    for (const path of [idImagePath, selfiePath]) {
      const { data, error } = await admin.storage.from('store-private').info(path)
      expect(error).toBeNull()
      expect(data).not.toBeNull()
    }

    const unauthorizedQueue = await invoke(seller, { action: 'pending_reviews' })
    expect(unauthorizedQueue.status).toBe(403)

    const queue = await invoke(moderator, { action: 'pending_reviews' })
    expect(queue.status).toBe(200)
    expect(queue.data.verifications).toEqual([
      expect.objectContaining({
        user_id: sellerId,
        seller_name: 'Seller Verification Test',
        id_image_url: expect.stringContaining('token='),
        selfie_url: expect.stringContaining('token='),
      }),
    ])

    const { error: sellerModeratorError } = await admin.from('store_admins').insert({ user_id: sellerId })
    expect(sellerModeratorError).toBeNull()
    const selfReview = await invoke(seller, {
      action: 'review',
      userId: sellerId,
      decision: 'approve',
    })
    expect(selfReview.status).toBe(403)
    await admin.from('store_admins').delete().eq('user_id', sellerId)

    const review = await invoke(moderator, {
      action: 'review',
      userId: sellerId,
      decision: 'approve',
    })
    expect(review.status).toBe(200)
    expect(review.data).toMatchObject({
      success: true,
      verification: { user_id: sellerId, status: 'approved' },
    })

    const { data: publicStatus, error: publicStatusError } = await seller
      .from('public_seller_status')
      .select('is_verified')
      .eq('user_id', sellerId)
      .single()
    expect(publicStatusError).toBeNull()
    expect(publicStatus?.is_verified).toBe(true)

    const { data: auditRows, error: auditError } = await admin
      .from('seller_verification_audit_log')
      .select('user_id, actor_user_id, action')
      .eq('user_id', sellerId)
    expect(auditError).toBeNull()
    expect(auditRows).toEqual([
      expect.objectContaining({ user_id: sellerId, actor_user_id: moderatorId, action: 'approved' }),
    ])
  }, 30_000)
})
