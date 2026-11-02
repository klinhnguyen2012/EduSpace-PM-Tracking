import { Archive, Bug, CheckSquare2, ChevronLeft, ChevronRight, LayoutDashboard } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { DashboardPage } from '../types'

const navigation: { id: DashboardPage; label: string; href: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { id: 'timeline', label: 'Task Timeline', href: '/task-timeline', icon: CheckSquare2 },
  { id: 'bugs', label: 'Bug Tracker', href: '/bug-tracker', icon: Bug },
  { id: 'archive', label: 'Lưu trữ', href: '/archive', icon: Archive },
]

type SidebarProps = {
  activePage: DashboardPage
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ activePage, collapsed, onToggle }: SidebarProps) {
  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-top">
        <Link className="brand" href="/" aria-label="EduSpace">
          <span className="brand-mark on-blue"><Image src="/eduspace-mark-white.png" alt="EduSpace" width={40} height={40} priority /></span>
          <span className="brand-copy"><strong>EduSpace</strong></span>
        </Link>
        <button
          className="sidebar-toggle"
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
          aria-expanded={!collapsed}
          aria-controls="main-navigation"
          title={collapsed ? 'Mở rộng' : 'Thu gọn'}
        >
          {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
        </button>
      </div>

      <nav className="main-nav" id="main-navigation" aria-label="Điều hướng chính">
        {navigation.map(({ id, label, href, icon: Icon }) => (
          <Link
            key={id}
            href={href}
            className={`nav-item${activePage === id ? ' active' : ''}`}
            aria-current={activePage === id ? 'page' : undefined}
            aria-label={label}
            title={collapsed ? label : undefined}
          >
            <Icon size={18} strokeWidth={1.9} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

    </aside>
  )
}
