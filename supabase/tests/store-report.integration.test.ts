import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from 'node:process'

const enabled = env.STORE_REPORT_INTEGRATION === '1'

describe.skipIf(!enabled)('store report Supabase integration', () => {
  let admin: SupabaseClient
  let reporter: SupabaseClient
  let rateReporter: SupabaseClient
  let reporterId = ''
  let rateReporterId = ''
  let storeIds: string[] = []

  async function createTestUser(client: SupabaseClient, label: string) {
    const email = `store-report-${label}-${crypto.randomUUID()}@example.test`
    const password = `Mm!${crypto.randomUUID()}9a`
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
    if (error || !data.user) throw error || new Error('Report test account could not be created.')
    const { error: profileError } = await admin.from('profiles').upsert({
      user_id: data.user.id,
      email,
      username: 'Store Report Test',
    })
    if (profileError) throw profileError
    const { error: signInError } = await client.auth.signInWithPassword({ email, password })
    if (signInError) throw signInError
    return data.user.id
  }

  async function invokeReport(client: SupabaseClient, storeId: string) {
    const { data, error } = await client.functions.invoke<{ success?: boolean; error?: string }>('store-report', {
      body: { storeId, reason: 'other', details: 'Integration test report' },
    })
    if (!error) return { status: 200, data }
    if (error.context instanceof Response) {
      return { status: error.context.status, data: await error.context.clone().json() as { error?: string } }
    }
    throw error
  }

  beforeAll(async () => {
    const url = env.STORE_REGISTRATION_TEST_URL
    const anonKey = env.STORE_REGISTRATION_TEST_ANON_KEY
    const serviceKey = env.STORE_REGISTRATION_TEST_SERVICE_ROLE_KEY
    if (!url || !anonKey || !serviceKey) {
      throw new Error('Set the STORE_REGISTRATION_TEST_* variables to a local Supabase project.')
    }
    admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    reporter = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
    rateReporter = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
    reporterId = await createTestUser(reporter, 'rls')
    rateReporterId = await createTestUser(rateReporter, 'rate')

    const stores = Array.from({ length: 6 }, (_, index) => ({
      shop_name: `Report Integration Store ${index + 1}`,
      subdomain: `report-test-${crypto.randomUUID().slice(0, 8)}`,
      status: 'approved',
    }))
    const { data, error } = await admin.from('stores').insert(stores).select('id')
    if (error || !data) throw error || new Error('Report test stores could not be created.')
    storeIds = data.map(store => store.id)
  }, 30_000)

  afterAll(async () => {
    if (!admin) return
    if (storeIds.length) await admin.from('stores').delete().in('id', storeIds)
    if (reporterId) await admin.auth.admin.deleteUser(reporterId)
    if (rateReporterId) {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`store-report:${rateReporterId}`))
      const rateKey = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
      await admin.from('store_registration_rate_limits').delete().eq('rate_key', rateKey).eq('action', 'store_report')
      await admin.auth.admin.deleteUser(rateReporterId)
    }
  }, 30_000)

  it('prevents reading reports, spoofing reporter identity, and duplicate open reports', async () => {
    const { error: insertError } = await reporter.from('store_reports').insert({
      store_id: storeIds[0],
      reporter_id: reporterId,
      reason: 'other',
      details: 'RLS test report',
    })
    expect(insertError).toBeNull()

    const { data: hiddenReports, error: readError } = await reporter
      .from('store_reports')
      .select('id')
      .eq('store_id', storeIds[0])
    expect(readError).toBeNull()
    expect(hiddenReports).toEqual([])

    const { error: spoofError } = await reporter.from('store_reports').insert({
      store_id: storeIds[1],
      reporter_id: rateReporterId,
      reason: 'other',
      details: 'Spoofed reporter test',
    })
    expect(spoofError?.code).toBe('42501')

    const { error: duplicateError } = await reporter.from('store_reports').insert({
      store_id: storeIds[0],
      reporter_id: reporterId,
      reason: 'other',
      details: 'Duplicate report test',
    })
    expect(duplicateError?.code).toBe('23505')
  })

  it('limits report submissions to five per user per day', async () => {
    for (const storeId of storeIds.slice(0, 5)) {
      const result = await invokeReport(rateReporter, storeId)
      expect(result.status).toBe(200)
      expect(result.data?.success).toBe(true)
    }

    const limited = await invokeReport(rateReporter, storeIds[5])
    expect(limited.status).toBe(429)
    expect(limited.data.error).toContain('daily report limit')
  }, 30_000)
})
