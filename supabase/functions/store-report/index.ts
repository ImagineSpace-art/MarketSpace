import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  STORE_REPORT_RATE_LIMIT,
  STORE_REPORT_RATE_WINDOW_SECONDS,
  validateStoreReportInput,
} from '../_shared/storeReportValidation.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type Json = Record<string, unknown>
type AuthenticatedContext = {
  admin: SupabaseClient
  userId: string
  emailVerified: boolean
}

function respond(body: Json, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function getObject(value: unknown): Json {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Json : {}
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

async function loadAuthenticatedContext(request: Request): Promise<AuthenticatedContext | Response> {
  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return respond({ error: 'Sign in to report this store.' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return respond({ error: 'Store reporting is not configured.' }, 503)
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  })
  const { data, error } = await authClient.auth.getUser()
  if (error || !data.user) return respond({ error: 'Sign in to report this store.' }, 401)

  return {
    admin: createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    }),
    userId: data.user.id,
    emailVerified: Boolean(data.user.email_confirmed_at),
  }
}

async function hashReporterId(userId: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`store-report:${userId}`))
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

async function ensureModerator(admin: SupabaseClient, userId: string) {
  const { data, error } = await admin.from('store_admins').select('user_id').eq('user_id', userId).maybeSingle()
  if (error) throw new Error('Moderator permissions could not be checked.')
  if (!data) return respond({ error: 'You are not authorized to moderate store reports.' }, 403)
  return null
}

async function submitReport(context: AuthenticatedContext, body: Json) {
  if (!context.emailVerified) {
    return respond({ error: 'Verify your email address before reporting a store.' }, 403)
  }

  const storeId = getString(body.storeId)
  if (!isUuid(storeId)) return respond({ error: 'Choose a valid store to report.' }, 400)

  const validated = validateStoreReportInput(body)
  if (validated.errors.length) {
    return respond({ error: validated.errors[0], details: validated.errors }, 400)
  }

  const { data: store, error: storeError } = await context.admin
    .from('stores')
    .select('id, user_id')
    .eq('id', storeId)
    .eq('status', 'approved')
    .maybeSingle()
  if (storeError) throw new Error('The store could not be checked for reporting.')
  if (!store) return respond({ error: 'Only approved stores can be reported.' }, 404)
  if (store.user_id === context.userId) return respond({ error: 'You cannot report your own store.' }, 400)

  const { data: withinLimit, error: rateLimitError } = await context.admin.rpc('consume_store_rate_limit', {
    p_rate_key: await hashReporterId(context.userId),
    p_action: 'store_report',
    p_limit: STORE_REPORT_RATE_LIMIT,
    p_window_seconds: STORE_REPORT_RATE_WINDOW_SECONDS,
  })
  if (rateLimitError) throw new Error('Report rate limiting is unavailable. Please try again later.')
  if (withinLimit !== true) return respond({ error: 'You have reached the daily report limit. Try again tomorrow.' }, 429)

  const { error: insertError } = await context.admin.from('store_reports').insert({
    store_id: storeId,
    reporter_id: context.userId,
    reason: validated.reason,
    details: validated.details,
  })
  if (insertError?.code === '23505') {
    return respond({ error: 'You already have an open report for this store.' }, 409)
  }
  if (insertError) throw new Error('Your report could not be submitted.')

  return respond({ success: true })
}

async function listOpenReports(context: AuthenticatedContext) {
  const unauthorized = await ensureModerator(context.admin, context.userId)
  if (unauthorized) return unauthorized

  const { data: reports, error: reportsError } = await context.admin
    .from('store_reports')
    .select('id, store_id, reason, details, created_at')
    .eq('status', 'open')
    .order('created_at', { ascending: true })
  if (reportsError) throw new Error('Open store reports could not be loaded.')

  const reportRows = reports || []
  const storeIds = [...new Set(reportRows.map(report => report.store_id))]
  const storesResult = storeIds.length
    ? await context.admin.from('stores').select('id, shop_name, subdomain').in('id', storeIds)
    : { data: [], error: null }
  if (storesResult.error) throw new Error('Reported store details could not be loaded.')

  const storesById = new Map((storesResult.data || []).map(store => [store.id, store]))
  const groups = new Map<string, {
    store: { id: string; shop_name: string; subdomain: string | null } | undefined
    reports: typeof reportRows
  }>()
  for (const report of reportRows) {
    if (!groups.has(report.store_id)) {
      groups.set(report.store_id, { store: storesById.get(report.store_id), reports: [] })
    }
    groups.get(report.store_id)?.reports.push(report)
  }
  return respond({
    reports: [...groups.values()].map(group => ({
      store: group.store,
      count: group.reports.length,
      reports: group.reports,
    })),
  })
}

async function reviewReport(context: AuthenticatedContext, body: Json) {
  const unauthorized = await ensureModerator(context.admin, context.userId)
  if (unauthorized) return unauthorized

  const reportId = getString(body.reportId)
  const decision = getString(body.decision)
  if (!isUuid(reportId) || !['dismiss', 'uphold'].includes(decision)) {
    return respond({ error: 'Choose a valid report and decision.' }, 400)
  }

  const { data, error } = await context.admin.rpc('review_store_report', {
    p_report_id: reportId,
    p_reviewer_id: context.userId,
    p_status: decision === 'dismiss' ? 'dismissed' : 'upheld',
  })
  if (error) {
    if (error.message.includes('no longer open')) {
      return respond({ error: 'This report has already been reviewed.' }, 409)
    }
    throw new Error('The report decision could not be saved and audited.')
  }
  return respond({ success: true, storeId: data })
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return respond({ error: 'Method not allowed.' }, 405)

  try {
    const context = await loadAuthenticatedContext(request)
    if (context instanceof Response) return context

    let body: Json
    try {
      body = getObject(await request.json())
    } catch {
      return respond({ error: 'Request body must be valid JSON.' }, 400)
    }
    const action = getString(body.action) || 'submit'
    if (action === 'submit') return await submitReport(context, body)
    if (action === 'open_reports') return await listOpenReports(context)
    if (action === 'review_report') return await reviewReport(context, body)
    return respond({ error: 'Unknown store report action.' }, 400)
  } catch (error) {
    console.error('Store report request failed:', error)
    return respond({
      error: error instanceof Error ? error.message : 'Store report request could not be completed.',
    }, 500)
  }
})
