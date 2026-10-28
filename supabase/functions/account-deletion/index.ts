import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { deleteAccountData, type AccountDeletionOperations } from '../_shared/accountDeletion.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function respond(body: { error?: string; success?: boolean }, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function getAuthenticatedUserId(request: Request) {
  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return null

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !anonKey) throw new Error('Account deletion is not configured.')

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  })
  const { data, error } = await authClient.auth.getUser()
  if (error || !data.user) return null
  return data.user.id
}

function createDeletionOperations(admin: SupabaseClient): AccountDeletionOperations {
  return {
    prepareAccountDeletion: async (userId) => {
      const { error } = await admin.rpc('prepare_account_deletion', { p_user_id: userId })
      return { error }
    },
    listPrivateFiles: async (path, options) => {
      const { data, error } = await admin.storage.from('store-private').list(path, options)
      return { data: data?.map(({ name, id }) => ({ name, id })) ?? null, error }
    },
    removePrivateFiles: async (paths) => {
      const { error } = await admin.storage.from('store-private').remove(paths)
      return { error }
    },
    deleteAuthUser: async (userId) => {
      const { error } = await admin.auth.admin.deleteUser(userId)
      return { error }
    },
  }
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return respond({ error: 'Method not allowed.' }, 405)

  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return respond({ error: 'Sign in again before deleting your account.' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceRoleKey) {
      return respond({ error: 'Account deletion is not configured.' }, 503)
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    // TODO(account-deletion): block deletion on open orders, unresolved disputes, or pending payouts once those tables exist.
    await deleteAccountData(userId, createDeletionOperations(admin))
    return respond({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Account deletion could not be completed.'
    return respond({ error: message }, 500)
  }
})
