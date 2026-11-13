import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type Json = Record<string, unknown>
type Context = { admin: SupabaseClient; userId: string }

function respond(body: Json, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

async function loadContext(request: Request): Promise<Context | Response> {
  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return respond({ error: 'Sign in to continue.' }, 401)

  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !anonKey || !serviceRoleKey) return respond({ error: 'Store deletion is not configured.' }, 503)

  const authClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } })
  const { data, error } = await authClient.auth.getUser()
  if (error || !data.user) return respond({ error: 'Your sign-in session has expired.' }, 401)

  return {
    admin: createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } }),
    userId: data.user.id,
  }
}

async function isModerator(admin: SupabaseClient, userId: string) {
  const { data, error } = await admin.from('store_admins').select('user_id').eq('user_id', userId).maybeSingle()
  if (error) throw new Error('Moderator permissions could not be checked.')
  return Boolean(data)
}

function addPublicMediaPaths(value: unknown, paths: Set<string>) {
  if (typeof value === 'string') {
    const match = value.match(/\/storage\/v1\/object\/(?:public|sign)\/marketspace-media\/([^?#]+)/i)
    if (match) {
      try {
        paths.add(decodeURIComponent(match[1]))
      } catch {
        paths.add(match[1])
      }
    }
    return
  }
  if (Array.isArray(value)) {
    value.forEach(item => addPublicMediaPaths(item, paths))
    return
  }
  if (value && typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach(item => addPublicMediaPaths(item, paths))
  }
}

function addPrivateMediaPath(value: unknown, ownerId: string, paths: Set<string>) {
  if (typeof value !== 'string') return
  const match = value.match(/\/storage\/v1\/object\/(?:public|sign)\/store-private\/([^?#]+)/i)
  let path = value
  if (match) {
    try {
      path = decodeURIComponent(match[1])
    } catch {
      path = match[1]
    }
  }
  if (path.startsWith(`${ownerId}/`) && !path.includes('/seller-verification/')) paths.add(path)
}

function collectDraftPrivatePaths(value: unknown, ownerId: string, paths: Set<string>) {
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value)) {
    value.forEach(item => collectDraftPrivatePaths(item, ownerId, paths))
    return
  }
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (['idImagePath', 'selfiePath', 'proofPath'].includes(key)) addPrivateMediaPath(nested, ownerId, paths)
    else collectDraftPrivatePaths(nested, ownerId, paths)
  }
}

async function collectMediaPaths(admin: SupabaseClient, storeId: string, ownerId: string) {
  const [storeResult, listingResult, adResult, identityResult, locationResult, draftResult] = await Promise.all([
    admin.from('stores').select('logo, cover, catalog, collections, template_content').eq('id', storeId).single(),
    admin.from('listings').select('images').eq('store_id', storeId),
    admin.from('store_ads').select('ad_data').eq('store_id', storeId),
    admin.from('store_owner_identity').select('id_image_path, selfie_path').eq('user_id', ownerId).maybeSingle(),
    admin.from('store_location_verifications').select('proof_path').eq('store_id', storeId).maybeSingle(),
    admin.from('store_registration_drafts').select('data').eq('user_id', ownerId).maybeSingle(),
  ])
  if (storeResult.error || listingResult.error || adResult.error || identityResult.error || locationResult.error || draftResult.error) {
    throw new Error('Store media could not be collected for deletion.')
  }

  const publicPaths = new Set<string>()
  const privatePaths = new Set<string>()
  addPublicMediaPaths(storeResult.data, publicPaths)
  addPublicMediaPaths(listingResult.data, publicPaths)
  addPublicMediaPaths(adResult.data, publicPaths)
  addPrivateMediaPath(identityResult.data?.id_image_path, ownerId, privatePaths)
  addPrivateMediaPath(identityResult.data?.selfie_path, ownerId, privatePaths)
  addPrivateMediaPath(locationResult.data?.proof_path, ownerId, privatePaths)
  collectDraftPrivatePaths(draftResult.data?.data, ownerId, privatePaths)
  return { publicPaths: [...publicPaths], privatePaths: [...privatePaths] }
}

async function removeInBatches(admin: SupabaseClient, bucket: string, paths: string[]) {
  for (let index = 0; index < paths.length; index += 100) {
    const { error } = await admin.storage.from(bucket).remove(paths.slice(index, index + 100))
    if (error) throw new Error(`Uploaded ${bucket} files could not be removed.`)
  }
}

async function finishCleanup(admin: SupabaseClient, cleanupId: string) {
  const { data: job, error: loadError } = await admin
    .from('store_deletion_cleanup')
    .select('public_media_paths, private_media_paths')
    .eq('id', cleanupId)
    .maybeSingle()
  if (loadError) throw new Error('The remaining store media cleanup could not be loaded.')
  if (!job) return

  await removeInBatches(admin, 'marketspace-media', job.public_media_paths || [])
  await removeInBatches(admin, 'store-private', job.private_media_paths || [])
  const { error: deleteError } = await admin.from('store_deletion_cleanup').delete().eq('id', cleanupId)
  if (deleteError) throw new Error('Deleted store media was removed, but the cleanup record could not be cleared.')
}

async function retryCleanup(context: Context, storeId: string, moderator: boolean) {
  const query = context.admin
    .from('store_deletion_cleanup')
    .select('id, owner_user_id')
    .eq('store_id', storeId)
  const { data: jobs, error } = moderator
    ? await query
    : await query.eq('owner_user_id', context.userId)
  if (error) throw new Error('Pending media cleanup could not be checked.')
  if (!moderator && jobs?.some(job => job.owner_user_id !== context.userId)) {
    throw new Error('You are not authorized to retry this media cleanup.')
  }
  for (const job of jobs || []) await finishCleanup(context.admin, job.id)
  return (jobs || []).length
}

async function deleteStore(context: Context, body: Json) {
  const storeId = getString(body.storeId)
  const action = getString(body.action)
  if (!isUuid(storeId)) return respond({ error: 'Choose a valid store.' }, 400)

  const moderator = await isModerator(context.admin, context.userId)
  if (action === 'retry_cleanup') {
    const retried = await retryCleanup(context, storeId, moderator)
    return respond({ success: true, retried })
  }

  const fraudAbuse = action === 'delete_for_fraud'
  if (action !== 'delete_owned' && !fraudAbuse) return respond({ error: 'Choose a valid deletion action.' }, 400)
  if (fraudAbuse && !moderator) return respond({ error: 'Only moderators can remove a store for fraud or abuse.' }, 403)

  const { data: store, error: storeError } = await context.admin
    .from('stores')
    .select('id, user_id, archived_at')
    .eq('id', storeId)
    .maybeSingle()
  if (storeError) throw new Error('Store ownership could not be checked.')
  if (!store) {
    if (!fraudAbuse && action === 'delete_owned') {
      const retried = await retryCleanup(context, storeId, moderator)
      if (retried) return respond({ success: true, storeId, retried })
    }
    return respond({ error: 'Store not found.' }, 404)
  }
  if (!fraudAbuse && (store.user_id !== context.userId || !store.archived_at)) {
    return respond({ error: 'Only the owner of a disabled store can permanently delete it.' }, 403)
  }

  const reason = getString(body.reason)
  if (fraudAbuse && (!reason || reason.length > 500)) {
    return respond({ error: 'A reason of at most 500 characters is required for a fraud or abuse removal.' }, 400)
  }

  const mediaPaths = await collectMediaPaths(context.admin, storeId, store.user_id)
  const { data: cleanupId, error: deleteError } = await context.admin.rpc('delete_store_completely', {
    p_store_id: storeId,
    p_actor_id: context.userId,
    p_fraud_abuse: fraudAbuse,
    p_reason: fraudAbuse ? reason : '',
    p_public_media_paths: mediaPaths.publicPaths,
    p_private_media_paths: mediaPaths.privatePaths,
  })
  if (deleteError) {
    if (deleteError.message.includes('Only the owner')) return respond({ error: deleteError.message }, 403)
    if (deleteError.message.includes('Only moderators')) return respond({ error: deleteError.message }, 403)
    throw new Error('Store data could not be deleted.')
  }

  if (cleanupId) {
    try {
      await finishCleanup(context.admin, cleanupId)
    } catch (cleanupError) {
      try {
        await retryCleanup(context, storeId, moderator)
        return respond({ success: true, storeId })
      } catch {
        // Keep the durable cleanup row so the owner or a moderator can retry.
      }
      return respond({
        error: cleanupError instanceof Error ? cleanupError.message : 'Store media cleanup is pending.',
        success: false,
        storeDeleted: true,
        cleanupPending: true,
        storeId,
      }, 503)
    }
  }
  return respond({ success: true, storeId })
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return respond({ error: 'Method not allowed.' }, 405)

  try {
    const context = await loadContext(request)
    if (context instanceof Response) return context
    const body = await request.json() as Json
    return await deleteStore(context, body)
  } catch (error) {
    return respond({ error: error instanceof Error ? error.message : 'Store deletion could not be completed.' }, 500)
  }
})
