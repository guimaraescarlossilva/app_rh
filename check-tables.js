import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

async function checkTables() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 Verificando tabelas no banco de dados...');
    
    // Verificar se o schema rh_db existe
    const schemaCheck = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = 'rh_db';
    `);
    
    if (schemaCheck.rows.length === 0) {
      console.log('❌ Schema rh_db não existe!');
      return;
    }
    
    console.log('✅ Schema rh_db existe');
    
    // Verificar tabelas no schema rh_db
    const tablesCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'rh_db'
      ORDER BY table_name;
    `);
    
    console.log('📋 Tabelas encontradas no schema rh_db:');
    tablesCheck.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Verificar especificamente a tabela branches
    const branchesCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'rh_db' 
      AND table_name = 'branches'
      ORDER BY ordinal_position;
    `);
    
    if (branchesCheck.rows.length === 0) {
      console.log('❌ Tabela branches não existe!');
    } else {
      console.log('✅ Tabela branches existe com colunas:');
      branchesCheck.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }
    
    // Verificar dados na tabela branches
    const dataCheck = await pool.query(`
      SELECT COUNT(*) as count FROM rh_db.branches;
    `);
    
    console.log(`📊 Registros na tabela branches: ${dataCheck.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Erro ao verificar tabelas:', error);
  } finally {
    await pool.end();
  }
}

checkTables().catch(console.error);
