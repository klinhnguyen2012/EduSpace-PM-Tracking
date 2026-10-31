# Bug Tracker Team PIC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace profile-based Bug Tracker PIC options with the same four shared team names used in Task Timeline, and persist the selected names without deleting historical UUID assignments.

**Architecture:** Add an additive Supabase migration for `bugs.pic_names`, backfill only UUIDs whose profile display names match the shared team list, and leave `pic_ids` unchanged. Update the typed Bug Tracker data flow to read/write `pic_names` and use the shared `teamMemberNames` list in the existing multi-select picker.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase PostgreSQL, CSS.

## Global Constraints

- The create/edit bug form shows the shared `teamMemberNames` as multi-select checkboxes using the existing team picker styling.
- Bug records store selected team member names in a new `pic_names` text-array column.
- The bug list displays names from `pic_names`, matching Task Timeline's team names and selection model.
- Existing `pic_ids` UUID data is retained.
- A migration backfills `pic_names` only for profile display names that match the shared team list; it does not guess replacements for other profile IDs.
- Keep existing bug creation/editing, image handling, status updates, and errors unchanged.

---

## File map

- Create `supabase/migrations/20261031190000_bug_pic_names.sql` to add `pic_names` and backfill recognized team profile names, preserving UUID order and leaving legacy IDs intact.
- Modify `src/types.ts` to represent `Bug.pic_names` and optional bug insert `pic_names`.
- Modify `src/app/bug-tracker/page.tsx` to use the shared names for choices and table labels, storing names in `draft.pic_names`.
- Do not add a test framework; this repository has no discovered test files or test script. Validate with `npm run build`, `git diff --check`, migration inspection, and a focused UI checklist.

### Task 1: Add a backward-compatible team PIC column

**Files:**
- Create: `supabase/migrations/20261031190000_bug_pic_names.sql`

**Interfaces:**
- Consumes: `public.bugs.pic_ids uuid[]`, `public.profiles.id`, and `public.profiles.display_name`.
- Produces: `public.bugs.pic_names text[] NOT NULL DEFAULT '{}'`, with matched team profiles backfilled in their prior PIC order.

- [ ] **Step 1: Add the additive column**

```sql
alter table public.bugs
  add column if not exists pic_names text[] not null default '{}';
```

- [ ] **Step 2: Backfill only recognized team display names**

Use an `unnest(... WITH ORDINALITY)` subquery so the existing PIC ordering is preserved. Keep all `pic_ids` values unchanged. Restrict backfill to empty `pic_names` rows and the exact team names `Khoa`, `Chiến`, `Trân`, `Linh`.

```sql
update public.bugs as bug
set pic_names = coalesce((
  select array_agg(profile.display_name order by assigned_pic.ordinality)
  from unnest(bug.pic_ids) with ordinality as assigned_pic(id, ordinality)
  join public.profiles as profile on profile.id = assigned_pic.id
  where profile.display_name = any(array['Khoa', 'Chiến', 'Trân', 'Linh']::text[])
), '{}'::text[])
where cardinality(bug.pic_ids) > 0
  and cardinality(bug.pic_names) = 0;
```

- [ ] **Step 3: Review migration safety**

Run: `git diff --check`

Expected: No whitespace errors. Review confirms no `DELETE`, `DROP`, or update of `pic_ids` exists; unrecognized UUID values remain in the legacy column.

### Task 2: Wire Bug Tracker to shared team names

**Files:**
- Modify: `src/types.ts`
- Modify: `src/app/bug-tracker/page.tsx`

**Interfaces:**
- Consumes: `teamMemberNames` from `src/lib/task-colors.ts`.
- Produces: Bug records and drafts with `pic_names: string[]`, used consistently by the selector, save payload, and PIC tags in the bug table.

- [ ] **Step 1: Update the shared Supabase types**

Add `pic_names: string[]` to the exported `Bug` type and `pic_names?: string[]` to the insert type for the `bugs` table. Keep `pic_ids` in both types.

```ts
export type Bug = {
  // existing properties
  pic_ids: string[]
  pic_names: string[]
  // existing properties
}
```

- [ ] **Step 2: Change the Bug Tracker draft and shared selector**

Import `teamMemberNames` from `../../lib/task-colors`. Replace `BugDraft`'s selected PIC field with `pic_names`; initialize it to `[]`. Remove the `TeamMember` type/state and `profiles` fetch because this form will no longer use registered profiles. The bug query must select `pic_names`, and loaded rows must normalize a nullable value to `[]`.

Render the same checkbox structure as Task Timeline, using each team name as the checkbox value/key and `draft.pic_names.includes(name)` for checked state. Toggle by name while preserving current multi-select behavior:

```tsx
function togglePic(memberName: string) {
  setDraft((current) => ({
    ...current,
    pic_names: current.pic_names.includes(memberName)
      ? current.pic_names.filter((name) => name !== memberName)
      : [...current.pic_names, memberName],
  }))
}
```

- [ ] **Step 3: Save, edit, and display PIC names**

Initialize `pic_names` from `bug.pic_names ?? []` in `openEditModal`. Include `pic_names: draft.pic_names` in the existing insert/update payload. Render each row's PIC tags from `bug.pic_names`; show the existing em dash empty-state marker when the array is empty. Do not change image handling, bug status, notes, or test-result fields.

- [ ] **Step 4: Run build and type validation**

Run: `npm run build`

Expected: Next.js production build and `tsc --noEmit` succeed. Resolve only errors caused by the new PIC name field.

- [ ] **Step 5: Review the implementation diff**

Run: `git diff --check && git diff --stat`

Expected: Only the migration, Bug type, and Bug Tracker PIC data/UI flow are changed.

### Task 3: Verify PIC selection behavior

**Files:**
- Verify: `supabase/migrations/20261031190000_bug_pic_names.sql`
- Verify: `src/types.ts`
- Verify: `src/app/bug-tracker/page.tsx`

**Interfaces:**
- Consumes: The migration and Bug Tracker changes from Tasks 1 and 2.
- Produces: Verified shared PIC options, name persistence, and legacy UUID preservation.

- [ ] **Step 1: Verify the selector choices**

In the Bug Tracker create and edit forms, confirm the visible options are exactly `Khoa`, `Chiến`, `Trân`, and `Linh`, using the existing checkbox layout. Confirm the form no longer sources options from `profiles`.

- [ ] **Step 2: Verify create/edit/display flow**

Select two team members, save a bug, reopen it, and verify those same names are checked. Confirm the bug table displays those names and an unassigned bug displays `—`.

- [ ] **Step 3: Verify migration data safety**

Confirm the migration's backfill only selects recognized profile display names, preserves their ordering, and never alters or removes the old `pic_ids` values. Record any database application limitation separately from code validation.
