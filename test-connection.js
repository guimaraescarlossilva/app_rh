import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  console.log('🔍 Testando conexão com o banco...');
  console.log('📋 DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'Não configurada');
  
  const pool = new Pool({ 
    host: 'dpg-d0cdphs9c44c73ds27tg-a.oregon-postgres.render.com',
    port: 5432,
    database: 'nativas_db',
    user: 'nativas_db_user',
    password: 'Hu01lD4toCQHs00i0nJZZNyfr0iJL8Jl',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Tentando conectar...');
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    const result = await client.query('SELECT version()');
    console.log('📊 Versão do PostgreSQL:', result.rows[0].version);
    
    client.release();
    await pool.end();
    console.log('✅ Teste de conexão concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    console.error('🔍 Detalhes:', error);
  }
}

testConnection();
