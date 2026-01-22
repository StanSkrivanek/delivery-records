# Delivery Records Management System

A comprehensive web application for tracking and managing daily delivery operations, vehicle usage, expenses, and invoice generation for courier and logistics sole traders.

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

- **Deliveries:** €X per parcel + 23% VAT
- **Collections:** €X per parcel + 23% VAT
- **Expenses:** Tracked with VAT-inclusive and VAT-exclusive amounts

### Image Storage

- Format: DD-MM-YYYY\_<random>.webp
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


Hi [Name],

I would like to discuss the current structure and rate of my rural route, as the workload has reached a level that is no longer sustainable or compliant in its current form.

The route is currently averaging 94 parcels per day (approximately 80–90 stops) and, due to the rural geography, depot loading requirements, and travel distances, this consistently results in 12–13 hour working days. While the parcel volume is strong, the time and distance involved mean this route is not comparable to an urban 90+ drop route.

To continue operating the route safely, reliably, and in line with reasonable working hours — particularly with further volume increases expected — the route realistically needs to be split across two drivers. However, at the current rate of €4.00 per parcel (ex. VAT), splitting the route becomes economically unviable once fuel and labour costs are taken into account.

To be transparent with the numbers:
- 94 parcels at €4.00 = €376 per day
- Fuel for two routes ≈ €100 per day
- This leaves approximately €138 per driver per day before any margin, which is below sustainable market rates for rural delivery work

I also understand that other subcontractors within the depot are operating on higher per-parcel rates. In that context, I believe the current rate on this route no longer reflects the workload, hours involved, or the requirement to restructure the route properly.

To allow the route to be split and operated safely while maintaining service levels, I would like to propose a revised rural rate of €4.75–€5.00 per parcel for this route.

I am very open to:
- A trial period at an adjusted rate
- Reviewing performance once the route is split
- Agreeing clear expectations on delivery standards and consistency

My aim is to keep the route stable, compliant, and professionally staffed over the long term.

Please let me know a suitable time to discuss this further.

Kind regards,  
Stan Skrivanek  
Cork