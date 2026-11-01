'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Bug, CalendarDays, Check, ChevronLeft, ChevronRight, CircleHelp, Clock3, KeyRound, ListTodo, Timer } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { memberColor } from '../lib/task-colors'

type TaskStatus = 'todo' | 'in_progress' | 'qa' | 'done' | 'paused'
type BugStatus = 'open' | 'in_progress' | 'fixed' | 'retesting' | 'closed'
type DashboardTask = {
  id: string
  title: string
  assignee_name: string | null
  assignee_names: string[]
  start_date: string | null
  deadline: string | null
  status: TaskStatus
}
type DashboardBug = { id: string; status: BugStatus }

function taskPics(task: DashboardTask) {
  return task.assignee_names?.length ? task.assignee_names : task.assignee_name ? [task.assignee_name] : []
}

const taskStatusLabels: Record<TaskStatus, string> = {
  done: 'Hoàn thành', in_progress: 'Đang làm', qa: 'Đang QA', todo: 'Chưa làm', paused: 'Tạm dừng',
}
const taskStatusOrder: TaskStatus[] = ['done', 'in_progress', 'qa', 'todo', 'paused']
const bugStatusLabels: Record<BugStatus, string> = {
  open: 'Mới', in_progress: 'Đang xử lý', fixed: 'Đã sửa', retesting: 'Chờ kiểm tra', closed: 'Đã đóng',
}

function todayInVietnam() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

function daysBetween(from: string, to: string) {
  const [fromYear, fromMonth, fromDay] = from.split('-').map(Number)
  const [toYear, toMonth, toDay] = to.split('-').map(Number)
  return Math.round((Date.UTC(toYear, toMonth - 1, toDay) - Date.UTC(fromYear, fromMonth - 1, fromDay)) / 86_400_000)
}

function addDays(date: string, amount: number) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + amount)).toISOString().slice(0, 10)
}

function shortDate(date: string) {
  return new Date(`${date}T12:00:00+07:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00+07:00`).toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh', weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

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
      <div className="setup-file-row"><span className="file-dot" /><code>.env.local</code><span className="file-row-hint">ở thư mục gốc dự án</span></div>
      <a className="text-link" href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">Mở Supabase Dashboard <ArrowUpRight size={15} /></a>
      <div className="setup-help"><CircleHelp size={15} /> Chưa có tài khoản? Xem <a href="/supabase-setup.md">checklist Supabase</a>.</div>
    </section>
  )
}

function MetricCard({ icon: Icon, label, value, tone }: {
  icon: typeof ListTodo
  label: string
  value: string | number
  tone: 'green' | 'neutral' | 'red' | 'amber'
}) {
  return <article className={`dashboard-metric ${tone}`}>
    <span className="dashboard-metric-icon"><Icon size={21} /></span>
    <div className="dashboard-metric-copy"><strong>{value}</strong><b>{label}</b></div>
  </article>
}

function StatusDistribution({ tasks }: { tasks: DashboardTask[] }) {
  const counts = taskStatusOrder.map((status) => ({
    status,
    label: taskStatusLabels[status],
    count: tasks.filter((task) => task.status === status).length,
  }))
  const total = tasks.length

  return <section className="dashboard-card status-card" aria-labelledby="status-summary-title">
    <div className="dashboard-card-heading"><h2 id="status-summary-title">Trạng thái task</h2><Link href="/task-timeline">Task <ArrowUpRight size={13} /></Link></div>
    {total === 0 ? <p className="dashboard-empty">Task sẽ xuất hiện ở đây sau khi được tạo.</p> : <>
      <div className="status-stack" role="img" aria-label={counts.map((item) => `${item.label}: ${item.count}`).join(', ')}>
        {counts.filter((item) => item.count > 0).map((item) => <span key={item.status} className={`status-stack-segment ${item.status}`} style={{ width: `${item.count / total * 100}%` }} />)}
      </div>
      <ul className="status-legend">{counts.map((item) => <li key={item.status}><span className={`status-dot ${item.status}`} /><span>{item.label}</span><b>{item.count}</b></li>)}</ul>
    </>}
  </section>
}

function DeadlineTimeline({ tasks, today }: { tasks: DashboardTask[]; today: string }) {
  const nextTasks = [...tasks]
    .filter((task) => task.deadline && task.status !== 'done')
    .sort((a, b) => a.deadline!.localeCompare(b.deadline!))

  return <section className="dashboard-card deadline-card" aria-labelledby="deadline-title">
    <div className="dashboard-card-heading"><h2 id="deadline-title">Deadline</h2><Link href="/task-timeline">Tất cả task <ArrowUpRight size={13} /></Link></div>
    {nextTasks.length === 0 ? <p className="dashboard-empty">Chưa có deadline cần theo dõi.</p> : <ol className="deadline-list">
      {nextTasks.map((task) => {
        const days = daysBetween(today, task.deadline!)
        const deadlineLabel = days < 0 ? `Quá hạn ${Math.abs(days)} ngày` : days === 0 ? 'Đến hạn hôm nay' : days <= 3 ? `Còn ${days} ngày` : null
        return <li key={task.id} className={days < 0 ? 'late' : ''}>
          <span className="deadline-date"><CalendarDays size={14} />{formatDate(task.deadline!)}</span>
          <div className="deadline-task"><strong title={task.title}>{task.title}</strong><small>{taskPics(task).join(', ') || 'Chưa phân công'}</small></div>
          {deadlineLabel && <span className={`deadline-countdown${days < 0 ? ' late' : ''}`}>{deadlineLabel}</span>}
          <span className={`task-status-pill ${task.status}`}>{taskStatusLabels[task.status]}</span>
        </li>
      })}
    </ol>}
  </section>
}

