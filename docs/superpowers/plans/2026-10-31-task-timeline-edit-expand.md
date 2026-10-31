# Task Timeline Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a consistent icon-only expand action to every task row, make full task editing unmistakable, and preserve multiline descriptions in the timeline.

**Architecture:** Reuse the existing text preview modal, inline task editor, and Supabase update flow. Keep status updates in the existing dropdown, avoid schema changes, and use the existing CSS preview and whitespace rules.

**Tech Stack:** Next.js 16, React 19, TypeScript, lucide-react, Supabase, CSS.

## Global Constraints

- Every task row shows an icon-only expand control.
- The task actions use a pencil icon to open the existing full task editor.
- Keep task status editable through its existing separate dropdown.
- Description text wraps within its table cell and preserves user-entered line breaks, whether the text is short or truncated for preview.
- Reuse the current task preview modal, inline edit form, task draft state, and Supabase update flow.
- Do not introduce a new modal, schema, or separate update flow.
- Preserve existing uncommitted changes in `src/app/task-timeline/page.tsx` and `src/app/globals.css`.

---

## File map

- Modify `src/app/task-timeline/page.tsx` to keep one row-level expand action, replace the ambiguous edit label with an accessible pencil icon action, and preserve the existing edit and save behavior.
- Modify `src/app/globals.css` to size and style the icon-only task edit action while retaining multiline text wrapping and newlines.
- Do not add a test framework; this repository has no discovered test files or test script. Validate with the production build and a focused UI checklist.

### Task 1: Make task expansion consistent

**Files:**
- Modify: `src/app/task-timeline/page.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `TextPreview` and the existing `expandedText` state/modal.
- Produces: One dedicated icon-only expand action in each task row, opening that row's title and full description.

- [ ] **Step 1: Prevent duplicate expand buttons in the title/description preview**

Add a `showExpandButton?: boolean` option to `TextPreview`, defaulting to `true` so output, notes, blockers, and feedback previews keep their existing behavior. For the title and description previews, pass `showExpandButton={false}` because the row-level action will open both fields together.

```tsx
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
  return (
    <div className="cell-expand-box">
      <div className="cell-expand-fade">{renderWithLinks(text, true)}</div>
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
```

- [ ] **Step 2: Keep the row-level control icon-only and accessible**

Keep the `Maximize2` control on every row, remove its unused `text` prop, and give it a descriptive accessible name. Its handler must set the preview text to `[task.title, task.description].filter(Boolean).join('\n\n')` and label the preview with the task title.

```tsx
<button
  className="cell-expand-trigger cell-expand-trigger--inline"
  type="button"
  title={`Xem đầy đủ ${label}`}
  aria-label={`Xem đầy đủ task ${label}`}
  onClick={onExpand}
>
  <Maximize2 size={11} aria-hidden="true" />
</button>
```

- [ ] **Step 3: Run the production build to catch type errors**

Run: `npm run build`

Expected: Build and `tsc --noEmit` succeed. If they fail because of these changes, fix the implementation before continuing.

- [ ] **Step 4: Verify the expansion behavior**

Check the task table with a task that has no description, a short description, and a long multiline description. Each row must show exactly one expand control in the title cell; activating it must open the full title and description, preserving newlines. Output/update previews must retain their own existing expansion behavior.

### Task 2: Make task editing explicit

**Files:**
- Modify: `src/app/task-timeline/page.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `toggleTaskDetails`, `editingDetails`, `saveTaskDetails`, and the existing status dropdown.
- Produces: An accessible pencil action that opens or closes the full inline task editor without changing status behavior.

- [ ] **Step 1: Replace the “Cập nhật” text action with a pencil icon**

Import `Pencil` from `lucide-react`. Replace the existing task details button content with `<Pencil size={15} aria-hidden="true" />`. Keep the existing click handler and `aria-expanded`. Set both `title` and `aria-label` to `Sửa task ${task.title}` when closed and `Đóng chỉnh sửa ${task.title}` when open.

```tsx
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
```

- [ ] **Step 2: Preserve full edit fields and save/error behavior**

Keep the existing editor fields for title, description, start date, deadline, priority, assignees, output, links, notes, feedback, and blocker details. Keep status controlled only by the existing status dropdown. Do not clear the editor draft or close it on a failed Supabase update.

- [ ] **Step 3: Style and validate the icon action**

Update `.task-details-button` in `src/app/globals.css` to use a fixed square hit target with centered content while retaining visible hover and keyboard-focus styling. Run `npm run build`.

Expected: Build and TypeScript check succeed; the row displays an icon action and status remains independently editable.

- [ ] **Step 4: Verify editing after task creation**

Open the pencil action on a newly created and an existing task. Change the title, description, deadline, PIC, priority, and one update field; save and verify the row reflects the saved values. Confirm a failed update leaves the editor open and displays the existing error message.

### Task 3: Verify multiline descriptions end to end

**Files:**
- Modify if needed: `src/app/globals.css`
- Verify: `src/app/task-timeline/page.tsx`

**Interfaces:**
- Consumes: The create and edit description textareas and `TextPreview`.
- Produces: Table previews and full-text modal content that wrap long content and retain explicit line breaks.

- [ ] **Step 1: Confirm the preview styles handle both plain and truncated text**

Retain `white-space: pre-line` on the title/description preview and `white-space: pre-wrap` in `.text-preview-content`; retain `overflow-wrap: anywhere` so long unbroken words and URLs cannot force the cell wider.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: Build and `tsc --noEmit` succeed.

- [ ] **Step 3: Verify create, edit, row preview, and expanded preview**

Create a task with a two-line description, verify the table shows both lines, edit it to add another line, save, and verify all lines remain. Test a long description and a long unbroken string to confirm the row wraps without expanding the table. Use the row-level expand action to confirm the complete text and line breaks.
