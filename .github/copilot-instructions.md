# AI coding guide for this repo

Use these project-specific notes to be productive immediately. Favor concrete patterns from the code over generic advice.

## Stack & workflows

- SvelteKit + TypeScript, Vite, ESLint/Prettier. SQLite via better-sqlite3 (native module).
- Package manager: pnpm. Key scripts (see package.json):
  - pnpm dev | pnpm build | pnpm preview
  - pnpm check (svelte-check) | pnpm lint (prettier+eslint) | pnpm format
- Inspector: Svelte inspector enabled (svelte.config.js) with meta-shift hold toggle; UI button always visible top-right.

## Data model and server layer

- Database file: database.db in repo root. Schema initialized and evolved at module load in src/lib/db.server.ts.
- Tables:
  - records: id, loaded, collected, cutters, returned, missplaced, expense, odometer, image_path, note, entry_date, created_at
  - vehicle_usage_log: per-day usage metadata with usage_mode ENUM ('standard' | 'no_used' | 'other') and optional record_id
- RecordService (src/lib/db.server.ts) is the single source of truth for all DB ops: CRUD, date-range queries, odometer analytics, and migrations. Call its static methods from routes/APIs.
- Migrations: migrateExistingRecords() adds missing columns/tables at startup. No external migration tool.

## Routing patterns

- Page server loads (+page.server.ts) fetch via RecordService; example: records/+page.server.ts returns records and year/month filters.
- Form actions: records/+page.server.ts actions.create parses multipart form, validates numeric/date inputs, saves image, creates record, then creates matching vehicle_usage_log.
- API endpoints (+server.ts):
  - PUT /api/records/[id]: update record; replace/delete image; re-create vehicle_usage_log for that record.
  - DELETE /api/records/[id]: delete record; delete image; delete vehicle usage logs.
  - GET /api/records/[id]/full: joined record + vehicle usage.
  - GET /api/odometer?year=&month=: monthly odometer readings and stats.
  - GET /api/vehicle-usage/[date]: usage log for a date or null.

## Files, images, and dates

- Images live under static/images/YYYY/Mon/<timestamp>.<ext> and are web-served. Utilities in src/lib/utils.ts:
  - createImagePath(file), saveImageFile(file, relativePath), deleteImageFile(relativePath)
- Always use entry_date (YYYY-MM-DD) for business logic; created_at is fallback for legacy rows.
- When usage_mode === 'standard', use odometer_end; otherwise use distance_manual and optional purpose.

## Analytics & helpers

- Pricing constants in src/lib/utils.ts: PPU_DELIVERY=4, PPU_COLLECTION=1, TAX_RATE=0.23. Helpers: calculateAnalytics, calculateRecordTotals, currency/number formatters, odometer helpers (calculateDailyDistances etc.).
- Odometer SQL in RecordService handles cross-month boundaries (window functions + LAG). Prefer getOdometerDifferencesByMonth and getOdometerStatsByMonth.

## Conventions and gotchas

- Server-only code (fs, path, better-sqlite3) belongs in .server.ts files or server endpoints. Do not import server modules into client components.
- Image replacement must delete the old file (see /api/records/[id]/+server.ts). Keep paths relative to static/.
- RecordService.getAvailableYearsAndMonths() is intentionally unimplemented; current UIs derive filters from existing records.
- ESLint is configured via eslint.config.js (no-undef off for TS); run pnpm lint and pnpm check before commits.

## Extending the app (examples)

- New DB query: add a static method to RecordService; call it from a +page.server.ts load.
- New API: add src/routes/api/<name>/+server.ts; use json() and error() from @sveltejs/kit; reuse utils for files/dates.
- New form flow: parse request.formData() in an action, validate numbers non-negative and dates not in the future (see records/+page.server.ts), then persist.

## WIP / status

- src/routes/analytics/+page.server.ts is a stub—wire it to RecordService analytics as needed.
- Adapter is auto; set a specific adapter for deployment if required.

References: src/lib/db.server.ts, src/lib/utils.ts, src/lib/types.ts, src/routes/\*\*, CLAUDE.md.
