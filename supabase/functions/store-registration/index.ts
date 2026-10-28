import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  fuzzyNameSimilarity,
  isDisposableEmailDomain,
  validateStoreSubdomain,
} from '../_shared/storeRegistrationValidation.ts'
import { hashSensitiveIdentifier } from '../_shared/storeRegistrationHash.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const PROHIBITED_TERMS = [
  'counterfeit', 'fake id', 'stolen goods', 'illegal drugs', 'firearms', 'weapon sales',
  'human trafficking', 'child exploitation',
]
const TERMS_VERSION = '2026-10-26'
const RETURNS_VERSION = '2026-10-26'
const PROHIBITED_ITEMS_VERSION = '2026-10-26'

type Json = Record<string, unknown>
type HandlerContext = { admin: SupabaseClient; userId: string; request: Request }

function respond(body: Json, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function fail(message: string, status = 400) {
  return respond({ error: message }, status)
}

async function keyedHash(value: string, secretName: string) {
  const secret = Deno.env.get(secretName)
  if (!secret) throw new Error(`${secretName} must be configured in Supabase Edge Function secrets.`)
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function hashRateLimitKey(request: Request, userId: string) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const source = request.headers.get('cf-connecting-ip') || forwarded || userId
  const secret = Deno.env.get('RATE_LIMIT_HASH_SECRET') || Deno.env.get('STORE_ID_HASH_SECRET') || 'local-development-rate-limit'
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(source))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function enforceRateLimit(admin: SupabaseClient, request: Request, userId: string, action: string, max: number) {
  const rateKey = await hashRateLimitKey(request, userId)
  const { data, error } = await admin.rpc('consume_store_rate_limit', {
    p_rate_key: rateKey,
    p_action: action,
    p_limit: max,
    p_window_seconds: 3600,
  })
  if (error) throw new Error('Rate limiting is unavailable. Please retry later.')
  if (data !== true) throw new Error('Too many attempts. Please wait before trying again.')
}

async function verifyCaptcha(token: unknown, request: Request, required: boolean) {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY')
  const appEnvironment = Deno.env.get('APP_ENV') || 'production'
  if (!secret) {
    if (required && appEnvironment === 'production') throw new Error('CAPTCHA verification is not configured.')
    return
  }
  if (typeof token !== 'string' || !token) throw new Error('Complete the CAPTCHA challenge before continuing.')
  const form = new FormData()
  form.set('secret', secret)
  form.set('response', token)
  const remoteIp = request.headers.get('cf-connecting-ip')
  if (remoteIp) form.set('remoteip', remoteIp)
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form })
  if (!response.ok) throw new Error('CAPTCHA verification is temporarily unavailable.')
  const result = await response.json() as { success?: boolean }
  if (!result.success) throw new Error('CAPTCHA verification failed. Please try again.')
}

async function loadAuthenticatedContext(request: Request): Promise<HandlerContext | Response> {
  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return fail('Sign in to continue.', 401)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return fail('Store registration service is not configured.', 503)

  const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
  const { data: authData, error: authError } = await authClient.auth.getUser()
  if (authError || !authData.user) return fail('Your sign-in session has expired. Please sign in again.', 401)
  return {
    admin: createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } }),
    userId: authData.user.id,
    request,
  }
}

