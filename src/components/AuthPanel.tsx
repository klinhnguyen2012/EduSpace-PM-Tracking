import { useState, type FormEvent } from 'react'
import { ArrowRight, LoaderCircle, LockKeyhole, Mail } from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'

type AuthPanelProps = { client: SupabaseClient }
type AuthMode = 'sign-in' | 'sign-up'

function friendlyError(message: string) {
  if (/invalid login credentials/i.test(message)) return 'Email hoặc mật khẩu chưa chính xác.'
  if (/email not confirmed/i.test(message)) return 'Email chưa được xác nhận. Hãy kiểm tra hộp thư của bạn.'
  if (/user already registered/i.test(message)) return 'Email này đã có tài khoản. Hãy chuyển sang đăng nhập.'
  return message
}

export function AuthPanel({ client }: AuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setNotice('')

    try {
      if (mode === 'sign-in') {
        const { error: authError } = await client.auth.signInWithPassword({ email, password })
        if (authError) throw authError
      } else {
        const { data, error: authError } = await client.auth.signUp({ email, password })
        if (authError) throw authError
        if (!data.session) {
          setNotice('Tài khoản đã được tạo. Hãy xác nhận email qua liên kết Supabase gửi cho bạn.')
        }
      }
    } catch (authError) {
      setError(friendlyError(authError instanceof Error ? authError.message : 'Đã có lỗi khi xác thực.'))
    } finally {
      setLoading(false)
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode)
    setError('')
    setNotice('')
  }

  return (
    <section className="auth-card" aria-labelledby="auth-title">
      <div className="auth-orb"><LockKeyhole size={19} /></div>
      <p className="eyebrow">CHÀO MỪNG ĐẾN EDUSPACE</p>
      <h2 id="auth-title">{mode === 'sign-in' ? 'Đăng nhập workspace' : 'Tạo tài khoản'}</h2>
      <p className="auth-intro">{mode === 'sign-in' ? 'Tiếp tục quản lý dự án cùng đội ngũ của bạn.' : 'Tạo tài khoản cho workspace EduSpace.'}</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="auth-email">Email</label>
        <div className="input-wrap">
          <Mail size={17} />
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            placeholder="ten@eduspace.vn"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <label htmlFor="auth-password">Mật khẩu</label>
        <div className="input-wrap">
          <LockKeyhole size={17} />
          <input
            id="auth-password"
            type="password"
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            placeholder="Nhập mật khẩu"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />
        </div>
        {error && <p className="form-message error" role="alert">{error}</p>}
        {notice && <p className="form-message success" role="status">{notice}</p>}
        <button className="primary-button auth-submit" type="submit" disabled={loading}>
          {loading ? <LoaderCircle className="spin" size={17} /> : <>{mode === 'sign-in' ? 'Đăng nhập' : 'Tạo tài khoản'} <ArrowRight size={17} /></>}
        </button>
      </form>
      <p className="auth-switch">
        {mode === 'sign-in' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
        <button type="button" onClick={() => switchMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}>
          {mode === 'sign-in' ? 'Đăng ký' : 'Đăng nhập'}
        </button>
      </p>
      <p className="auth-footnote">Tài khoản được xác thực an toàn qua Supabase Auth.</p>
    </section>
  )
}
