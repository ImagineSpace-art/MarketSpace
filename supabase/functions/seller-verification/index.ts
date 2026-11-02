import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { hashSensitiveIdentifier } from '../_shared/storeRegistrationHash.ts'
import { isValidZambianNrc } from '../_shared/storeRegistrationValidation.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const PRIVATE_BUCKET = 'store-private'
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

type Json = Record<string, unknown>
type Context = {
  admin: ReturnType<typeof createClient>
  userId: string
  request: Request
  user: { id: string; phone?: string; phone_confirmed_at?: string | null }
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
  if (!url || !anonKey || !serviceRoleKey) {
    return fail('Seller verification service is not configured.', 503)
  }

  const authClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
  })
  const { data, error } = await authClient.auth.getUser()
  if (error || !data.user) return fail('Your sign-in session has expired. Please sign in again.', 401)

  return {
    admin: createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } }),
    userId: data.user.id,
    request,
    user: data.user,
  }
}

function validateImagePath(path: string, userId: string, kind: 'id' | 'selfie') {
  const prefix = `${userId}/seller-verification/${kind}/`
  const filename = path.startsWith(prefix) ? path.slice(prefix.length) : ''
  if (!filename || !/^[A-Za-z0-9._-]+$/.test(filename) || filename.includes('..')) {
    throw new Error(`Upload your ${kind === 'id' ? 'ID photo' : 'selfie'} to the private verification folder.`)
  }
  return path
}

async function verifyPrivateImage(admin: Context['admin'], path: string, label: string) {
  const { data, error } = await admin.storage.from(PRIVATE_BUCKET).info(path)
  if (error || !data) throw new Error(`The uploaded ${label} could not be verified.`)

  const mimeType = getString(data.contentType).toLowerCase()
  const size = Number(data.size)
  if (!ALLOWED_IMAGE_TYPES.has(mimeType) || !Number.isFinite(size) || size <= 0 || size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(`${label} must be a JPEG, PNG, or WebP image no larger than 8 MB.`)
  }
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
  const digest = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`seller-verification:${userId}`),
  )
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function enforceSubmissionLimit(context: Context) {
  const { data, error } = await context.admin.rpc('consume_store_rate_limit', {
    p_rate_key: await hashRateLimitUser(context.userId),
    p_action: 'seller_verification_submit',
    p_limit: 3,
    p_window_seconds: 86400,
  })
  if (error) throw new Error('Submission rate limiting is unavailable. Please retry later.')
  if (data !== true) throw new Error('You have reached the limit of three verification submissions today.')
}

async function removeUnreferencedUploads(context: Context, paths: string[]) {
  const { data, error } = await context.admin
    .from('seller_verifications')
    .select('id_image_path, selfie_path, retained_image_paths')
    .eq('user_id', context.userId)
    .maybeSingle()
  if (error) {
    console.error('Seller verification uploads could not be checked before cleanup:', error)
    return
  }
  const referencedPaths = new Set([
    data?.id_image_path,
    data?.selfie_path,
    ...(Array.isArray(data?.retained_image_paths) ? data.retained_image_paths : []),
  ].filter((path): path is string => typeof path === 'string'))
  const unreferencedPaths = paths.filter(path => !referencedPaths.has(path))
  if (!unreferencedPaths.length) return

  const { error: removeError } = await context.admin.storage.from(PRIVATE_BUCKET).remove(unreferencedPaths)
  if (removeError) console.error('Unsubmitted seller verification images could not be removed:', removeError)
}

async function getStatus(context: Context) {
  const { data, error } = await context.admin
    .from('seller_verifications')
    .select('status, reason, reviewed_at, submitted_at')
    .eq('user_id', context.userId)
    .maybeSingle()
  if (error) throw new Error('Your verification status could not be loaded.')

  return respond({
    verification: data
      ? {
          status: data.status,
          reason: data.reason,
          reviewedAt: data.reviewed_at,
          submittedAt: data.submitted_at,
        }
      : { status: 'none', reason: null, reviewedAt: null, submittedAt: null },
  })
}

async function ensureModerator(context: Context) {
  const { data, error } = await context.admin
    .from('store_admins')
    .select('user_id')
    .eq('user_id', context.userId)
    .maybeSingle()
  if (error) throw new Error('Moderator permissions could not be checked.')
  return Boolean(data)
}

