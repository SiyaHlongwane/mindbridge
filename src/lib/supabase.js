import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const key = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
)?.trim()

function isBrowserForbiddenSecretKey(value) {
  if (!value) return false
  if (value.startsWith('sb_secret_')) return true
  const parts = value.split('.')
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
      if (payload?.role === 'service_role') return true
    } catch {
      // ignore malformed JWT
    }
  }
  return false
}

function isValidUrl(value) {
  if (!value) return false
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

export const supabaseKeyError = isBrowserForbiddenSecretKey(key)
  ? 'A Supabase secret/service_role key was placed in VITE_SUPABASE_ANON_KEY. Secret keys are forbidden in the browser — replace VITE_SUPABASE_ANON_KEY with your Supabase Publishable / anon public key (sb_publishable_... or anon JWT) and rotate the exposed secret key in Supabase.'
  : url && !isValidUrl(url)
    ? 'VITE_SUPABASE_URL must be a valid https:// project URL (for example https://your-project.supabase.co).'
    : ''

export const supabase =
  isValidUrl(url) && key && !supabaseKeyError
    ? createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null

export function isMissingSchemaError(error) {
  if (!error) return false
  const code = String(error.code || '')
  const msg = String(error.message || error.details || '')
  return (
    ['42703', '42P01', '42883', 'PGRST202', 'PGRST204', 'PGRST205'].includes(code) ||
    /column .* does not exist|relation .* does not exist|could not find the .* column|could not find the function|schema cache/i.test(msg)
  )
}

export function isCheckConstraintError(error) {
  if (!error) return false
  return String(error.code || '') === '23514' || /violates check constraint/i.test(String(error.message || ''))
}