function getObject(value: unknown): Json {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Json : {}
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isPhone(value: string) {
  return /^\+?[0-9 ()-]{8,20}$/.test(value)
}

function getStepData(data: Json, key: string) {
  return getObject(data[key])
}

async function checkAvailable(admin: SupabaseClient, slug: string, userId: string) {
  const { data, error } = await admin.rpc('store_subdomain_available', {
    p_subdomain: slug,
    p_user_id: userId,
  })
  if (error) throw new Error('Store address checks are unavailable. Please try again.')
  return data === true
}

function validateDraftStep(step: number, data: Json) {
  if (step <= 2) {
    const identity = getStepData(data, 'identity')
    if (step === 2) {
      if (getString(identity.legalName).length < 4) return 'Enter your full legal name.'
      if (getString(identity.residentialAddress).length < 8) return 'Enter your complete residential address.'
      const dob = new Date(`${getString(identity.dateOfBirth)}T00:00:00Z`)
      if (Number.isNaN(dob.getTime())) return 'Enter a valid date of birth.'
      const cutoff = new Date()
      cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 18)
      if (dob > cutoff) return 'Store owners must be at least 18 years old.'
    }
  }
  if (step >= 3) {
    const store = getStepData(data, 'store')
    if (getString(store.name).length < 2) return 'Enter a valid store name.'
    const slug = getString(store.subdomain).toLowerCase()
    const slugError = validateStoreSubdomain(slug)
    if (slugError) return slugError
    if (getString(store.description).length < 20) return 'Add a store description of at least 20 characters.'
    if (!['physical', 'online_delivery', 'meetup_only'].includes(getString(store.type))) return 'Select a valid store type.'
    const supportContact = getString(store.supportContact)
    if (!isEmail(supportContact) && !isPhone(supportContact)) return 'Enter a valid email address or WhatsApp number.'
  }
  if (step >= 4) {
    const store = getStepData(data, 'store')
    const location = getStepData(data, 'location')
    if (store.type === 'physical') {
      const latitude = Number(location.latitude)
      const longitude = Number(location.longitude)
      if (!getString(location.streetAddress) || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
        !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        return 'Provide a physical address and valid map coordinates.'
      }
    }
    if (store.type === 'online_delivery' && !getString(location.deliveryAreas)) return 'List the store delivery areas.'
    if (store.type === 'meetup_only' && !getString(location.safeMeetupLocations)) return 'List the safe meetup locations.'
  }
  if (step >= 5) {
    const payout = getStepData(data, 'payout')
    if (!['mobile_money', 'bank'].includes(getString(payout.method))) return 'Select a valid payout method.'
    if (getString(payout.accountHolderName).length < 4) return 'Enter the account holder name.'
  }
  if (step >= 6) {
    const policies = getStepData(data, 'policies')
    if (policies.termsAccepted !== true || policies.returnsAccepted !== true || policies.prohibitedItemsAccepted !== true) {
      return 'Accept all required policies before continuing.'
    }
    if (getString(policies.returnPolicy).length < 10) return 'Add a customer-facing return policy.'
  }
  return ''
}

async function encryptPayout(accountNumber: string) {
  const encodedKey = Deno.env.get('STORE_PAYOUT_ENCRYPTION_KEY')
  if (!encodedKey) throw new Error('STORE_PAYOUT_ENCRYPTION_KEY must be configured in Supabase Edge Function secrets.')
  const keyBytes = Uint8Array.from(atob(encodedKey), (char) => char.charCodeAt(0))
  if (keyBytes.length !== 32) throw new Error('STORE_PAYOUT_ENCRYPTION_KEY must be a base64-encoded 32-byte key.')
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt'])
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(accountNumber))
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)
  return btoa(String.fromCharCode(...combined))
}

async function verifyPrivateImage(admin: SupabaseClient, path: string, userId: string, folder: string) {
  if (!path.startsWith(`${userId}/${folder}/`) || path.includes('..')) throw new Error('A private verification image is missing or invalid.')
  const { error } = await admin.storage.from('store-private').createSignedUrl(path, 30)
  if (error) throw new Error('A private verification image could not be verified.')
}

async function sendOwnerEmail(to: string, subject: string, html: string) {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('EMAIL_FROM')
  if (!apiKey || !from) return 'Email notifications are not configured yet; configure RESEND_API_KEY and EMAIL_FROM.'
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html }),
  })
  if (!response.ok) return 'The application was saved, but its email notification could not be sent.'
  return ''
}

