# Delivery Records Management System

A comprehensive web application for tracking and managing daily delivery operations, vehicle usage, expenses, and invoice generation for courier and logistics companies.

**Tech Stack:** SvelteKit + TypeScript + SQLite (better-sqlite3) + Vite

---

## 🚀 Features

- ✅ **Daily Record Management** - Track deliveries, collections, returns, and expenses
- ✅ **Invoice Generation** - Automated PDF invoices with VAT calculations
- ✅ **Analytics Dashboard** - Monthly overview with charts and statistics
- ✅ **Vehicle Tracking** - Odometer readings and daily distance calculations
- ✅ **Revenue Analysis** - VAT and profit tracking
- ✅ **Multi-Image Support** - Upload and manage multiple delivery photos
- ✅ **Year/Month Filtering** - Easy data navigation across all pages

---

## 📋 Quick Start

### Prerequisites

- Node.js 18+ (20+ recommended)
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd delivery-records

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open browser at http://localhost:5173
```

### Available Scripts

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm check            # Run svelte-check (type checking)
pnpm lint             # Run ESLint and Prettier checks
pnpm format           # Format code with Prettier
```

---

## 📚 Documentation

- **[DOCS.md](./DOCS.md)** - Complete architecture documentation, design decisions, API routes, data flow patterns
- **[TODO.md](./TODO.md)** - Feature roadmap, completed tasks, and known issues
- **[CLAUDE.md](./CLAUDE.md)** - Project overview, business domain, and development workflow
- **[.github/copilot-instructions.md](./.github/copilot-instructions.md)** - Coding conventions and quick reference

---

## 🗄️ Database

**Database:** SQLite (`database.db` in project root)

**Tables:**
- `records` - Main delivery records
- `vehicle_usage_log` - Vehicle usage tracking

**Migrations:** Auto-applied on server start via `RecordService.migrateExistingRecords()`

---

## 📁 Project Structure

```
src/
  lib/
    db.server.ts              # Database service layer
    utils.ts                  # Shared utilities & calculations
    invoice.server.ts         # Invoice generation logic
    pdfGenerator.ts           # PDF HTML generation
    components/               # Reusable Svelte components
  routes/
    +page.svelte              # Homepage dashboard
    records/                  # CRUD operations
    analytics/                # Data analytics
    odometer/                 # Vehicle tracking
    invoice/                  # Invoice generator
    revenue-returns/          # Revenue analysis
    api/                      # REST API endpoints
static/
  images/                     # Uploaded delivery photos
```

---

## 🔑 Key Concepts

### Vehicle Usage Modes

1. **Standard** - Normal operation (uses odometer reading)
2. **No Used** - Vehicle not used (manual distance = 0)
3. **Other** - Special usage (requires purpose description)

### Pricing Model

- **Deliveries:** €4 per parcel + 23% VAT
- **Collections:** €1 per parcel + 23% VAT
- **Expenses:** Tracked with VAT-inclusive and VAT-exclusive amounts

### Image Storage

- Format: DD-MM-YYYY_<random>.avif
- Location: `static/images/YYYY/Mon/`
- Multiple images per record (JSON array)

---

## 🛠️ Development

### Code Quality

- **TypeScript** for type safety
- **ESLint + Prettier** for code formatting
- **Svelte 5 Runes** for reactive state management
- **Server-only modules** use `.server.ts` suffix

### Testing Locally

```bash
# Type checking
pnpm check

# Linting
pnpm lint

# Format code
pnpm format
```

---

## 🚢 Deployment

Currently configured with `adapter-auto`. Change to a specific adapter when deploying:

```bash
pnpm add -D @sveltejs/adapter-node    # For Node.js
pnpm add -D @sveltejs/adapter-static  # For static hosting
pnpm add -D @sveltejs/adapter-vercel  # For Vercel
```

Update `svelte.config.js` accordingly.

---

## 📝 License

[Add your license information here]

---

## 🤝 Contributing

[Add contribution guidelines here]

---

**Last Updated:** 26 October 2025  
**Current Branch:** 21-refactor-edit-record (merged to main as branch 22)