function RoadmapTimeline({ tasks, today }: { tasks: DashboardTask[]; today: string }) {
  const [windowOffset, setWindowOffset] = useState(0)
  const firstDay = addDays(today, windowOffset - 7)
  const days = Array.from({ length: 30 }, (_, index) => addDays(firstDay, index))
  const lastDay = days[days.length - 1]
  const plannedTasks = tasks.flatMap((task) => {
    const firstDate = task.start_date ?? task.deadline
    const lastDate = task.deadline ?? task.start_date
    if (!firstDate || !lastDate) return []

    const firstOffset = daysBetween(firstDay, firstDate)
    const lastOffset = daysBetween(firstDay, lastDate)
    const rangeStart = Math.min(firstOffset, lastOffset)
    const rangeEnd = Math.max(firstOffset, lastOffset)
    if (rangeEnd < 0 || rangeStart >= days.length) return []

    return [{
      task,
      startColumn: Math.max(0, rangeStart),
      endColumn: Math.min(days.length - 1, rangeEnd),
      isMilestone: firstDate === lastDate,
    }]
  })
  const visibleAssignees = new Set(plannedTasks.flatMap(({ task }) => taskPics(task).length ? taskPics(task) : ['Chưa phân công']))
  const preferredOrder = ['Khoa', 'Chiến', 'Trân', 'Linh']
  const assignees = [
    ...preferredOrder.filter((name) => visibleAssignees.has(name)),
    ...Array.from(visibleAssignees).filter((name) => !preferredOrder.includes(name) && name !== 'Chưa phân công').sort(),
    ...(visibleAssignees.has('Chưa phân công') ? ['Chưa phân công'] : []),
  ]
  const unplannedCount = tasks.filter((task) => !task.start_date && !task.deadline).length

  return <section className="dashboard-card roadmap-card" aria-labelledby="roadmap-title">
    <div className="roadmap-heading">
      <div><h2 id="roadmap-title">Roadmap</h2>{unplannedCount > 0 && <span className="roadmap-unplanned">{unplannedCount} chưa xếp</span>}</div>
      <div className="roadmap-controls" aria-label="Chọn khoảng thời gian">
        <button className="roadmap-period-button" type="button" aria-label="30 ngày trước" onClick={() => setWindowOffset((offset) => offset - 30)}><ChevronLeft size={16} /></button>
        <span className="roadmap-period-label">{shortDate(firstDay)} – {shortDate(lastDay)} {lastDay.slice(0, 4)}</span>
        <button className="roadmap-period-button" type="button" aria-label="30 ngày tiếp theo" onClick={() => setWindowOffset((offset) => offset + 30)}><ChevronRight size={16} /></button>
        {windowOffset !== 0 && <button className="roadmap-today-button" type="button" onClick={() => setWindowOffset(0)}>Hôm nay</button>}
      </div>
    </div>
    <div className="roadmap-scroll">
      <div className="roadmap-grid">
        <div className="roadmap-axis-label">PIC</div>
        <div className="roadmap-axis-days">
          {days.map((day) => {
            const weekday = new Date(`${day}T12:00:00+07:00`).toLocaleDateString('vi-VN', { weekday: 'short' }).replace('.', '')
            return <div className={`roadmap-day${day === today ? ' today' : ''}`} key={day} aria-label={formatDate(day)} title={formatDate(day)}>
              <b>{day.slice(8, 10)}</b><small>{weekday}</small>
            </div>
          })}
        </div>
        {assignees.length === 0 ? <div className="roadmap-empty">Không có task có ngày trong khoảng này.</div> : assignees.map((assignee) => {
          const color = assignee === 'Chưa phân công'
            ? { background: '#edf1f2', color: '#64747c', border: '#dfe6e8' }
            : memberColor(assignee)
          return <div className="roadmap-lane" key={assignee}>
            <div className="roadmap-assignee"><span style={{ backgroundColor: color.background, color: color.color, borderColor: color.border }}>{assignee}</span></div>
            <div className="roadmap-track">
              {plannedTasks.filter(({ task }) => (taskPics(task).length ? taskPics(task) : ['Chưa phân công']).includes(assignee)).map(({ task, startColumn, endColumn, isMilestone }) => (
                <span
                  key={task.id}
                  className={`roadmap-bar${isMilestone ? ' milestone' : ''}${task.status === 'done' ? ' done' : ''}`}
                  style={{ gridColumn: `${startColumn + 1} / ${endColumn + 2}`, backgroundColor: color.background, color: color.color, borderColor: color.border }}
                  title={`${task.title} · ${task.start_date ? shortDate(task.start_date) : 'Chỉ có deadline'} → ${task.deadline ? shortDate(task.deadline) : 'Chưa có deadline'} · ${taskStatusLabels[task.status]}`}
                  aria-label={`${task.title}, ${assignee}, ${task.start_date ? shortDate(task.start_date) : 'chỉ có deadline'} đến ${task.deadline ? shortDate(task.deadline) : 'chưa có deadline'}, ${taskStatusLabels[task.status]}`}
                >
                  {!isMilestone && <span>{task.title}</span>}
                </span>
              ))}
            </div>
          </div>
        })}
      </div>
    </div>
  </section>
}

