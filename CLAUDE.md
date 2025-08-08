# CLAUDE.md

Canonical AI guide: see .github/copilot-instructions.md. This file is a short pointer to avoid drift.

Quick-start for Claude Code

- Use pnpm: pnpm dev | pnpm build | pnpm preview | pnpm check | pnpm lint | pnpm format.
- All DB access goes through RecordService in src/lib/db.server.ts (runs migrations at module load). Do not import server modules in client components.
- Images live under static/images/YYYY/Mon/<timestamp>.<ext>. Use createImagePath, saveImageFile, deleteImageFile from src/lib/utils.ts.
- Business dates use entry_date (YYYY-MM-DD). For vehicle usage: usage_mode 'standard' uses odometer_end; others use distance_manual (+ optional purpose).
- API patterns to follow: PUT/DELETE /api/records/[id], GET /api/records/[id]/full, GET /api/odometer?year=&month=, GET /api/vehicle-usage/[date].

If guidance ever diverges, prefer .github/copilot-instructions.md.

References

- .github/copilot-instructions.md (canonical)
- src/lib/db.server.ts, src/lib/utils.ts, src/lib/types.ts
- src/routes/\*\*

Last synced: 2025-08-08
