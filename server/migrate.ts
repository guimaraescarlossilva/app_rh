import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from "@shared/schema";

export async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }

  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  const db = drizzle(pool, { schema });

  try {
    console.log('🔄 Running database migrations...');
    
    // Drop existing tables in rh_db schema only (in correct order due to foreign keys)
    console.log('🧹 Cleaning existing tables in rh_db schema...');
    const tablesToDrop = [
      'payroll', 'advances', 'terminations', 'vacations', 
      'employees', 'job_positions', 'module_permissions', 
      'user_restaurants', 'user_groups', 'permission_groups', 'users', 'restaurants'
    ];
    
    for (const table of tablesToDrop) {
      try {
        await db.execute(`DROP TABLE IF EXISTS rh_db.${table} CASCADE;`);
        console.log(`Dropped table: rh_db.${table}`);
      } catch (e) {
        console.log(`Table rh_db.${table} did not exist or could not be dropped`);
      }
    }
    
    // Drop existing types in rh_db schema only
    const typesToDrop = ['payment_status', 'termination_reason', 'vacation_status', 'employee_status'];
    for (const type of typesToDrop) {
      try {
        await db.execute(`DROP TYPE IF EXISTS rh_db.${type} CASCADE;`);
        console.log(`Dropped type: rh_db.${type}`);
      } catch (e) {
        console.log(`Type rh_db.${type} did not exist or could not be dropped`);
      }
    }
    
    // Create enums in rh_db schema
    console.log('📝 Creating enums in rh_db schema...');
    await db.execute(`CREATE TYPE rh_db.employee_status AS ENUM ('ativo', 'inativo', 'afastado');`);
    await db.execute(`CREATE TYPE rh_db.vacation_status AS ENUM ('pendente', 'aprovado', 'em_gozo', 'concluido', 'rejeitado');`);
    await db.execute(`CREATE TYPE rh_db.termination_reason AS ENUM ('demissao', 'rescisao', 'aposentadoria', 'abandono', 'falecimento');`);
    await db.execute(`CREATE TYPE rh_db.payment_status AS ENUM ('pendente', 'processado', 'pago');`);

    // Create restaurants table in rh_db schema
    await db.execute(`
      CREATE TABLE IF NOT EXISTS rh_db.restaurants (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        fantasy_name TEXT NOT NULL,
        address TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        cnpj TEXT NOT NULL UNIQUE,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        neighborhood TEXT NOT NULL,
        zip_code TEXT NOT NULL,
        active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT now() NOT NULL,
        updated_at TIMESTAMP DEFAULT now() NOT NULL
      );
    `);

    // Create users table in rh_db schema
    await db.execute(`
      CREATE TABLE IF NOT EXISTS rh_db.users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT now() NOT NULL
      );
    `);

    // Create permission_groups table in rh_db schema
    await db.execute(`
      CREATE TABLE IF NOT EXISTS rh_db.permission_groups (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT now() NOT NULL
      );
    `);

    // Create user_groups table in rh_db schema
    await db.execute(`
      CREATE TABLE IF NOT EXISTS rh_db.user_groups (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES rh_db.users(id) ON DELETE CASCADE,
        group_id VARCHAR NOT NULL REFERENCES rh_db.permission_groups(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT now() NOT NULL
      );
    `);

    // Create user_restaurants table in rh_db schema
    await db.execute(`
      CREATE TABLE IF NOT EXISTS rh_db.user_restaurants (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES rh_db.users(id) ON DELETE CASCADE,
        restaurant_id VARCHAR NOT NULL REFERENCES rh_db.restaurants(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT now() NOT NULL
      );
    `);

    // Create module_permissions table in rh_db schema
    await db.execute(`
      CREATE TABLE IF NOT EXISTS rh_db.module_permissions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id VARCHAR NOT NULL REFERENCES rh_db.permission_groups(id) ON DELETE CASCADE,
        module TEXT NOT NULL,
        can_read BOOLEAN DEFAULT false NOT NULL,
        can_create BOOLEAN DEFAULT false NOT NULL,
        can_update BOOLEAN DEFAULT false NOT NULL,
        can_delete BOOLEAN DEFAULT false NOT NULL
      );
    `);

    // Create job_positions table in rh_db schema
    await db.execute(`
      CREATE TABLE IF NOT EXISTS rh_db.job_positions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        base_salary DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT now() NOT NULL
      );
    `);

    // Create employees table in rh_db schema
    await db.execute(`
      CREATE TABLE IF NOT EXISTS rh_db.employees (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        cpf TEXT NOT NULL UNIQUE,
        email TEXT,
        phone TEXT,
        address TEXT,
        restaurant_id VARCHAR NOT NULL REFERENCES rh_db.restaurants(id) ON DELETE CASCADE,
        position_id VARCHAR REFERENCES rh_db.job_positions(id),
        admission_date DATE NOT NULL,
        base_salary DECIMAL(10,2) NOT NULL,
        agreed_salary DECIMAL(10,2) NOT NULL,
        advance_percentage DECIMAL(5,2) DEFAULT 40.00,
        status rh_db.employee_status DEFAULT 'ativo' NOT NULL,
        created_at TIMESTAMP DEFAULT now() NOT NULL,
        updated_at TIMESTAMP DEFAULT now() NOT NULL
      );
    `);

    // Create vacations table in rh_db schema
    await db.execute(`
      CREATE TABLE IF NOT EXISTS rh_db.vacations (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id VARCHAR NOT NULL REFERENCES rh_db.employees(id) ON DELETE CASCADE,
        acquisition_period_start DATE NOT NULL,
        acquisition_period_end DATE NOT NULL,
        enjoyment_limit DATE NOT NULL,
        enjoyment_period_start DATE,
        enjoyment_period_end DATE,
        days INTEGER NOT NULL DEFAULT 30,
        status rh_db.vacation_status DEFAULT 'pendente' NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT now() NOT NULL,
        approved_at TIMESTAMP,
        approved_by VARCHAR REFERENCES rh_db.users(id)
      );
    `);

    // Create terminations table in rh_db schema
    await db.execute(`
      CREATE TABLE IF NOT EXISTS rh_db.terminations (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id VARCHAR NOT NULL REFERENCES rh_db.employees(id) ON DELETE CASCADE,
        termination_date DATE NOT NULL,
        reason rh_db.termination_reason NOT NULL,
        description TEXT,
        receipt_issued BOOLEAN DEFAULT false,
        fgts_released BOOLEAN DEFAULT false,
        severance_processed BOOLEAN DEFAULT false,
        payment_date DATE,
        created_at TIMESTAMP DEFAULT now() NOT NULL
      );
    `);

    // Create advances table in rh_db schema
    await db.execute(`
      CREATE TABLE IF NOT EXISTS rh_db.advances (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id VARCHAR NOT NULL REFERENCES rh_db.employees(id) ON DELETE CASCADE,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        base_amount DECIMAL(10,2) NOT NULL,
        percentage DECIMAL(5,2) NOT NULL,
        advance_amount DECIMAL(10,2) NOT NULL,
        payment_date DATE,
        status rh_db.payment_status DEFAULT 'pendente' NOT NULL,
        created_at TIMESTAMP DEFAULT now() NOT NULL
      );
    `);

    // Create payroll table in rh_db schema
    await db.execute(`
      CREATE TABLE IF NOT EXISTS rh_db.payroll (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id VARCHAR NOT NULL REFERENCES rh_db.employees(id) ON DELETE CASCADE,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        base_salary DECIMAL(10,2) NOT NULL,
        agreed_salary DECIMAL(10,2) NOT NULL,
        advance DECIMAL(10,2) DEFAULT 0.00,
        night_shift_additional DECIMAL(10,2) DEFAULT 0.00,
        night_shift_dsr DECIMAL(10,2) DEFAULT 0.00,
        overtime DECIMAL(10,2) DEFAULT 0.00,
        overtime_dsr DECIMAL(10,2) DEFAULT 0.00,
        vacation_bonus DECIMAL(10,2) DEFAULT 0.00,
        five_year_bonus DECIMAL(10,2) DEFAULT 0.00,
        position_gratification DECIMAL(10,2) DEFAULT 0.00,
        general_gratification DECIMAL(10,2) DEFAULT 0.00,
        cashier_gratification DECIMAL(10,2) DEFAULT 0.00,
        family_allowance DECIMAL(10,2) DEFAULT 0.00,
        holiday_pay DECIMAL(10,2) DEFAULT 0.00,
        unhealthiness DECIMAL(10,2) DEFAULT 0.00,
        maternity_leave DECIMAL(10,2) DEFAULT 0.00,
        tips DECIMAL(10,2) DEFAULT 0.00,
        others DECIMAL(10,2) DEFAULT 0.00,
        vouchers DECIMAL(10,2) DEFAULT 0.00,
        gross_amount DECIMAL(10,2) NOT NULL,
        inss DECIMAL(10,2) DEFAULT 0.00,
        inss_vacation DECIMAL(10,2) DEFAULT 0.00,
        irpf DECIMAL(10,2) DEFAULT 0.00,
        union_fee DECIMAL(10,2) DEFAULT 0.00,
        absences DECIMAL(10,2) DEFAULT 0.00,
        absence_reason TEXT,
        net_amount DECIMAL(10,2) NOT NULL,
        status rh_db.payment_status DEFAULT 'pendente' NOT NULL,
        processed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT now() NOT NULL
      );
    `);

    console.log('✅ Database migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}