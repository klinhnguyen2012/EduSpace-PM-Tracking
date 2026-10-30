'use client'

import { ArrowUpRight, Check, CircleHelp, CircleUserRound, FileText, KeyRound, ShieldCheck } from 'lucide-react'
import { AuthPanel } from './AuthPanel'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

type DashboardProps = { authenticated: boolean }

function SetupNotice() {
  return (
    <section className="setup-card" aria-labelledby="setup-title">
      <div className="setup-icon"><KeyRound size={22} /></div>
      <p className="eyebrow">KẾT NỐI LẦN ĐẦU</p>
      <h2 id="setup-title">Chưa kết nối Supabase</h2>
      <p className="setup-description">
        Thêm Project URL và publishable key vào file <code>.env.local</code> để bật đăng nhập.
        Bạn có thể xem hướng dẫn từng bước trong tài liệu cài đặt.
      </p>
      <div className="setup-file-row">
        <span className="file-dot" />
        <code>.env.local</code>
        <span className="file-row-hint">ở thư mục gốc dự án</span>
      </div>
      <a className="text-link" href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">
        Mở Supabase Dashboard <ArrowUpRight size={15} />
      </a>
      <div className="setup-help">
        <CircleHelp size={15} /> Chưa có tài khoản? Xem <a href="/supabase-setup.md">checklist Supabase</a>.
      </div>
    </section>
  )
}

function WelcomePanel({ authenticated }: { authenticated: boolean }) {
  return (
    <section className="welcome-panel">
      <p className="eyebrow">EDUSPACE · PROJECT MANAGEMENT</p>
      <h2>Một không gian rõ ràng cho mọi đầu việc.</h2>
      <p>
        {authenticated
          ? 'Nền tảng đang được thiết lập. Khi các phase tiếp theo hoàn tất, nhóm có thể quản lý task, deadline và bug tại đây.'
          : 'Đăng nhập và các tính năng quản lý dự án sẽ được mở sau khi kết nối workspace với Supabase.'}
      </p>
      <ul className="phase-list">
        <li><Check size={15} /> {authenticated ? 'Đăng nhập workspace qua Supabase Auth' : 'Khung giao diện và điều hướng đã sẵn sàng'}</li>
        <li><Check size={15} /> {authenticated ? 'Các trang chính đã được định hình' : 'Supabase Auth sẽ xác thực người dùng thật'}</li>
        <li><FileText size={15} /> Checklist kết nối Supabase có sẵn trong dự án</li>
      </ul>
    </section>
  )
}

export function Dashboard({ authenticated }: DashboardProps) {
  if (!authenticated && isSupabaseConfigured && supabase) {
    return (
      <>
        <div className="page-heading">
          <div>
            <p className="eyebrow">KHÔNG GIAN DỰ ÁN EDUSPACE</p>
            <h1>Bắt đầu tại đây</h1>
            <p>Đăng nhập để cùng đội ngũ quản lý công việc và tiến độ.</p>
          </div>
        </div>
        <AuthPanel client={supabase} />
      </>
    )
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{authenticated ? 'TỔNG QUAN DỰ ÁN' : 'KHÔNG GIAN DỰ ÁN EDUSPACE'}</p>
          <h1>{authenticated ? 'Dashboard' : 'Bắt đầu tại đây'}</h1>
          <p>{authenticated
            ? 'Nền tảng theo dõi tiến độ và phối hợp công việc của đội ngũ EduSpace.'
            : 'Đăng nhập để cùng đội ngũ quản lý công việc và tiến độ.'}</p>
        </div>
        {authenticated && <div className="workspace-note"><ShieldCheck size={15} /> Dữ liệu workspace được bảo vệ</div>}
      </div>
      <div className="content-grid">
        <WelcomePanel authenticated={authenticated} />
        {authenticated ? (
          <div className="phase-card">
            <span className="phase-card-icon"><CircleUserRound size={19} /></span>
            <div>
              <h2>Workspace đã sẵn sàng</h2>
              <p>Đăng nhập thành công. Task Timeline, AI Task Capture, Dashboard dữ liệu và Bug Tracker sẽ được bổ sung theo từng phase.</p>
            </div>
          </div>
        ) : <SetupNotice />}
      </div>
    </>
  )
}
