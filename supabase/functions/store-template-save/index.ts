import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  getStoreTemplateId,
  validateDepartmentNames,
  validateStoreTemplateContent,
} from '../_shared/storeTemplateSchema.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function respond(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function getAuthenticatedUserId(request: Request) {
  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return null

  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!url || !anonKey) throw new Error('Store template service is not configured.')

  const authClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
  })
  const { data, error } = await authClient.auth.getUser()
  if (error || !data.user) return null
  return data.user.id
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return respond({ error: 'Method not allowed.' }, 405)

  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return respond({ error: 'Your session expired, please sign in again.' }, 401)

    const url = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !serviceRoleKey) return respond({ error: 'Store template service is not configured.' }, 503)

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return respond({ error: 'Request body must be valid JSON.' }, 400)
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return respond({ error: 'Request body must be an object.' }, 400)
    }

    const requestBody = body as Record<string, unknown>
    const templateId = getStoreTemplateId(requestBody.templateId)
    if (!templateId) return respond({ error: 'Choose a supported store template.' }, 400)

    const admin = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: store, error: storeError } = await admin
      .from('stores')
      .select('user_id, shop_name, logo, cover, template_id, template_content, template_changed_at, collections')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .maybeSingle()
    if (storeError) throw new Error('Your approved store could not be loaded.')
    if (!store) return respond({ error: 'An approved store is required to customize a template.' }, 404)

    const validated = validateStoreTemplateContent(templateId, requestBody.content, userId, store.shop_name || '')
    if (validated.errors.length > 0) {
      return respond({ error: 'Template content is invalid.', details: validated.errors }, 400)
    }

    const existingCollections = Array.isArray(store.collections)
      ? store.collections as Array<{ id?: unknown; name?: unknown; bannerImage?: unknown }>
      : []
    let nextCollections = existingCollections.filter(collection => typeof collection.id === 'string' && typeof collection.name === 'string')
    if (Object.hasOwn(requestBody, 'departments')) {
      const departmentInput = requestBody.departments
      const departmentEntries = Array.isArray(departmentInput)
        ? departmentInput.map(department => typeof department === 'string'
          ? { name: department }
          : department && typeof department === 'object'
            ? department as Record<string, unknown>
            : {})
        : []
      const validatedDepartments = validateDepartmentNames(departmentEntries.map(department => department.name))
      if (validatedDepartments.errors.length > 0) {
        return respond({ error: 'Departments are invalid.', details: validatedDepartments.errors }, 400)
      }
      nextCollections = validatedDepartments.names.map(name => {
        const entry = departmentEntries.find(department => typeof department.name === 'string' && department.name.toLocaleLowerCase() === name.toLocaleLowerCase())
        const image = entry?.image
        const existing = existingCollections.find(collection => typeof collection.name === 'string' && collection.name.toLocaleLowerCase() === name.toLocaleLowerCase())
        const bannerImage = typeof image === 'string' && (!image || (image.startsWith(`${userId}/`) && image.length <= 512)) ? image : existing?.bannerImage
        return { id: existing?.id || crypto.randomUUID(), name, ...(typeof bannerImage === 'string' && bannerImage ? { bannerImage } : {}) }
      })
    }

    const existingContent = store.template_content && typeof store.template_content === 'object'
      && !Array.isArray(store.template_content)
      ? store.template_content as Record<string, unknown>
      : {}
    const existingBoutiqueContent = existingContent['boutique-grid']
    const existingBoutiqueLogo = existingBoutiqueContent && typeof existingBoutiqueContent === 'object'
      && !Array.isArray(existingBoutiqueContent)
      ? (existingBoutiqueContent as Record<string, unknown>).logoImage
      : undefined
    const templateLogo = templateId === 'boutique-grid' ? validated.content.logoImage : undefined
    const templateBanner = templateId === 'boutique-grid'
      ? validated.content.bannerImage
      : validated.content.heroImage
    const shouldSyncStoreLogo = Boolean(templateLogo) && (
      !store.logo || existingBoutiqueLogo !== templateLogo
    )
    const nextStoreLogo = shouldSyncStoreLogo && templateLogo
      ? admin.storage.from('store-assets').getPublicUrl(templateLogo).data.publicUrl
      : store.logo
    const nextStoreCover = templateBanner
      ? admin.storage.from('store-assets').getPublicUrl(templateBanner).data.publicUrl
      : store.cover
    const shouldSyncStoreCover = Boolean(templateBanner) && store.cover !== nextStoreCover

    const { data: updatedStore, error: updateError } = await admin
      .from('stores')
      .update({
        template_id: templateId,
        template_content: { ...existingContent, [templateId]: validated.content },
        collections: nextCollections,
        ...(shouldSyncStoreLogo ? { logo: nextStoreLogo } : {}),
        ...(shouldSyncStoreCover ? { cover: nextStoreCover } : {}),
      })
      .eq('user_id', userId)
      .eq('status', 'approved')
      .select('template_changed_at, logo, cover')
      .single()
    if (updateError) {
      if (updateError.message.includes('once every six months')) {
        return respond({ error: 'You can change your store template once every six months.' }, 409)
      }
      throw new Error('Your store template could not be saved.')
    }

    return respond({
      success: true,
      templateId,
      content: validated.content,
      departments: nextCollections,
      templateChangedAt: updatedStore.template_changed_at || store.template_changed_at,
      logo: updatedStore.logo,
      cover: updatedStore.cover,
    })
  } catch (error) {
    console.error('Store template save failed:', error)
    return respond({
      error: error instanceof Error ? error.message : 'Store template could not be saved.',
    }, 500)
  }
})
