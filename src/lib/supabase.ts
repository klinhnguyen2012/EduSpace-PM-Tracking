import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

let client: SupabaseClient<Database> | null = null

const authStorage = {
  getItem(key: string) {
    if (typeof window === 'undefined') return null
    const remember = window.localStorage.getItem('eduspace-remember-auth') === 'true'
    return (remember ? window.localStorage : window.sessionStorage).getItem(key)
  },
  setItem(key: string, value: string) {
    if (typeof window === 'undefined') return
    const remember = window.localStorage.getItem('eduspace-remember-auth') === 'true'
    const target = remember ? window.localStorage : window.sessionStorage
    const other = remember ? window.sessionStorage : window.localStorage
    other.removeItem(key)
    target.setItem(key, value)
  },
  removeItem(key: string) {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(key)
    window.sessionStorage.removeItem(key)
  },
}

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
          detectSessionInUrl: false,
          flowType: 'pkce',
          persistSession: true,
          storage: authStorage,
        },
      })
    }
  } catch {
    // A missing or malformed local URL should show the setup notice, not crash the app.
  }
}

export const supabase = client
export const isSupabaseConfigured = Boolean(supabase)

export function setRememberAuth(remember: boolean) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem('eduspace-remember-auth', String(remember))
}
