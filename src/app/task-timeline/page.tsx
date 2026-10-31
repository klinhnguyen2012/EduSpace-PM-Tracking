'use client'

import { Fragment, useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { ImagePlus, Maximize2, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { memberColor, teamMemberNames } from '../../lib/task-colors'
import { renderWithLinks } from '../../lib/linkify'

type TaskStatus = 'todo' | 'in_progress' | 'qa' | 'done' | 'paused'
type TaskPriority = 'P0' | 'P1' | 'P2'
type TaskView = 'active' | 'completed'

type Task = {
  id: string
  title: string
  description: string | null
  output: string | null
  status: TaskStatus
  priority: TaskPriority | null
  start_date: string | null
  deadline: string | null
  assignee_name: string | null
  assignee_names: string[]
  links: string[]
  notes: string | null
  feedback: string | null
  is_blocked: boolean
  blocker_reason: string | null
  attachments: string[]
  created_at: string
}

type TaskDetailsDraft = {
  taskId: string
  title: string
  description: string
  startDate: string
  deadline: string
  priority: TaskPriority
  output: string
  links: string
  notes: string
  feedback: string
  isBlocked: boolean
  blockerReason: string
  picNames: string[]
}

const statusLabels: Record<TaskStatus, string> = {
  todo: 'Chưa làm',
  in_progress: 'Đang làm',
  qa: 'Đang QA',
  done: 'Hoàn thành',
  paused: 'Tạm dừng',
}

const priorityLabels: Record<TaskPriority, string> = { P0: 'P0 · Gấp', P1: 'P1 · Cao', P2: 'P2 · Bình thường' }
function deadlineDisplay(deadline: string | null) {
  return deadline ? new Date(`${deadline}T12:00:00+07:00`).toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric',
  }) : '—'
}

