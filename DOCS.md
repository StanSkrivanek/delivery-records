# Architecture & Implementation Documentation

This document provides detailed technical documentation about the project's architecture, design decisions, and implementation patterns.

---

## 📁 File Structure Analysis

### API Route Architecture: `/api/records/[id]/` Structure

The project has two server files in the records API that serve **different, complementary purposes**:

#### **1. `/api/records/[id]/+server.ts`** (Main CRUD Endpoint)

**Purpose:** Handles mutations and basic operations on individual records

**Methods:**

- `PUT` - Updates a record with full data validation
  - Handles form data parsing (all numeric and text fields)
  - Manages image uploads/replacements/deletions
  - Updates vehicle usage log (deletes old, creates new)
  - Validates non-negative numbers and date formats
- `DELETE` - Removes a record and all associated data
  - Deletes image files (supports both single and multiple images)
  - Removes vehicle usage log entries
  - Cleans up all references

**Key Features:**

- Multi-part form data handling
- Image file management with validation (5MB limit, image types only)
- JSON array support for multiple images
- Comprehensive error handling with proper HTTP status codes
- Transaction-like operations (deletes old usage log before creating new)

#### **2. `/api/records/[id]/full/+server.ts`** (Specialized Read Endpoint)

**Purpose:** Provides enriched data by joining multiple tables

**Methods:**

- `GET` - Fetches complete record with vehicle usage data
  - Calls `RecordService.getRecordWithVehicleUsageById(recordId)`
  - Returns joined data from `records` + `vehicle_usage_log` tables
  - Single, focused responsibility

**Used By:**

- `RecordsList.svelte` when opening the edit modal (line 105)
- Ensures edit form has complete data from both tables

**Why This Design?**

```typescript
// In RecordsList.svelte:
async function openEditModal(record) {
	// Fetches joined data for accurate editing
	const response = await fetch(`/api/records/${record.id}/full`);
	const fullRecord = await response.json();
	// Now has: record data + usage_mode + distance_manual + purpose
}
```

### Design Rationale: Separation of Concerns

**✅ Benefits of This Structure:**

1. **Clear Responsibility**
   - Main endpoint: Mutations (PUT/DELETE)
   - `/full` endpoint: Read-only specialized query
2. **Performance**
   - Don't join tables when not needed
   - Update operations use `getRecordById()` (faster)
   - Edit modal uses `getRecordWithVehicleUsageById()` (complete data)

3. **API Clarity**
   - RESTful design: `/api/records/{id}` for standard CRUD
   - Extended resource: `/api/records/{id}/full` for enriched data
4. **Maintainability**
   - Each file has a single, clear purpose
   - Easy to understand what each endpoint does
   - `/full` can be extended with more joins if needed

5. **Flexibility**
   - Can add other specialized endpoints (e.g., `/summary`, `/history`)
   - Doesn't pollute main CRUD endpoint with query variations

**❌ Why NOT Consolidate?**

- Would mix read and write concerns in one file
- GET method would need query params to control join behavior
- Less clear API semantics
- Main endpoint would become unnecessarily complex

### Conclusion

**Status: ✅ Keep both files as-is**

This is intentional, well-designed architecture following REST principles and separation of concerns. Not redundant code.

---

## 🗄️ Database Architecture

### Tables & Relationships

#### **records** (Main Transaction Table)

