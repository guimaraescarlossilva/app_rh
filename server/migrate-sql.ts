import { pool } from "./db";

export async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  try {
    // Create enums (only if they don't exist)
    console.log('📝 Creating enums in rh_db schema...');
    
    const enumTypes = [
      { name: 'employee_status', values: ['ativo', 'inativo', 'afastado'] },
      { name: 'vacation_status', values: ['pendente', 'aprovado', 'em_gozo', 'concluido', 'rejeitado'] },
      { name: 'termination_reason', values: ['demissao', 'rescisao', 'aposentadoria', 'abandono', 'falecimento'] },
      { name: 'payment_status', values: ['pendente', 'processado', 'pago'] }
    ];

    for (const enumType of enumTypes) {
      // Check if enum type already exists
      const checkQuery = `
        SELECT 1 FROM pg_type 
        WHERE typname = $1 AND typnamespace = (
          SELECT oid FROM pg_namespace WHERE nspname = 'rh_db'
        )
      `;
      
      const result = await pool.query(checkQuery, [enumType.name]);
      
      if (result.rows.length === 0) {
        // Create enum if it doesn't exist
        const createQuery = `CREATE TYPE rh_db.${enumType.name} AS ENUM (${enumType.values.map(v => `'${v}'`).join(', ')});`;
        console.log(`Query: ${createQuery}`);
        await pool.query(createQuery);
        console.log(`Created enum: rh_db.${enumType.name}`);
      } else {
        console.log(`Enum already exists: rh_db.${enumType.name}`);
      }
    }

    // Create tables
    console.log('📋 Creating tables in rh_db schema...');
    
    const createTablesQueries = [
      `CREATE TABLE IF NOT EXISTS rh_db.branches (
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
      );`,
      
      `CREATE TABLE IF NOT EXISTS rh_db.users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        cpf TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT now() NOT NULL
      );`,
      
      `CREATE TABLE IF NOT EXISTS rh_db.permission_groups (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT now() NOT NULL
      );`,
      
      `CREATE TABLE IF NOT EXISTS rh_db.user_groups (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES rh_db.users(id) ON DELETE CASCADE,
        group_id VARCHAR NOT NULL REFERENCES rh_db.permission_groups(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT now() NOT NULL
      );`,
      
      `CREATE TABLE IF NOT EXISTS rh_db.user_branches (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES rh_db.users(id) ON DELETE CASCADE,
        branch_id VARCHAR NOT NULL REFERENCES rh_db.branches(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT now() NOT NULL
      );`,
      
      `CREATE TABLE IF NOT EXISTS rh_db.module_permissions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id VARCHAR NOT NULL REFERENCES rh_db.permission_groups(id) ON DELETE CASCADE,
        module TEXT NOT NULL,
        can_read BOOLEAN DEFAULT false NOT NULL,
        can_create BOOLEAN DEFAULT false NOT NULL,
        can_update BOOLEAN DEFAULT false NOT NULL,
        can_delete BOOLEAN DEFAULT false NOT NULL
      );`,
      
      `CREATE TABLE IF NOT EXISTS rh_db.job_positions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        base_salary DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT now() NOT NULL
      );`,
      
      `CREATE TABLE IF NOT EXISTS rh_db.employees (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        cpf TEXT NOT NULL UNIQUE,
        email TEXT,
        phone TEXT,
        address TEXT,
        branch_id VARCHAR NOT NULL REFERENCES rh_db.branches(id) ON DELETE CASCADE,
        position_id VARCHAR REFERENCES rh_db.job_positions(id),
        admission_date DATE NOT NULL,
        base_salary DECIMAL(10,2) NOT NULL,
        agreed_salary DECIMAL(10,2) NOT NULL,
        advance_percentage DECIMAL(5,2) DEFAULT 40.00,
        status rh_db.employee_status DEFAULT 'ativo' NOT NULL,
        created_at TIMESTAMP DEFAULT now() NOT NULL,
        updated_at TIMESTAMP DEFAULT now() NOT NULL
      );`,
      
      `CREATE TABLE IF NOT EXISTS rh_db.vacations (
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
      );`,
      
      `CREATE TABLE IF NOT EXISTS rh_db.terminations (
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
      );`,
      
      `CREATE TABLE IF NOT EXISTS rh_db.advances (
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
      );`,
      
      `CREATE TABLE IF NOT EXISTS rh_db.payroll (
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
      );`
    ];

    for (const query of createTablesQueries) {
      console.log(`Query: ${query}`);
      await pool.query(query);
    }

    // Create default branch
    console.log('🏢 Creating default branch...');
    const countResult = await pool.query('SELECT COUNT(*) as count FROM rh_db.branches;');
    console.log(`Query: SELECT COUNT(*) as count FROM rh_db.branches;`);
    
    if (parseInt(countResult.rows[0].count) === 0) {
      const insertQuery = `
        INSERT INTO rh_db.branches (
          fantasy_name, address, phone, email, cnpj, city, state,
          neighborhood, zip_code, active, created_at, updated_at
        ) VALUES (
          'Filial Principal',
          'Endereço da Filial Principal',
          '(00) 0000-0000',
          'contato@empresa.com',
          '00.000.000/0001-00',
          'São Paulo',
          'SP',
          'Centro',
          '00000-000',
          true,
          now(),
          now()
        );
      `;
      console.log(`Query: ${insertQuery}`);
      await pool.query(insertQuery);
      console.log('✅ Default branch created successfully!');
    }

    console.log('✅ Database migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}
