import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let adminClient: SupabaseClient | null = null
let authClient: SupabaseClient | null = null

function getSupabaseUrl() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL
  if (!url) {
    throw new Error(
      'EXPO_PUBLIC_SUPABASE_URL is missing. Add it to .env and restart Expo.'
    )
  }
  return url
}

/** Anon/publishable client — used only to validate the caller's JWT. */
function getSupabaseAuthClient() {
  if (authClient) return authClient

  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY
  if (!anonKey) {
    throw new Error(
      'EXPO_PUBLIC_SUPABASE_KEY is missing. Add it to .env and restart Expo.'
    )
  }

  authClient = createClient(getSupabaseUrl(), anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return authClient
}

/** Service-role client for API routes only. Never import this in client code. */
export function getSupabaseAdmin() {
  if (adminClient) return adminClient

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is missing. Add the service_role key from Supabase Dashboard → Project Settings → API to your .env, then restart Expo.'
    )
  }

  adminClient = createClient(getSupabaseUrl(), serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return adminClient
}

export async function getUserFromRequest(request: Request) {
  const header = request.headers.get('Authorization')
  if (!header?.startsWith('Bearer ')) {
    return null
  }

  const accessToken = header.slice('Bearer '.length).trim()
  if (!accessToken) return null

  const auth = getSupabaseAuthClient()
  const { data, error } = await auth.auth.getUser(accessToken)
  if (error || !data.user) return null
  return data.user
}