```sql
CREATE TABLE records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  loaded INTEGER NOT NULL,           -- Parcels loaded for delivery
  collected INTEGER NOT NULL,         -- Parcels collected from customers
  cutters INTEGER NOT NULL,           -- Parcels returned by customers
  returned INTEGER NOT NULL,          -- Parcels returned to depot
  missplaced INTEGER DEFAULT 0,       -- Lost/missing parcels
  expense REAL DEFAULT 0,             -- Daily expenses (VAT inclusive)
  expense_no_vat REAL DEFAULT 0,     -- Expenses without VAT
  odometer INTEGER DEFAULT 0,         -- End-of-day odometer reading
  image_path TEXT,                    -- JSON array of image paths
  note TEXT,                          -- Daily notes/comments
  entry_date DATE NOT NULL,           -- Business date (YYYY-MM-DD)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

#### **vehicle_usage_log** (Vehicle Tracking)

```sql
CREATE TABLE vehicle_usage_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_date DATE NOT NULL,
  usage_mode TEXT NOT NULL CHECK (usage_mode IN ('standard', 'no_used', 'other')),
  vehicle_id INTEGER DEFAULT 1,
  odometer_end INTEGER,               -- Used when usage_mode = 'standard'
  distance_manual INTEGER DEFAULT 0,   -- Used when usage_mode != 'standard'
  purpose TEXT,                       -- Required when usage_mode = 'other'
  comment TEXT,                       -- Mirrors record.note
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  record_id INTEGER REFERENCES records(id)
)
```

**Index:**

```sql
CREATE INDEX idx_vehicle_usage_log_record_id
ON vehicle_usage_log(record_id);
```

### Data Relationships

**One-to-One:** `records ↔ vehicle_usage_log` (via record_id)

- Each record has zero or one vehicle usage log
- Vehicle usage log is created/updated when record is saved
- Both are deleted together (cascade delete)

### Vehicle Usage Modes

1. **`standard`** - Normal delivery operation
   - Uses `odometer_end` from record
   - `distance_manual` = 0
   - Daily distance calculated from previous day's odometer
2. **`no_used`** - Vehicle not used
   - `odometer_end` = NULL
   - Must specify `distance_manual` (usually 0)
   - No odometer reading taken
3. **`other`** - Special usage
   - `odometer_end` = NULL
   - Must specify `distance_manual`
   - Must provide `purpose` (e.g., "maintenance", "personal use")

### Image Storage

**Format:** JSON array stored in `records.image_path`

```json
["images/2025/Oct/26-10-2025_abc123.avif", "images/2025/Oct/26-10-2025_def456.avif"]
```

**File Naming Convention:** `DD-MM-YYYY_<random>.avif`

**Directory Structure:**

```
static/
  images/
    2025/
      Jan/
      Feb/
      ...
      Oct/
        26-10-2025_v07jj0.avif
        26-10-2025_x8k2p1.avif
```

**Migration:** Legacy timestamps were converted to DD-MM-YYYY format (see `migrate-image-names.js`)

---

## 🔄 Data Flow Patterns

### Record Creation Flow

1. **User submits form** → `routes/records/+page.svelte`
2. **Form action** → `routes/records/+page.server.ts` → `actions.create`
3. **Validation** → Check non-negative numbers, valid date, image types
4. **Image processing** → `createImagePaths()`, `saveImageFile()` for each
5. **Database writes:**

   ```typescript
   // 1. Create record
   const recordId = await RecordService.createRecord({...});

   // 2. Create vehicle usage log with record_id
   await RecordService.createVehicleUsageLog({
     record_id: recordId,
     ...
   });
   ```

6. **Response** → Return success/error to form

### Record Update Flow

1. **User clicks Edit** → `RecordsList.svelte` → `openEditModal()`
2. **Fetch complete data** → `GET /api/records/{id}/full`
   - Returns record + vehicle usage joined
3. **Show modal** → Pre-populate all fields
4. **User submits changes** → `saveEdit()`
5. **API call** → `PUT /api/records/{id}`
6. **Server processing:**

   ```typescript
   // 1. Validate input
   // 2. Handle image changes (replace/keep/delete)
   // 3. Update record
   await RecordService.updateRecord(recordId, {...});

   // 4. Delete old vehicle usage log
   await RecordService.deleteVehicleUsageLogByRecordId(recordId);

   // 5. Create new vehicle usage log
   await RecordService.createVehicleUsageLog({...});
   ```

7. **Refresh UI** → `invalidateAll()` to reload data

### Record Delete Flow

1. **User clicks Delete** → Confirmation modal
2. **Confirm** → `DELETE /api/records/{id}`
3. **Server cleanup:**

   ```typescript
   // 1. Parse image paths (JSON array or single string)
   // 2. Delete all image files from filesystem
   // 3. Delete vehicle usage log entries
   await RecordService.deleteVehicleUsageLogByRecordId(recordId);

   // 4. Delete record
   await RecordService.deleteRecord(recordId);
   ```

4. **Response** → Success/error
5. **UI update** → Remove from list, `invalidateAll()`

---

## 🎨 Component Architecture

### Key Components

#### **FormData.svelte** (Record Creation)

- Form for adding new delivery records
- Handles all input fields with validation
- Uses `ImageUpload.svelte` for multi-image support
- Displays success/error messages (currently doesn't auto-dismiss)
- **Note:** Single `note` field - mirrors to `vehicle_usage_log.comment`

#### **RecordsList.svelte** (Record Display & Management)

- Displays filtered records in a table
- **Edit Modal:** Fetches `/full` endpoint for complete data
- **Delete Modal:** Confirmation dialog before deletion
- **Image Modal:** Gallery view with navigation
- **Note Modal:** Read-only note display
- Uses `Modal.svelte` for all dialogs

#### **ImageUpload.svelte** (Multi-Image Upload)

- Drag-and-drop support
- Multiple file selection
- Preview thumbnails
- Individual image removal
- File type validation (images only)
- Size validation (5MB per file)

#### **Modal.svelte** (Reusable Dialog)

- Generic modal wrapper
- Close on overlay click
- Keyboard support (ESC to close)
- Slot-based content
- Used for: edit, delete, image gallery, notes

#### **BarGroups.svelte** (Data Visualization)

- Multi-series bar chart
- Date-based x-axis with auto-fill for missing dates
- Configurable height and keys
- Used on homepage for delivery trends

### Page Structure

```
routes/
  +layout.svelte              # Global layout with Navigation
  +page.svelte                # Homepage - Monthly dashboard

  records/
    +page.server.ts           # Load records, handle create action
    +page.svelte              # Records list with FormData

  analytics/
    +page.server.ts           # Load all records for filtering
    +page.svelte              # OverviewCards + OverviewTable

  odometer/
    +page.server.ts           # Load odometer readings and stats
    +page.svelte              # Monthly distance tracking

  invoice/
    +page.server.ts           # Load available periods
    +page.svelte              # Invoice generator UI

  revenue-returns/
    +page.server.ts           # Load invoice summaries
    +page.svelte              # VAT and profit calculations

  api/
    invoice/+server.ts        # GET/POST invoice generation
    odometer/+server.ts       # GET odometer data by month
    records/
      +server.ts              # GET all records (unused?)
      [id]/
        +server.ts            # PUT/DELETE individual record
        full/+server.ts       # GET record with vehicle usage
    vehicle-usage/
      [date]/+server.ts       # GET usage log for specific date