function BugSummary({ bugs }: { bugs: DashboardBug[] }) {
  const open = bugs.filter((bug) => bug.status === 'open').length
  const inProgress = bugs.filter((bug) => bug.status === 'in_progress').length
  const retesting = bugs.filter((bug) => bug.status === 'retesting').length
  const active = open + inProgress + retesting
  return <section className="dashboard-card bug-summary-card" aria-labelledby="bug-summary-title">
    <div className="dashboard-card-heading"><h2 id="bug-summary-title">Bug</h2><Link href="/bug-tracker">Mở <ArrowUpRight size={13} /></Link></div>
    <div className="bug-count-grid">
      <div><span className="bug-count-icon open"><Bug size={16} /></span><strong>{open}</strong><small>{bugStatusLabels.open}</small></div>
      <div><span className="bug-count-icon working"><Timer size={16} /></span><strong>{inProgress}</strong><small>{bugStatusLabels.in_progress}</small></div>
      <div><span className="bug-count-icon retest"><Check size={16} /></span><strong>{retesting}</strong><small>{bugStatusLabels.retesting}</small></div>
    </div>
    <p className="bug-summary-total">{active} đang mở · {bugs.length} tổng</p>
  </section>
}

export function Dashboard() {
  const [tasks, setTasks] = useState<DashboardTask[]>([])
  const [bugs, setBugs] = useState<DashboardBug[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const today = todayInVietnam()

  useEffect(() => {
    let active = true
    async function loadDashboard() {
      if (!supabase) {
        setError('Chưa kết nối được Supabase.')
        setLoading(false)
        return
      }
      const [taskResult, bugResult] = await Promise.all([
        supabase.from('tasks').select('id,title,assignee_name,assignee_names,start_date,deadline,status').order('created_at', { ascending: false }),
        supabase.from('bugs').select('id,status'),
      ])
      if (!active) return
      if (taskResult.error || bugResult.error) setError(`Không tải được dashboard: ${taskResult.error?.message ?? bugResult.error?.message}`)
      else {
        setTasks(taskResult.data.map((task) => ({ ...task, assignee_names: task.assignee_names ?? (task.assignee_name ? [task.assignee_name] : []) })) as DashboardTask[])
        setBugs(bugResult.data as DashboardBug[])
      }
      setLoading(false)
    }
    void loadDashboard()
    return () => { active = false }
  }, [])

  const doneCount = tasks.filter((task) => task.status === 'done').length
  const completion = tasks.length ? Math.round(doneCount / tasks.length * 100) : 0
  const overdueCount = tasks.filter((task) => task.status !== 'done' && task.deadline && daysBetween(today, task.deadline) < 0).length
  const todoCount = tasks.filter((task) => task.status === 'todo').length

  return <>
    <div className="page-heading dashboard-page-heading">
      <div><h1>Dashboard</h1></div>
    </div>
    {error && <div className="data-error" role="alert">{error}</div>}
    <section className="dashboard-metrics" aria-label="Chỉ số dự án">
      <article className="dashboard-metric completion-metric">
        <span className="completion-ring" style={{ background: `conic-gradient(#29a66a ${completion}%, #e7efee ${completion}% 100%)` }}><span>{loading ? '—' : `${completion}%`}</span></span>
        <div className="dashboard-metric-copy"><b>Hoàn thành</b></div>
      </article>
      <MetricCard icon={ListTodo} value={loading ? '—' : tasks.length} label="Task" tone="neutral" />
      <MetricCard icon={Clock3} value={loading ? '—' : overdueCount} label="Quá hạn" tone="red" />
      <MetricCard icon={Timer} value={loading ? '—' : todoCount} label="Chưa làm" tone="amber" />
    </section>

    <DeadlineTimeline tasks={tasks} today={today} />

    <section className="dashboard-detail-grid" aria-label="Chi tiết dự án">
      <StatusDistribution tasks={tasks} />
      <BugSummary bugs={bugs} />
    </section>

    <RoadmapTimeline tasks={tasks} today={today} />
  </>
}
