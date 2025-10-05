# 🚀 Fleet Management System - Quick Start Guide

## 📋 First Time Setup

1. **Start local Supabase**

   ```bash
   supabase start --workdir . --yes
   ```

2. **Install dependencies** (if not done):

   ```bash
   pnpm install
   ```

3. **Reset and seed database (optional)**

   ```bash
   supabase db reset --workdir . --local --yes
   ```

4. **Start the app**:

   ```bash
   pnpm dev
   ```

5. **Login**:
   - URL: http://localhost:5173
   - Email: `admin@example.com`
   - Password: `admin123`

---

## 🔑 User Roles & Permissions

| Role              | Can Do                                        |
| ----------------- | --------------------------------------------- |
| **Super Admin**   | Everything - Full system access               |
| **Org Admin**     | Manage organization, users, vehicles, records |
| **Depot Manager** | Manage specific depot and its vehicles        |
| **Driver**        | Create delivery records only                  |
| **Viewer**        | View reports and analytics (read-only)        |

---

## 🗄️ Database Quick Reference

### **Tables**

```
users              - System users with roles
organizations      - Tenant organizations
depots             - Physical locations
vehicles           - Fleet vehicles
vehicle_assignments - Driver → Vehicle mapping
records            - Daily delivery data
vehicle_usage_log  - Detailed usage tracking
clients            - Invoice recipients
invoices           - Generated invoices
sessions           - Login sessions
```

### View Data

- Supabase Studio: http://127.0.0.1:55423
- psql example:
  ```bash
  psql postgresql://postgres:postgres@127.0.0.1:55422/postgres
  # \dt to list tables
  # SELECT id, email, first_name, last_name, role FROM public.users;
  ```

---

## 🛠️ Common Tasks

### **Add a New User** (via SQL until Admin UI is ready)

```sql
INSERT INTO users (
  email, password_hash, first_name, last_name,
  role, organization_id, is_active
) VALUES (
  'driver@example.com',
  '$2b$10$...hash...',  -- Use AuthService.hashPassword()
  'John',
  'Doe',
  'driver',
  1,
  1
);
```

### **Add a Vehicle**

```sql
INSERT INTO vehicles (
  organization_id, license_plate, make, model, is_active
) VALUES (
  1, '25-D-12345', 'Mercedes', 'Sprinter', 1
);
```

### Reset Password (via SQL)

```typescript
// Generate hash in Node.js console:
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('newpassword123', 10);
console.log(hash);
```

Then in Supabase (Studio SQL editor or psql):

```sql
UPDATE public.users
SET password_hash = '$2b$10$...'
WHERE email = 'admin@example.com';
```

---

## 🚨 Troubleshooting

### Problem: Can't login

Use Supabase Studio (Tables) or psql:

```sql
-- Check user exists and is active
SELECT * FROM public.users WHERE email='admin@example.com';
-- Verify sessions
SELECT * FROM public.sessions;
-- Clear all sessions
DELETE FROM public.sessions;
```

### **Problem: Blank page after login**

- Check browser console for errors
- Verify `locals.user` is set in hooks
- Check that layout is receiving user data

### Problem: Database issues

If you need a clean state locally:

```bash
supabase db reset --workdir . --local --yes
```

### Problem: Need to reset everything

```bash
supabase db reset --workdir . --local --yes
```

---

## 📝 Development Workflow

### **Typical Day:**

1. Start dev server: `pnpm dev`
2. Login to app
3. Make changes to code
4. Hot reload works automatically
5. Check types: `pnpm check`
6. Format code: `pnpm format`

### **Before Committing:**

```bash
pnpm check   # Type checking
pnpm lint    # Linting
pnpm format  # Auto-format
```

---

## 🔐 Security Notes

- Do not commit secrets; keep .env.local out of git
- Change default password immediately
- Use HTTPS in production (secure cookies)
- Set strong passwords (min 12 characters)
- Backup database regularly (use Postgres backups)

---

## 🐛 Known Issues

1. **Records page** - Not updated for new schema yet
2. **Analytics page** - Needs multi-vehicle support
3. **Invoice page** - Needs client management
4. **No admin UI** - Must use SQL for now

**These will be fixed in Phase 2!**

---

## 📞 Next Steps

Ready to add more features? Here's what's coming:

**Phase 2: Admin Panel**

- Vehicle management UI
- User management UI
- Depot management UI
- Organization settings

**Want to continue?** Let me know! 🚀