async function loadPendingReviews(context: Context) {
  if (!await ensureModerator(context)) return fail('You are not authorized to review seller identities.', 403)

  const { data: verifications, error } = await context.admin
    .from('seller_verifications')
    .select('user_id, submitted_at, id_image_path, selfie_path')
    .eq('status', 'pending')
    .neq('user_id', context.userId)
    .order('submitted_at', { ascending: true })
    .limit(100)
  if (error) throw new Error('The identity review queue could not be loaded.')

  const userIds = (verifications || []).map(verification => verification.user_id)
  const { data: profiles, error: profilesError } = userIds.length
    ? await context.admin.from('public_profiles').select('user_id, username').in('user_id', userIds)
    : { data: [], error: null }
  if (profilesError) throw new Error('Seller names could not be loaded.')
  const profileNames = new Map((profiles || []).map(profile => [profile.user_id, profile.username || 'Seller']))

  const reviews = await Promise.all((verifications || []).map(async verification => {
    if (!verification.id_image_path || !verification.selfie_path) {
      throw new Error('A pending verification is missing one or more identity images.')
    }
    const [idImageResult, selfieResult] = await Promise.all([
      context.admin.storage.from(PRIVATE_BUCKET).createSignedUrl(verification.id_image_path, 600),
      context.admin.storage.from(PRIVATE_BUCKET).createSignedUrl(verification.selfie_path, 600),
    ])
    if (idImageResult.error || selfieResult.error || !idImageResult.data || !selfieResult.data) {
      throw new Error('Identity images could not be prepared for secure review.')
    }
    return {
      user_id: verification.user_id,
      seller_name: profileNames.get(verification.user_id) || 'Seller',
      submitted_at: verification.submitted_at,
      id_image_url: idImageResult.data.signedUrl,
      selfie_url: selfieResult.data.signedUrl,
    }
  }))
  return respond({ verifications: reviews })
}

async function reviewVerification(context: Context, body: Json) {
  if (!await ensureModerator(context)) return fail('You are not authorized to review seller identities.', 403)

  const userId = getString(body.userId)
  const decision = getString(body.decision)
  const reason = getString(body.reason)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId) ||
      !['approve', 'reject'].includes(decision)) {
    return fail('Choose a valid seller and review decision.')
  }
  if (userId === context.userId) return fail('You cannot review your own identity verification.', 403)
  if (reason.length > 500 || (decision === 'reject' && !reason)) {
    return fail(decision === 'reject'
      ? 'A reason is required when rejecting a verification.'
      : 'The reason must be 500 characters or fewer.')
  }

  const { data, error } = await context.admin.rpc('review_seller_verification', {
    p_user_id: userId,
    p_reviewer_id: context.userId,
    p_decision: decision === 'approve' ? 'approved' : 'rejected',
    p_reason: reason,
  })
  if (error) {
    if (error.message.includes('cannot review their own')) {
      return fail('You cannot review your own identity verification.', 403)
    }
    if (error.message.includes('no longer pending')) {
      return fail('This seller verification has already been reviewed.', 409)
    }
    if (error.message.includes('Invalid seller verification') || error.message.includes('reason')) {
      return fail(error.message, 400)
    }
    throw new Error('The seller verification decision and audit record could not be saved.')
  }
  return respond({ success: true, verification: data })
}

