import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN') || ''
const corsHeaders = {
  ...(allowedOrigin ? { 'Access-Control-Allow-Origin': allowedOrigin } : {}),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
}
const requestMessage = 'If the address is eligible, a one-time code has been sent.'
const verifyMessage = 'The code could not be verified. Request a new code and try again.'
type Json = Record<string, unknown>

function respond(body: Json, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function isEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

async function hashIdentifier(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

async function verifyTurnstile(token: string, secret: string, ip: string) {
  if (!token) return false
  const form = new URLSearchParams({ secret, response: token, remoteip: ip })
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  })
  if (!response.ok) throw new Error('CAPTCHA verification service is unavailable.')
  const result = await response.json() as { success?: boolean }
  return result.success === true
}

function getClientIp(request: Request) {
  return request.headers.get('cf-connecting-ip')
    || request.headers.get('x-real-ip')
    || request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim()
    || 'unknown-ip'
}

async function consumeLimit(admin: ReturnType<typeof createClient>, value: string, scope: string, secret: string) {
  const identifierHash = await hashIdentifier(value, secret)
  const { data, error } = await admin.rpc('consume_admin_auth_rate_limit', {
    p_identifier_hash: identifierHash,
    p_scope: scope,
    p_limit: 5,
  })
  if (error) throw new Error('Admin authentication rate limiting is unavailable.')
  return data === true
}

async function isEligible(admin: ReturnType<typeof createClient>, email: string) {
  const { data, error } = await admin.rpc('admin_email_is_eligible', { p_email: email })
  if (error) throw new Error('Moderator access could not be checked.')
  return data === true
}

async function requestOtp(email: string, token: string, ip: string, admin: ReturnType<typeof createClient>, config: { url: string; anonKey: string; hashSecret: string; turnstileSecret: string }) {
  if (!await verifyTurnstile(token, config.turnstileSecret, ip)) {
    return respond({ success: true, message: requestMessage })
  }
  const [emailAllowed, ipAllowed] = await Promise.all([
    consumeLimit(admin, email, 'request_email', config.hashSecret),
    consumeLimit(admin, ip, 'request_ip', config.hashSecret),
  ])
  if (!emailAllowed || !ipAllowed || !await isEligible(admin, email)) {
    return respond({ success: true, message: requestMessage })
  }

  const otpResponse = await fetch(`${config.url}/auth/v1/otp`, {
    method: 'POST',
    headers: { apikey: config.anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      create_user: false,
      gotrue_meta_security: { captcha_token: token },
    }),
  })
  if (!otpResponse.ok) {
    console.error('Admin OTP dispatch failed.')
  }
  return respond({ success: true, message: requestMessage })
}

async function verifyOtp(email: string, token: string, captchaToken: string, ip: string, admin: ReturnType<typeof createClient>, config: { url: string; anonKey: string; hashSecret: string; turnstileSecret: string }) {
  if (!await verifyTurnstile(captchaToken, config.turnstileSecret, ip)) {
    return respond({ success: false, message: verifyMessage })
  }
  const [emailAllowed, ipAllowed] = await Promise.all([
    consumeLimit(admin, email, 'verify_email', config.hashSecret),
    consumeLimit(admin, ip, 'verify_ip', config.hashSecret),
  ])
  if (!emailAllowed || !ipAllowed || !/^\d{6}$/.test(token) || !await isEligible(admin, email)) {
    return respond({ success: false, message: verifyMessage })
  }

  const verifyResponse = await fetch(`${config.url}/auth/v1/verify`, {
    method: 'POST',
    headers: { apikey: config.anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token, type: 'email' }),
  })
  if (!verifyResponse.ok) {
    return respond({ success: false, message: verifyMessage })
  }
  const session = await verifyResponse.json() as Json
  if (typeof session.access_token !== 'string' || typeof session.refresh_token !== 'string') {
    return respond({ success: false, message: verifyMessage })
  }
  return respond({ success: true, session })
}

Deno.serve(async request => {
  const origin = request.headers.get('origin')
  if (!allowedOrigin || origin !== allowedOrigin) {
    return new Response('Forbidden', { status: 403 })
  }
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return respond({ error: 'Method not allowed.' }, 405)

  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY')
  const hashSecret = Deno.env.get('ADMIN_AUTH_HASH_SECRET')
  if (!url || !anonKey || !serviceRoleKey || !turnstileSecret || !hashSecret || !allowedOrigin) {
    return respond({ error: 'Moderator sign-in is not configured.' }, 503)
  }

  let body: Json
  try {
    const parsed: unknown = await request.json()
    body = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Json : {}
  } catch {
    return respond({ error: 'Request body must be valid JSON.' }, 400)
  }

  const email = getString(body.email).toLowerCase()
  const clientIp = getClientIp(request)
  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    if (!isEmail(email)) return respond({ success: true, message: requestMessage })
    const action = getString(body.action)
    if (action === 'request') {
      return await requestOtp(email, getString(body.captchaToken), clientIp, admin, {
        url, anonKey, hashSecret, turnstileSecret,
      })
    }
    if (action === 'verify') {
      const code = getString(body.code)
      return await verifyOtp(email, code, getString(body.captchaToken), clientIp, admin, {
        url, anonKey, hashSecret, turnstileSecret,
      })
    }
    return respond({ error: 'Unknown admin authentication action.' }, 400)
  } catch (error) {
    console.error('Admin authentication request failed:', error instanceof Error ? error.message : 'Unknown error')
    return respond({ error: 'Moderator sign-in is temporarily unavailable.' }, 503)
  }
})
