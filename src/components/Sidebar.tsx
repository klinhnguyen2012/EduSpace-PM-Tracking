import { BarChart3, Bug, CheckSquare2, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import type { DashboardPage } from '../types'

const navigation: { id: DashboardPage; label: string; href: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { id: 'timeline', label: 'Task Timeline', href: '/task-timeline', icon: CheckSquare2 },
  { id: 'bugs', label: 'Bug Tracker', href: '/bug-tracker', icon: Bug },
]

type SidebarProps = { activePage: DashboardPage }

export function Sidebar({ activePage }: SidebarProps) {
  return (
    <aside className="sidebar">
      <Link className="brand" href="/">
        <span className="brand-mark"><BarChart3 size={21} strokeWidth={2.5} /></span>
        <span className="brand-copy">
          <strong>EduSpace</strong>
          <small>PROJECT SPACE</small>
        </span>
      </Link>

      <div className="sidebar-section-label">KHÔNG GIAN LÀM VIỆC</div>
      <nav className="main-nav" aria-label="Điều hướng chính">
        {navigation.map(({ id, label, href, icon: Icon }) => (
          <Link
            key={id}
            href={href}
            className={`nav-item${activePage === id ? ' active' : ''}`}
            aria-current={activePage === id ? 'page' : undefined}
            aria-label={label}
          >
            <Icon size={18} strokeWidth={1.9} />
            <span>{label}</span>
            {id === 'timeline' && <span className="nav-pill">V1</span>}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="status-dot" />
        <span>Nền tảng phiên bản 1</span>
      </div>
    </aside>
  )
}
