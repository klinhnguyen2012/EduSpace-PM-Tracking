# Task Timeline Completed Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add adjacent active and completed task views with counts, automatically filtering tasks according to their current status.

**Architecture:** Keep the existing single `tasks` state and Supabase status update flow. Derive unfinished and completed arrays from `tasks`, show one selected array in the existing table, and add accessible view buttons with compact count badges.

**Tech Stack:** Next.js 16, React 19, TypeScript, lucide-react, CSS.

## Global Constraints

- Add two adjacent view buttons to the task list card: “Danh sách task” and “Đã hoàn thành”.
- Show a count for each view.
- “Danh sách task” shows every task whose status is not `done`; “Đã hoàn thành” shows tasks whose status is `done`.
- Changing a task's existing status dropdown to `done` moves the row to the completed view. Changing it back to any other existing status returns it to the unfinished view.
- Keep the existing table, edit form, delete action, and status options; show a view-specific empty message when the chosen list has no rows.
- Filter the already-loaded task state in `src/app/task-timeline/page.tsx`; do not add a database column, duplicate records, or change Supabase status updates.

---

## File map

- Modify `src/app/task-timeline/page.tsx` to derive filtered views, render the selected view and counts, and handle its empty state.
- Modify `src/app/globals.css` to style the selected/unselected view buttons and counts consistently in light and dark themes.
- Do not add a test framework; this repository has no discovered test files or test script. Validate with `npm run build`, `git diff --check`, and a focused UI/source review.

### Task 1: Add automatically filtered task views

**Files:**
- Modify: `src/app/task-timeline/page.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: Existing `tasks` state and `changeStatus(task, status)`.
- Produces: `TaskView = 'active' | 'completed'`, derived task arrays, count buttons, and the existing table rendered for the selected view.

- [ ] **Step 1: Add the view state and derived task arrays**

Add a local type and default the view to the existing task list. Derive counts and rows from the same `tasks` state:

```tsx
type TaskView = 'active' | 'completed'

const [taskView, setTaskView] = useState<TaskView>('active')
const activeTasks = orderedTasks.filter((task) => task.status !== 'done')
const completedTasks = orderedTasks.filter((task) => task.status === 'done')
const visibleTasks = taskView === 'active' ? activeTasks : completedTasks
const taskSequence = new Map(visibleTasks.map((task, index) => [task.id, index + 1]))
```

Place the derived arrays after `orderedTasks` is defined. Remove the old `taskSequence` derived from all tasks.

- [ ] **Step 2: Render adjacent accessible view buttons**

Replace the static task-list heading with a heading group containing two native buttons. Use `aria-pressed` for their selected state and display each derived array's count. Use the exact visible labels:

```tsx
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
```

Keep the task table columns and row content unchanged. Iterate `visibleTasks` instead of `orderedTasks`.

- [ ] **Step 3: Make loading and empty states view-specific**

Keep the current loading state. When the active view is empty and `tasks.length === 0`, show `Chưa có task. Bấm “Tạo task” để tạo công việc đầu tiên.`. When the active view is empty but tasks exist, show `Không còn task chưa hoàn thành.`. When the completed view is empty, show `Chưa có task hoàn thành.`. Keep the existing shared error banner outside the card.

- [ ] **Step 4: Style the view switch**

Add `.task-view-switch` rules near `.task-list-heading` in `src/app/globals.css`. Keep buttons adjacent, provide a distinct selected state, visible keyboard focus, and compact count chips. Add dark theme overrides alongside existing dark-mode task list styles. Avoid changing the task table or page layout.

```css
.task-view-switch { display: flex; flex-wrap: wrap; gap: 6px; }
.task-view-switch button { min-height: 32px; display: inline-flex; align-items: center; gap: 7px; padding: 0 10px; border: 1px solid #d9e3f2; border-radius: 7px; color: #4b5563; background: #fff; font-size: 12px; font-weight: 600; }
.task-view-switch button[aria-pressed="true"] { border-color: #cdddf9; color: #1f3a93; background: #f5f8ff; }
.task-view-switch button span { min-width: 20px; padding: 2px 6px; border-radius: 999px; color: #64748b; background: #f0f3f8; font-size: 10px; text-align: center; }
.task-view-switch button[aria-pressed="true"] span { color: #1f3a93; background: #e4edff; }
.task-view-switch button:focus-visible { outline: 2px solid #2f80ed; outline-offset: 2px; }
```

- [ ] **Step 5: Run build and whitespace checks**

Run: `npm run build && git diff --check`

Expected: Next.js production build and TypeScript check succeed; `git diff --check` reports no whitespace errors.

- [ ] **Step 6: Verify automatic movement**

Check the source and UI behavior: active count equals all non-`done` tasks; completed count equals `done` tasks; selecting `Hoàn thành` via a row dropdown moves the task out of the active view and increments the completed count; changing it to any non-`done` status returns it to active. Verify both empty messages and that task edit/delete actions remain in each view.
