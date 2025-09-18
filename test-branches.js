import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "./shared/schema.js";

dotenv.config();

async function testBranches() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const db = drizzle(pool, { schema });

  try {
    console.log('🔍 Testando consulta de branches...');
    
    // Testar consulta direta
    const branches = await db.select().from(schema.branches);
    console.log('✅ Consulta direta funcionou:', branches.length, 'registros');
    console.log('📋 Dados:', JSON.stringify(branches, null, 2));
    
    // Testar inserção
    console.log('🔍 Testando inserção de branch...');
    const newBranch = {
      fantasyName: "Teste Branch",
      address: "Rua Teste",
      phone: "(11) 99999-9999",
      email: "teste@teste.com",
      cnpj: "12.345.678/0001-90",
      city: "São Paulo",
      state: "SP",
      neighborhood: "Centro",
      zipCode: "01234-567",
      active: true
    };
    
    const [insertedBranch] = await db.insert(schema.branches).values(newBranch).returning();
    console.log('✅ Inserção funcionou:', insertedBranch);
    
    // Remover o registro de teste
    await db.delete(schema.branches).where(schema.branches.id.eq(insertedBranch.id));
    console.log('✅ Registro de teste removido');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await pool.end();
  }
}

testBranches().catch(console.error);
