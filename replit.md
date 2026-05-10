# Scratchpad PRO

A notes + calculator + drawing app with Supabase auth and real-time sync. Users sign in with email or Google, create scratchpad notes that support inline math calculations, freehand drawing, and export.

## Run & Operate

- `pnpm --filter @workspace/scratchpad run dev` — run the frontend (via workflow)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- Required secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — Supabase project credentials

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite 7, Tailwind CSS v4
- Backend auth/DB: Supabase (external)
- API: Express 5 (api-server artifact, for future use)
- Animation: motion/react
- Build: Vite

## Where things live

- `artifacts/scratchpad/` — main frontend app (react-vite artifact, preview at `/`)
- `artifacts/scratchpad/src/App.tsx` — root app, auth flow, note management
- `artifacts/scratchpad/src/components/Calculator.tsx` — main scratchpad editor with math evaluation
- `artifacts/scratchpad/src/components/Calculator/` — Editor, VirtualKeyboard, Key, ProgrammableKeys
- `artifacts/scratchpad/src/contexts/ThemeContext.tsx` — theme system (multiple color themes)
- `artifacts/scratchpad/src/contexts/HistoryContext.tsx` — calculation history
- `artifacts/scratchpad/src/lib/supabase.ts` — Supabase client
- `artifacts/scratchpad/src/lib/math.ts` — inline math evaluation engine
- `artifacts/api-server/` — Express API server (for future backend features)

## Architecture decisions

- Uses Supabase directly from the frontend for auth and data (no custom backend needed)
- Real-time note sync via Supabase `postgres_changes` subscription
- Math evaluation is done client-side in `lib/math.ts`
- Google OAuth redirect uses `window.location.origin` to work across environments
- Supabase client falls back to placeholder values so the app renders even without secrets (shows login screen with clear error if credentials are wrong)

## Product

Scratchpad PRO lets users create personal scratchpad notes that combine freeform text, inline math calculations (auto-evaluated line by line), and freehand drawing. Notes are synced to Supabase in real-time across sessions. Multiple visual themes, export to PDF, calculation history, and virtual keyboard support.

## User preferences

- Migrated from Vercel/v0 — preserve original app look and behavior exactly

## Gotchas

- The frontend artifact is at preview path `/` — always at the root
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must be set as Replit secrets for auth to work
- Google OAuth redirect URL in Supabase dashboard must include the Replit domain (found in `$REPLIT_DOMAINS`)
- Tailwind v4: `@import url(...)` must come BEFORE `@import "tailwindcss"` in CSS files
- Do NOT run `pnpm dev` at workspace root — use workflows or `pnpm --filter`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
