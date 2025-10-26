# Database & Images Backup - Quick Start Guide

## 🚀 Quick Start

Your automatic backup system is **ready to use**! Here's everything you need to know:

## ⚡ Automatic Backups at Midnight (Smart Scheduling!)

Backups run automatically **every night at midnight** - but **only if there are changes** in the database!

```bash
# Just run your server as normal
pnpm dev

# At midnight, you'll see (if there are changes):
# 🔄 Database changes detected, starting backup...
# ✅ Automatic backup completed: Backup created: DB 0.04 MB, Images 11.89 MB

# If no changes:
# ℹ️  No database changes detected, skipping backup
```

**What gets backed up:**

- 📦 **Database** - Individual timestamped files (keeps last 30)
- 📸 **Images** - Single folder that gets replaced/updated each time

## 🖥️ Backup Management Web Interface

Visit: **http://localhost:5173/backup**

Features:

- 📋 View all backups
- ➕ Create backup now (manual)
- ↻ Restore from backup
- 🗑️ Delete old backups

## 💻 Manual Backup (Command Line)

```bash
pnpm backup
```

Output:

```
📦 Creating database backup...
✅ Database backup created successfully!
   Filename: database_backup_2025-10-26_07-51-21.db
   Location: /Volumes/HD-700/SQL/delivery-backups
   Size: 0.04 MB
   Time: 10/26/2025, 7:51:21 AM

📸 Backing up images...
✅ Images backed up successfully!
   Size: 11.89 MB

📊 Total database backups: 3
📊 Images backup: Up to date
```

## 📁 Backup Location

All backups are stored at:

```
/Volumes/HD-700/SQL/delivery-backups
├── database_backup_2025-10-26_07-41-07.db
├── database_backup_2025-10-26_07-43-05.db
├── database_backup_2025-10-26_07-51-21.db
└── images_backup/
    └── 2025/
        ├── Jul/
        ├── Aug/
        ├── Sep/
        └── Oct/
```

**Note:** Make sure the HD-700 drive is mounted before running backups!

## 🎯 How It Works

### Smart Midnight Scheduling

- ⏰ Backup runs **automatically at midnight**
- 🔍 **Checks for changes** before backing up
- 💾 Only creates backup if database has changed
- 📅 Once per day maximum

### What Gets Backed Up

**Database:**

- ✅ Individual timestamped files
- ✅ Keeps last 30 backups
- ✅ Old backups deleted automatically

**Images:**

- ✅ Single `images_backup` folder
- ✅ Replaces previous backup completely
- ✅ All images preserved in folder structure

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

- **Database Backups:** Last 30 backups kept
- **Images Backup:** Single folder (always current)
- **Deletes:** Older database backups automatically removed
- **Safety:** Pre-restore backups are also kept

## 🛡️ Safety Features

✅ **Change Detection** - Only backs up when database changes  
✅ **Midnight Scheduling** - Runs at midnight for minimal disruption  
✅ **Safety Backup** - When restoring, current DB is backed up first  
✅ **Verification** - All backups are verified after creation  
✅ **Timestamps** - Easy to identify when each backup was made  
✅ **No Downtime** - Backups work while app is running  
✅ **Images Preserved** - Complete folder structure maintained

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
2. Wait until midnight (or trigger manual backup: `pnpm backup`)
3. Check console for error messages
4. Look for "No database changes detected" message (means no backup needed)

### "Images not backed up"

**Solutions:**

1. Check that `static/images` directory exists
2. Verify HD-700 drive has enough space
3. Check console logs for error messages

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

Your database AND images are now automatically backed up every midnight (only when there are changes) to `/Volumes/HD-700/SQL/delivery-backups`.

**Smart Features:**

- 🌙 Runs at midnight automatically
- 🔍 Only backs up when changes detected
- 📦 Database: Last 30 backups
- 📸 Images: Single up-to-date folder

The system is already running - you don't need to do anything else! 🎊

Your database is now automatically backed up every 24 hours to `/Volumes/HD-700/SQL/delivery-backups`.

The system is already running - you don't need to do anything else! 🎊
