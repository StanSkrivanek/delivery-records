import { dev } from '$app/environment';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';

const dbPath = dev ? 'database.db' : './database.db';
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// ============================================================================
// SCHEMA DEFINITIONS
// ============================================================================

// Initialize database schema
db.exec(`
  -- ============================================================================
  -- USERS & AUTHENTICATION
  -- ============================================================================
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'org_admin', 'depot_manager', 'driver', 'viewer')) DEFAULT 'driver',
    is_active BOOLEAN DEFAULT 1,
    organization_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

  -- ============================================================================
  -- ORGANIZATIONS
  -- ============================================================================
  CREATE TABLE IF NOT EXISTS organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    legal_name TEXT,
    vat_number TEXT,
    tax_id TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'Ireland',
    logo_url TEXT,
    is_active BOOLEAN DEFAULT 1,
    settings JSON, -- Organization-specific settings
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active);

  -- ============================================================================
  -- DEPOTS / LOCATIONS
  -- ============================================================================
  CREATE TABLE IF NOT EXISTS depots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    code TEXT, -- Short code like "DUB01", "CRK01"
    address TEXT,
    city TEXT,
    postal_code TEXT,
    phone TEXT,
    email TEXT,
    manager_id INTEGER, -- User who manages this depot
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_depots_organization ON depots(organization_id);
  CREATE INDEX IF NOT EXISTS idx_depots_active ON depots(is_active);

  -- ============================================================================
  -- VEHICLES
  -- ============================================================================
  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL,
    depot_id INTEGER,
    license_plate TEXT NOT NULL,
    make TEXT,
    model TEXT,
    year INTEGER,
    vin TEXT,
    initial_odometer INTEGER DEFAULT 0,
    current_odometer INTEGER DEFAULT 0,
    fuel_type TEXT CHECK (fuel_type IN ('diesel', 'petrol', 'electric', 'hybrid')),
    is_active BOOLEAN DEFAULT 1,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (depot_id) REFERENCES depots(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_vehicles_organization ON vehicles(organization_id);
  CREATE INDEX IF NOT EXISTS idx_vehicles_depot ON vehicles(depot_id);
  CREATE INDEX IF NOT EXISTS idx_vehicles_license ON vehicles(license_plate);
  CREATE INDEX IF NOT EXISTS idx_vehicles_active ON vehicles(is_active);

  -- ============================================================================
  -- VEHICLE ASSIGNMENTS (Driver-Vehicle assignments)
  -- ============================================================================
  CREATE TABLE IF NOT EXISTS vehicle_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    assigned_date DATE NOT NULL,
    unassigned_date DATE,
    is_active BOOLEAN DEFAULT 1,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_assignments_vehicle ON vehicle_assignments(vehicle_id);
  CREATE INDEX IF NOT EXISTS idx_assignments_user ON vehicle_assignments(user_id);
  CREATE INDEX IF NOT EXISTS idx_assignments_date ON vehicle_assignments(assigned_date);

  -- ============================================================================
  -- DELIVERY RECORDS
  -- ============================================================================
  CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL,
    depot_id INTEGER,
    vehicle_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    entry_date DATE NOT NULL,
    
    -- Parcel counts
    loaded INTEGER NOT NULL DEFAULT 0,
    collected INTEGER NOT NULL DEFAULT 0,
    cutters INTEGER NOT NULL DEFAULT 0,
    returned INTEGER NOT NULL DEFAULT 0,
    missplaced INTEGER DEFAULT 0,
    
    -- Financial
    expense REAL DEFAULT 0,
    expense_no_vat REAL DEFAULT 0,
    
    -- Vehicle data
    odometer_start INTEGER,
    odometer_end INTEGER,
    
    -- Documentation
    image_path TEXT,
    note TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (depot_id) REFERENCES depots(id) ON DELETE SET NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
  );

  CREATE INDEX IF NOT EXISTS idx_records_organization ON records(organization_id);
  CREATE INDEX IF NOT EXISTS idx_records_depot ON records(depot_id);
  CREATE INDEX IF NOT EXISTS idx_records_vehicle ON records(vehicle_id);
  CREATE INDEX IF NOT EXISTS idx_records_user ON records(user_id);
  CREATE INDEX IF NOT EXISTS idx_records_date ON records(entry_date);

  -- ============================================================================
  -- VEHICLE USAGE LOG
  -- ============================================================================
  CREATE TABLE IF NOT EXISTS vehicle_usage_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id INTEGER NOT NULL,
    vehicle_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    entry_date DATE NOT NULL,
    usage_mode TEXT NOT NULL CHECK (usage_mode IN ('standard', 'no_used', 'other')),
    odometer_start INTEGER,
    odometer_end INTEGER,
    distance_manual INTEGER DEFAULT 0,
    purpose TEXT,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_usage_record ON vehicle_usage_log(record_id);
  CREATE INDEX IF NOT EXISTS idx_usage_vehicle ON vehicle_usage_log(vehicle_id);
  CREATE INDEX IF NOT EXISTS idx_usage_date ON vehicle_usage_log(entry_date);

  -- ============================================================================
  -- CLIENTS (Invoice recipients)
  -- ============================================================================
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    vat_number TEXT,
    payment_terms INTEGER DEFAULT 30, -- Days
    pricing_delivery REAL DEFAULT 4.0,
    pricing_collection REAL DEFAULT 1.0,
    is_active BOOLEAN DEFAULT 1,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_clients_organization ON clients(organization_id);
  CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(is_active);

  -- ============================================================================
  -- INVOICES
  -- ============================================================================
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    invoice_number TEXT UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    subtotal REAL NOT NULL,
    vat_amount REAL NOT NULL,
    total_amount REAL NOT NULL,
    status TEXT CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')) DEFAULT 'draft',
    paid_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
  );

  CREATE INDEX IF NOT EXISTS idx_invoices_organization ON invoices(organization_id);
  CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
  CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
  CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
  CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);

  -- ============================================================================
  -- SESSIONS (for authentication)
  -- ============================================================================
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
`);

