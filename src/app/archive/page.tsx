'use client'

import { useCallback, useEffect, useState } from 'react'
import { Archive, CalendarClock, RotateCcw } from 'lucide-react'
import { supabase } from '../../lib/supabase'

type ArchiveTask = {
  id: string; title: string; description: string | null; status: 'todo' | 'in_progress' | 'qa' | 'done' | 'paused'
  priority: 'P0' | 'P1' | 'P2' | null; start_date: string | null; deadline: string | null
  assignee_name: string | null; assignee_names: string[] | null; links: string[] | null; attachments: string[] | null
  created_at: string; archived_at: string; archive_reason: 'deleted' | 'completed' | null; archive_previous_status: string | null
}
type ArchiveBug = {
  id: string; title: string; description: string | null; status: 'open' | 'in_progress' | 'fixed' | 'retesting' | 'closed'
  notes: string | null; test_result: string | null; attachments: string[] | null; test_attachments: string[] | null
  pic_names: string[] | null; evidence_link: string | null; created_at: string; archived_at: string
  archive_reason: 'deleted' | 'completed' | null; archive_previous_status: string | null
}
type ArchiveTab = 'tasks' | 'bugs'

function remainingDays(archivedAt: string) {
  const elapsed = Date.now() - new Date(archivedAt).getTime()
  return Math.max(0, 30 - Math.floor(elapsed / 86_400_000))
}

function archiveReason(reason: string | null) {
  return reason === 'completed' ? 'Hoàn thành' : 'Đã xóa'
}

