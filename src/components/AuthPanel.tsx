'use client'

import { useState, type FormEvent } from 'react'
import Image from 'next/image'
import { ArrowRight, LoaderCircle, LockKeyhole, User } from 'lucide-react'
import { setRememberAuth, supabase } from '../lib/supabase'

type AuthPanelProps = {
  onSuccess: (username: string) => void
}

export function AuthPanel({ onSuccess }: AuthPanelProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    if (!supabase) {
      setError('Chưa kết nối Supabase. Kiểm tra cấu hình môi trường rồi tải lại trang.')
      setLoading(false)
      return
    }

    try {
      setRememberAuth(remember)
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: username.trim().toLowerCase(),
        password,
      })
      if (loginError || !data.user?.email) {
        setError('Email hoặc mật khẩu chưa chính xác.')
        return
      }
      onSuccess(data.user.email)
    } catch {
      setError('Không kết nối được Supabase. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-card" aria-labelledby="auth-title">
      <div className="auth-header">
        <div className="auth-logo">
          <Image
            src="/eduspace-mark.png"
            alt="EduSpace Logo"
            width={76}
            height={76}
            priority
          />
        </div>
        <p className="eyebrow">CHÀO MỪNG ĐẾN EDUSPACE</p>
        <h2 id="auth-title">Đăng nhập workspace</h2>
        <p className="auth-intro">Đăng nhập bằng email và mật khẩu riêng của bạn.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="auth-username">Email</label>
        <div className="input-wrap">
          <User size={17} />
          <input
            id="auth-username"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </div>

        <label htmlFor="auth-password">Mật khẩu</label>
        <div className="input-wrap">
          <LockKeyhole size={17} />
          <input
            id="auth-password"
            type="password"
            autoComplete="current-password"
            placeholder="Nhập mật khẩu"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <label className="auth-remember"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> Ghi nhớ đăng nhập trên thiết bị này</label>

        {error && <p className="form-message error" role="alert">{error}</p>}

        <button className="primary-button auth-submit" type="submit" disabled={loading}>
          {loading ? <LoaderCircle className="spin" size={17} /> : <>Đăng nhập <ArrowRight size={17} /></>}
        </button>
        <a className="auth-link-button" href="/auth/forgot-password">Quên mật khẩu?</a>
      </form>
    </section>
  )
}
