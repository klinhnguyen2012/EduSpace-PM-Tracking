'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronRight, LogOut, Moon, Sun } from 'lucide-react'
import Image from 'next/image'
import { AuthPanel } from './AuthPanel'
import { Sidebar } from './Sidebar'
import { supabase } from '../lib/supabase'
import { pageTitles, type DashboardPage } from '../types'

const AUTH_STORAGE_KEY = 'eduspace-auth-user'

function pageFromPath(pathname: string): DashboardPage {
  if (pathname.startsWith('/task-timeline')) return 'timeline'
  if (pathname.startsWith('/bug-tracker')) return 'bugs'
  if (pathname.startsWith('/archive')) return 'archive'
  return 'dashboard'
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
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
    const storedUser = window.localStorage.getItem(AUTH_STORAGE_KEY)
    setCurrentUser(storedUser)
    if (storedUser && supabase) {
      const client = supabase
      void client.auth.getSession().then(({ data }) => {
        if (!data.session) {
          return client.auth.signInWithPassword({ email: 'admin@eduspace.vn', password: 'admin123' })
        }
      })
    }
    setAuthLoading(false)
  }, [])

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

  function handleLoginSuccess(username: string) {
    setCurrentUser(username)
    window.localStorage.setItem(AUTH_STORAGE_KEY, username)
    if (supabase) {
      void supabase.auth.signInWithPassword({ email: 'admin@eduspace.vn', password: 'admin123' })
    }
  }

  function handleSignOut() {
    setSigningOut(true)
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    if (supabase) void supabase.auth.signOut()
    setCurrentUser(null)
    setSigningOut(false)
  }

  const pageTitle = pageTitles[activePage]
  const initials = currentUser ? currentUser.slice(0, 1).toUpperCase() : 'A'

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
          <AuthPanel onSuccess={handleLoginSuccess} />
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
