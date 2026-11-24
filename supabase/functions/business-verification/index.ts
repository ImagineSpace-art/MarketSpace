import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  canGrantBusinessVerification,
  isBusinessDocumentType,
  isChallengeCodeLive,
  isValidDocumentNumber,
  isValidEndorserPhone,
  isValidPersonOrRole,
  validateBusinessEvidencePath,
} from '../_shared/businessVerificationValidation.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const PRIVATE_BUCKET = 'store-private'
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Errors whose message is safe and useful to show to the person who caused them. */
class UserError extends Error {}

type Json = Record<string, unknown>
type Context = {
  admin: ReturnType<typeof createClient>
  userId: string
}

function respond(body: Json, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function fail(message: string, status = 400) {
  return respond({ error: message }, status)
}

function getObject(value: unknown): Json {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Json : {}
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

async function loadContext(request: Request): Promise<Context | Response> {
  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return fail('Sign in to continue.', 401)

  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !anonKey || !serviceRoleKey) return fail('Business verification service is not configured.', 503)

  const authClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } })
  const { data, error } = await authClient.auth.getUser()
  if (error || !data.user) return fail('Your sign-in session has expired. Please sign in again.', 401)

  return {
    admin: createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } }),
    userId: data.user.id,
  }
}

async function isModerator(context: Context) {
  const { data, error } = await context.admin
    .from('store_admins')
    .select('user_id')
    .eq('user_id', context.userId)
    .maybeSingle()
  if (error) throw new Error('Moderator permissions could not be checked.')
  return Boolean(data)
}

/** RAISE EXCEPTION messages from our SQL functions are written for users. */
function rpcFailure(error: { code?: string; message: string }, fallback: string) {
  if (error.code === 'P0001') return fail(error.message, 400)
  console.error(fallback, error)
  throw new Error(fallback)
}

async function hashRateLimitUser(userId: string) {
  const secret = Deno.env.get('RATE_LIMIT_HASH_SECRET') || Deno.env.get('STORE_ID_HASH_SECRET')
  if (!secret) throw new Error('Rate-limit hashing is not configured.')
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`business-verification:${userId}`))
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

async function enforceSubmissionLimit(context: Context) {
  const { data, error } = await context.admin.rpc('consume_store_rate_limit', {
    p_rate_key: await hashRateLimitUser(context.userId),
    p_action: 'business_verification_submit',
    p_limit: 6,
    p_window_seconds: 86400,
  })
  if (error) throw new Error('Submission rate limiting is unavailable. Please retry later.')
  if (data !== true) throw new UserError('You have reached the limit of six verification submissions today.')
}

async function verifyPrivateImage(context: Context, path: string, label: string) {
  const { data, error } = await context.admin.storage.from(PRIVATE_BUCKET).info(path)
  if (error || !data) throw new UserError(`The uploaded ${label} could not be verified.`)
  const mimeType = getString(data.contentType).toLowerCase()
  const size = Number(data.size)
  if (!ALLOWED_IMAGE_TYPES.has(mimeType) || !Number.isFinite(size) || size <= 0 || size > MAX_IMAGE_SIZE_BYTES) {
    throw new UserError(`${label} must be a JPEG, PNG, or WebP photo no larger than 8 MB.`)
  }
}

async function signedUrl(context: Context, path: string | null) {
  if (!path) return null
  const { data, error } = await context.admin.storage.from(PRIVATE_BUCKET).createSignedUrl(path, 600)
  if (error || !data) throw new Error('Evidence could not be prepared for secure review.')
  return data.signedUrl
}

async function loadOwnStore(context: Context) {
  const { data, error } = await context.admin
    .from('stores')
    .select('id, shop_name, status, business_verified_at')
    .eq('user_id', context.userId)
    .maybeSingle()
  if (error) throw new Error('Your store could not be loaded.')
  return data
}

// ---------------------------------------------------------------------------
// Seller actions
// ---------------------------------------------------------------------------

