'use client'

import { useState, type FormEvent } from 'react'
import Image from 'next/image'
import { ArrowRight, LoaderCircle, LockKeyhole, User } from 'lucide-react'

type AuthPanelProps = {
  onSuccess: (username: string) => void
}

export function AuthPanel({ onSuccess }: AuthPanelProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    await new Promise((resolve) => setTimeout(resolve, 300))

    const trimmedUser = username.trim()
    if (trimmedUser === 'admin' && password === 'admin123') {
      onSuccess(trimmedUser)
    } else {
      setError('Tên đăng nhập hoặc mật khẩu chưa chính xác.')
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
        <p className="auth-intro">Nhập thông tin tài khoản để truy cập không gian làm việc EduSpace.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="auth-username">Tên đăng nhập</label>
        <div className="input-wrap">
          <User size={17} />
          <input
            id="auth-username"
            type="text"
            autoComplete="username"
            placeholder="Nhập tên đăng nhập"
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

        {error && <p className="form-message error" role="alert">{error}</p>}

        <button className="primary-button auth-submit" type="submit" disabled={loading}>
          {loading ? <LoaderCircle className="spin" size={17} /> : <>Đăng nhập <ArrowRight size={17} /></>}
        </button>
      </form>
    </section>
  )
}
