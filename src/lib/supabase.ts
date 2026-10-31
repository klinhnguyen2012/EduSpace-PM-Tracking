import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

let client: SupabaseClient<Database> | null = null

if (url && key) {
  try {
    const parsedUrl = new URL(url)
    if (
      parsedUrl.protocol === 'https:' ||
      ['localhost', '127.0.0.1', '[::1]'].includes(parsedUrl.hostname)
    ) {
    client = createClient<Database>(url, key, {
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