async function getStatus(context: Context) {
  const store = await loadOwnStore(context)
  if (!store) return respond({ store: null })

  const [documents, videoChecks, endorsements] = await Promise.all([
    context.admin.from('store_business_documents')
      .select('id, doc_type, doc_number, status, reason, created_at, reviewed_at')
      .eq('store_id', store.id).order('created_at', { ascending: false }).limit(5),
    context.admin.from('store_video_checks')
      .select('id, challenge_code, code_expires_at, status, notes, created_at, reviewed_at')
      .eq('store_id', store.id).order('created_at', { ascending: false }).limit(1),
    context.admin.from('store_endorsements')
      .select('id, endorser_name, endorser_role, status, notes, created_at, reviewed_at')
      .eq('store_id', store.id).order('created_at', { ascending: false }).limit(5),
  ])
  if (documents.error || videoChecks.error || endorsements.error) {
    throw new Error('Your verification status could not be loaded.')
  }

  const latestVideo = videoChecks.data?.[0] || null
  return respond({
    store: {
      id: store.id,
      shopName: store.shop_name,
      approved: store.status === 'approved',
      businessVerifiedAt: store.business_verified_at,
    },
    documents: documents.data || [],
    // The code is only shown while it is live, so the seller can hold it up during the call.
    videoCheck: latestVideo
      ? {
          id: latestVideo.id,
          status: latestVideo.status,
          notes: latestVideo.notes,
          reviewedAt: latestVideo.reviewed_at,
          challengeCode: latestVideo.status === 'pending' && isChallengeCodeLive(latestVideo.code_expires_at)
            ? latestVideo.challenge_code
            : null,
          codeExpiresAt: latestVideo.status === 'pending' ? latestVideo.code_expires_at : null,
        }
      : null,
    endorsements: endorsements.data || [],
  })
}

async function requireApprovedUnverifiedStore(context: Context) {
  const store = await loadOwnStore(context)
  if (!store) throw new UserError('Open and get approval for a store before applying for business verification.')
  if (store.status !== 'approved') throw new UserError('Only approved stores can apply for business verification.')
  if (store.business_verified_at) throw new UserError('Your store is already business verified.')
  return store
}

async function submitDocument(context: Context, body: Json) {
  const docType = getString(body.docType)
  const docNumber = getString(body.docNumber)
  const filePath = getString(body.filePath)
  if (!isBusinessDocumentType(docType)) return fail('Choose a valid document type.')
  if (!isValidDocumentNumber(docNumber)) return fail('Enter the document number (3 to 40 letters, numbers, spaces or - / . _).')
  if (!validateBusinessEvidencePath(filePath, context.userId, 'document')) {
    return fail('Upload the document photo to your private verification folder.')
  }

  let uploaded = false
  try {
    const store = await requireApprovedUnverifiedStore(context)
    const { data: pending, error: pendingError } = await context.admin
      .from('store_business_documents').select('id').eq('store_id', store.id).eq('status', 'pending').limit(1)
    if (pendingError) throw new Error('Your document records could not be checked.')
    if (pending?.length) return fail('Your document is already waiting for review.', 409)

    await enforceSubmissionLimit(context)
    await verifyPrivateImage(context, filePath, 'document photo')

    const { data, error } = await context.admin.from('store_business_documents').insert({
      store_id: store.id,
      doc_type: docType,
      doc_number: docNumber,
      file_path: filePath,
    }).select('id').single()
    if (error) {
      if (error.code === '23505') return fail('Your document is already waiting for review.', 409)
      throw new Error('Your document could not be saved.')
    }
    uploaded = true

    await context.admin.from('business_verification_audit_log').insert({
      store_id: store.id,
      actor_user_id: context.userId,
      action: 'document_submitted',
      details: { document_id: data.id, doc_type: docType },
    })
    return respond({ success: true, id: data.id })
  } catch (error) {
    console.error('Business document submission failed:', error)
    if (error instanceof UserError) return fail(error.message, 400)
    return fail(error instanceof Error ? error.message : 'Your document could not be submitted.', 500)
  } finally {
    if (!uploaded) await context.admin.storage.from(PRIVATE_BUCKET).remove([filePath])
  }
}

async function submitEndorsement(context: Context, body: Json) {
  const endorserName = getString(body.endorserName)
  const endorserRole = getString(body.endorserRole)
  const endorserPhone = getString(body.endorserPhone)
  const letterPath = getString(body.letterPath)
  if (!isValidPersonOrRole(endorserName)) return fail('Enter the endorser’s full name.')
  if (!isValidPersonOrRole(endorserRole)) return fail('Enter the endorser’s role, for example market chairperson.')
  if (!isValidEndorserPhone(endorserPhone)) return fail('Enter a phone number with 9 to 15 digits.')
  if (!validateBusinessEvidencePath(letterPath, context.userId, 'endorsement')) {
    return fail('Upload the endorsement letter to your private verification folder.')
  }

  let saved = false
  try {
    const store = await requireApprovedUnverifiedStore(context)
    const { data: pending, error: pendingError } = await context.admin
      .from('store_endorsements').select('id').eq('store_id', store.id).eq('status', 'pending').limit(1)
    if (pendingError) throw new Error('Your endorsement records could not be checked.')
    if (pending?.length) return fail('Your endorsement is already waiting for review.', 409)

    await enforceSubmissionLimit(context)
    await verifyPrivateImage(context, letterPath, 'endorsement letter photo')

    const { data, error } = await context.admin.from('store_endorsements').insert({
      store_id: store.id,
      endorser_name: endorserName,
      endorser_role: endorserRole,
      endorser_phone: endorserPhone,
      letter_path: letterPath,
    }).select('id').single()
    if (error) {
      if (error.code === '23505') return fail('Your endorsement is already waiting for review.', 409)
      throw new Error('Your endorsement could not be saved.')
    }
    saved = true

    await context.admin.from('business_verification_audit_log').insert({
      store_id: store.id,
      actor_user_id: context.userId,
      action: 'endorsement_submitted',
      details: { endorsement_id: data.id },
    })
    return respond({ success: true, id: data.id })
  } catch (error) {
    console.error('Business endorsement submission failed:', error)
    if (error instanceof UserError) return fail(error.message, 400)
    return fail(error instanceof Error ? error.message : 'Your endorsement could not be submitted.', 500)
  } finally {
    if (!saved) await context.admin.storage.from(PRIVATE_BUCKET).remove([letterPath])
  }
}

