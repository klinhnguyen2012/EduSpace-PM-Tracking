'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { ChevronRight, LogOut } from 'lucide-react'
import { Dashboard } from './Dashboard'
import { Sidebar } from './Sidebar'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { pageTitles, type DashboardPage } from '../types'

function pageFromPath(pathname: string): DashboardPage {
  if (pathname.startsWith('/task-timeline')) return 'timeline'
  if (pathname.startsWith('/bug-tracker')) return 'bugs'
  return 'dashboard'
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const activePage = pageFromPath(pathname)
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

  const pageTitle = pageTitles[activePage]
  const initials = session?.user.email?.slice(0, 1) ?? 'E'

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} />
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{pageTitle}</strong></div>
          <div className="topbar-right">
            <span className="phase-chip">V1 · NỀN TẢNG</span>
            {session && <>
              <span className="user-avatar" aria-label={session.user.email ?? 'Tài khoản'}>{initials}</span>
              <button className="signout-button" type="button" onClick={handleSignOut} disabled={signingOut}>
                <LogOut size={15} /> <span>{signingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}</span>
              </button>
            </>}
          </div>
        </header>

        <div className="page-content">
          {authLoading ? (
            <div className="loading-state" role="status"><span className="loading-ring" /> Đang kiểm tra phiên đăng nhập…</div>
          ) : session ? (
            <>
              {authError && <div className="auth-error-banner" role="alert">{authError}</div>}
              {children}
            </>
          ) : (
            <>
              {authError && <div className="auth-error-banner" role="alert">{authError}</div>}
              <Dashboard authenticated={false} />
            </>
          )}
          <footer className="page-footer"><span>EduSpace PM Dashboard</span><span>Thiết kế cho đội ngũ dự án</span></footer>
        </div>
      </main>
    </div>
  )
}
