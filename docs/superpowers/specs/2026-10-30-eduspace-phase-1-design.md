# EduSpace PM Dashboard — Phase 1 Design

## Scope

Build only the V1 foundation: a React, TypeScript, Vite, and Tailwind application shell; Vietnamese navigation for Dashboard, Task Timeline, and Bug Tracker; Supabase client configuration; and Supabase Auth sign-in/sign-out with clear loading, signed-out, signed-in, and missing-configuration states. Do not build task, dashboard, AI, or bug workflows in this phase.

## Architecture

Keep the app small: `App.tsx` owns auth/session state and the three-item shell, `lib/supabase.ts` creates a client only when the required public URL and anon key are present, and focused components render authentication and navigation. `.env.example` documents `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; a real `.env` remains local and ignored by Git. Supabase Auth owns identity; application data and RLS policies are deferred to a later approved phase.

When credentials are absent, show an explicit Vietnamese setup state and never present a fake successful login. When configured, use Supabase email/password authentication, restore the persisted session, and provide sign-out. The three navigation destinations may show honest “sẽ triển khai ở phase sau” placeholders.

## Setup checklist

Provide a thread-friendly checklist and a committed `docs/supabase-setup.md` explaining how to create a Supabase project, find its Project URL and anon/publishable key, copy `.env.example` to `.env.local`, fill the two values, start the app, and create a test user through Supabase Auth. Never request or commit the service-role key. Explain that signup may require email confirmation depending on the project's Auth settings.

## Acceptance

- App starts with the specified frontend stack and no prohibited UI/chart/state/Gantt/AI libraries.
- Missing Supabase configuration is visible and actionable; there is no mock auth.
- Configured users can sign in, retain a session across reload, and sign out.
- `.env.example` contains names and safe placeholders only; local env files are ignored.
- The sidebar contains exactly the three V1 destinations.
- Documentation gives a first-time Supabase setup checklist.

## Out of scope

Task CRUD/schema, RLS for task and bug data, AI Edge Function, dashboard metrics/charts, Bug Tracker, and timeline interactions. These remain subsequent phases and require checking the previous phase before proceeding.