// ---------------------------------------------------------------------------
// Moderator actions
// ---------------------------------------------------------------------------

async function loadQueue(context: Context, body: Json) {
  if (!await isModerator(context)) return fail('You are not authorized to review business verification.', 403)
  const scope = getString(body.scope) === 'verified' ? 'verified' : 'pending'

  const [documents, videoChecks, endorsements] = await Promise.all([
    context.admin.from('store_business_documents').select('*').order('created_at', { ascending: false }).limit(500),
    context.admin.from('store_video_checks').select('*').order('created_at', { ascending: false }).limit(500),
    context.admin.from('store_endorsements').select('*').order('created_at', { ascending: false }).limit(500),
  ])
  if (documents.error || videoChecks.error || endorsements.error) {
    throw new Error('The business verification queue could not be loaded.')
  }

  const storeIds = Array.from(new Set([
    ...(documents.data || []).map(row => row.store_id),
    ...(videoChecks.data || []).map(row => row.store_id),
    ...(endorsements.data || []).map(row => row.store_id),
  ]))
  const verifiedFilter = scope === 'verified'

  if (scope === 'verified') {
    // Stores that were verified may have no evidence rows left to list, so query them directly.
    const { data: verifiedStores, error } = await context.admin
      .from('stores').select('id').not('business_verified_at', 'is', null).limit(200)
    if (error) throw new Error('Verified stores could not be loaded.')
    for (const store of verifiedStores || []) if (!storeIds.includes(store.id)) storeIds.push(store.id)
  }

  const { data: stores, error: storesError } = storeIds.length
    ? await context.admin.from('stores')
        .select('id, user_id, shop_name, subdomain, status, business_verified_at')
        .in('id', storeIds).eq('status', 'approved')
    : { data: [], error: null }
  if (storesError) throw new Error('Stores could not be loaded.')

  const wanted = (stores || []).filter(store => verifiedFilter ? store.business_verified_at : !store.business_verified_at)

  const items = await Promise.all(wanted.map(async store => {
    const storeDocuments = (documents.data || []).filter(row => row.store_id === store.id)
    const storeVideoChecks = (videoChecks.data || []).filter(row => row.store_id === store.id)
    const storeEndorsements = (endorsements.data || []).filter(row => row.store_id === store.id)
    return {
      store_id: store.id,
      shop_name: store.shop_name,
      subdomain: store.subdomain,
      is_own_store: store.user_id === context.userId,
      business_verified_at: store.business_verified_at,
      can_grant: canGrantBusinessVerification({
        documents: storeDocuments,
        videoChecks: storeVideoChecks,
        endorsements: storeEndorsements,
      }),
      documents: await Promise.all(storeDocuments.slice(0, 5).map(async row => ({
        id: row.id,
        doc_type: row.doc_type,
        doc_number: row.doc_number,
        status: row.status,
        reason: row.reason,
        checked_against_source: row.checked_against_source,
        created_at: row.created_at,
        file_url: row.status === 'pending' || row.status === 'verified' ? await signedUrl(context, row.file_path) : null,
      }))),
      video_checks: storeVideoChecks.slice(0, 3).map(row => ({
        id: row.id,
        status: row.status,
        challenge_code: row.challenge_code,
        code_expires_at: row.code_expires_at,
        originals_seen: row.originals_seen,
        shop_shown: row.shop_shown,
        code_matched: row.code_matched,
        notes: row.notes,
        created_at: row.created_at,
      })),
      endorsements: await Promise.all(storeEndorsements.slice(0, 5).map(async row => ({
        id: row.id,
        endorser_name: row.endorser_name,
        endorser_role: row.endorser_role,
        endorser_phone: row.endorser_phone,
        status: row.status,
        notes: row.notes,
        created_at: row.created_at,
        letter_url: row.status === 'pending' || row.status === 'confirmed' ? await signedUrl(context, row.letter_path) : null,
      }))),
    }
  }))

  items.sort((a, b) => String(a.shop_name).localeCompare(String(b.shop_name)))
  return respond({ stores: items })
}

