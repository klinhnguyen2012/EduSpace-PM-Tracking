import { BarChart3, Bug, CheckSquare2, LayoutDashboard } from 'lucide-react'
import type { DashboardPage } from '../types'

const navigation: { id: DashboardPage; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'timeline', label: 'Task Timeline', icon: CheckSquare2 },
  { id: 'bugs', label: 'Bug Tracker', icon: Bug },
]

type SidebarProps = {
  activePage: DashboardPage
  onNavigate: (page: DashboardPage) => void
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <a className="brand" href="#dashboard" onClick={() => onNavigate('dashboard')}>
        <span className="brand-mark"><BarChart3 size={21} strokeWidth={2.5} /></span>
        <span className="brand-copy">
          <strong>EduSpace</strong>
          <small>PROJECT SPACE</small>
        </span>
      </a>

      <div className="sidebar-section-label">KHÔNG GIAN LÀM VIỆC</div>
      <nav className="main-nav" aria-label="Điều hướng chính">
        {navigation.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`nav-item${activePage === id ? ' active' : ''}`}
            aria-current={activePage === id ? 'page' : undefined}
            aria-label={label}
            onClick={() => onNavigate(id)}
          >
            <Icon size={18} strokeWidth={1.9} />
            <span>{label}</span>
            {id === 'timeline' && <span className="nav-pill">V1</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="status-dot" />
        <span>Nền tảng phiên bản 1</span>
      </div>
    </aside>
  )
}