export default function ArchivePage() {
  const [tasks, setTasks] = useState<ArchiveTask[]>([])
  const [bugs, setBugs] = useState<ArchiveBug[]>([])
  const [tab, setTab] = useState<ArchiveTab>('tasks')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadArchive = useCallback(async () => {
    setLoading(true)
    setError('')
    if (!supabase) {
      setError('Chưa kết nối Supabase.')
      setLoading(false)
      return
    }
    const [taskResult, bugResult] = await Promise.all([
      supabase.from('tasks').select('id,title,description,status,priority,start_date,deadline,assignee_name,assignee_names,links,attachments,created_at,archived_at,archive_reason,archive_previous_status').not('archived_at', 'is', null).order('archived_at', { ascending: false }),
      supabase.from('bugs').select('id,title,description,status,notes,test_result,attachments,test_attachments,pic_names,evidence_link,created_at,archived_at,archive_reason,archive_previous_status').not('archived_at', 'is', null).order('archived_at', { ascending: false }),
    ])
    if (taskResult.error || bugResult.error) {
      setError(`Không tải được lưu trữ: ${taskResult.error?.message ?? bugResult.error?.message}`)
    } else {
      setTasks((taskResult.data ?? []) as unknown as ArchiveTask[])
      setBugs((bugResult.data ?? []) as unknown as ArchiveBug[])
    }
    setLoading(false)
  }, [])

  useEffect(() => { void loadArchive() }, [loadArchive])

  async function restoreTask(task: ArchiveTask) {
    if (!supabase) return
    const restoreStatus = task.archive_reason === 'completed'
      ? (task.archive_previous_status as ArchiveTask['status'] || 'in_progress')
      : task.status
    const { error: restoreError } = await supabase.from('tasks').update({
      status: restoreStatus,
      completed_at: null,
      archived_at: null,
      archive_reason: null,
      archive_previous_status: null,
    }).eq('id', task.id)
    if (restoreError) {
      setError(`Không khôi phục được task: ${restoreError.message}`)
      return
    }
    setTasks((current) => current.filter((item) => item.id !== task.id))
  }

  async function restoreBug(bug: ArchiveBug) {
    if (!supabase) return
    const restoreStatus = bug.archive_reason === 'completed'
      ? (bug.archive_previous_status as ArchiveBug['status'] || 'retesting')
      : bug.status
    const { error: restoreError } = await supabase.from('bugs').update({
      status: restoreStatus,
      archived_at: null,
      archive_reason: null,
      archive_previous_status: null,
    }).eq('id', bug.id)
    if (restoreError) {
      setError(`Không khôi phục được bug: ${restoreError.message}`)
      return
    }
    setBugs((current) => current.filter((item) => item.id !== bug.id))
  }

  return <>
    <div className="page-heading archive-page-heading">
      <div><h1>Lưu trữ</h1></div>
      <span className="archive-retention-note"><CalendarClock size={15} /> Tự xóa sau 30 ngày</span>
    </div>
    {error && <div className="data-error" role="alert">{error}</div>}
    <section className="archive-card">
      <div className="archive-tabs" role="tablist" aria-label="Loại nội dung lưu trữ">
        <button type="button" role="tab" aria-selected={tab === 'tasks'} onClick={() => setTab('tasks')}>Tasks <span>{tasks.length}</span></button>
        <button type="button" role="tab" aria-selected={tab === 'bugs'} onClick={() => setTab('bugs')}>Bugs <span>{bugs.length}</span></button>
      </div>
      {loading ? <div className="archive-empty">Đang tải…</div> : tab === 'tasks' ? tasks.length === 0 ? (
        <div className="archive-empty"><Archive size={22} /><strong>Chưa có task lưu trữ</strong></div>
      ) : <div className="archive-list">{tasks.map((task) => <article className="archive-row" key={task.id}>
        <div className="archive-row-main">
          <div className="archive-row-title"><strong>{task.title}</strong><span className={`archive-reason ${task.archive_reason}`}>{archiveReason(task.archive_reason)}</span></div>
          <p>{task.assignee_names?.join(', ') || task.assignee_name || 'Chưa phân công'}{task.deadline ? ` · Deadline ${new Date(`${task.deadline}T12:00:00`).toLocaleDateString('vi-VN')}` : ''}</p>
          {task.description && <p>{task.description}</p>}
          {!!task.links?.length && <div className="archive-links">{task.links.map((link) => <a href={link} target="_blank" rel="noreferrer" key={link}>{link}</a>)}</div>}
          {!!task.attachments?.length && <small>{task.attachments.length} ảnh được giữ lại</small>}
        </div>
        <div className="archive-row-actions"><span>Còn {remainingDays(task.archived_at)} ngày</span><button type="button" className="secondary-button" onClick={() => void restoreTask(task)}><RotateCcw size={14} /> Khôi phục</button></div>
      </article>)}</div> : bugs.length === 0 ? (
        <div className="archive-empty"><Archive size={22} /><strong>Chưa có bug lưu trữ</strong></div>
      ) : <div className="archive-list">{bugs.map((bug) => <article className="archive-row" key={bug.id}>
        <div className="archive-row-main">
          <div className="archive-row-title"><strong>{bug.title}</strong><span className={`archive-reason ${bug.archive_reason}`}>{archiveReason(bug.archive_reason)}</span></div>
          <p>{bug.pic_names?.join(', ') || 'Chưa phân công'} · {bug.status === 'closed' ? 'Đã đóng' : bug.status}</p>
          {bug.description && <p>{bug.description}</p>}
          {bug.evidence_link && <div className="archive-links"><a href={bug.evidence_link} target="_blank" rel="noreferrer">{bug.evidence_link}</a></div>}
          {(bug.attachments?.length || bug.test_attachments?.length) ? <small>{(bug.attachments?.length ?? 0) + (bug.test_attachments?.length ?? 0)} ảnh được giữ lại</small> : null}
        </div>
        <div className="archive-row-actions"><span>Còn {remainingDays(bug.archived_at)} ngày</span><button type="button" className="secondary-button" onClick={() => void restoreBug(bug)}><RotateCcw size={14} /> Khôi phục</button></div>
      </article>)}</div>}
    </section>
  </>
}
