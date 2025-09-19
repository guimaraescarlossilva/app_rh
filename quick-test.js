import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({ 
  host: 'dpg-d0cdphs9c44c73ds27tg-a.oregon-postgres.render.com',
  port: 5432,
  database: 'nativas_db',
  user: 'nativas_db_user',
  password: 'Hu01lD4toCQHs00i0nJZZNyfr0iJL8Jl',
  ssl: { rejectUnauthorized: false }
});

async function quickTest() {
  try {
    console.log('🔍 Testando conexão...');
    const client = await pool.connect();
    
    console.log('✅ Conectado! Testando consulta...');
    const result = await client.query('SELECT COUNT(*) as count FROM rh_db.branches');
    console.log('📊 Filiais no banco:', result.rows[0].count);
    
    client.release();
    await pool.end();
    console.log('✅ Teste concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

quickTest();
