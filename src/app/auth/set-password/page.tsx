'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, LoaderCircle, LockKeyhole } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

export default function SetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void supabase?.auth.getSession().then(({ data }) => {
      if (!active) return
      if (!data.session) router.replace('/')
      else setReady(true)
    })
    return () => { active = false }
  }, [router])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    if (password !== confirmation) {
      setError('Hai mật khẩu chưa trùng nhau.')
      return
    }
    if (!supabase) {
      setError('Chưa kết nối Supabase.')
      return
    }
    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) setError(updateError.message)
      else {
        setMessage('Mật khẩu đã được tạo. Đang mở EduSpace…')
        window.setTimeout(() => router.replace('/'), 800)
      }
    } catch {
      setError('Không kết nối được Supabase. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  if (!ready) return <div className="loading-state" role="status"><span className="loading-ring" /> Đang kiểm tra lời mời…</div>

  return <section className="auth-card" aria-labelledby="set-password-title">
    <div className="auth-header"><h2 id="set-password-title">Tạo mật khẩu EduSpace</h2><p className="auth-intro">Đặt mật khẩu riêng để đăng nhập bằng email của bạn.</p></div>
    <form className="auth-form" onSubmit={handleSubmit}>
      <label htmlFor="new-password">Mật khẩu mới</label>
      <div className="input-wrap"><LockKeyhole size={17} /><input id="new-password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
      <label htmlFor="confirm-password">Nhập lại mật khẩu</label>
      <div className="input-wrap"><LockKeyhole size={17} /><input id="confirm-password" type="password" autoComplete="new-password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></div>
      {error && <p className="form-message error" role="alert">{error}</p>}
      {message && <p className="form-message success" role="status">{message}</p>}
      <button className="primary-button auth-submit" type="submit" disabled={loading}>{loading ? <LoaderCircle className="spin" size={17} /> : <>Lưu mật khẩu <ArrowRight size={17} /></>}</button>
    </form>
  </section>
}
