# Task Timeline edit and expand design

## Goal

Make every task row easy to inspect and edit, while preserving multiline task descriptions in the timeline.

## User experience

- Every task row shows an icon-only expand control. Activating it opens the existing full-text preview with the task title and complete description, including line breaks.
- The task actions use a pencil icon to open the existing full task editor. Give the icon an accessible name and tooltip identifying the task. Keep task status editable through its existing separate dropdown.
- Description text wraps within its table cell and preserves user-entered line breaks, whether the text is short or truncated for preview.

## Implementation boundaries

Reuse the current task preview modal, inline edit form, task draft state, and Supabase update flow. Do not introduce a new modal, schema, or separate update flow. Keep existing uncommitted changes in `src/app/task-timeline/page.tsx` and `src/app/globals.css`, integrating with them rather than replacing them.

The edit form must continue to support the task title, description, start date, deadline, priority, assignees, output, links, notes, feedback, and blocker fields. A successful save updates the row locally; failures remain visible through the existing error UI.

## Verification

- Run the repository build and TypeScript check.
- Review the task timeline diff to confirm there is one icon-only expand action per row, an accessible edit action, and multiline wrapping remains enabled.
- Verify that status changes remain independent from editing task details.