function TextPreview({
  label,
  text,
  onExpand,
  maxLength = 80,
  showExpandButton = true,
}: {
  label: string
  text: string
  onExpand: () => void
  maxLength?: number
  showExpandButton?: boolean
}) {
  const nonUrlText = text.replace(/(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g, '').trim()
  const lines = text.split('\n').filter((l) => l.trim().length > 0)
  const isTruncated = !((nonUrlText.length <= maxLength && lines.length <= 2) || text.length <= maxLength)

  if (!isTruncated) {
    return <span className="cell-preview-plain">{renderWithLinks(text, true)}</span>
  }

  return (
    <div className="cell-expand-box">
      <div className="cell-expand-fade">
        {renderWithLinks(text, true)}
      </div>
      {showExpandButton && (
        <button
          className="cell-expand-trigger"
          type="button"
          title={`Xem đầy đủ ${label}`}
          aria-label={`Xem đầy đủ ${label}`}
          onClick={onExpand}
        >
          <Maximize2 size={11} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

function ExpandButton({ label, onExpand }: { label: string; onExpand: () => void }) {
  return (
    <button
      className="cell-expand-trigger cell-expand-trigger--inline"
      type="button"
      title={`Xem đầy đủ ${label}`}
      aria-label={`Xem đầy đủ task ${label}`}
      onClick={onExpand}
    >
      <Maximize2 size={11} aria-hidden="true" />
    </button>
  )
}

export default function TaskTimeline() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [deadline, setDeadline] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('P1')
  const [assigneeNames, setAssigneeNames] = useState<string[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [editingDetails, setEditingDetails] = useState<TaskDetailsDraft | null>(null)
  const [savingDetails, setSavingDetails] = useState(false)
  const [expandedText, setExpandedText] = useState<{ label: string; text: string } | null>(null)
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  const [taskView, setTaskView] = useState<TaskView>('active')

  const loadData = useCallback(async () => {
    if (!supabase) {
      setError('Chưa kết nối Supabase. Kiểm tra cấu hình môi trường rồi tải lại trang.')
      setLoading(false)
      return
    }
    const client = supabase

    setLoading(true)
    setError('')
    const taskResult = await client
      .from('tasks')
      .select('id,title,description,output,status,priority,start_date,deadline,assignee_name,assignee_names,links,notes,feedback,is_blocked,blocker_reason,attachments,created_at')
      .order('created_at', { ascending: true })

    if (taskResult.error) setError(`Không tải được task: ${taskResult.error.message}`)
    else {
      const rows = taskResult.data.map((task) => ({ ...task, assignee_names: task.assignee_names ?? (task.assignee_name ? [task.assignee_name] : []) })) as Task[]
      setTasks(rows)
      const signedUrls = await Promise.all(rows.flatMap((task) => task.attachments.map(async (path) => {
        const { data } = await client.storage.from('task-images').createSignedUrl(path, 3600)
        return [path, data?.signedUrl ?? ''] as const
      })))
      setImageUrls(Object.fromEntries(signedUrls.filter(([, url]) => url)))
    }

    setLoading(false)
  }, [])

  useEffect(() => { void loadData() }, [loadData])

  useEffect(() => {
    if (!isCreateOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) setIsCreateOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isCreateOpen, saving])

  useEffect(() => {
    if (!expandedText && !expandedImage) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExpandedText(null)
        setExpandedImage(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [expandedText, expandedImage])

  function handleImageSelection(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.currentTarget.files ?? [])
    event.currentTarget.value = ''
    if (selected.length > 5) {
      setError('Mỗi task tải lên tối đa 5 ảnh.')
      return
    }
    if (selected.some((file) => !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type))) {
      setError('Chỉ hỗ trợ ảnh JPG, PNG, WebP hoặc GIF.')
      return
    }
    if (selected.some((file) => file.size > 5 * 1024 * 1024)) {
      setError('Mỗi ảnh cần nhỏ hơn hoặc bằng 5 MB.')
      return
    }
    setError('')
    setImageFiles(selected)
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    const client = supabase

    setSaving(true)
    setError('')
    const taskId = crypto.randomUUID()
    const uploadedPaths: string[] = []
    try {
      for (const file of imageFiles) {
        const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1]
        const path = `${taskId}/${crypto.randomUUID()}.${extension}`
        const { error: uploadError } = await client.storage.from('task-images').upload(path, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false,
        })
        if (uploadError) throw uploadError
        uploadedPaths.push(path)
      }

      const { data, error: insertError } = await client
        .from('tasks')
        .insert({
          id: taskId,
          title: title.trim(),
          description: description.trim() || null,
          start_date: startDate || null,
          deadline: deadline || null,
          priority,
          assignee_name: assigneeNames[0] || null,
          assignee_names: assigneeNames,
          attachments: uploadedPaths,
        })
        .select('id,title,description,output,status,priority,start_date,deadline,assignee_name,assignee_names,links,notes,feedback,is_blocked,blocker_reason,attachments,created_at')
        .single()
      if (insertError) throw insertError

      setTasks((current) => [data as Task, ...current])
      if (uploadedPaths.length) {
        const signedUrls = await Promise.all(uploadedPaths.map(async (path) => {
          const { data: signed } = await client.storage.from('task-images').createSignedUrl(path, 3600)
          return [path, signed?.signedUrl ?? ''] as const
        }))
        setImageUrls((current) => ({ ...current, ...Object.fromEntries(signedUrls.filter(([, url]) => url)) }))
      }
      setTitle('')
      setDescription('')
      setStartDate('')
      setDeadline('')
      setPriority('P1')
      setAssigneeNames([])
      setImageFiles([])
      setIsCreateOpen(false)
    } catch (createError) {
      if (uploadedPaths.length) await client.storage.from('task-images').remove(uploadedPaths)
      setError(`Không tạo được task hoặc ảnh: ${createError instanceof Error ? createError.message : 'Vui lòng thử lại.'}`)
    } finally {
      setSaving(false)
    }
  }

  async function changeStatus(task: Task, status: TaskStatus) {
    if (!supabase) return
    setError('')
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ status, completed_at: status === 'done' ? new Date().toISOString() : null })
      .eq('id', task.id)

    if (updateError) setError(`Không cập nhật được trạng thái: ${updateError.message}`)
    else setTasks((current) => current.map((item) => item.id === task.id ? { ...item, status } : item))
  }

  async function deleteTask(task: Task) {
    if (!supabase || !window.confirm(`Xóa task “${task.title}”?`)) return
    setError('')
    const { error: deleteError } = await supabase.from('tasks').delete().eq('id', task.id)
    if (deleteError) setError(`Không xóa được task: ${deleteError.message}`)
    else {
      setTasks((current) => current.filter((item) => item.id !== task.id))
      if (task.attachments.length) {
        const { error: storageError } = await supabase.storage.from('task-images').remove(task.attachments)
        if (storageError) setError(`Task đã xóa nhưng ảnh chưa được dọn khỏi Storage: ${storageError.message}`)
      }
      setImageUrls((current) => Object.fromEntries(Object.entries(current).filter(([path]) => !task.attachments.includes(path))))
    }
  }

  function toggleTaskDetails(task: Task) {
    setEditingDetails((current) => current?.taskId === task.id ? null : {
      taskId: task.id,
      title: task.title,
      description: task.description ?? '',
      startDate: task.start_date ?? '',
      deadline: task.deadline ?? '',
      priority: task.priority ?? 'P1',
      output: task.output ?? '',
      links: task.links.join('\n'),
      notes: task.notes ?? '',
      feedback: task.feedback ?? '',
      isBlocked: task.is_blocked,
      blockerReason: task.blocker_reason ?? '',
      picNames: task.assignee_names?.length ? task.assignee_names : task.assignee_name ? [task.assignee_name] : [],
    })
  }

  async function saveTaskDetails(event: FormEvent<HTMLFormElement>, task: Task) {
    event.preventDefault()
    if (!supabase || editingDetails?.taskId !== task.id) return

    setSavingDetails(true)
    setError('')
    const draft = editingDetails
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        title: draft.title.trim() || task.title,
        description: draft.description.trim() || null,
        start_date: draft.startDate || null,
        deadline: draft.deadline || null,
        priority: draft.priority,
        output: draft.output.trim() || null,
        links: draft.links.split('\n').map((value) => value.trim()).filter(Boolean),
        notes: draft.notes.trim() || null,
        feedback: draft.feedback.trim() || null,
        is_blocked: draft.isBlocked,
        blocker_reason: draft.isBlocked ? draft.blockerReason.trim() || null : null,
        assignee_name: draft.picNames[0] || null,
        assignee_names: draft.picNames,
      })
      .eq('id', task.id)

    if (updateError) setError(`Không cập nhật được thông tin task: ${updateError.message}`)
    else {
      setTasks((current) => current.map((item) => item.id === task.id ? {
        ...item,
        title: draft.title.trim() || task.title,
        description: draft.description.trim() || null,
        start_date: draft.startDate || null,
        deadline: draft.deadline || null,
        priority: draft.priority,
        output: draft.output.trim() || null,
        links: draft.links.split('\n').map((value) => value.trim()).filter(Boolean),
        notes: draft.notes.trim() || null,
        feedback: draft.feedback.trim() || null,
        is_blocked: draft.isBlocked,
        blocker_reason: draft.isBlocked ? draft.blockerReason.trim() || null : null,
        assignee_name: draft.picNames[0] || null,
        assignee_names: draft.picNames,
      } : item))
      setEditingDetails(null)
    }
    setSavingDetails(false)
  }

  const orderedTasks = [...tasks].sort((a, b) => a.created_at.localeCompare(b.created_at))
  const activeTasks = orderedTasks.filter((task) => task.status !== 'done')
  const completedTasks = orderedTasks.filter((task) => task.status === 'done')
  const visibleTasks = taskView === 'active' ? activeTasks : completedTasks
  const taskSequence = new Map(visibleTasks.map((task, index) => [task.id, index + 1]))

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Task Timeline</h1>
        </div>
        <div className="page-heading-actions">
          <button className="secondary-button" type="button" onClick={() => void loadData()} disabled={loading}>
            <RefreshCw size={15} /> Làm mới
          </button>
          <button className="primary-button create-task-button" type="button" onClick={() => { setError(''); setIsCreateOpen(true) }}>
            <Plus size={17} /> Tạo task
          </button>
        </div>
      </div>

      {error && !isCreateOpen && <div className="data-error" role="alert">{error}</div>}

      {isCreateOpen && <div className="modal-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) setIsCreateOpen(false)
      }}>
        <section className="task-modal" role="dialog" aria-modal="true" aria-labelledby="create-task-title">
          <header className="task-modal-header">
            <h2 id="create-task-title">Tạo task mới</h2>
            <button className="modal-close-button" type="button" aria-label="Đóng" disabled={saving} onClick={() => setIsCreateOpen(false)}><X size={21} /></button>
          </header>
          <form className="task-create-form" onSubmit={handleCreate}>
            <div className="task-modal-body">
              {error && <div className="data-error" role="alert">{error}</div>}
              <label className="task-field task-title-field">
                <span>Tiêu đề <b>*</b></span>
                <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Hoàn thiện trang đăng nhập" required maxLength={200} />
              </label>
              <label className="task-field">
                <span>Mô tả</span>
                <textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Nhập mô tả chi tiết cho task (hỗ trợ xuống dòng)" />
              </label>
              <div className="task-modal-grid">
                <label className="task-field">
                  <span>Ngày bắt đầu</span>
                  <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                </label>
                <label className="task-field">
                  <span>Deadline</span>
                  <input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
                </label>
                <label className="task-field">
                  <span>Ưu tiên</span>
                  <select value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}>
                    {Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <div className="task-field">
                  <span>PIC · Có thể chọn nhiều người</span>
                  <div className="task-pic-picker">{teamMemberNames.map((name) => <label className="task-pic-option" key={name}>
                    <input type="checkbox" checked={assigneeNames.includes(name)} onChange={() => setAssigneeNames((current) => current.includes(name) ? current.filter((pic) => pic !== name) : [...current, name])} />
                    <span>{name}</span>
                  </label>)}</div>
                </div>
              </div>
              <label className="task-field task-image-field">
                <span><ImagePlus size={14} aria-hidden="true" /> Ảnh đính kèm</span>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handleImageSelection} />
                <small>Tối đa 5 ảnh, 5 MB mỗi ảnh.</small>
              </label>
              {imageFiles.length > 0 && <div className="selected-images" aria-label="Ảnh đã chọn">
                {imageFiles.map((file, index) => <span className="selected-image" key={`${file.name}-${index}`}>
                  {file.name}
                  <button type="button" aria-label={`Bỏ ảnh ${file.name}`} onClick={() => setImageFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}><X size={13} /></button>
                </span>)}
              </div>}
            </div>
            <footer className="task-modal-footer">
              <button className="secondary-button" type="button" disabled={saving} onClick={() => setIsCreateOpen(false)}>Hủy</button>
              <button className="primary-button task-submit" type="submit" disabled={saving || !title.trim()}>
                <Plus size={16} /> {saving ? 'Đang lưu…' : 'Tạo task'}
              </button>
            </footer>
          </form>
        </section>
      </div>}

      <section className="task-list-card" aria-label="Danh sách task">
        <div className="task-list-heading">
          <div className="task-view-switch" role="group" aria-label="Lọc danh sách task">
            <button type="button" aria-pressed={taskView === 'active'} onClick={() => setTaskView('active')}>
              Danh sách task <span>{activeTasks.length}</span>
            </button>
            <button type="button" aria-pressed={taskView === 'completed'} onClick={() => setTaskView('completed')}>
              Đã hoàn thành <span>{completedTasks.length}</span>
            </button>
          </div>
        </div>
        {loading ? <div className="task-empty" role="status">Đang tải task từ Supabase…</div> : visibleTasks.length === 0 ? (
          <div className="task-empty">
            {taskView === 'completed'
              ? 'Chưa có task hoàn thành.'
              : tasks.length === 0
                ? 'Chưa có task. Bấm “Tạo task” để tạo công việc đầu tiên.'
                : 'Không còn task chưa hoàn thành.'}
          </div>
        ) : (
          <div className="task-table-wrap">
            <table className="task-table">
              <thead><tr><th>STT</th><th>PIC</th><th>Deadline</th><th>Công việc</th><th>Output cụ thể</th><th>Ưu tiên</th><th>Trạng thái</th><th>Cập nhật</th><th>Ảnh</th><th aria-label="Thao tác" /></tr></thead>
              <tbody>
                  {visibleTasks.map((task) => (
                    <Fragment key={task.id}>
                    <tr>
                      <td className="task-sequence">{taskSequence.get(task.id)}</td>
                      <td><div className="task-pic-tags">{task.assignee_names.length ? task.assignee_names.map((name) => {
                        const color = memberColor(name)
                        return <span className="assignee-tag" key={name} style={{ backgroundColor: color.background, color: color.color, borderColor: color.border }}>{name}</span>
                      }) : '—'}</div></td>
                      <td className="task-deadline-cell">{task.deadline ? <span>{deadlineDisplay(task.deadline)}</span> : '—'}</td>
                      <td className="task-title-cell">
                        <div className="task-title-wrap">
                          <div className="task-title-header">
                            <strong><TextPreview label={task.title} text={task.title} onExpand={() => setExpandedText({ label: task.title, text: task.title })} showExpandButton={false} /></strong>
                            <ExpandButton label={task.title} onExpand={() => setExpandedText({ label: task.title, text: [task.title, task.description].filter(Boolean).join('\n\n') })} />
                          </div>
                          {task.description && <small><TextPreview label="mô tả" text={task.description} onExpand={() => setExpandedText({ label: `Mô tả · ${task.title}`, text: task.description! })} maxLength={65} showExpandButton={false} /></small>}
                        </div>
                      </td>
                      <td className="task-output-cell">{task.output ? <TextPreview label="output" text={task.output} onExpand={() => setExpandedText({ label: `Output cụ thể · ${task.title}`, text: task.output! })} /> : '—'}</td>
                      <td>{task.priority ? <span className={`priority-tag ${task.priority.toLowerCase()}`}>{priorityLabels[task.priority]}</span> : '—'}</td>
                      <td><select className={`task-status-select status-${task.status}`} aria-label={`Trạng thái ${task.title}`} value={task.status} onChange={(event) => void changeStatus(task, event.target.value as TaskStatus)}>
                        {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select></td>
                      <td className="task-updates-cell">
                        {task.links.length === 0 && !task.notes && !task.feedback && !task.is_blocked && !task.blocker_reason ? '—' : <div className="task-updates">
                          {task.links.map((taskLink, linkIndex) => <div className="task-update-line" key={`${task.id}-link-${linkIndex}`}><b>Link</b><a href={taskLink} target="_blank" rel="noreferrer">Mở link {linkIndex + 1}</a></div>)}
                          {(task.notes || task.blocker_reason || task.is_blocked) && <div className="task-update-line"><b>{task.is_blocked ? 'Blocker' : 'Ghi chú'}</b><span>{task.is_blocked && <strong className="blocker-label">Blocked</strong>}<TextPreview label="ghi chú / blocker" text={[task.blocker_reason, task.notes].filter(Boolean).join('\n') || 'Task đang bị chặn'} onExpand={() => setExpandedText({ label: `Ghi chú / Blocker · ${task.title}`, text: [task.blocker_reason, task.notes].filter(Boolean).join('\n') || 'Task đang bị chặn' })} /></span></div>}
                          {task.feedback && <div className="task-update-line"><b>Feedback</b><TextPreview label="feedback" text={task.feedback} onExpand={() => setExpandedText({ label: `Feedback · ${task.title}`, text: task.feedback! })} /></div>}
                        </div>}
                      </td>
                      <td><div className="task-images" aria-label={`${task.attachments.length} ảnh đính kèm`}>
                        {task.attachments.map((path) => imageUrls[path] && <button className="task-image-thumb" type="button" onClick={() => setExpandedImage(imageUrls[path])} key={path} aria-label="Xem ảnh đính kèm"><img src={imageUrls[path]} alt="Ảnh task" /></button>)}
                        {task.attachments.length === 0 && '—'}
                      </div></td>
                      <td><div className="task-actions">
                        <button
                          className="task-details-button"
                          type="button"
                          aria-label={editingDetails?.taskId === task.id ? `Đóng chỉnh sửa ${task.title}` : `Sửa task ${task.title}`}
                          title={editingDetails?.taskId === task.id ? `Đóng chỉnh sửa ${task.title}` : `Sửa task ${task.title}`}
                          aria-expanded={editingDetails?.taskId === task.id}
                          onClick={() => toggleTaskDetails(task)}
                        >
                          <Pencil size={15} aria-hidden="true" />
                        </button>
                        <button className="icon-button danger" type="button" aria-label={`Xóa ${task.title}`} onClick={() => void deleteTask(task)}><Trash2 size={16} /></button>
                      </div></td>
                    </tr>
                    {editingDetails?.taskId === task.id && <tr className="task-edit-row"><td colSpan={10}>
                      <form className="task-edit-form" onSubmit={(event) => void saveTaskDetails(event, task)}>
                        <label className="task-field task-title-field"><span>Tiêu đề <b>*</b></span><input value={editingDetails.title} onChange={(event) => setEditingDetails({ ...editingDetails, title: event.target.value })} placeholder="Tiêu đề công việc" required maxLength={200} /></label>
                        <div className="task-modal-grid">
                          <label className="task-field"><span>Ngày bắt đầu</span><input type="date" value={editingDetails.startDate} onChange={(event) => setEditingDetails({ ...editingDetails, startDate: event.target.value })} /></label>
                          <label className="task-field"><span>Deadline</span><input type="date" value={editingDetails.deadline} onChange={(event) => setEditingDetails({ ...editingDetails, deadline: event.target.value })} /></label>
                          <label className="task-field"><span>Ưu tiên</span><select value={editingDetails.priority} onChange={(event) => setEditingDetails({ ...editingDetails, priority: event.target.value as TaskPriority })}>{Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                        </div>
                        <div className="task-field task-pic-edit-field"><span>PIC · Có thể chọn nhiều người</span><div className="task-pic-picker">{Array.from(new Set([...teamMemberNames, ...editingDetails.picNames])).map((name) => <label className="task-pic-option" key={name}>
                          <input type="checkbox" checked={editingDetails.picNames.includes(name)} onChange={() => setEditingDetails({ ...editingDetails, picNames: editingDetails.picNames.includes(name) ? editingDetails.picNames.filter((pic) => pic !== name) : [...editingDetails.picNames, name] })} />
                          <span>{name}</span>
                        </label>)}</div></div>
                        <label className="task-field"><span>Mô tả công việc</span><textarea rows={3} value={editingDetails.description} onChange={(event) => setEditingDetails({ ...editingDetails, description: event.target.value })} placeholder="Cập nhật mô tả chi tiết (hỗ trợ xuống dòng)" /></label>
                        <label className="task-field"><span>Output cụ thể</span><textarea rows={3} value={editingDetails.output} onChange={(event) => setEditingDetails({ ...editingDetails, output: event.target.value })} placeholder="Kết quả cần bàn giao" /></label>
                        <label className="task-field"><span>Link làm (mỗi link một dòng)</span><textarea rows={3} value={editingDetails.links} onChange={(event) => setEditingDetails({ ...editingDetails, links: event.target.value })} placeholder="https://..." /></label>
                        <label className="task-field"><span>Ghi chú / Khó khăn</span><textarea rows={3} value={editingDetails.notes} onChange={(event) => setEditingDetails({ ...editingDetails, notes: event.target.value })} placeholder="Ghi chú tiến độ" /></label>
                        <label className="task-field"><span>Feedback</span><textarea rows={3} value={editingDetails.feedback} onChange={(event) => setEditingDetails({ ...editingDetails, feedback: event.target.value })} placeholder="Feedback cho task" /></label>
                        <div className="task-blocker-edit">
                          <label><input type="checkbox" checked={editingDetails.isBlocked} onChange={(event) => setEditingDetails({ ...editingDetails, isBlocked: event.target.checked })} /> Task đang bị blocker</label>
                          {editingDetails.isBlocked && <input aria-label="Lý do bị blocker" value={editingDetails.blockerReason} onChange={(event) => setEditingDetails({ ...editingDetails, blockerReason: event.target.value })} placeholder="Lý do bị chặn" />}
                        </div>
                        <div className="task-edit-actions">
                          <button className="secondary-button" type="button" onClick={() => setEditingDetails(null)}>Hủy</button>
                          <button className="primary-button" type="submit" disabled={savingDetails}>{savingDetails ? 'Đang lưu…' : 'Lưu thay đổi'}</button>
                        </div>
                      </form>
                    </td></tr>}
                    </Fragment>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {expandedText && <div className="modal-backdrop text-preview-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setExpandedText(null)
      }}>
        <section className="text-preview-modal" role="dialog" aria-modal="true" aria-labelledby="text-preview-title">
          <header className="task-modal-header">
            <h2 id="text-preview-title">{expandedText.label}</h2>
            <button className="modal-close-button" type="button" aria-label="Đóng" onClick={() => setExpandedText(null)}><X size={21} /></button>
          </header>
          <div className="text-preview-content">{renderWithLinks(expandedText.text)}</div>
        </section>
      </div>}

      {expandedImage && <div className="modal-backdrop image-preview-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setExpandedImage(null)
      }}>
        <section className="image-preview-modal" role="dialog" aria-modal="true" aria-label="Ảnh đính kèm task">
          <button className="image-preview-close" type="button" aria-label="Đóng ảnh" onClick={() => setExpandedImage(null)}><X size={22} /></button>
          <img src={expandedImage} alt="Ảnh đính kèm task" />
        </section>
      </div>}
    </>
  )
}
