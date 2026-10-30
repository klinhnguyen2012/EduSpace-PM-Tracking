import { FileText } from 'lucide-react'

export function TaskTimeline() {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">QUẢN LÝ CÔNG VIỆC</p>
          <h1>Task Timeline</h1>
          <p>Bảng công việc và AI Task Capture sẽ được triển khai ở phase tiếp theo.</p>
        </div>
      </div>
      <section className="phase-card">
        <span className="phase-card-icon"><FileText size={19} /></span>
        <div>
          <h2>Đang chuẩn bị</h2>
          <p>Bảng công việc và AI Task Capture sẽ được triển khai ở phase tiếp theo.</p>
        </div>
      </section>
    </>
  )
}
