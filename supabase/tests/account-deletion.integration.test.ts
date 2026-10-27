import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from 'node:process'

const enabled = env.ACCOUNT_DELETION_INTEGRATION === '1'

describe.skipIf(!enabled)('account deletion Edge Function integration', () => {
  let admin: SupabaseClient
  let owner: SupabaseClient
  let ownerId = ''
  let otherUserId = ''
  let privatePath = ''
  let ownerEmail = ''
  let ownerPassword = ''

  beforeAll(async () => {
    const url = env.STORE_REGISTRATION_TEST_URL
    const anonKey = env.STORE_REGISTRATION_TEST_ANON_KEY
    const serviceKey = env.STORE_REGISTRATION_TEST_SERVICE_ROLE_KEY
    if (!url || !anonKey || !serviceKey) {
      throw new Error('Set the STORE_REGISTRATION_TEST_* variables to a local Supabase project.')
    }
    admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    owner = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })

    ownerEmail = `account-delete-${crypto.randomUUID()}@example.test`
    ownerPassword = `Mm!${crypto.randomUUID()}9a`
    const ownerAccount = await admin.auth.admin.createUser({
      email: ownerEmail,
      password: ownerPassword,
      email_confirm: true,
    })
    if (ownerAccount.error || !ownerAccount.data.user) {
      throw ownerAccount.error || new Error('Deletion test account could not be created.')
    }
    ownerId = ownerAccount.data.user.id

    const otherAccount = await admin.auth.admin.createUser({
      email: `account-delete-other-${crypto.randomUUID()}@example.test`,
      password: `Mm!${crypto.randomUUID()}9a`,
      email_confirm: true,
    })
    if (otherAccount.error || !otherAccount.data.user) {
      throw otherAccount.error || new Error('Deletion boundary test account could not be created.')
    }
    otherUserId = otherAccount.data.user.id

    const { error: signInError } = await owner.auth.signInWithPassword({
      email: ownerEmail,
      password: ownerPassword,
    })
    if (signInError) throw signInError

    privatePath = `${ownerId}/deletion-test/${crypto.randomUUID()}.jpg`
    const { error: uploadError } = await owner.storage
      .from('store-private')
      .upload(privatePath, new Blob(['private test image'], { type: 'image/jpeg' }), { contentType: 'image/jpeg' })
    if (uploadError) throw uploadError
  }, 30_000)

  afterAll(async () => {
    if (!admin) return
    if (ownerId) {
      await admin.storage.from('store-private').remove([privatePath].filter(Boolean))
      await admin.auth.admin.deleteUser(ownerId)
    }
    if (otherUserId) await admin.auth.admin.deleteUser(otherUserId)
  }, 30_000)

  it('deletes only the signed-in account and removes its private storage files', async () => {
    const { data, error } = await owner.functions.invoke<{ success?: boolean; error?: string }>('account-deletion', {
      body: { userId: otherUserId },
    })

    expect(error).toBeNull()
    expect(data?.success).toBe(true)

    const { data: deletedOwner } = await admin.auth.admin.getUserById(ownerId)
    const { data: retainedOther } = await admin.auth.admin.getUserById(otherUserId)
    expect(deletedOwner.user).toBeNull()
    expect(retainedOther.user?.id).toBe(otherUserId)

    const { error: fileError } = await admin.storage.from('store-private').download(privatePath)
    expect(fileError).not.toBeNull()
  }, 30_000)
})
