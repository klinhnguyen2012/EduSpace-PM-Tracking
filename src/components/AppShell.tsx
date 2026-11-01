'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronRight, LogOut, Moon, Sun } from 'lucide-react'
import Image from 'next/image'
import { SetupNotice } from './Dashboard'
import { AuthPanel } from './AuthPanel'
import { Sidebar } from './Sidebar'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { inviteCallbackPath } from '../lib/auth-redirect'
import { pageTitles, type DashboardPage } from '../types'

function pageFromPath(pathname: string): DashboardPage {
  if (pathname.startsWith('/task-timeline')) return 'timeline'
  if (pathname.startsWith('/bug-tracker')) return 'bugs'
  return 'dashboard'
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const activePage = pageFromPath(pathname)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('eduspace-theme')
    const initialTheme = storedTheme === 'dark' ? 'dark' : 'light'
    setTheme(initialTheme)
    document.documentElement.dataset.theme = initialTheme
  }, [])

  useEffect(() => {
    setSidebarCollapsed(window.localStorage.getItem('eduspace-sidebar') === 'collapsed')
  }, [])

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false)
      return
    }
    const inviteCallback = pathname === '/' ? inviteCallbackPath(window.location.search) : null
    if (inviteCallback) {
      router.replace(inviteCallback)
      return
    }
    let mounted = true
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setCurrentUser(data.session?.user.email ?? null)
      setAuthLoading(false)
    }).catch(() => {
      if (!mounted) return
      setCurrentUser(null)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user.email ?? null)
      setAuthLoading(false)
    })
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [pathname, router])

  function toggleTheme() {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    document.documentElement.dataset.theme = nextTheme
    window.localStorage.setItem('eduspace-theme', nextTheme)
  }

  function toggleSidebar() {
    const nextCollapsed = !sidebarCollapsed
    setSidebarCollapsed(nextCollapsed)
    window.localStorage.setItem('eduspace-sidebar', nextCollapsed ? 'collapsed' : 'expanded')
  }

  function handleLoginSuccess(email: string) {
    setCurrentUser(email)
  }

  async function handleSignOut() {
    setSigningOut(true)
    if (supabase) {
      try {
        await supabase.auth.signOut({ scope: 'local' })
      } catch {
        // Bỏ qua lỗi sign out từ Supabase nếu có
      }
    }
    setCurrentUser(null)
    setSigningOut(false)
  }

  const pageTitle = pageTitles[activePage]
  const initials = currentUser ? currentUser.slice(0, 1).toUpperCase() : 'A'

  if (pathname.startsWith('/auth/')) {
    return <main className="auth-screen"><div className="auth-content">{children}</div></main>
  }

  if (authLoading) {
    return (
      <main className="auth-screen">
        <div className="loading-state" role="status">
          <span className="loading-ring" /> Đang tải workspace…
        </div>
      </main>
    )
  }

  if (!currentUser) {
    return (
      <main className="auth-screen">
        <button
          className="theme-toggle auth-theme-toggle"
          type="button"
          onClick={toggleTheme}
          aria-pressed={theme === 'dark'}
          aria-label={theme === 'light' ? 'Chuyển sang giao diện tối' : 'Chuyển sang giao diện sáng'}
          title={theme === 'light' ? 'Giao diện tối' : 'Giao diện sáng'}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        <div className="auth-content">
          {isSupabaseConfigured && supabase ? (
            <AuthPanel onSuccess={handleLoginSuccess} />
          ) : (
            <SetupNotice />
          )}
        </div>
      </main>
    )
  }

  return (
    <div className={`app-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <Sidebar activePage={activePage} collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <main className={`main-area${activePage === 'dashboard' ? ' dashboard-main-area' : ''}`}>
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{pageTitle}</strong></div>
          <div className="topbar-right">
            <button
              className="theme-toggle"
              type="button"
              onClick={toggleTheme}
              aria-pressed={theme === 'dark'}
              aria-label={theme === 'light' ? 'Chuyển sang giao diện tối' : 'Chuyển sang giao diện sáng'}
              title={theme === 'light' ? 'Giao diện tối' : 'Giao diện sáng'}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <span className="user-avatar" aria-label={`Tài khoản: ${currentUser}`} title={`Tài khoản: ${currentUser}`}>
              {initials}
            </span>
            <button className="signout-button" type="button" onClick={handleSignOut} disabled={signingOut}>
              <LogOut size={15} /> <span>{signingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}</span>
            </button>
          </div>
        </header>

        <div className="page-content">
          {children}
          <footer className="page-footer"><span>EduSpace PM Dashboard</span><span>Thiết kế cho đội ngũ dự án</span></footer>
        </div>
      </main>
    </div>
  )
}