async function saveDraft(context: HandlerContext, body: Json) {
  const step = Number(body.step)
  if (!Number.isInteger(step) || step < 1 || step > 6) return fail('Invalid application step.')
  const rateLimitAction = step === 2 ? 'identity' : step === 5 ? 'payout' : 'draft'
  await enforceRateLimit(context.admin, context.request, context.userId, rateLimitAction, step === 2 || step === 5 ? 5 : 30)
  if (step === 1) {
    await verifyCaptcha(body.captchaToken, context.request, true)
    const { data: authData, error: authError } = await context.admin.auth.admin.getUserById(context.userId)
    if (authError || !authData.user?.email_confirmed_at) return fail('Confirm your email address before continuing.', 403)
    if ((Deno.env.get('PHONE_OTP_REQUIRED') || 'true') !== 'false' && !authData.user.phone_confirmed_at) {
      return fail('Verify your phone number with Supabase Auth before continuing.', 403)
    }
  }

  const data = getObject(body.data)
  const validationMessage = validateDraftStep(step, data)
  if (validationMessage) return fail(validationMessage)
  const store = getStepData(data, 'store')
  if (step >= 3 && !(await checkAvailable(context.admin, getString(store.subdomain).toLowerCase(), context.userId))) {
    return fail('That store address is already in use.')
  }

  if (step === 2) {
    const identity = getStepData(data, 'identity')
    const idImagePath = getString(identity.idImagePath)
    const selfiePath = getString(identity.selfiePath)
    if (!idImagePath || !selfiePath) return fail('Upload your ID photo and a live selfie.')
    await verifyPrivateImage(context.admin, idImagePath, context.userId, 'idImagePath')
    await verifyPrivateImage(context.admin, selfiePath, context.userId, 'selfiePath')
    const idNumber = getString(body.identityNumber)
    if (!idNumber) return fail('Enter your government ID number.')
    const idHash = await hashSensitiveIdentifier(idNumber, 'id', Deno.env.get('STORE_ID_HASH_SECRET') || '')
    const { data: duplicateIdentity, error: duplicateError } = await context.admin
      .from('store_owner_identity')
      .select('user_id')
      .eq('id_number_hash', idHash)
      .neq('user_id', context.userId)
      .maybeSingle()
    if (duplicateError) throw new Error('Identity uniqueness could not be checked.')
    if (duplicateIdentity) return fail('This government ID is already associated with another store owner.')

    const { error: identityError } = await context.admin.from('store_owner_identity').upsert({
      user_id: context.userId,
      legal_name: getString(identity.legalName),
      date_of_birth: getString(identity.dateOfBirth),
      residential_address: getString(identity.residentialAddress),
      id_number_hash: idHash,
      id_image_path: idImagePath,
      selfie_path: selfiePath,
      updated_at: new Date().toISOString(),
    })
    if (identityError) throw new Error('Owner verification details could not be saved securely.')
  }

  if (step === 5) {
    const payout = getStepData(data, 'payout')
    const accountNumber = getString(body.payoutAccountNumber)
    if (!accountNumber) return fail('Enter your bank or mobile money account number.')
    const accountCiphertext = await encryptPayout(accountNumber)
    const { error: payoutError } = await context.admin.from('store_payout_accounts').upsert({
      user_id: context.userId,
      payout_method: getString(payout.method),
      account_holder_name: getString(payout.accountHolderName),
      account_number_ciphertext: accountCiphertext,
      status: 'pending',
      updated_at: new Date().toISOString(),
    })
    if (payoutError) throw new Error('Payout details could not be encrypted and saved.')
  }

  const safeData = structuredClone(data)
  const payout = getStepData(safeData, 'payout')
  payout.accountNumber = ''
  const { data: currentDraft } = await context.admin
    .from('store_registration_drafts')
    .select('status')
    .eq('user_id', context.userId)
    .maybeSingle()
  if (currentDraft?.status && !['draft', 'rejected'].includes(currentDraft.status)) {
    return fail('This application is already under review.', 409)
  }

  const update: Json = {
    user_id: context.userId,
    current_step: step + 1,
    data: safeData,
    status: 'draft',
    updated_at: new Date().toISOString(),
  }
  const { error: draftError } = await context.admin.from('store_registration_drafts').upsert(update)
  if (draftError) throw new Error('Application progress could not be saved.')
  return respond({ saved: true })
}