```

---

## 💰 Business Logic & Calculations

### Pricing Constants

```typescript
// From lib/utils.ts
const PPU_DELIVERY = 4; // €4 per parcel delivered
const PPU_COLLECTION = 1; // €1 per parcel collected
const TAX_RATE = 0.23; // 23% VAT (Ireland)
```

### Revenue Calculations

**Delivery Revenue:**

```typescript
const deliveredCount = loaded - returned - missplaced;
const deliverySubtotal = deliveredCount * PPU_DELIVERY;
const deliveryVAT = deliverySubtotal * TAX_RATE;
const deliveryTotal = deliverySubtotal + deliveryVAT;
```

**Collection Revenue:**

```typescript
const collectedCount = collected + cutters;
const collectionSubtotal = collectedCount * PPU_COLLECTION;
const collectionVAT = collectionSubtotal * TAX_RATE;
const collectionTotal = collectionSubtotal + collectionVAT;
```

**Grand Total:**

```typescript
const grandTotal = deliveryTotal + collectionTotal;
```

### Analytics Calculations

**Success Rate:**

```typescript
const totalDelivered = loaded - returned - missplaced;
const totalAttempted = totalDelivered + returned;
const successRate = (totalDelivered / totalAttempted) * 100;
```

**Average Per Day:**

```typescript
const workingDays = records.length; // Days with records
const averagePerDay = totalDelivered / workingDays;
```

### Odometer Calculations

**Daily Distance:**

```typescript
const dailyDistance = currentOdometer - previousOdometer;
```

**Monthly Total:**

```typescript
const monthlyDistance = records.reduce((sum, record) => sum + (record.daily_difference || 0), 0);
```

**Average Distance:**

```typescript
const avgDistance = monthlyDistance / workingDays;
```

---

## 🔒 Validation & Security

### Input Validation

**Numeric Fields:**

- Must be non-negative integers
- Default to 0 if not provided
- Validated both client-side and server-side

**Date Validation:**

```typescript
// Must not be in the future
const entryDateObj = new Date(entryDate);
const today = new Date();
today.setHours(23, 59, 59, 999);

