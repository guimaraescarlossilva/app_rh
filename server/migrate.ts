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
    
    // Create all tables using the schema
    await db.execute(`
      -- Create enums
      CREATE TYPE IF NOT EXISTS employee_status AS ENUM ('ativo', 'inativo', 'afastado');
      CREATE TYPE IF NOT EXISTS vacation_status AS ENUM ('pendente', 'aprovado', 'em_gozo', 'concluido', 'rejeitado');
      CREATE TYPE IF NOT EXISTS termination_reason AS ENUM ('demissao', 'rescisao', 'aposentadoria', 'abandono', 'falecimento');
      CREATE TYPE IF NOT EXISTS payment_status AS ENUM ('pendente', 'processado', 'pago');
    `);

    // Create users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT now() NOT NULL
      );
    `);

    // Create permission_groups table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS permission_groups (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT now() NOT NULL
      );
    `);

    // Create user_groups table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_groups (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        group_id VARCHAR NOT NULL REFERENCES permission_groups(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT now() NOT NULL
      );
    `);

    // Create module_permissions table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS module_permissions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id VARCHAR NOT NULL REFERENCES permission_groups(id) ON DELETE CASCADE,
        module TEXT NOT NULL,
        can_read BOOLEAN DEFAULT false NOT NULL,
        can_create BOOLEAN DEFAULT false NOT NULL,
        can_update BOOLEAN DEFAULT false NOT NULL,
        can_delete BOOLEAN DEFAULT false NOT NULL
      );
    `);

    // Create job_positions table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS job_positions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        base_salary DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT now() NOT NULL
      );
    `);

    // Create employees table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        cpf TEXT NOT NULL UNIQUE,
        email TEXT,
        phone TEXT,
        address TEXT,
        position_id VARCHAR REFERENCES job_positions(id),
        admission_date DATE NOT NULL,
        base_salary DECIMAL(10,2) NOT NULL,
        agreed_salary DECIMAL(10,2) NOT NULL,
        advance_percentage DECIMAL(5,2) DEFAULT 40.00,
        status employee_status DEFAULT 'ativo' NOT NULL,
        created_at TIMESTAMP DEFAULT now() NOT NULL,
        updated_at TIMESTAMP DEFAULT now() NOT NULL
      );
    `);

    // Create vacations table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS vacations (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id VARCHAR NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        acquisition_period_start DATE NOT NULL,
        acquisition_period_end DATE NOT NULL,
        enjoyment_limit DATE NOT NULL,
        enjoyment_period_start DATE,
        enjoyment_period_end DATE,
        days INTEGER NOT NULL DEFAULT 30,
        status vacation_status DEFAULT 'pendente' NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT now() NOT NULL,
        approved_at TIMESTAMP,
        approved_by VARCHAR REFERENCES users(id)
      );
    `);

    // Create terminations table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS terminations (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id VARCHAR NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        termination_date DATE NOT NULL,
        reason termination_reason NOT NULL,
        description TEXT,
        receipt_issued BOOLEAN DEFAULT false,
        fgts_released BOOLEAN DEFAULT false,
        severance_processed BOOLEAN DEFAULT false,
        payment_date DATE,
        created_at TIMESTAMP DEFAULT now() NOT NULL
      );
    `);

    // Create advances table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS advances (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id VARCHAR NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        base_amount DECIMAL(10,2) NOT NULL,
        percentage DECIMAL(5,2) NOT NULL,
        advance_amount DECIMAL(10,2) NOT NULL,
        payment_date DATE,
        status payment_status DEFAULT 'pendente' NOT NULL,
        created_at TIMESTAMP DEFAULT now() NOT NULL
      );
    `);

    // Create payroll table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS payroll (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id VARCHAR NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
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
        status payment_status DEFAULT 'pendente' NOT NULL,
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
