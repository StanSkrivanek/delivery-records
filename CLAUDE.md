# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a delivery records management application built with SvelteKit and TypeScript. It tracks daily delivery records including items loaded, collected, returned, and expenses. The app uses SQLite database with better-sqlite3 for data persistence and includes image upload functionality for delivery receipts.

## Development Commands

### Package Manager
This project uses `pnpm` as the package manager (see pnpm configuration in package.json).

### Core Commands
- `pnpm run dev` - Start development server
- `pnpm run build` - Build production version  
- `pnpm run preview` - Preview production build
- `pnpm run check` - Run svelte-check for TypeScript validation
- `pnpm run check:watch` - Run svelte-check in watch mode
- `pnpm run lint` - Run ESLint and Prettier checks
- `pnpm run format` - Format code with Prettier

### Code Quality
Always run `pnpm run lint` and `pnpm run check` before committing changes to ensure code quality and type safety.

## Architecture

### Database Layer (`src/lib/db.server.ts`)
- Uses better-sqlite3 for SQLite database operations
- `RecordService` class provides all database operations (CRUD, migrations, analytics queries)
- Automatic schema migrations on startup
- Records table schema includes: loaded, collected, cutters, returned, missplaced, expense, image_path, entry_date

### Routes Structure
- `/` - Homepage with dashboard overview (loads all records + current month analytics)
- `/records` - Full records management page
- `/analytics` - Analytics and reporting with date filtering
- `/api/records` - REST API endpoints for record operations

### Key Components (`src/lib/components/`)
- `Navigation.svelte` - Main navigation
- `FormData.svelte` - Record creation/editing form
- `ImageUpload.svelte` - Image upload handling
- `OverviewCards.svelte` - Dashboard summary cards  
- `OverviewTable.svelte` - Records table display
- `charts/` - Chart components for analytics visualization

### Utilities (`src/lib/utils.ts`)
- Image file management functions (createImagePath, saveImageFile, deleteImageFile)
- Analytics calculation functions with pricing constants (PPU_DELIVERY=4, PPU_COLLECTION=1, TAX_RATE=0.23)
- Date formatting and currency formatting helpers
- Record aggregation and calculation functions

### Image Storage
- Images stored in `static/images/YYYY/MMM/` directory structure
- Automatic directory creation on upload
- Unique timestamp-based filenames

## Development Notes

### Database
- SQLite database file: `database.db` in project root
- Schema auto-migrates on application startup via `RecordService.migrateExistingRecords()`
- Better-sqlite3 requires native compilation (configured in pnpm.onlyBuiltDependencies)

### Current Development Focus
Based on TODO.md, active development areas include:
- Homepage dashboard implementation (statistics cards, charts, recent records)
- Image optimization on upload
- Export functionality (PDF invoices, CSV exports)
- Date picker improvements
- Performance optimizations for large datasets

### Data Flow
1. Records created via FormData component or API endpoints
2. Stored in SQLite via RecordService methods
3. Retrieved and filtered for display in various route pages
4. Analytics calculated using utility functions for financial reporting

### Pricing Model
The application uses a specific pricing structure:
- €4 per delivered item + 23% tax
- €1 per collected item + 23% tax
- Expense tracking for profitability calculations