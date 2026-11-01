'use client'

import { useState, type FormEvent } from 'react'
import { ArrowRight, LoaderCircle, Mail } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')
    if (!supabase) {
      setError('Chưa kết nối Supabase.')
      setLoading(false)
      return
    }
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/set-password`,
      })
      if (resetError) setError('Chưa gửi được email khôi phục. Vui lòng thử lại sau.')
      else setMessage('Nếu email thuộc tài khoản EduSpace, hướng dẫn đặt lại mật khẩu sẽ được gửi đến hộp thư.')
    } catch {
      setError('Không kết nối được Supabase. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return <section className="auth-card" aria-labelledby="forgot-password-title">
    <div className="auth-header"><h2 id="forgot-password-title">Khôi phục mật khẩu</h2><p className="auth-intro">Nhập email để nhận link đặt mật khẩu mới.</p></div>
    <form className="auth-form" onSubmit={handleSubmit}>
      <label htmlFor="recovery-email">Email</label>
      <div className="input-wrap"><Mail size={17} /><input id="recovery-email" type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
      {error && <p className="form-message error" role="alert">{error}</p>}
      {message && <p className="form-message success" role="status">{message}</p>}
      <button className="primary-button auth-submit" type="submit" disabled={loading}>{loading ? <LoaderCircle className="spin" size={17} /> : <>Gửi link đặt lại <ArrowRight size={17} /></>}</button>
      <a className="auth-link-button" href="/">Quay lại đăng nhập</a>
    </form>
  </section>
}
