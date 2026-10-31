import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type Json = Record<string, unknown>
type AuthenticatedContext = { admin: SupabaseClient; userId: string }
type PendingAdRow = {
  id: string
  status: string
  ad_data: Json
  moderation_status: 'pending'
  moderation_reason: string | null
  store_id: string
  user_id: string
  created_at: string
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

async function loadAuthenticatedContext(request: Request): Promise<AuthenticatedContext | Response> {
  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return respond({ error: 'Sign in to review listings.' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return respond({ error: 'Listing review is not configured.' }, 503)
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  })
  const { data, error } = await authClient.auth.getUser()
  if (error || !data.user) return respond({ error: 'Your sign-in session has expired. Please sign in again.' }, 401)

  return {
    admin: createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    }),
    userId: data.user.id,
  }
}

async function ensureModerator(context: AuthenticatedContext) {
  const { data, error } = await context.admin
    .from('store_admins')
    .select('user_id')
    .eq('user_id', context.userId)
    .maybeSingle()
  if (error) throw new Error('Moderator permissions could not be checked.')
  return Boolean(data)
}

async function loadPendingListings(context: AuthenticatedContext) {
  if (!await ensureModerator(context)) {
    return respond({ error: 'You are not authorized to review listings.' }, 403)
  }

  const { data: listings, error } = await context.admin
    .from('listings')
    .select('*')
    .eq('moderation_status', 'pending')
    .order('created_at', { ascending: true })
  if (error) throw new Error('The pending listing queue could not be loaded.')

  const userIds = [...new Set((listings || []).map(listing => listing.user_id).filter(Boolean))]
  const storeIds = [...new Set((listings || []).map(listing => listing.store_id).filter(Boolean))]
  const [profilesResult, storesResult] = await Promise.all([
    userIds.length
      ? context.admin.from('public_profiles').select('user_id, username').in('user_id', userIds)
      : Promise.resolve({ data: [], error: null }),
    storeIds.length
      ? context.admin.from('stores').select('id, shop_name').in('id', storeIds)
      : Promise.resolve({ data: [], error: null }),
  ])
  if (profilesResult.error || storesResult.error) throw new Error('Listing seller details could not be loaded.')

  const profileNames = new Map((profilesResult.data || []).map(profile => [profile.user_id, profile.username || 'Seller']))
  const storeNames = new Map((storesResult.data || []).map(store => [store.id, store.shop_name || 'Store']))
  return respond({
    listings: (listings || []).map(listing => ({
      ...listing,
      seller_name: profileNames.get(listing.user_id) || 'Seller',
      store_name: listing.store_id ? storeNames.get(listing.store_id) || 'Store' : null,
    })),
  })
}

async function reviewListing(context: AuthenticatedContext, body: Json) {
  if (!await ensureModerator(context)) {
    return respond({ error: 'You are not authorized to review listings.' }, 403)
  }

  const listingId = typeof body.listingId === 'number' && Number.isSafeInteger(body.listingId)
    ? String(body.listingId)
    : getString(body.listingId)
  const parsedListingId = Number(listingId)
  const decision = getString(body.decision)
  const reason = getString(body.reason)
  if (!/^[1-9]\d*$/.test(listingId) || !Number.isSafeInteger(parsedListingId) || !['approve', 'reject'].includes(decision)) {
    return respond({ error: 'Choose a valid listing and review decision.' }, 400)
  }
  if (reason.length > 500 || (decision === 'reject' && !reason)) {
    return respond({ error: decision === 'reject' ? 'A reason is required to reject a listing.' : 'The reason must be 500 characters or fewer.' }, 400)
  }

  const { data, error } = await context.admin.rpc('review_listing_moderation', {
    p_listing_id: parsedListingId,
    p_reviewer_id: context.userId,
    p_decision: decision === 'approve' ? 'approved' : 'rejected',
    p_reason: reason,
  })
  if (error) {
    if (error.message.includes('cannot review their own listings')) {
      return respond({ error: 'You cannot review your own listing.' }, 403)
    }
    if (error.message.includes('no longer pending')) {
      return respond({ error: 'This listing has already been reviewed.' }, 409)
    }
    if (error.message.includes('active listing limit')) {
      return respond({ error: 'The store has reached its active listing limit; the listing cannot be approved yet.' }, 409)
    }
    if (error.message.includes('Invalid listing review') || error.message.includes('reason')) {
      return respond({ error: error.message }, 400)
    }
    throw new Error('The listing decision, audit record, and seller notification could not be saved.')
  }
  return respond({ success: true, listing: data })
}