async function generateLocationCode(context: HandlerContext) {
  await enforceRateLimit(context.admin, context.request, context.userId, 'location_code', 10)
  const { data: draft, error } = await context.admin
    .from('store_registration_drafts')
    .select('data, status, location_code_hash, location_code_text, location_code_expires_at')
    .eq('user_id', context.userId)
    .maybeSingle()
  if (error || !draft || !['draft', 'rejected'].includes(draft.status)) return fail('Save your application details before generating a code.', 409)
  const validationMessage = validateDraftStep(4, getObject(draft.data))
  if (validationMessage) return fail(validationMessage)
  const expiry = Date.parse(draft.location_code_expires_at || '')
  if (draft.location_code_text && expiry > Date.now()) return respond({ locationCode: draft.location_code_text })

  const locationCode = String(crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000)
  const { error: updateError } = await context.admin.from('store_registration_drafts').update({
    location_code_hash: await keyedHash(locationCode, 'STORE_ID_HASH_SECRET'),
    location_code_text: locationCode,
    location_code_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('user_id', context.userId)
  if (updateError) throw new Error('The location verification code could not be created.')
  return respond({ locationCode })
}

async function checkSubdomainAction(context: HandlerContext, body: Json) {
  await enforceRateLimit(context.admin, context.request, context.userId, 'subdomain', 20)
  const slug = getString(body.subdomain).toLowerCase()
  const validationMessage = validateStoreSubdomain(slug)
  if (validationMessage) return respond({ available: false, message: validationMessage })
  const available = await checkAvailable(context.admin, slug, context.userId)
  return respond({ available, message: available ? '' : 'That store address is already in use.' })
}

async function submitApplication(context: HandlerContext, body: Json) {
  await enforceRateLimit(context.admin, context.request, context.userId, 'submit', 5)
  await verifyCaptcha(body.captchaToken, context.request, true)
  const { data: authData, error: authError } = await context.admin.auth.admin.getUserById(context.userId)
  if (authError || !authData.user) throw new Error('Account verification could not be checked.')
  if (!authData.user.email_confirmed_at) return fail('Confirm your email address before submitting.', 403)
  if (isDisposableEmailDomain(authData.user.email || '')) return fail('Use a non-disposable email address for a store account.')
  if ((Deno.env.get('PHONE_OTP_REQUIRED') || 'true') !== 'false' && !authData.user.phone_confirmed_at) {
    return fail('Verify your phone number with Supabase Auth before submitting.', 403)
  }

  const { data: draft, error: draftError } = await context.admin
    .from('store_registration_drafts')
    .select('data, status, current_step, location_code_hash, location_code_text, location_code_expires_at')
    .eq('user_id', context.userId)
    .maybeSingle()
  if (draftError || !draft) return fail('Save all application steps before submitting.')
  if (draft.status !== 'draft') return fail('This application has already been submitted.', 409)
  if (draft.current_step < 7) return fail('Complete every application step before submitting.')
  const data = getObject(draft.data)
  const validationMessage = validateDraftStep(6, data)
  if (validationMessage) return fail(validationMessage)

  const identity = getStepData(data, 'identity')
  const storeData = getStepData(data, 'store')
  const location = getStepData(data, 'location')
  const { data: ownerIdentity, error: identityError } = await context.admin
    .from('store_owner_identity')
    .select('id_number_hash, id_image_path, selfie_path, legal_name')
    .eq('user_id', context.userId)
    .maybeSingle()
  if (identityError || !ownerIdentity) return fail('Complete owner identity verification before submitting.')
  await verifyPrivateImage(context.admin, ownerIdentity.id_image_path, context.userId, 'idImagePath')
  await verifyPrivateImage(context.admin, ownerIdentity.selfie_path, context.userId, 'selfiePath')

  const slug = getString(storeData.subdomain).toLowerCase()
  if (!(await checkAvailable(context.admin, slug, context.userId))) return fail('That store address is no longer available.')
  const verificationMethod = getString(location.verificationMethod) === 'video' ? 'video' : 'photo'
  if (verificationMethod === 'photo') {
    if (!getString(location.proofPath)) return fail('Upload a photo showing the one-time location code.')
    if (!getString(draft.location_code_text) || Date.parse(draft.location_code_expires_at || '') <= Date.now()) {
      return fail('The location code expired. Generate a new code and upload a new proof photo.')
    }
    await verifyPrivateImage(context.admin, getString(location.proofPath), context.userId, 'proofPath')
  }
  const { data: payoutAccount, error: payoutError } = await context.admin
    .from('store_payout_accounts')
    .select('account_holder_name')
    .eq('user_id', context.userId)
    .maybeSingle()
  if (payoutError || !payoutAccount) return fail('Save payout details before submitting.')

  const idHash = ownerIdentity.id_number_hash
  const verifiedPhone = authData.user.phone || ''
  const phoneHash = verifiedPhone
    ? await hashSensitiveIdentifier(verifiedPhone, 'phone', Deno.env.get('STORE_ID_HASH_SECRET') || '')
    : ''
  const storeAddress = storeData.type === 'physical'
    ? getString(location.streetAddress)
    : storeData.type === 'online_delivery' ? 'Online delivery' : 'Meetup only'
  const residentialAddress = getString(identity.residentialAddress)
  const normalizedAddress = residentialAddress.toLowerCase().replace(/[^a-z0-9]/g, '')
  const normalizedStoreAddress = getString(location.streetAddress).toLowerCase().replace(/[^a-z0-9]/g, '')
  const descriptionText = `${getString(storeData.name)} ${getString(storeData.description)}`.toLowerCase()
  const prohibitedMatches = PROHIBITED_TERMS.filter((term) => descriptionText.includes(term))
  const { data: banned, error: bannedError } = await context.admin
    .from('store_banned_matches')
    .select('id')
    .or(`user_id.eq.${context.userId},id_number_hash.eq.${idHash}${phoneHash ? `,phone_hash.eq.${phoneHash}` : ''}`)
    .limit(1)
  if (bannedError) throw new Error('Banned-account checks could not be completed.')

  const { data: duplicateIdentity, error: duplicateIdentityError } = await context.admin
    .from('store_owner_identity')
    .select('user_id')
    .eq('id_number_hash', idHash)
    .neq('user_id', context.userId)
    .maybeSingle()
  if (duplicateIdentityError) throw new Error('Duplicate identity checks could not be completed.')

  let duplicatePhoneRows: Array<{ user_id: string }> = []
  if (phoneHash) {
    const { data, error: phoneError } = await context.admin
      .from('store_owner_identity')
      .select('user_id')
      .eq('phone_number_hash', phoneHash)
      .neq('user_id', context.userId)
      .limit(1)
    if (phoneError) throw new Error('Duplicate phone checks could not be completed.')
    duplicatePhoneRows = data || []
    const { error: savePhoneHashError } = await context.admin
      .from('store_owner_identity')
      .update({ phone_number_hash: phoneHash, updated_at: new Date().toISOString() })
      .eq('user_id', context.userId)
    if (savePhoneHashError) throw new Error('Verified phone matching could not be saved.')
  }

  const { data: stores, error: storeCheckError } = await context.admin
    .from('stores')
    .select('id, address')
    .neq('user_id', context.userId)
  if (storeCheckError) throw new Error('Duplicate address checks could not be completed.')
  const { data: existingIdentities, error: residentialError } = await context.admin
    .from('store_owner_identity')
    .select('user_id, residential_address')
    .neq('user_id', context.userId)
  if (residentialError) throw new Error('Duplicate residential-address checks could not be completed.')
  const duplicateAddress = ((stores || []).some((existing) =>
    String(existing.address || '').toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedStoreAddress && normalizedStoreAddress.length > 7
  ) || (existingIdentities || []).some((existing) =>
    String(existing.residential_address || '').toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedAddress && normalizedAddress.length > 7
  ))

  const payoutMatch = fuzzyNameSimilarity(payoutAccount.account_holder_name, ownerIdentity.legal_name)
  const results = {
    duplicateId: Boolean(duplicateIdentity),
    duplicatePhone: Boolean(duplicatePhoneRows?.length),
    duplicateAddress,
    bannedUserMatch: Boolean(banned?.length),
    prohibitedKeywords: prohibitedMatches,
    payoutNameMatch: payoutMatch,
    payoutNameFlagged: payoutMatch < 0.6,
    locationProofProvided: Boolean(getString(location.proofPath)),
    idImagesProvided: Boolean(ownerIdentity.id_image_path && ownerIdentity.selfie_path),
  }
  const flagged = results.duplicateId || results.duplicatePhone || results.duplicateAddress ||
    results.bannedUserMatch || results.prohibitedKeywords.length > 0 || results.payoutNameFlagged

  const storePayload = {
    user_id: context.userId,
    shop_name: getString(storeData.name),
    description: getString(storeData.description),
    category: getString(storeData.category),
    address: storeAddress,
    whatsapp: isPhone(getString(storeData.supportContact)) ? getString(storeData.supportContact) : '',
    logo: getString(storeData.logo),
    logo: getString(storeData.logo),
    subdomain: slug,
    store_type: getString(storeData.type),
    operation_type: getString(storeData.type) === 'physical' ? 'physical' : 'online',
    business_registration_number: getString(storeData.businessRegistrationNumber) || null,
    customer_care: {
      returnPolicy: getString(getStepData(data, 'policies').returnPolicy),
      email: isEmail(getString(storeData.supportContact)) ? getString(storeData.supportContact) : '',
    },
    opening_hours: { text: getString(location.openingHours) },
    delivery_areas: getString(location.deliveryAreas).split(',').map((item) => item.trim()).filter(Boolean),
    safe_meetup_locations: getString(location.safeMeetupLocations).split(',').map((item) => item.trim()).filter(Boolean),
    storefront_latitude: location.latitude ? Number(location.latitude) : null,
    storefront_longitude: location.longitude ? Number(location.longitude) : null,
    status: 'pending_review',
    probation_state: 'probation',
    active_listing_limit: 10,
    max_order_value_zmw: Number(Deno.env.get('PROBATION_MAX_ORDER_VALUE_ZMW') || '5000'),
    payout_hold_days: 5,
  }
  const { data: savedStore, error: storeError } = await context.admin
    .from('stores')
    .upsert(storePayload, { onConflict: 'user_id' })
    .select('id')
    .single()
  if (storeError) {
    const databaseErrorCode = storeError.code || 'unknown'
    console.error('store_registration_store_upsert_failed', { code: databaseErrorCode })
    if (['PGRST204', 'PGRST205', '42703'].includes(databaseErrorCode)) {
      return fail('The store database schema is missing required fields. Apply the store-registration migrations and retry.', 500)
    }
    throw new Error(`Store application could not be submitted (database error ${databaseErrorCode}).`)
  }
  if (!savedStore) throw new Error('Store application could not be submitted because no store record was returned.')

  const { error: locationError } = await context.admin.from('store_location_verifications').upsert({
    store_id: savedStore.id,
    user_id: context.userId,
    code_hash: getString(draft.location_code_hash) || await keyedHash(crypto.randomUUID(), 'STORE_ID_HASH_SECRET'),
    code_text: getString(draft.location_code_text) || 'N/A',
    code_expires_at: getString(draft.location_code_expires_at) || new Date(Date.now() + 86400000).toISOString(),
    verification_method: verificationMethod,
    proof_path: getString(location.proofPath) || null,
    status: 'pending',
    updated_at: new Date().toISOString(),
  })
  if (locationError) throw new Error('Location verification could not be recorded.')

  const termsVersion = String(body.termsVersion || TERMS_VERSION)
  const returnsVersion = String(body.returnsVersion || RETURNS_VERSION)
  const prohibitedItemsVersion = String(body.prohibitedItemsVersion || PROHIBITED_ITEMS_VERSION)
  if (termsVersion !== TERMS_VERSION || returnsVersion !== RETURNS_VERSION || prohibitedItemsVersion !== PROHIBITED_ITEMS_VERSION) {
    return fail('The policy versions changed. Review and accept the current policies before submitting.')
  }
  const { error: policyError } = await context.admin.from('store_policy_acceptances').upsert({
    store_id: savedStore.id,
    user_id: context.userId,
    terms_version: termsVersion,
    returns_version: returnsVersion,
    prohibited_items_version: prohibitedItemsVersion,
    accepted_at: new Date().toISOString(),
  }, { onConflict: 'store_id,terms_version,returns_version,prohibited_items_version' })
  if (policyError) throw new Error('Policy acceptance could not be recorded.')

  const { error: checksError } = await context.admin.from('store_review_checks').upsert({
    store_id: savedStore.id,
    results,
    flagged,
    checked_at: new Date().toISOString(),
  })
  if (checksError) throw new Error('Automated review checks could not be saved.')

  const { error: auditError } = await context.admin.from('store_review_audit_log').insert({
    store_id: savedStore.id,
    actor_user_id: context.userId,
    action: 'submitted',
    details: { flagged },
  })
  if (auditError) throw new Error('Submission audit could not be recorded.')

  const { error: draftUpdateError } = await context.admin
    .from('store_registration_drafts')
    .update({ status: 'pending_review', updated_at: new Date().toISOString() })
    .eq('user_id', context.userId)
  if (draftUpdateError) throw new Error('Application status could not be updated.')

  const confirmation = await sendOwnerEmail(
    authData.user.email || '',
    'Your MarketSpace store application was received',
    `<p>We received your application for <strong>${escapeHtml(getString(storeData.name))}</strong>.</p><p>It is now pending review.</p>`,
  )
  const response = { status: 'pending_review', locationCode: draft.location_code_text || undefined, emailWarning: confirmation || undefined }
  return respond(response)
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char] || char)
}

