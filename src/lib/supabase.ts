import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

let client: ReturnType<typeof createClient> | null = null

if (url && key) {
  try {
    const parsedUrl = new URL(url)
    if (
      parsedUrl.protocol === 'https:' ||
      ['localhost', '127.0.0.1', '[::1]'].includes(parsedUrl.hostname)
    ) {
      client = createClient(url, key, {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true,
        },
      })
    }
  } catch {
    // A missing or malformed local URL should show the setup notice, not crash the app.
  }
}

export const supabase = client
export const isSupabaseConfigured = Boolean(supabase)
