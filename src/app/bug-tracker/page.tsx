import { ShieldCheck } from 'lucide-react'

export default function BugTracker() {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">THEO DÕI LỖI</p>
          <h1>Bug Tracker</h1>
          <p>Không gian ghi nhận và theo dõi lỗi sẽ được triển khai ở phase sau.</p>
        </div>
      </div>
      <section className="phase-card">
        <span className="phase-card-icon"><ShieldCheck size={19} /></span>
        <div>
          <h2>Đang chuẩn bị</h2>
          <p>Không gian ghi nhận và theo dõi lỗi sẽ được triển khai ở phase sau.</p>
        </div>
      </section>
    </>
  )
}