async function ensureAdmin(admin: SupabaseClient, userId: string) {
  const { data, error } = await admin.from('store_admins').select('user_id').eq('user_id', userId).maybeSingle()
  if (error) throw new Error('Reviewer permissions could not be checked.')
  if (!data) throw new Error('You are not authorized to review store applications.')
}

async function reviewQueue(context: HandlerContext) {
  await ensureAdmin(context.admin, context.userId)
  const { data: stores, error } = await context.admin
    .from('stores')
    .select('id, user_id, shop_name, description, category, address, whatsapp, subdomain, store_type, business_registration_number, created_at')
    .eq('status', 'pending_review')
    .order('created_at', { ascending: true })
  if (error) throw new Error('The review queue could not be loaded.')
  const queue = []
  for (const store of stores || []) {
    const [identityResult, locationResult, payoutResult, checksResult] = await Promise.all([
      context.admin.from('store_owner_identity').select('legal_name, date_of_birth, residential_address, id_image_path, selfie_path, status').eq('user_id', store.user_id).maybeSingle(),
      context.admin.from('store_location_verifications').select('proof_path, code_text, verification_method, status').eq('store_id', store.id).maybeSingle(),
      context.admin.from('store_payout_accounts').select('account_holder_name, payout_method, status').eq('user_id', store.user_id).maybeSingle(),
      context.admin.from('store_review_checks').select('results, flagged').eq('store_id', store.id).maybeSingle(),
    ])
    const identity = identityResult.data
    const proof = locationResult.data
    const signedUrl = async (path: string | null | undefined) => {
      if (!path) return null
      const { data, error: signedUrlError } = await context.admin.storage.from('store-private').createSignedUrl(path, 300)
      if (signedUrlError || !data.signedUrl) throw new Error('Private review images could not be accessed.')
      return data.signedUrl
    }
    const [idUrl, selfieUrl, proofUrl] = await Promise.all([
      signedUrl(identity?.id_image_path),
      signedUrl(identity?.selfie_path),
      signedUrl(proof?.proof_path),
    ])
    queue.push({
      ...store,
      identity: identity ? { ...identity, id_image_url: idUrl, selfie_url: selfieUrl } : null,
      location: proof ? { ...proof, proof_url: proofUrl } : null,
      payout: payoutResult.data,
      checks: checksResult.data,
    })
  }
  return respond({ applications: queue })
}

