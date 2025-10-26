# Database Backup System

This document describes the automatic database backup system for the Delivery Records application.

## Overview

The backup system provides three ways to backup your database:

1. **Automatic Daily Backups** - Runs automatically every 24 hours when the server is running
2. **Manual CLI Backup** - Use `pnpm backup` command
3. **Web Interface Backup** - Use the `/backup` page to create, restore, and manage backups

## Backup Location

All backups are stored at:

```
/Volumes/HD-700/SQL/delivery-backups
```

## Features

### Automatic Backups

- Runs once every 24 hours automatically
- Triggered on server start (after 1-minute delay) and on every request
- No user intervention required
- Logs success/failure to console

### Backup Retention

- Keeps the last **30 backups**
- Older backups are automatically deleted when the limit is exceeded
- Each backup is timestamped for easy identification

### Backup File Naming

Format: `database_backup_YYYY-MM-DD_HH-MM-SS.db`

Example: `database_backup_2025-10-26_14-30-45.db`

### Safety Features

- When restoring a backup, a safety backup of the current database is automatically created
- Safety backups are named: `database_pre-restore_<timestamp>.db`
- This allows you to revert if the restore doesn't work as expected

## Usage

### 1. Automatic Backups

No action required. Backups run automatically when the server is running.

To verify automatic backups are working:

```bash
# Check the logs when starting the server
pnpm dev
# Look for: "✅ Automatic backup completed: ..."
```

### 2. Manual CLI Backup

```bash
# Run from the project root
pnpm backup
```

Output:

```
✅ Backup created successfully!
   Filename: database_backup_2025-10-26_14-30-45.db
   Location: /Volumes/HD-700/SQL/delivery-backups
   Size: 2.45 MB
   Time: 26/10/2025, 14:30:45

📊 Total backups in directory: 15
```

### 3. Web Interface

Navigate to: `http://localhost:5173/backup`

Features:

- **View all backups** - See a list with filename, creation date, and size
- **Create backup** - Click "Create Backup Now" button
- **Restore backup** - Click "Restore" next to any backup (with confirmation)
- **Delete backup** - Click "Delete" next to any backup (with confirmation)

## API Endpoints

### List Backups

```http
GET /api/backup
```

Response:

```json
{
	"success": true,
	"backups": [
		{
			"filename": "database_backup_2025-10-26_14-30-45.db",
			"path": "/Volumes/HD-700/SQL/delivery-backups/database_backup_2025-10-26_14-30-45.db",
			"size": "2.45 MB",
			"created": "2025-10-26T14:30:45.000Z"
		}
	],
	"count": 1
}
```

### Create Backup

```http
GET /api/backup?action=create
```

or

```http
POST /api/backup
Content-Type: application/json

{
  "action": "create"
}
```

Response:

```json
{
	"success": true,
	"message": "Backup created successfully: database_backup_2025-10-26_14-30-45.db (2.45 MB)",
	"filename": "database_backup_2025-10-26_14-30-45.db",
	"path": "/Volumes/HD-700/SQL/delivery-backups/database_backup_2025-10-26_14-30-45.db"
}
```

### Restore Backup

```http
POST /api/backup
Content-Type: application/json

{
  "action": "restore",
  "filename": "database_backup_2025-10-26_14-30-45.db"
}
```

Response:

```json
{
	"success": true,
	"message": "Database restored successfully from database_backup_2025-10-26_14-30-45.db. Safety backup created: database_pre-restore_1729950645000.db"
}
```

### Delete Backup

```http
POST /api/backup
Content-Type: application/json

{
  "action": "delete",
  "filename": "database_backup_2025-10-26_14-30-45.db"
}
```

Response:

```json
{
	"success": true,
	"message": "Backup deleted successfully: database_backup_2025-10-26_14-30-45.db"
}
```

## Architecture

### Files Created

1. **`src/lib/backup.server.ts`** - Core backup logic
   - `createBackup()` - Creates a database backup
   - `listBackups()` - Lists all available backups
   - `restoreBackup()` - Restores from a backup
   - `deleteBackup()` - Deletes a backup
   - `cleanupOldBackups()` - Removes old backups

2. **`src/hooks.server.ts`** - Automatic backup scheduler
   - Runs on server start
   - Checks on every request (but only backs up once per 24 hours)
   - Uses interval to ensure backups happen even during idle periods

3. **`src/routes/api/backup/+server.ts`** - API endpoints
   - GET - List backups or create backup
   - POST - Create, restore, or delete backup

4. **`src/routes/backup/+page.server.ts`** - Server load function
   - Loads backup list for the UI

5. **`src/routes/backup/+page.svelte`** - Web interface
   - Interactive backup management UI
   - Create, restore, delete backups
   - View backup history

6. **`scripts/backup.js`** - CLI backup script
   - Standalone Node.js script
   - Can be run via `pnpm backup`

## Configuration

Edit `src/lib/backup.server.ts` to change settings:

```typescript
const BACKUP_DIR = '/Volumes/HD-700/SQL/delivery-backups'; // Backup location
const MAX_BACKUPS = 30; // Number of backups to keep
```

Edit `src/hooks.server.ts` to change the backup interval:

```typescript
const BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
```

## Troubleshooting

### Backup directory not found

If you see an error about the backup directory:

1. Check that the external drive `HD-700` is mounted
2. Verify the path: `/Volumes/HD-700/SQL/delivery-backups`
3. The directory will be created automatically if it doesn't exist

### Backups not running automatically

1. Check that the server is running (`pnpm dev`)
2. Check the console logs for error messages
3. Verify that at least one request has been made to the server (visit any page)

### Restore failed

1. Check that the backup file exists and is not corrupted
2. Verify you have write permissions for the database file
3. Check the console logs for detailed error messages
4. A safety backup should have been created before the restore attempt

## Best Practices

1. **Monitor backups regularly** - Check the `/backup` page periodically
2. **Keep external drive connected** - Ensure HD-700 is mounted when running the server
3. **Test restores** - Occasionally test restoring a backup to verify it works
4. **Manual backups before major changes** - Run `pnpm backup` before making significant changes
5. **Don't delete all backups** - Keep at least a few recent backups for redundancy

## Notes

- Backups are simple file copies - no compression or encryption
- Each backup is a complete copy of the database
- Backup size depends on your database size (expect 1-10 MB typically)
- Backups are quick - usually takes less than a second
- No downtime required - backups work while the app is running
