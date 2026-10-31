# Bug Tracker team PIC design

## Goal

Make Bug Tracker PIC selection consistent with Task Timeline by offering the same four team members instead of listing registered profiles such as the generic “demo” account.

## User experience and data flow

- The create/edit bug form shows the shared `teamMemberNames` as multi-select checkboxes using the existing team picker styling.
- Bug records store selected team member names in a new `pic_names` text-array column.
- The bug list displays names from `pic_names`, matching Task Timeline's team names and selection model.
- Existing `pic_ids` UUID data is retained. A migration backfills `pic_names` only for profile display names that match the shared team list; it does not guess replacements for other profile IDs.

## Implementation boundaries

Reuse `teamMemberNames` from `src/lib/task-colors.ts` and the existing Bug Tracker form state/save flow. Add one additive Supabase migration for `pic_names`; do not remove or rewrite `pic_ids`. Remove the profile-list fetch only if no remaining Bug Tracker behavior needs it. Keep existing bug creation/editing, image handling, status updates, and errors unchanged.

## Verification

- Run the repository production build and TypeScript check.
- Check that Bug Tracker's PIC selection source is the same shared list as Task Timeline and that saving/loading uses `pic_names`.
- Inspect the migration to ensure legacy UUID values remain intact and recognized team names are backfilled.