async function reviewApplication(context: HandlerContext, body: Json) {
  await ensureAdmin(context.admin, context.userId)
  await enforceRateLimit(context.admin, context.request, context.userId, 'review', 60)
  const storeId = getString(body.storeId)
  const decision = getString(body.decision)
  const reason = getString(body.reason)
  if (!storeId || !['approve', 'reject'].includes(decision)) return fail('Invalid review decision.')
  if (reason.length < 8) return fail('Provide a review reason of at least 8 characters.')

  const { data: store, error: storeError } = await context.admin
    .from('stores')
    .select('id, user_id, shop_name')
    .eq('id', storeId)
    .eq('status', 'pending_review')
    .maybeSingle()
  if (storeError || !store) return fail('The application is no longer pending review.', 404)

  const approved = decision === 'approve'
  const { error: updateError } = await context.admin.from('stores').update({
    status: approved ? 'approved' : 'rejected',
    rejection_reason: approved ? null : reason,
    verified_id: approved && body.verifiedId === true,
    verified_location: approved && body.verifiedLocation === true,
    registered_business: approved && body.registeredBusiness === true,
    probation_state: 'probation',
    active_listing_limit: 10,
    max_order_value_zmw: Number(Deno.env.get('PROBATION_MAX_ORDER_VALUE_ZMW') || '5000'),
    payout_hold_days: 5,
  }).eq('id', store.id)
  if (updateError) throw new Error('The review decision could not be saved.')

  const { error: identityUpdateError } = await context.admin
    .from('store_owner_identity')
    .update({
      status: approved && body.verifiedId === true ? 'verified' : 'pending',
      verified_at: approved && body.verifiedId === true ? new Date().toISOString() : null,
      delete_images_after: new Date(Date.now() + 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', store.user_id)
  if (identityUpdateError) throw new Error('Owner verification status could not be updated.')

  const { error: locationUpdateError } = await context.admin
    .from('store_location_verifications')
    .update({
      status: approved && body.verifiedLocation === true ? 'verified' : decision === 'reject' ? 'rejected' : 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('store_id', store.id)
  if (locationUpdateError) throw new Error('Location verification status could not be updated.')

  const { error: auditError } = await context.admin.from('store_review_audit_log').insert({
    store_id: store.id,
    actor_user_id: context.userId,
    action: approved ? 'approved' : 'rejected',
    reason,
    details: {
      verifiedId: body.verifiedId === true,
      verifiedLocation: body.verifiedLocation === true,
      registeredBusiness: body.registeredBusiness === true,
    },
  })
  if (auditError) throw new Error('The review action could not be audited.')

  await context.admin.from('store_registration_drafts').update({
    status: approved ? 'approved' : 'rejected',
    updated_at: new Date().toISOString(),
  }).eq('user_id', store.user_id)

  const { data: owner } = await context.admin.auth.admin.getUserById(store.user_id)
  const emailWarning = owner.user?.email
    ? await sendOwnerEmail(
      owner.user.email,
      approved ? 'Your MarketSpace store was approved' : 'Your MarketSpace store needs changes',
      approved
        ? `<p>Your store <strong>${escapeHtml(store.shop_name)}</strong> has been approved and is live in probation.</p>`
        : `<p>Your store <strong>${escapeHtml(store.shop_name)}</strong> was not approved.</p><p>Reason: ${escapeHtml(reason)}</p><p>You can update your application and resubmit it.</p>`,
    )
    : 'Owner email address is unavailable; notification was not sent.'
  return respond({ success: true, emailWarning: emailWarning || undefined })
}

async function deleteIdentityImages(context: HandlerContext) {
  const { data: store, error: storeError } = await context.admin
    .from('stores')
    .select('id, status')
    .eq('user_id', context.userId)
    .maybeSingle()
  if (storeError || !store || !['approved', 'rejected'].includes(store.status)) {
    return fail('Verification images can be deleted after the application decision is complete.', 409)
  }
  const { data: identity, error: identityError } = await context.admin
    .from('store_owner_identity')
    .select('id_image_path, selfie_path')
    .eq('user_id', context.userId)
    .maybeSingle()
  if (identityError || !identity) return fail('Owner identity data could not be found.', 404)
  const { data: location, error: locationError } = await context.admin
    .from('store_location_verifications')
    .select('store_id, proof_path')
    .eq('store_id', store.id)
    .maybeSingle()
  if (locationError) throw new Error('Location verification media could not be checked.')

  const paths = [identity.id_image_path, identity.selfie_path, location?.proof_path].filter((path): path is string => Boolean(path))
  if (paths.length) {
    const { error: removeError } = await context.admin.storage.from('store-private').remove(paths)
    if (removeError) throw new Error('Private verification images could not be deleted.')
  }
  const { error: updateIdentityError } = await context.admin.from('store_owner_identity').update({
    id_image_path: null,
    selfie_path: null,
    delete_images_after: null,
    updated_at: new Date().toISOString(),
  }).eq('user_id', context.userId)
  if (updateIdentityError) throw new Error('Identity image deletion could not be recorded.')
  if (location) {
    const { error: updateLocationError } = await context.admin.from('store_location_verifications')
      .update({ proof_path: null, updated_at: new Date().toISOString() })
      .eq('store_id', store.id)
    if (updateLocationError) throw new Error('Location proof deletion could not be recorded.')
  }
  const { error: auditError } = await context.admin.from('store_review_audit_log').insert({
    store_id: store.id,
    actor_user_id: context.userId,
    action: 'verification_images_deleted_by_owner',
  })
  if (auditError) throw new Error('Verification image deletion could not be audited.')
  return respond({ success: true })
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return fail('Method not allowed.', 405)
  try {
    const context = await loadAuthenticatedContext(request)
    if (context instanceof Response) return context
    const body = getObject(await request.json())
    const action = getString(body.action)
    if (action === 'save_draft') return await saveDraft(context, body)
    if (action === 'generate_location_code') return await generateLocationCode(context)
    if (action === 'check_subdomain') return await checkSubdomainAction(context, body)
    if (action === 'submit_application') return await submitApplication(context, body)
    if (action === 'review_queue') return await reviewQueue(context)
    if (action === 'review_application') return await reviewApplication(context, body)
    if (action === 'delete_identity_images') return await deleteIdentityImages(context)
    return fail('Unknown store registration action.')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Store registration could not be processed.'
    return fail(message, 500)
  }
})