if (entryDateObj > today) {
	throw error(400, 'Entry date cannot be in the future');
}
```

**Image Validation:**

- Must be image MIME type (`image/*`)
- Max size: 5MB per file
- Multiple files supported
- File type check: `file.type.startsWith('image/')`

### Error Handling Patterns

**API Endpoints:**

```typescript
try {
	// Operation
	return json(result);
} catch (err) {
	console.error('Operation error:', err);
	if (err && typeof err === 'object' && 'status' in err) {
		throw err; // Re-throw SvelteKit errors (preserve status)
	}
	throw error(500, 'Generic error message');
}
```

**File Operations:**

```typescript
try {
	deleteImageFile(imagePath);
} catch (imageError) {
	console.error(`Failed to delete ${imagePath}:`, imageError);
	// Continue execution - don't fail entire operation
}
```

---

## 🎯 Known Limitations & Future Work

### Current Limitations

1. **No Pagination**
   - All records loaded at once
   - Will impact performance with 1000+ records
   - Consider implementing cursor or offset pagination

2. **No Search**
   - Users can only filter by year/month drop-downs
   - No text search across notes, dates, or values

3. **No Database Backup**
   - SQLite file in project root
   - No automated backups
   - Risk of data loss

4. **Single Vehicle**
   - `vehicle_id` hardcoded to 1
   - No vehicle management UI
   - Settings page needed for multi-vehicle support

5. **No Authentication**
   - Open access to all data
   - No user management
   - Consider auth middleware when deploying

6. **Success Message Persists**
   - Form success message doesn't auto-dismiss
   - Should implement timeout with toast notification

### Performance Considerations

**Image Storage:**

- Images stored in `static/` directory
- Served directly by web server
- Consider CDN for production deployment
- No image optimization on upload (manual Squoosh use recommended)

**Database Queries:**

- No indexes on `entry_date` (add for large datasets)
- Join queries not optimized (acceptable for small datasets)
- Consider pagination and lazy loading

**Client-Side Filtering:**

- All records loaded, filtered in browser
- Works for ~500 records
- Need server-side filtering for larger datasets

---

## 🛠️ Development Patterns

### State Management (Svelte 5 Runes)

**Reactive State:**

```typescript
let selectedYear = $state(2025);
let selectedMonth = $state(10);
```

**Derived State:**

```typescript
let filteredRecords = $derived.by(() => {
	return records.filter((r) => new Date(r.entry_date).getMonth() + 1 === selectedMonth);
});
```

**Effects:**

```typescript
$effect(() => {
	if (!availableMonths.includes(selectedMonth)) {
		selectedMonth = availableMonths[0];
	}
});
```

### Server-Only Code

**Pattern:** Use `.server.ts` suffix for server-only modules

```typescript
// ✅ lib/db.server.ts - Safe to import 'better-sqlite3'
// ✅ lib/invoice.server.ts - Safe to import 'fs', 'path'
// ❌ lib/utils.ts - Client code, no Node.js APIs
```

**Imports:**

```typescript
// Server route:
import { RecordService } from '$lib/db.server'; // OK

// Component:
import { formatCurrency } from '$lib/utils'; // OK
import { RecordService } from '$lib/db.server'; // ERROR!
```

### Form Actions

**Structure:**

```typescript
// routes/records/+page.server.ts
export const actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		// Process, validate, save
		return { success: true };
	}
};
```

**Usage in Component:**

```svelte
<form method="POST" action="?/create" enctype="multipart/form-data">
	<!-- form fields -->
</form>
```

### API Endpoints

**Naming Convention:**

- GET `/api/resource` - List
- GET `/api/resource/{id}` - Single item
- GET `/api/resource/{id}/extended` - Enriched data
- POST `/api/resource` - Create
- PUT `/api/resource/{id}` - Update
- DELETE `/api/resource/{id}` - Remove

**Response Format:**

```typescript
// Success
return json({ data, success: true });

// Error
throw error(400, 'Validation message');
```

---

## 📚 References

- **Architecture Guide:** This file (DOCS.md)
- **AI Coding Guide:** `.github/copilot-instructions.md`
- **Project Context:** `CLAUDE.md`
- **Task List:** `TODO.md`
- **User Guide:** `README.md`

---

**Last Updated:** 26 October 2025  
**Version:** 1.0  
**Branch:** 21-refactor-edit-record (merged to main as branch 22)
