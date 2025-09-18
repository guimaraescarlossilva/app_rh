import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

async function testSimple() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 Testando consulta simples de branches...');
    
    // Testar consulta direta com SQL
    const result = await pool.query(`
      SELECT id, fantasy_name, address, phone, email, cnpj, city, state, neighborhood, zip_code, active, created_at, updated_at
      FROM rh_db.branches 
      ORDER BY fantasy_name
    `);
    
    console.log('✅ Consulta SQL funcionou:', result.rows.length, 'registros');
    console.log('📋 Dados:', JSON.stringify(result.rows, null, 2));
    
    // Testar inserção com SQL
    console.log('🔍 Testando inserção com SQL...');
    const insertResult = await pool.query(`
      INSERT INTO rh_db.branches (
        fantasy_name, address, phone, email, cnpj, city, state, 
        neighborhood, zip_code, active, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now()
      ) RETURNING *
    `, [
      "Teste Branch SQL",
      "Rua Teste SQL",
      "(11) 99999-9999",
      "teste@teste.com",
      "12.345.678/0001-91",
      "São Paulo",
      "SP",
      "Centro",
      "01234-567",
      true
    ]);
    
    console.log('✅ Inserção SQL funcionou:', insertResult.rows[0]);
    
    // Remover o registro de teste
    await pool.query('DELETE FROM rh_db.branches WHERE id = $1', [insertResult.rows[0].id]);
    console.log('✅ Registro de teste removido');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await pool.end();
  }
}

testSimple().catch(console.error);
