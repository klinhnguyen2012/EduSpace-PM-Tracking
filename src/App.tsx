import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Check, ChevronRight, CircleUserRound, FileText, LogOut, ShieldCheck } from 'lucide-react'
import { AuthPanel } from './components/AuthPanel'
import { SetupNotice } from './components/SetupNotice'
import { Sidebar } from './components/Sidebar'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import type { DashboardPage } from './types'

const pageDetails: Record<DashboardPage, { title: string; eyebrow: string; description: string }> = {
  dashboard: {
    title: 'Dashboard',
    eyebrow: 'TỔNG QUAN DỰ ÁN',
    description: 'Nền tảng theo dõi tiến độ và phối hợp công việc của đội ngũ EduSpace.',
  },
  timeline: {
    title: 'Task Timeline',
    eyebrow: 'QUẢN LÝ CÔNG VIỆC',
    description: 'Bảng công việc và AI Task Capture sẽ được triển khai ở phase tiếp theo.',
  },
  bugs: {
    title: 'Bug Tracker',
    eyebrow: 'THEO DÕI LỖI',
    description: 'Không gian ghi nhận và theo dõi lỗi sẽ được triển khai ở phase sau.',
  },
}

function PlaceholderContent({ page }: { page: DashboardPage }) {
  const isDashboard = page === 'dashboard'
  const title = pageDetails[page]

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{title.eyebrow}</p>
          <h1>{title.title}</h1>
          <p>{title.description}</p>
        </div>
        {isDashboard && <div className="workspace-note"><ShieldCheck size={15} /> Dữ liệu workspace được bảo vệ</div>}
      </div>
      {isDashboard ? (
        <div className="content-grid">
          <section className="welcome-panel">
            <p className="eyebrow">EDUSPACE · PROJECT MANAGEMENT</p>
            <h2>Một không gian rõ ràng cho mọi đầu việc.</h2>
            <p>
              Nền tảng đang được thiết lập. Khi các phase tiếp theo hoàn tất, nhóm sẽ có thể quản lý task,
              deadline và bug tại đây.
            </p>
            <ul className="phase-list">
              <li><Check size={15} /> Đăng nhập workspace qua Supabase Auth</li>
              <li><Check size={15} /> Các trang chính đã được định hình</li>
              <li><FileText size={15} /> Hướng dẫn kết nối Supabase có sẵn trong thư mục docs</li>
            </ul>
          </section>
          {isSupabaseConfigured ? (
            <div className="phase-card">
              <span className="phase-card-icon"><CircleUserRound size={19} /></span>
              <div>
                <h2>Workspace đã sẵn sàng</h2>
                <p>Đăng nhập thành công. Task Timeline, AI Task Capture, Dashboard dữ liệu và Bug Tracker sẽ được bổ sung theo từng phase.</p>
              </div>
            </div>
          ) : <SetupNotice />}
        </div>
      ) : (
        <section className="phase-card">
          <span className="phase-card-icon">{page === 'timeline' ? <FileText size={19} /> : <ShieldCheck size={19} />}</span>
          <div>
            <h2>Đang chuẩn bị</h2>
            <p>{title.description}</p>
          </div>
        </section>
      )}
    </>
  )
}

export default function App() {
  const [activePage, setActivePage] = useState<DashboardPage>('dashboard')
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured)
  const [authError, setAuthError] = useState('')
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    if (!supabase) return

    let isActive = true
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (isActive) setSession(currentSession)
    })

    void supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!isActive) return
        setSession(data.session)
        if (error) setAuthError(error.message)
      })
      .catch((error: unknown) => {
        if (isActive) setAuthError(error instanceof Error ? error.message : 'Không thể khôi phục phiên đăng nhập.')
      })
      .finally(() => {
        if (isActive) setAuthLoading(false)
      })

    return () => {
      isActive = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  async function handleSignOut() {
    if (!supabase) return
    setSigningOut(true)
    setAuthError('')
    try {
      const { error } = await supabase.auth.signOut()
      if (error) setAuthError(error.message)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Không thể đăng xuất. Vui lòng thử lại.')
    } finally {
      setSigningOut(false)
    }
  }

  const page = pageDetails[activePage]
  const initials = session?.user.email?.slice(0, 1) ?? 'E'

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{page.title}</strong></div>
          <div className="topbar-right">
            {session ? (
              <>
                <span className="phase-chip">V1 · NỀN TẢNG</span>
                <span className="user-avatar" aria-label={session.user.email ?? 'Tài khoản'}>{initials}</span>
                <button className="signout-button" type="button" onClick={handleSignOut} disabled={signingOut}>
                  <LogOut size={15} /> <span>{signingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}</span>
                </button>
              </>
            ) : <span className="phase-chip">V1 · NỀN TẢNG</span>}
          </div>
        </header>

        <div className="page-content">
          {authLoading ? (
            <div className="loading-state" role="status"><span className="loading-ring" /> Đang kiểm tra phiên đăng nhập…</div>
          ) : session ? (
            <>
              {authError && <div className="auth-error-banner" role="alert">{authError}</div>}
              <PlaceholderContent page={activePage} />
            </>
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">KHÔNG GIAN DỰ ÁN EDUSPACE</p>
                  <h1>Bắt đầu tại đây</h1>
                  <p>Đăng nhập để cùng đội ngũ quản lý công việc và tiến độ.</p>
                </div>
              </div>
              {authError && <div className="auth-error-banner" role="alert">{authError}</div>}
              {isSupabaseConfigured && supabase ? (
                <AuthPanel client={supabase} />
              ) : (
                <div className="content-grid">
                  <section className="welcome-panel">
                    <p className="eyebrow">EDUSPACE · PROJECT MANAGEMENT</p>
                    <h2>Một không gian rõ ràng cho mọi đầu việc.</h2>
                    <p>Đăng nhập và các tính năng quản lý dự án sẽ được mở sau khi kết nối workspace với Supabase.</p>
                    <ul className="phase-list">
                      <li><Check size={15} /> Khung giao diện và điều hướng đã sẵn sàng</li>
                      <li><Check size={15} /> Supabase Auth sẽ xác thực người dùng thật</li>
                      <li><FileText size={15} /> Hướng dẫn thiết lập nằm trong thư mục docs</li>
                    </ul>
                  </section>
                  <SetupNotice />
                </div>
              )}
            </>
          )}
          <footer className="page-footer"><span>EduSpace PM Dashboard</span><span>Thiết kế cho đội ngũ dự án</span></footer>
        </div>
      </main>
    </div>
  )
}