// ============================================================================
// SEED DATA - Create initial super admin
// ============================================================================
export async function seedDatabase() {
  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  
  if (existingUsers.count === 0) {
    console.log('🌱 Seeding database with initial data...');
    
    // Create default organization
    const orgStmt = db.prepare(`
      INSERT INTO organizations (name, legal_name, country, is_active)
      VALUES (?, ?, ?, ?)
    `);
    
    const orgResult = orgStmt.run(
      'Default Organization',
      'Default Organization Ltd.',
      'Ireland',
      1
    );
    
    const orgId = orgResult.lastInsertRowid;
    
    // Create super admin user
    const passwordHash = await bcrypt.hash('admin123', 10);
    const userStmt = db.prepare(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, organization_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    userStmt.run(
      'admin@example.com',
      passwordHash,
      'Super',
      'Admin',
      'super_admin',
      orgId,
      1
    );
    
    console.log('✅ Database seeded successfully!');
    console.log('📧 Login: admin@example.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  CHANGE THIS PASSWORD IMMEDIATELY!');
  }
}

// Initialize seed data on startup
seedDatabase().catch(console.error);

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface User {
  id?: number;
  email: string;
  password_hash?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'super_admin' | 'org_admin' | 'depot_manager' | 'driver' | 'viewer';
  is_active: boolean;
  organization_id?: number;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string;
}

export interface Organization {
  id?: number;
  name: string;
  legal_name?: string;
  vat_number?: string;
  tax_id?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  logo_url?: string;
  is_active: boolean;
  settings?: string; // JSON
  created_at?: string;
  updated_at?: string;
}

export interface Depot {
  id?: number;
  organization_id: number;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  manager_id?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Vehicle {
  id?: number;
  organization_id: number;
  depot_id?: number;
  license_plate: string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  initial_odometer?: number;
  current_odometer?: number;
  fuel_type?: 'diesel' | 'petrol' | 'electric' | 'hybrid';
  is_active: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Record {
  id?: number;
  organization_id: number;
  depot_id?: number;
  vehicle_id: number;
  user_id: number;
  entry_date: string;
  loaded: number;
  collected: number;
  cutters: number;
  returned: number;
  missplaced?: number;
  expense?: number;
  expense_no_vat?: number;
  odometer_start?: number;
  odometer_end?: number;
  image_path?: string;
  note?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Client {
  id?: number;
  organization_id: number;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  vat_number?: string;
  payment_terms?: number;
  pricing_delivery?: number;
  pricing_collection?: number;
  is_active: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// DATABASE SERVICE CLASSES
// ============================================================================

export class AuthService {
  static async createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const stmt = db.prepare(`
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role, organization_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      user.email,
      user.password_hash,
      user.first_name,
      user.last_name,
      user.phone || null,
      user.role,
      user.organization_id || null,
      user.is_active ? 1 : 0
    );
    
    return result.lastInsertRowid as number;
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as User | null;
  }

  static async getUserById(id: number): Promise<User | null> {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | null;
  }

  static async updateLastLogin(userId: number): Promise<void> {
    const stmt = db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(userId);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static async createSession(userId: number): Promise<string> {
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    const stmt = db.prepare(`
      INSERT INTO sessions (id, user_id, expires_at)
      VALUES (?, ?, ?)
    `);
    
    stmt.run(sessionId, userId, expiresAt.toISOString());
    return sessionId;
  }

  static async getSession(sessionId: string): Promise<{ user_id: number; expires_at: string } | null> {
    const stmt = db.prepare('SELECT * FROM sessions WHERE id = ? AND expires_at > CURRENT_TIMESTAMP');
    return stmt.get(sessionId) as { user_id: number; expires_at: string } | null;
  }

  static async deleteSession(sessionId: string): Promise<void> {
    const stmt = db.prepare('DELETE FROM sessions WHERE id = ?');
    stmt.run(sessionId);
  }

  static async cleanExpiredSessions(): Promise<void> {
    const stmt = db.prepare('DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP');
    stmt.run();
  }
}

export class OrganizationService {
  static async create(org: Omit<Organization, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const stmt = db.prepare(`
      INSERT INTO organizations (name, legal_name, vat_number, tax_id, phone, email, address, city, postal_code, country, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      org.name,
      org.legal_name || null,
      org.vat_number || null,
      org.tax_id || null,
      org.phone || null,
      org.email || null,
      org.address || null,
      org.city || null,
      org.postal_code || null,
      org.country || 'Ireland',
      org.is_active ? 1 : 0
    );
    
    return result.lastInsertRowid as number;
  }

  static async getById(id: number): Promise<Organization | null> {
    const stmt = db.prepare('SELECT * FROM organizations WHERE id = ?');
    return stmt.get(id) as Organization | null;
  }

  static async getAll(): Promise<Organization[]> {
    const stmt = db.prepare('SELECT * FROM organizations ORDER BY name');
    return stmt.all() as Organization[];
  }
}

export class VehicleService {
  static async create(vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const stmt = db.prepare(`
      INSERT INTO vehicles (organization_id, depot_id, license_plate, make, model, year, vin, initial_odometer, current_odometer, fuel_type, is_active, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      vehicle.organization_id,
      vehicle.depot_id || null,
      vehicle.license_plate,
      vehicle.make || null,
      vehicle.model || null,
      vehicle.year || null,
      vehicle.vin || null,
      vehicle.initial_odometer || 0,
      vehicle.current_odometer || 0,
      vehicle.fuel_type || null,
      vehicle.is_active ? 1 : 0,
      vehicle.notes || null
    );
    
    return result.lastInsertRowid as number;
  }

  static async getByOrganization(organizationId: number): Promise<Vehicle[]> {
    const stmt = db.prepare('SELECT * FROM vehicles WHERE organization_id = ? AND is_active = 1 ORDER BY license_plate');
    return stmt.all(organizationId) as Vehicle[];
  }

  static async getById(id: number): Promise<Vehicle | null> {
    const stmt = db.prepare('SELECT * FROM vehicles WHERE id = ?');
    return stmt.get(id) as Vehicle | null;
  }
}

// Ensure static/images directory exists
const imagesDir = path.join(process.cwd(), 'static', 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

export default db;
