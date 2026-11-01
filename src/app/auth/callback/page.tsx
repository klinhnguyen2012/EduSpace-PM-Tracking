'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function completeAuth() {
      const searchParams = new URLSearchParams(window.location.search)
      const code = searchParams.get('code')
      const nextPath = searchParams.get('next') === '/auth/set-password' ? '/auth/set-password' : '/'
      if (!supabase || !code) {
        if (active) setError('Link xác nhận không hợp lệ hoặc đã hết hạn. Hãy xin gửi lại email.')
        return
      }
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      if (!active) return
      if (exchangeError) setError('Không xác nhận được email. Hãy xin gửi lại link mời hoặc khôi phục mật khẩu.')
      else router.replace(nextPath)
    }
    void completeAuth()
    return () => { active = false }
  }, [router])

  return <section className="auth-card"><h2>{error ? 'Không xác nhận được email' : 'Đang xác nhận email…'}</h2>{error && <p className="form-message error" role="alert">{error}</p>}{error && <a className="auth-link-button" href="/">Quay lại đăng nhập</a>}</section>
}