async function loadPendingAds(context: AuthenticatedContext) {
  if (!await ensureModerator(context)) {
    return respond({ error: 'You are not authorized to review ads.' }, 403)
  }

  const { data: ads, error } = await context.admin
    .from('store_ads')
    .select('id,status,ad_data,moderation_status,moderation_reason,store_id,user_id,created_at')
    .eq('moderation_status', 'pending')
    .order('created_at', { ascending: true })
  if (error) throw new Error('The pending ad queue could not be loaded.')

  const storeIds = [...new Set((ads || []).map(ad => ad.store_id))]
  const userIds = [...new Set((ads || []).map(ad => ad.user_id))]
  const [storesResult, profilesResult] = await Promise.all([
    storeIds.length
      ? context.admin.from('stores').select('id,shop_name').in('id', storeIds)
      : Promise.resolve({ data: [], error: null }),
    userIds.length
      ? context.admin.from('public_profiles').select('user_id,username').in('user_id', userIds)
      : Promise.resolve({ data: [], error: null }),
  ])
  if (storesResult.error || profilesResult.error) throw new Error('Ad seller details could not be loaded.')

  const storeNames = new Map((storesResult.data || []).map(store => [store.id, store.shop_name || 'Store']))
  const sellerNames = new Map((profilesResult.data || []).map(profile => [profile.user_id, profile.username || 'Seller']))
  return respond({
    ads: ((ads || []) as PendingAdRow[]).map(ad => ({
      ...ad.ad_data,
      id: ad.id,
      status: ad.status,
      moderation_status: ad.moderation_status,
      moderation_reason: ad.moderation_reason,
      store_id: ad.store_id,
      user_id: ad.user_id,
      created_at: ad.created_at,
      store_name: storeNames.get(ad.store_id) || 'Store',
      seller_name: sellerNames.get(ad.user_id) || 'Seller',
    })),
  })
}

async function reviewAd(context: AuthenticatedContext, body: Json) {
  if (!await ensureModerator(context)) {
    return respond({ error: 'You are not authorized to review ads.' }, 403)
  }

  const adId = getString(body.adId)
  const decision = getString(body.decision)
  const reason = getString(body.reason)
  if (!adId || !['approve', 'reject'].includes(decision)) {
    return respond({ error: 'Choose a valid ad and review decision.' }, 400)
  }
  if (reason.length > 500 || (decision === 'reject' && !reason)) {
    return respond({ error: decision === 'reject' ? 'A reason is required to reject an ad.' : 'The reason must be 500 characters or fewer.' }, 400)
  }

  const { data, error } = await context.admin.rpc('review_store_ad_moderation', {
    p_ad_id: adId,
    p_reviewer_id: context.userId,
    p_decision: decision === 'approve' ? 'approved' : 'rejected',
    p_reason: reason,
  })
  if (error) {
    if (error.message.includes('cannot review their own ads')) {
      return respond({ error: 'You cannot review your own ad.' }, 403)
    }
    if (error.message.includes('no longer pending')) {
      return respond({ error: 'This ad has already been reviewed.' }, 409)
    }
    if (error.message.includes('Invalid ad review') || error.message.includes('reason')) {
      return respond({ error: error.message }, 400)
    }
    throw new Error('The ad decision and audit record could not be saved.')
  }
  return respond({ success: true, ad: data })
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

    const action = getString(body.action) || 'pending_listings'
    if (action === 'pending_listings') return await loadPendingListings(context)
    if (action === 'review_listing') return await reviewListing(context, body)
    if (action === 'pending_ads') return await loadPendingAds(context)
    if (action === 'review_ad') return await reviewAd(context, body)
    return respond({ error: 'Unknown listing review action.' }, 400)
  } catch (error) {
    console.error('Listing review request failed:', error)
    return respond({
      error: error instanceof Error ? error.message : 'Listing review could not be completed.',
    }, 500)
  }
})
