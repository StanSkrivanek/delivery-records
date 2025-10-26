# Database Backup - Quick Start Guide

## 🚀 Quick Start

Your automatic backup system is **ready to use**! Here's everything you need to know:

## ⚡ Automatic Backups (Already Active!)

Backups run automatically every 24 hours when the server is running. No setup needed!

```bash
# Just run your server as normal
pnpm dev

# After 1 minute, you'll see:
# ✅ Automatic backup completed: Backup created successfully: database_backup_2025-10-26_14-30-45.db (2.45 MB)
```

## 🖥️ Backup Management Web Interface

Visit: **http://localhost:5173/backup**

Features:

- 📋 View all backups
- ➕ Create backup now
- ↻ Restore from backup
- 🗑️ Delete old backups

## 💻 Manual Backup (Command Line)

```bash
pnpm backup
```

Output:

```
✅ Backup created successfully!
   Filename: database_backup_2025-10-26_07-43-05.db
   Location: /Volumes/HD-700/SQL/delivery-backups
   Size: 0.04 MB
   Time: 10/26/2025, 7:43:05 AM
```

## 📁 Backup Location

All backups are stored at:

```
/Volumes/HD-700/SQL/delivery-backups
```

**Note:** Make sure the HD-700 drive is mounted before running backups!

## 🔄 Restore a Backup

### Via Web Interface:

1. Go to http://localhost:5173/backup
2. Click "↻ Restore" next to the backup you want
3. Confirm the action
4. Done! (A safety backup is created automatically)

### Via API:

```bash
curl -X POST http://localhost:5173/api/backup \
  -H "Content-Type: application/json" \
  -d '{"action":"restore","filename":"database_backup_2025-10-26_07-43-05.db"}'
```

## 🗑️ Delete a Backup

### Via Web Interface:

1. Go to http://localhost:5173/backup
2. Click "🗑️ Delete" next to the backup
3. Confirm the action

### Via API:

```bash
curl -X POST http://localhost:5173/api/backup \
  -H "Content-Type: application/json" \
  -d '{"action":"delete","filename":"database_backup_2025-10-26_07-43-05.db"}'
```

## 📊 Backup Retention

- **Keeps:** Last 30 backups
- **Deletes:** Older backups automatically
- **Safety:** Pre-restore backups are also kept

## 🛡️ Safety Features

✅ **Safety Backup** - When restoring, current DB is backed up first  
✅ **Verification** - All backups are verified after creation  
✅ **Timestamps** - Easy to identify when each backup was made  
✅ **No Downtime** - Backups work while app is running

## 📋 Backup File Format

```
database_backup_YYYY-MM-DD_HH-MM-SS.db
```

Example:

```
database_backup_2025-10-26_14-30-45.db
                ↑          ↑
              Date        Time
```

## 🆘 Troubleshooting

### "Backup directory not found"

**Solution:** Check that HD-700 drive is mounted:

```bash
ls -la /Volumes/HD-700/SQL/
```

### "Backups not running automatically"

**Solutions:**

1. Restart the server: `pnpm dev`
2. Visit any page to trigger the backup check
3. Check console for error messages

### "Restore failed"

**Solutions:**

1. Verify backup file exists and is not corrupted
2. Check you have write permissions
3. Look at console logs for details
4. A safety backup should have been created

## 📚 More Information

For complete documentation, see:

- **`BACKUP.md`** - Full documentation
- **`BACKUP-IMPLEMENTATION.md`** - Technical implementation details

## 🎉 That's It!

Your database is now automatically backed up every 24 hours to `/Volumes/HD-700/SQL/delivery-backups`.

The system is already running - you don't need to do anything else! 🎊
