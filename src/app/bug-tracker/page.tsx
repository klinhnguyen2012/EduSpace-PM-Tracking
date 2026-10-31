'use client'

import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Bug as BugIcon, Maximize2, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { renderWithLinks } from '../../lib/linkify'
import { teamMemberNames } from '../../lib/task-colors'

type BugStatus = 'open' | 'in_progress' | 'fixed' | 'retesting' | 'closed'
type Bug = {
  id: string
  title: string
  description: string | null
  status: BugStatus
  notes: string | null
  test_result: string | null
  attachments: string[]
  test_attachments: string[]
  pic_names: string[]
  created_at: string
}
type BugDraft = Pick<Bug, 'title' | 'description' | 'status' | 'notes' | 'test_result' | 'attachments' | 'test_attachments' | 'pic_names'>
type ImageKind = 'illustration' | 'test'

const statusLabels: Record<BugStatus, string> = {
  open: 'Mới', in_progress: 'Đang làm', fixed: 'Đã sửa', retesting: 'Đang QA', closed: 'Đã đóng',
}

const emptyDraft: BugDraft = {
  title: '', description: '', status: 'open', notes: '', test_result: '', attachments: [], test_attachments: [], pic_names: [],
}

export default function BugTracker() {
  const [bugs, setBugs] = useState<Bug[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBugId, setEditingBugId] = useState<string | null>(null)
  const [draft, setDraft] = useState<BugDraft>(emptyDraft)
  const [illustrationFiles, setIllustrationFiles] = useState<File[]>([])
  const [testImageFiles, setTestImageFiles] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [removedImagePaths, setRemovedImagePaths] = useState<string[]>([])

  const loadData = useCallback(async () => {
    if (!supabase) {
      setError('Chưa kết nối Supabase. Kiểm tra cấu hình môi trường rồi tải lại trang.')
      setLoading(false)
      return
    }
    const client = supabase
    setLoading(true)
    setError('')
    const { data, error: loadError } = await client
      .from('bugs')
      .select('id,title,description,status,notes,test_result,attachments,test_attachments,pic_names,created_at')
      .order('created_at', { ascending: false })

    if (loadError) {
      setError(`Không tải được dữ liệu: ${loadError.message}`)
    } else {
      const loadedBugs = (data ?? []).map((bug) => ({ ...bug, pic_names: bug.pic_names ?? [] })) as Bug[]
      setBugs(loadedBugs)
      const paths = loadedBugs.flatMap((bug) => [...bug.attachments, ...bug.test_attachments])
      const signedUrls = await Promise.all(paths.map(async (path) => {
        const { data: signed } = await client.storage.from('task-images').createSignedUrl(path, 3600)
        return [path, signed?.signedUrl ?? ''] as const
      }))
      setImageUrls(Object.fromEntries(signedUrls.filter(([, url]) => url)))
    }
    setLoading(false)
  }, [])

  useEffect(() => { void loadData() }, [loadData])

  function openCreateModal() {
    setError('')
    setEditingBugId(null)
    setDraft(emptyDraft)
    setIllustrationFiles([])
    setTestImageFiles([])
    setRemovedImagePaths([])
    setIsModalOpen(true)
  }

  function openEditModal(bug: Bug) {
    setError('')
    setEditingBugId(bug.id)
    setDraft({
      title: bug.title,
      description: bug.description ?? '',
      status: bug.status,
      notes: bug.notes ?? '',
      test_result: bug.test_result ?? '',
      attachments: bug.attachments,
      test_attachments: bug.test_attachments,
      pic_names: bug.pic_names ?? [],
    })
    setIllustrationFiles([])
    setTestImageFiles([])
    setRemovedImagePaths([])
    setIsModalOpen(true)
  }

  function handleImageSelection(event: ChangeEvent<HTMLInputElement>, kind: ImageKind) {
    const selected = Array.from(event.currentTarget.files ?? [])
    event.currentTarget.value = ''
    const existingCount = kind === 'illustration' ? draft.attachments.length + illustrationFiles.length : draft.test_attachments.length + testImageFiles.length
    if (existingCount + selected.length > 5) {
      setError('Mỗi mục tải lên tối đa 5 ảnh.')
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
    if (kind === 'illustration') setIllustrationFiles((current) => [...current, ...selected])
    else setTestImageFiles((current) => [...current, ...selected])
  }

  function togglePic(memberName: string) {
    setDraft((current) => ({
      ...current,
      pic_names: current.pic_names.includes(memberName)
        ? current.pic_names.filter((name) => name !== memberName)
        : [...current.pic_names, memberName],
    }))
  }

  function removeExistingImage(path: string, kind: ImageKind) {
    setDraft((current) => kind === 'illustration'
      ? { ...current, attachments: current.attachments.filter((item) => item !== path) }
      : { ...current, test_attachments: current.test_attachments.filter((item) => item !== path) })
    setRemovedImagePaths((current) => [...current, path])
  }

  function renderEditableImages(paths: string[], label: string, kind: ImageKind) {
    if (!paths.length) return null
    return <div className="bug-edit-image-list" aria-label={label}>{paths.map((path) => <div className="bug-edit-image" key={path}>
      {imageUrls[path] ? <button className="task-image-thumb" type="button" onClick={() => setExpandedImage(imageUrls[path])} aria-label={`Xem ${label}`}><img src={imageUrls[path]} alt={label} /></button> : <span className="bug-cell-empty">Ảnh</span>}
      <button className="bug-remove-image" type="button" aria-label={`Xóa ${label}`} onClick={() => removeExistingImage(path, kind)}><X size={13} /></button>
    </div>)}</div>
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    setSaving(true)
    setError('')
    const bugId = editingBugId ?? crypto.randomUUID()
    const uploaded: Record<ImageKind, string[]> = { illustration: [], test: [] }
    try {
      const uploadGroups: [ImageKind, File[]][] = [
        ['illustration', illustrationFiles],
        ['test', testImageFiles],
      ]
      for (const [kind, files] of uploadGroups) {
        for (const file of files) {
          const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1]
          const path = `bugs/${bugId}/${kind}/${crypto.randomUUID()}.${extension}`
          const { error: uploadError } = await supabase.storage.from('task-images').upload(path, file, {
            contentType: file.type, cacheControl: '3600', upsert: false,
          })
          if (uploadError) throw uploadError
          uploaded[kind].push(path)
        }
      }
    } catch (uploadError) {
      const uploadedPaths = [...uploaded.illustration, ...uploaded.test]
      if (uploadedPaths.length) await supabase.storage.from('task-images').remove(uploadedPaths)
      setError(`Không tải được ảnh: ${uploadError instanceof Error ? uploadError.message : 'Vui lòng thử lại.'}`)
      setSaving(false)
      return
    }

    const resultFields = {
      title: draft.title.trim(),
      description: draft.description?.trim() || null,
      attachments: [...draft.attachments, ...uploaded.illustration],
      test_attachments: [...draft.test_attachments, ...uploaded.test],
      pic_names: draft.pic_names,
    }
    const result = editingBugId
      ? await supabase.from('bugs').update({
          ...resultFields,
          status: draft.status,
          notes: draft.notes?.trim() || null,
          test_result: draft.test_result?.trim() || null,
        }).eq('id', editingBugId)
      : await supabase.from('bugs').insert({
          ...resultFields,
          id: bugId,
          status: 'open',
          severity: 'medium',
        })

    if (result.error) {
      const uploadedPaths = [...uploaded.illustration, ...uploaded.test]
      if (uploadedPaths.length) await supabase.storage.from('task-images').remove(uploadedPaths)
      setError(`Không lưu được bug: ${result.error.message}`)
    } else {
      setIsModalOpen(false)
      setIllustrationFiles([])
      setTestImageFiles([])
      if (removedImagePaths.length) await supabase.storage.from('task-images').remove(removedImagePaths)
      setRemovedImagePaths([])
      await loadData()
    }
    setSaving(false)
  }

  async function changeStatus(bug: Bug, status: BugStatus) {
    if (!supabase || status === bug.status) return
    const { error: updateError } = await supabase.from('bugs').update({ status }).eq('id', bug.id)
    if (updateError) setError(`Không cập nhật được trạng thái: ${updateError.message}`)
    else setBugs((current) => current.map((item) => item.id === bug.id ? { ...item, status } : item))
  }

  async function deleteBug(bug: Bug) {
    if (!supabase) return
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bug "${bug.title}"?`)) return
    setError('')
    const { error: deleteError } = await supabase.from('bugs').delete().eq('id', bug.id)
    if (deleteError) {
      setError(`Không xóa được bug: ${deleteError.message}`)
      return
    }

    setBugs((current) => current.filter((item) => item.id !== bug.id))
    if (isModalOpen && editingBugId === bug.id) {
      setIsModalOpen(false)
    }

    const allImages = [...bug.attachments, ...bug.test_attachments]
    if (allImages.length) {
      await supabase.storage.from('task-images').remove(allImages)
      setImageUrls((current) => {
        const next = { ...current }
        allImages.forEach((path) => delete next[path])
        return next
      })
    }
  }

  function renderImages(paths: string[], label: string, showEmpty = true) {
    return paths.length ? <div className="bug-image-thumbs" aria-label={`${paths.length} ${label}`}>
      {paths.map((path) => imageUrls[path] && <button className="task-image-thumb" type="button" onClick={() => setExpandedImage(imageUrls[path])} key={path} aria-label={`Xem ${label}`}>
        <img src={imageUrls[path]} alt={label} />
      </button>)}
    </div> : showEmpty ? <span className="bug-cell-empty">—</span> : null
  }

  return (
    <>
      <div className="page-heading">
        <div><p className="eyebrow">THEO DÕI LỖI</p><h1>Bug Tracker</h1></div>
        <div className="page-heading-actions">
          <button className="secondary-button" type="button" onClick={() => void loadData()} disabled={loading}><RefreshCw size={15} /> Làm mới</button>
          <button className="primary-button create-task-button" type="button" onClick={openCreateModal}><Plus size={17} /> Báo lỗi</button>
        </div>
      </div>

      {error && !isModalOpen && <div className="data-error" role="alert">{error}</div>}

      <section className="task-list-card bug-list-card" aria-label="Danh sách bug">
        <div className="task-list-heading"><h2><BugIcon size={16} /> Danh sách bug</h2><span>{bugs.length} bug</span></div>
        {loading ? <div className="task-empty" role="status">Đang tải bug từ Supabase…</div> : bugs.length === 0 ? (
          <div className="task-empty">Chưa có bug. Bấm “Báo lỗi” để ghi nhận bug đầu tiên.</div>
        ) : <div className="bug-table-wrap">
          <table className="bug-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Bug</th>
                <th>PIC</th>
                <th>Ảnh minh họa</th>
                <th>Trạng thái</th>
                <th>Nhận xét</th>
                <th>Kết quả kiểm tra</th>
                <th>Ảnh test</th>
                <th className="bug-actions-header">Thao tác</th>
              </tr>
            </thead>
            <tbody>{bugs.map((bug, index) => <tr key={bug.id}>
              <td className="bug-sequence">{index + 1}</td>
              <td className="bug-title-cell">
                <button className="bug-title-button" type="button" onClick={() => openEditModal(bug)} title="Bấm để xem và sửa">{bug.title}</button>
                {bug.description && (
                  <div className="bug-desc-line">
                    <span className="bug-desc-text">{renderWithLinks(bug.description, true)}</span>
                    {bug.description.replace(/(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g, '').trim().length > 80 && (
                      <button className="cell-expand-trigger" type="button" onClick={() => setPreviewContent(bug.description ?? '')} title="Xem chi tiết">
                        <Maximize2 size={11} aria-hidden="true" />
                        <span>Mở rộng</span>
                      </button>
                    )}
                  </div>
                )}
              </td>
              <td><div className="bug-pic-list">{bug.pic_names.length ? bug.pic_names.map((name) => (
                <span className="bug-pic-tag" key={name}>{name}</span>
              )) : <span className="bug-cell-empty">—</span>}</div></td>
              <td>{renderImages(bug.attachments, 'ảnh minh họa')}</td>
              <td><select className={`bug-status-select ${bug.status}`} aria-label={`Trạng thái bug ${bug.title}`} value={bug.status} onChange={(event) => void changeStatus(bug, event.target.value as BugStatus)}>
                {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select></td>
              <td>{bug.notes ? (
                <div className="bug-cell-with-links">
                  <span>{renderWithLinks(bug.notes, true)}</span>
                  {bug.notes.replace(/(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g, '').trim().length > 60 && (
                    <button className="cell-expand-trigger" type="button" onClick={() => setPreviewContent(bug.notes ?? '')} title="Xem chi tiết">
                      <Maximize2 size={11} aria-hidden="true" />
                      <span>Mở rộng</span>
                    </button>
                  )}
                </div>
              ) : <span className="bug-cell-empty">—</span>}</td>
              <td>{bug.test_result ? (
                <div className="bug-cell-with-links">
                  <span>{renderWithLinks(bug.test_result, true)}</span>
                  {bug.test_result.replace(/(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g, '').trim().length > 60 && (
                    <button className="cell-expand-trigger" type="button" onClick={() => setPreviewContent(bug.test_result ?? '')} title="Xem chi tiết">
                      <Maximize2 size={11} aria-hidden="true" />
                      <span>Mở rộng</span>
                    </button>
                  )}
                </div>
              ) : <span className="bug-cell-empty">—</span>}</td>
              <td>{renderImages(bug.test_attachments, 'ảnh test')}</td>
              <td className="bug-actions-cell">
                <button className="bug-action-btn edit" type="button" onClick={() => openEditModal(bug)} title="Cập nhật bug">
                  <Pencil size={13} /> <span>Sửa</span>
                </button>
                <button className="bug-action-btn delete" type="button" onClick={() => void deleteBug(bug)} title="Xóa bug">
                  <Trash2 size={13} /> <span>Xóa</span>
                </button>
              </td>
            </tr>)}</tbody>
          </table>
        </div>}
      </section>

      {previewContent && <div className="modal-backdrop text-preview-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setPreviewContent(null)
      }}>
        <section className="text-preview-modal" role="dialog" aria-modal="true" aria-label="Nội dung đầy đủ">
          <header className="task-modal-header"><h2>Nội dung đầy đủ</h2><button className="modal-close-button" type="button" aria-label="Đóng" onClick={() => setPreviewContent(null)}><X size={21} /></button></header>
          <div className="text-preview-content">{renderWithLinks(previewContent ?? '')}</div>
        </section>
      </div>}

      {isModalOpen && <div className="modal-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) setIsModalOpen(false)
      }}>
        <section className="task-modal bug-modal" role="dialog" aria-modal="true" aria-labelledby="bug-modal-title">
          <header className="task-modal-header">
            <h2 id="bug-modal-title">{editingBugId ? 'Cập nhật bug' : 'Báo lỗi mới'}</h2>
            <button className="modal-close-button" type="button" aria-label="Đóng" disabled={saving} onClick={() => setIsModalOpen(false)}><X size={21} /></button>
          </header>
          <form className="task-create-form" onSubmit={(event) => void handleSubmit(event)}>
            <div className="task-modal-body">
              {error && <div className="data-error" role="alert">{error}</div>}
              <label className="task-field bug-title-field"><span>Bug <b>*</b></span>
                <input autoFocus required maxLength={200} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Mô tả ngắn gọn lỗi gặp phải" />
              </label>
              <label className="task-field"><span>Chi tiết bug</span>
                <textarea rows={3} value={draft.description ?? ''} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Lỗi xảy ra ở đâu, trong tình huống nào?" />
              </label>
              <label className="task-field task-image-field"><span>Ảnh minh họa bug</span>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={(event) => handleImageSelection(event, 'illustration')} />
                <small>Tối đa 5 ảnh, mỗi ảnh không quá 5 MB.</small>
              </label>
              <div className="task-field"><span>PIC · Có thể chọn nhiều người</span>
                <div className="task-pic-picker">{teamMemberNames.map((memberName) => <label className="task-pic-option" key={memberName}>
                  <input type="checkbox" checked={draft.pic_names.includes(memberName)} onChange={() => togglePic(memberName)} />
                  <span>{memberName}</span>
                </label>)}</div>
              </div>
              {renderEditableImages(draft.attachments, 'ảnh minh họa đã tải lên', 'illustration')}
              {illustrationFiles.length > 0 && <div className="selected-images" aria-label="Ảnh minh họa đang chờ tải lên">
                {illustrationFiles.map((file, index) => <span className="selected-image" key={`${file.name}-${index}`}>{file.name}
                  <button type="button" aria-label={`Bỏ ảnh ${file.name}`} onClick={() => setIllustrationFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}><X size={13} /></button>
                </span>)}
              </div>}

              {editingBugId && <>
                <div className="bug-followup-fields">
                  <label className="task-field"><span>Trạng thái</span>
                    <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as BugStatus })}>
                      {Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                    </select>
                  </label>
                  <label className="task-field"><span>Nhận xét sau khi fix</span>
                    <textarea rows={3} value={draft.notes ?? ''} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="Nhân sự ghi lại cách xử lý hoặc lưu ý" />
                  </label>
                  <label className="task-field"><span>Kết quả kiểm tra</span>
                    <textarea rows={3} value={draft.test_result ?? ''} onChange={(event) => setDraft({ ...draft, test_result: event.target.value })} placeholder="Kết quả test sau khi fix" />
                  </label>
                  <label className="task-field task-image-field"><span>Ảnh test</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={(event) => handleImageSelection(event, 'test')} />
                    <small>Tối đa 5 ảnh, mỗi ảnh không quá 5 MB.</small>
                  </label>
                  {renderEditableImages(draft.test_attachments, 'ảnh test đã tải lên', 'test')}
                  {testImageFiles.length > 0 && <div className="selected-images" aria-label="Ảnh test đang chờ tải lên">
                    {testImageFiles.map((file, index) => <span className="selected-image" key={`${file.name}-${index}`}>{file.name}
                      <button type="button" aria-label={`Bỏ ảnh ${file.name}`} onClick={() => setTestImageFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}><X size={13} /></button>
                    </span>)}
                  </div>}
                </div>
              </>}
            </div>
            <footer className="task-modal-footer bug-modal-footer">
              {editingBugId ? (
                <button
                  className="danger-button bug-modal-delete"
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    const currentBug = bugs.find((b) => b.id === editingBugId)
                    if (currentBug) void deleteBug(currentBug)
                  }}
                >
                  <Trash2 size={15} /> Xóa bug
                </button>
              ) : <div />}
              <div className="modal-footer-actions">
                <button className="secondary-button" type="button" disabled={saving} onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button className="primary-button task-submit" type="submit" disabled={saving || !draft.title.trim()}>
                  {saving ? 'Đang lưu…' : 'Lưu cập nhật'}
                </button>
              </div>
            </footer>
          </form>
        </section>
      </div>}

      {expandedImage && <div className="modal-backdrop image-preview-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setExpandedImage(null)
      }}>
        <section className="image-preview-modal" role="dialog" aria-modal="true" aria-label="Ảnh bug">
          <button className="image-preview-close" type="button" aria-label="Đóng ảnh" onClick={() => setExpandedImage(null)}><X size={22} /></button>
          <img src={expandedImage} alt="Ảnh bug" />
        </section>
      </div>}
    </>
  )
}
