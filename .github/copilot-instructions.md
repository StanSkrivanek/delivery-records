# AI coding guide for this repo

Use these repo-specific notes to move fast. Prefer concrete patterns found here over generic advice.

## Stack & workflows

- SvelteKit + TypeScript, Vite, ESLint/Prettier. DB: SQLite via better-sqlite3 (native).
- Package manager: pnpm. Scripts: pnpm dev | pnpm build | pnpm preview | pnpm check (svelte-check) | pnpm lint (prettier+eslint) | pnpm format.
- Svelte inspector enabled (see svelte.config.js); toggle with meta-shift or use the UI button.

## Data model & server layer

- DB file: database.db at repo root. Schema created/evolved on module load in src/lib/db.server.ts.
- Tables: records(id, loaded, collected, cutters, returned, missplaced, expense, odometer, image_path, note, entry_date, created_at) and vehicle_usage_log(entry_date, usage_mode 'standard'|'no_used'|'other', odometer_end, distance_manual, purpose, comment, record_id).
- RecordService in src/lib/db.server.ts is the single source of truth: CRUD, date-range queries, odometer analytics, migrations. Call it only from server code.
- Startup migration: migrateExistingRecords() adds missing columns/tables; no external migration tool.

## Routes, APIs, and forms

- Records page: src/routes/records/+page.server.ts loads via RecordService; actions.create parses multipart form, validates numbers (non-negative) and dates (not future), saves image, creates record, then creates vehicle_usage_log with record_id.
- Record APIs: PUT /api/records/[id] updates record, handles image replace/delete, then re-creates vehicle_usage_log; DELETE /api/records/[id] removes record, image, and related usage logs; GET /api/records/[id]/full returns joined record + usage.
- Odometer API: GET /api/odometer?year=&month= returns readings + stats from RecordService.getOdometerDifferencesByMonth / getOdometerStatsByMonth.
- Vehicle usage API: GET /api/vehicle-usage/[date] returns usage log for a date or null.
- Invoice API: GET /api/invoice?year=&month=&format=html|json returns invoice data or HTML; POST /api/invoice accepts { year, month, companyInfo?, invoiceReceiver? } and returns HTML (attachment). See src/lib/invoice.server.ts and src/lib/pdfGenerator.ts.

## Files, images, and dates

- Images live under static/images/YYYY/Mon/<timestamp>.<ext>. Use src/lib/utils.ts: createImagePath(file), saveImageFile(file, relativePath), deleteImageFile(relativePath). Keep paths relative to static/.
- Business logic uses entry_date (YYYY-MM-DD). created_at is a fallback for legacy rows.
- Vehicle usage: if usage_mode === 'standard' use odometer_end; otherwise use distance_manual (+ optional purpose); comment can mirror record.note.

## Analytics & helpers

- Pricing constants (src/lib/utils.ts): PPU_DELIVERY=4, PPU_COLLECTION=1, TAX_RATE=0.23. Helpers: calculateAnalytics, calculateRecordTotals, currency/number formatters.
- Odometer: prefer DB-backed helpers in RecordService for cross-month correctness; client utils also expose calculateDailyDistances et al for UI-only use.
- PDF/Invoice: generateInvoiceHTML(data, companyInfo?, invoiceReceiver?, options?) in src/lib/pdfGenerator.ts.

## Conventions & gotchas

- Server-only modules (fs, path, better-sqlite3) must stay in .server.ts files or server endpoints; never import them in client components.
- When replacing images, delete the old file (see /api/records/[id]/+server.ts).
- RecordService.getAvailableYearsAndMonths() is intentionally unimplemented; UIs derive filters from existing records.
- Lint/typecheck before commits: pnpm lint and pnpm check. ESLint wired via eslint.config.js.

## Status

- Analytics page is implemented (see src/routes/analytics/+page.server.ts and +page.svelte) using RecordService + utils.
- Adapter is auto; set a specific adapter when deploying if needed.

References: src/lib/db.server.ts, src/lib/utils.ts, src/lib/types.ts, src/lib/invoice.server.ts, src/lib/pdfGenerator.ts, src/routes/\*\*, CLAUDE.md.
