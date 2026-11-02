'use client'

import { useCallback, useEffect, useState } from 'react'
import { Archive, CalendarClock, RotateCcw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { parseNamedLink } from '../../lib/linkify'

type ArchiveTask = {
  id: string; title: string; description: string | null; status: 'todo' | 'in_progress' | 'qa' | 'done' | 'paused'
  deadline: string | null; assignee_name: string | null; assignee_names: string[] | null
  links: string[] | null; attachments: string[] | null; archived_at: string
  archive_reason: 'deleted' | 'completed' | null; archive_previous_status: string | null
}
type ArchiveBug = {
  id: string; title: string; description: string | null; status: 'open' | 'in_progress' | 'fixed' | 'retesting' | 'closed'
  attachments: string[] | null; test_attachments: string[] | null; pic_names: string[] | null
  evidence_link: string | null; archived_at: string; archive_reason: 'deleted' | 'completed' | null
  archive_previous_status: string | null
}
type ArchiveTab = 'records' | 'links'

function remainingDays(archivedAt: string) {
  const elapsed = Date.now() - new Date(archivedAt).getTime()
  return Math.max(0, 30 - Math.floor(elapsed / 86_400_000))
}

function archiveReason(reason: string | null) {
  return reason === 'completed' ? 'Đã hoàn thành' : 'Đã xóa'
}

export default function ArchivePage() {
  const [tasks, setTasks] = useState<ArchiveTask[]>([])
  const [bugs, setBugs] = useState<ArchiveBug[]>([])
  const [tab, setTab] = useState<ArchiveTab>('records')
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
      supabase.from('tasks').select('id,title,description,status,deadline,assignee_name,assignee_names,links,attachments,archived_at,archive_reason,archive_previous_status').not('archived_at', 'is', null).order('archived_at', { ascending: false }),
      supabase.from('bugs').select('id,title,description,status,attachments,test_attachments,pic_names,evidence_link,archived_at,archive_reason,archive_previous_status').not('archived_at', 'is', null).order('archived_at', { ascending: false }),
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
      status: restoreStatus, completed_at: null, archived_at: null, archive_reason: null, archive_previous_status: null,
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
      status: restoreStatus, archived_at: null, archive_reason: null, archive_previous_status: null,
    }).eq('id', bug.id)
    if (restoreError) {
      setError(`Không khôi phục được bug: ${restoreError.message}`)
      return
    }
    setBugs((current) => current.filter((item) => item.id !== bug.id))
  }

  const records = [
    ...tasks.map((item) => ({ kind: 'task' as const, id: item.id, archivedAt: item.archived_at, item })),
    ...bugs.map((item) => ({ kind: 'bug' as const, id: item.id, archivedAt: item.archived_at, item })),
  ].sort((a, b) => b.archivedAt.localeCompare(a.archivedAt))
  const links = [
    ...tasks.flatMap((task) => (task.links ?? []).map((url, index) => ({
      id: `task-${task.id}-${index}`, url, title: task.title,
      owner: task.assignee_names?.join(', ') || task.assignee_name || 'Chưa phân công',
      kind: 'Task', archivedAt: task.archived_at, reason: task.archive_reason,
    }))),
    ...bugs.flatMap((bug) => bug.evidence_link ? [{
      id: `bug-${bug.id}`, url: bug.evidence_link, title: bug.title,
      owner: bug.pic_names?.join(', ') || '—', kind: 'Bug', archivedAt: bug.archived_at, reason: bug.archive_reason,
    }] : []),
  ].sort((a, b) => b.archivedAt.localeCompare(a.archivedAt))

  return <>
    <div className="page-heading archive-page-heading">
      <div><h1>Lưu trữ</h1></div>
      <span className="archive-retention-note"><CalendarClock size={15} /> Tự xóa sau 30 ngày</span>
    </div>
    {error && <div className="data-error" role="alert">{error}</div>}
    <section className="archive-card">
      <div className="archive-tabs" role="tablist" aria-label="Nội dung lưu trữ">
        <button type="button" role="tab" aria-selected={tab === 'records'} onClick={() => setTab('records')}>Task &amp; bug <span>{records.length}</span></button>
        <button type="button" role="tab" aria-selected={tab === 'links'} onClick={() => setTab('links')}>Link <span>{links.length}</span></button>
      </div>
      {loading ? <div className="archive-empty">Đang tải…</div> : tab === 'records' ? records.length === 0 ? (
        <div className="archive-empty"><Archive size={22} /><strong>Chưa có task hoặc bug lưu trữ</strong></div>
      ) : <div className="archive-list">{records.map((record) => record.kind === 'task' ? <article className="archive-row" key={`task-${record.id}`}>
        <div className="archive-row-main">
          <div className="archive-row-title"><span className="archive-kind">Task</span><strong>{record.item.title}</strong><span className={`archive-reason ${record.item.archive_reason}`}>{archiveReason(record.item.archive_reason)}</span></div>
          <p>{record.item.assignee_names?.join(', ') || record.item.assignee_name || 'Chưa phân công'}{record.item.deadline ? ` · Deadline ${new Date(`${record.item.deadline}T12:00:00`).toLocaleDateString('vi-VN')}` : ''}</p>
          {record.item.description && <p>{record.item.description}</p>}
          {!!record.item.attachments?.length && <small>{record.item.attachments.length} ảnh được giữ lại</small>}
        </div>
        <div className="archive-row-actions"><span>Còn {remainingDays(record.archivedAt)} ngày</span><button type="button" className="secondary-button" onClick={() => void restoreTask(record.item)}><RotateCcw size={14} /> Khôi phục</button></div>
      </article> : <article className="archive-row" key={`bug-${record.id}`}>
        <div className="archive-row-main">
          <div className="archive-row-title"><span className="archive-kind">Bug</span><strong>{record.item.title}</strong><span className={`archive-reason ${record.item.archive_reason}`}>{archiveReason(record.item.archive_reason)}</span></div>
          <p>{record.item.pic_names?.join(', ') || 'Chưa phân công'} · {record.item.status === 'closed' ? 'Đã đóng' : record.item.status}</p>
          {record.item.description && <p>{record.item.description}</p>}
          {(record.item.attachments?.length || record.item.test_attachments?.length) ? <small>{(record.item.attachments?.length ?? 0) + (record.item.test_attachments?.length ?? 0)} ảnh được giữ lại</small> : null}
        </div>
        <div className="archive-row-actions"><span>Còn {remainingDays(record.archivedAt)} ngày</span><button type="button" className="secondary-button" onClick={() => void restoreBug(record.item)}><RotateCcw size={14} /> Khôi phục</button></div>
      </article>)}</div> : links.length === 0 ? (
        <div className="archive-empty"><Archive size={22} /><strong>Chưa có link lưu trữ</strong></div>
      ) : <div className="archive-list">{links.map((link) => {
        const { label, url } = parseNamedLink(link.url)
        return <article className="archive-row archive-link-row" key={link.id}>
          <div className="archive-row-main">
            <div className="archive-row-title"><span className="archive-kind">{link.kind}</span><strong>{link.title}</strong><span className={`archive-reason ${link.reason}`}>{archiveReason(link.reason)}</span></div>
            <p>{link.owner}</p>
            <a className="archive-link-url" href={url} target="_blank" rel="noreferrer" title={url}>{label}</a>
          </div>
          <div className="archive-row-actions"><span>Còn {remainingDays(link.archivedAt)} ngày</span></div>
        </article>
      })}</div>}
    </section>
  </>
}
