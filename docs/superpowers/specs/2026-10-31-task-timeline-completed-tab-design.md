# Task Timeline completed tab design

## Goal

Separate completed tasks from unfinished work while keeping the existing task data and status workflow.

## User experience and behavior

- Add two adjacent view buttons to the task list card: “Danh sách task” and “Đã hoàn thành”.
- Show a count for each view.
- “Danh sách task” shows every task whose status is not `done`; “Đã hoàn thành” shows tasks whose status is `done`.
- Changing a task's existing status dropdown to `done` moves the row to the completed view. Changing it back to any other existing status returns it to the unfinished view.
- Keep the existing table, edit form, delete action, and status options; show a view-specific empty message when the chosen list has no rows.

## Implementation boundaries

Filter the already-loaded task state in `src/app/task-timeline/page.tsx`; do not add a database column, duplicate records, or change Supabase status updates. Add minimal accessible selected-state styling in `src/app/globals.css` and keep the wide table as a single view rather than splitting it into side-by-side tables.

## Verification

- Run the repository production build and TypeScript check.
- Check that the view counts derive from task status and the displayed rows match the selected view.
- Verify that status changes automatically move tasks in both directions and the list empty state remains clear.