async function submit(context: Context, body: Json) {
  if (body.consentAccepted !== true) {
    return fail('Review and accept the identity verification privacy notice before submitting.')
  }

  const idNumber = getString(body.idNumber)
  if (!isValidZambianNrc(idNumber)) return fail('Enter your 9-digit NRC number using numbers only.')

  let idImagePath: string
  let selfiePath: string
  try {
    idImagePath = validateImagePath(getString(body.idImagePath), context.userId, 'id')
    selfiePath = validateImagePath(getString(body.selfiePath), context.userId, 'selfie')
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Upload both verification images.')
  }
  if (idImagePath === selfiePath) return fail('Upload separate ID and selfie images.')
  const uploadedPaths = [idImagePath, selfiePath]
  let submissionSaved = false

  try {
    const { data: store, error: storeError } = await context.admin
      .from('stores')
      .select('id')
      .eq('user_id', context.userId)
      .maybeSingle()
    if (storeError) throw new Error('Store ownership could not be checked.')
    if (store) return fail('Store owners must use the existing store verification process.', 409)

    const { data: existing, error: existingError } = await context.admin
      .from('seller_verifications')
      .select('status, id_image_path, selfie_path, retained_image_paths')
      .eq('user_id', context.userId)
      .maybeSingle()
    if (existingError) throw new Error('Your verification record could not be checked.')
    if (existing?.status === 'pending') return fail('Your verification is already waiting for review.', 409)
    if (existing?.status === 'approved') return fail('Your identity is already verified.', 409)

    await enforceSubmissionLimit(context)
    await Promise.all([
      verifyPrivateImage(context.admin, idImagePath, 'ID photo'),
      verifyPrivateImage(context.admin, selfiePath, 'selfie'),
    ])

    const idHashSecret = Deno.env.get('STORE_ID_HASH_SECRET') || ''
    const idHash = await hashSensitiveIdentifier(idNumber, 'id', idHashSecret)
    const phoneHash = context.user.phone && context.user.phone_confirmed_at
      ? await hashSensitiveIdentifier(context.user.phone, 'phone', idHashSecret)
      : null

    const { data: bannedMatches, error: bannedError } = await context.admin
      .from('store_banned_matches')
      .select('id')
      .or(`user_id.eq.${context.userId},id_number_hash.eq.${idHash}${phoneHash ? `,phone_hash.eq.${phoneHash}` : ''}`)
      .limit(1)
    if (bannedError) throw new Error('Banned-identity checks could not be completed.')
    if (bannedMatches?.length) return fail('This account or identity is not eligible for verification.', 403)

    const { data: duplicateSellerId, error: duplicateSellerError } = await context.admin
      .from('seller_verifications')
      .select('user_id')
      .eq('id_hash', idHash)
      .neq('user_id', context.userId)
      .maybeSingle()
    if (duplicateSellerError) throw new Error('Duplicate identity checks could not be completed.')
    if (duplicateSellerId) return fail('This government ID is already associated with another seller.', 409)

    const { data: duplicateStoreId, error: duplicateStoreError } = await context.admin
      .from('store_owner_identity')
      .select('user_id')
      .eq('id_number_hash', idHash)
      .neq('user_id', context.userId)
      .maybeSingle()
    if (duplicateStoreError) throw new Error('Duplicate identity checks could not be completed.')
    if (duplicateStoreId) return fail('This government ID is already associated with another store owner.', 409)

    if (phoneHash) {
      const [
        { data: duplicateSellerPhone, error: duplicateSellerPhoneError },
        { data: duplicateStorePhone, error: duplicateStorePhoneError },
      ] = await Promise.all([
        context.admin.from('seller_verifications')
          .select('user_id')
          .eq('phone_hash', phoneHash)
          .neq('user_id', context.userId)
          .limit(1),
        context.admin.from('store_owner_identity')
          .select('user_id')
          .eq('phone_number_hash', phoneHash)
          .neq('user_id', context.userId)
          .limit(1),
      ])
      if (duplicateSellerPhoneError || duplicateStorePhoneError) {
        throw new Error('Duplicate phone checks could not be completed.')
      }
      if (duplicateSellerPhone?.length || duplicateStorePhone?.length) {
        return fail('This verified phone number is already associated with another seller.', 409)
      }
    }

    const retainedImagePaths = Array.from(new Set([
      ...(Array.isArray(existing?.retained_image_paths) ? existing.retained_image_paths : []),
      existing?.id_image_path,
      existing?.selfie_path,
    ].filter((path): path is string => typeof path === 'string' && path.length > 0)))

    const submittedAt = new Date().toISOString()
    const { error: saveError } = await context.admin.from('seller_verifications').upsert({
      user_id: context.userId,
      status: 'pending',
      reason: null,
      reviewed_by: null,
      reviewed_at: null,
      id_hash: idHash,
      phone_hash: phoneHash,
      id_image_path: idImagePath,
      selfie_path: selfiePath,
      consented_at: submittedAt,
      retained_image_paths: retainedImagePaths,
      submitted_at: submittedAt,
      updated_at: submittedAt,
      images_purged_at: null,
    })
    if (saveError) {
      if (saveError.code === '23505') {
        return fail('This government ID is already associated with another seller.', 409)
      }
      throw new Error('Your verification submission could not be saved.')
    }

    submissionSaved = true
    return respond({ success: true, status: 'pending', submittedAt })
  } catch (error) {
    console.error('Seller verification submission failed:', error)
    return fail(error instanceof Error ? error.message : 'Your verification submission could not be completed.', 500)
  } finally {
    if (!submissionSaved) {
      await removeUnreferencedUploads(context, uploadedPaths)
    }
  }
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
    if (action === 'submit') return await submit(context, body)
    if (action === 'pending_reviews') return await loadPendingReviews(context)
    if (action === 'review') return await reviewVerification(context, body)
    return fail('Unknown seller verification action.')
  } catch (error) {
    console.error('Seller verification request failed:', error)
    return fail(error instanceof Error ? error.message : 'Seller verification request could not be completed.', 500)
  }
})
