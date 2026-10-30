import { ArrowUpRight, CircleHelp, KeyRound } from 'lucide-react'

export function SetupNotice() {
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
      <div className="setup-help"><CircleHelp size={15} /> Chưa có tài khoản? Xem <a href="./docs/supabase-setup.md">checklist Supabase</a>.</div>
    </section>
  )
}
