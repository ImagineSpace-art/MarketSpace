import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') return new Response('Method not allowed.', { status: 405 })
  const expectedSecret = Deno.env.get('PURGE_JOB_SECRET')
  if (!expectedSecret || request.headers.get('x-purge-secret') !== expectedSecret) {
    return new Response('Unauthorized.', { status: 401 })
  }

  const url = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceRoleKey) return new Response('Purge service is not configured.', { status: 503 })
  const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: expired, error: queryError } = await admin
    .from('store_owner_identity')
    .select('user_id, id_image_path, selfie_path')
    .not('delete_images_after', 'is', null)
    .lte('delete_images_after', new Date().toISOString())
  if (queryError) return new Response('Expired image records could not be loaded.', { status: 500 })

  let removedCount = 0
  let failedCount = 0
  for (const identity of expired || []) {
    const { data: store } = await admin.from('stores').select('id').eq('user_id', identity.user_id).maybeSingle()
    const { data: location } = store
      ? await admin.from('store_location_verifications').select('proof_path').eq('store_id', store.id).maybeSingle()
      : { data: null }
    const paths = [identity.id_image_path, identity.selfie_path, location?.proof_path].filter((path): path is string => Boolean(path))
    if (paths.length) {
      const { error: removeError } = await admin.storage.from('store-private').remove(paths)
      if (removeError) {
        failedCount += 1
        continue
      }
    }
    const { error: updateError } = await admin.from('store_owner_identity').update({
      id_image_path: null,
      selfie_path: null,
      delete_images_after: null,
      updated_at: new Date().toISOString(),
    }).eq('user_id', identity.user_id)
    if (updateError) {
      failedCount += 1
      continue
    }
    if (store) {
      await admin.from('store_location_verifications').update({ proof_path: null, updated_at: new Date().toISOString() }).eq('store_id', store.id)
      await admin.from('store_review_audit_log').insert({
        store_id: store.id,
        actor_user_id: null,
        action: 'verification_images_deleted_after_retention',
        details: { imageCount: paths.length },
      })
    }
    removedCount += paths.length
  }

  return Response.json({ removedCount, failedCount })
})
