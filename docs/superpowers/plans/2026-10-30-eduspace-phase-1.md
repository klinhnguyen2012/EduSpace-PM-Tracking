# EduSpace Phase 1 Implementation Plan

> **For agentic workers:** Execute this plan task by task with review checkpoints.

**Goal:** Create the EduSpace V1 frontend foundation with real Supabase Auth wiring and a clear first-time setup path.

**Architecture:** A compact Vite React TypeScript app uses Tailwind for styling and the Supabase JavaScript client for email/password authentication. `App.tsx` owns session and navigation state; a small Supabase module handles optional configuration; UI components display the shell and auth states. No product data features are included in this phase.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, Lucide React, Supabase JavaScript Client.

## Global Constraints

- Implement Phase 1 only and check this phase before starting later phases.
- Use Vietnamese for user-facing interface text; retain common technical terms where useful.
- Keep dependencies and abstractions minimal.
- Do not include secrets in frontend source or commit `.env.local`.
- Do not fabricate an authenticated state when Supabase is unconfigured.
- Sidebar navigation has exactly Dashboard, Task Timeline, and Bug Tracker.
- Do not add test suites or run tests; use the production build and a concise manual browser checklist for verification.

---

## File Map

- `package.json`, `package-lock.json`: frontend scripts and minimal runtime/development dependencies.
- `index.html`, `vite.config.ts`, `tsconfig*.json`, `postcss.config.js`, `tailwind.config.js`: Vite, TypeScript, and Tailwind setup.
- `.gitignore`: exclude local env files, dependencies, build output, and local tooling artifacts.
- `.env.example`: safe placeholders for `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, with legacy anon-key compatibility documented.
- `src/main.tsx`: React entry point.
- `src/App.tsx`: session restore, auth event subscription, auth form actions, and three-item navigation shell.
- `src/index.css`: Tailwind directives and compact global styles.
- `src/lib/supabase.ts`: optional Supabase client factory and configuration status.
- `src/types/index.ts`: only shared auth/navigation types needed by the UI.
- `src/components/AuthPanel.tsx`: sign-in and sign-up form, errors, and loading state.
- `src/components/Sidebar.tsx`: responsive sidebar navigation.
- `src/components/SetupNotice.tsx`: actionable missing-configuration message.
- `docs/supabase-setup.md`: beginner checklist to create a Supabase project and connect local credentials.

### Task 1: Scaffold the required frontend stack

**Files:** Create the Vite, React, TypeScript, Tailwind, and gitignore files listed in the file map. Add only the required dependencies.

- [x] Initialize a Vite React TypeScript app in the repository root.
- [x] Configure Tailwind CSS and Lucide React.
- [x] Add `.env.local` and `.env` patterns to `.gitignore`; verify no `.venv/`, `.env*` secrets, or generated output is staged.
- [x] Confirm the package scripts include `dev` and `build`.

### Task 2: Build the Vietnamese app shell

**Files:** `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/components/Sidebar.tsx`, `src/components/SetupNotice.tsx`.

- [x] Render a desktop-first, tablet-responsive navy/teal shell with exactly three sidebar destinations.
- [x] Keep placeholder pages honest: “Sẽ triển khai ở phase sau”.
- [x] Show the missing-Supabase setup state when credentials are absent.

### Task 3: Connect Supabase Auth

**Files:** `.env.example`, `src/lib/supabase.ts`, `src/App.tsx`, `src/components/AuthPanel.tsx`, `src/types/index.ts`.

- [x] Read `VITE_SUPABASE_URL` and either the current publishable key or legacy anon key from Vite environment variables.
- [x] Create the Supabase client only when both values exist and are non-empty.
- [x] Restore the persisted session with `getSession` and subscribe to auth changes; unsubscribe on unmount.
- [x] Support email/password sign-in, sign-up, and sign-out with clear Vietnamese loading and error messages.
- [x] Keep app data access and RLS outside this phase.

### Task 4: Document first-time Supabase setup and verify the phase

**Files:** `docs/supabase-setup.md`, `.env.example`, all frontend files from earlier tasks.

- [x] Write a beginner checklist: create a Supabase project, find Project URL and anon/publishable key, create a test user, copy `.env.example` to `.env.local`, add both values, restart Vite, and sign in.
- [x] Explain email confirmation may be enabled, and explicitly warn never to expose or use the `service_role` key in frontend configuration.
- [x] Run the production build and inspect its exit status.
- [ ] Browser visual inspection could not run: no browser/DevTools provider is configured in this session. Local dev server returned HTTP 200. Real sign-in still requires the user's Supabase credentials.
- [x] Review the final Git diff for scope and secrets.