async function moderate(context: Context, action: string, body: Json) {
  if (!await isModerator(context)) return fail('You are not authorized to review business verification.', 403)

  const reason = getString(body.reason)
  const notes = getString(body.notes)
  if (reason.length > 500 || notes.length > 500) return fail('Reasons and notes must be 500 characters or fewer.')

  if (action === 'review_document') {
    const documentId = getString(body.documentId)
    const decision = getString(body.decision)
    if (!UUID_PATTERN.test(documentId) || !['verified', 'rejected'].includes(decision)) {
      return fail('Choose a valid document and decision.')
    }
    const { data, error } = await context.admin.rpc('business_review_document', {
      p_document_id: documentId,
      p_reviewer_id: context.userId,
      p_decision: decision,
      p_checked_against_source: body.checkedAgainstSource === true,
      p_reason: reason,
    })
    if (error) return rpcFailure(error, 'The document decision could not be saved.')
    return respond({ success: true, document: data })
  }

  if (action === 'start_video_check') {
    const storeId = getString(body.storeId)
    if (!UUID_PATTERN.test(storeId)) return fail('Choose a valid store.')
    const { data, error } = await context.admin.rpc('business_start_video_check', {
      p_store_id: storeId,
      p_reviewer_id: context.userId,
    })
    if (error) return rpcFailure(error, 'The video check could not be started.')
    return respond({ success: true, videoCheck: data })
  }

  if (action === 'record_video_check') {
    const checkId = getString(body.checkId)
    const decision = getString(body.decision)
    if (!UUID_PATTERN.test(checkId) || !['passed', 'failed'].includes(decision)) {
      return fail('Choose a valid video check and decision.')
    }
    const { data, error } = await context.admin.rpc('business_record_video_check', {
      p_check_id: checkId,
      p_reviewer_id: context.userId,
      p_decision: decision,
      p_originals_seen: body.originalsSeen === true,
      p_shop_shown: body.shopShown === true,
      p_code_matched: body.codeMatched === true,
      p_notes: notes,
    })
    if (error) return rpcFailure(error, 'The video check result could not be saved.')
    return respond({ success: true, videoCheck: data })
  }

  if (action === 'review_endorsement') {
    const endorsementId = getString(body.endorsementId)
    const decision = getString(body.decision)
    if (!UUID_PATTERN.test(endorsementId) || !['confirmed', 'not_confirmed'].includes(decision)) {
      return fail('Choose a valid endorsement and decision.')
    }
    const { data, error } = await context.admin.rpc('business_review_endorsement', {
      p_endorsement_id: endorsementId,
      p_reviewer_id: context.userId,
      p_decision: decision,
      p_phoned: body.phoned === true,
      p_notes: notes,
    })
    if (error) return rpcFailure(error, 'The endorsement decision could not be saved.')
    return respond({ success: true, endorsement: data })
  }

  if (action === 'grant' || action === 'revoke') {
    const storeId = getString(body.storeId)
    if (!UUID_PATTERN.test(storeId)) return fail('Choose a valid store.')
    const { data, error } = action === 'grant'
      ? await context.admin.rpc('business_grant_verification', { p_store_id: storeId, p_reviewer_id: context.userId })
      : await context.admin.rpc('business_revoke_verification', {
          p_store_id: storeId,
          p_reviewer_id: context.userId,
          p_reason: reason,
        })
    if (error) return rpcFailure(error, 'The verification change could not be saved.')
    return respond({ success: true, result: data })
  }

  return fail('Unknown business verification action.')
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return fail('Method not allowed.', 405)

  try {
    const context = await loadContext(request)
    if (context instanceof Response) return context

    let body: Json
    try {
      body = getObject(await request.json())
    } catch {
      return fail('Request body must be valid JSON.')
    }
    const action = getString(body.action)
    if (action === 'status') return await getStatus(context)
    if (action === 'submit_document') return await submitDocument(context, body)
    if (action === 'submit_endorsement') return await submitEndorsement(context, body)
    if (action === 'queue') return await loadQueue(context, body)
    return await moderate(context, action, body)
  } catch (error) {
    console.error('Business verification request failed:', error)
    return fail(error instanceof Error ? error.message : 'Business verification request could not be completed.', 500)
  }
})
