import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, text, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { asc } from 'drizzle-orm';

dotenv.config();

// Definir a tabela branches com schema correto
const branches = pgTable("branches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fantasyName: text("fantasy_name").notNull(),
  address: text("address").notNull(),
  phone: text("phone"),
  email: text("email"),
  cnpj: text("cnpj").notNull().unique(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  neighborhood: text("neighborhood").notNull(),
  zipCode: text("zip_code").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
}, {
  schema: 'rh_db'  // Especificar o schema
});

async function testDrizzle() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const db = drizzle(pool, { schema: { branches } });

  try {
    console.log('🔍 Testando Drizzle ORM com schema rh_db...');
    
    // Testar consulta com Drizzle
    const result = await db.select().from(branches).orderBy(asc(branches.fantasyName));
    console.log('✅ Consulta Drizzle funcionou:', result.length, 'registros');
    console.log('📋 Dados:', JSON.stringify(result, null, 2));
    
    // Testar inserção com Drizzle
    console.log('🔍 Testando inserção com Drizzle...');
    const newBranch = {
      fantasyName: "Teste Drizzle Schema",
      address: "Rua Drizzle Schema",
      phone: "(11) 77777-7777",
      email: "drizzle-schema@teste.com",
      cnpj: "12.345.678/0001-93",
      city: "São Paulo",
      state: "SP",
      neighborhood: "Centro",
      zipCode: "01234-569",
      active: true
    };
    
    const [insertedBranch] = await db.insert(branches).values(newBranch).returning();
    console.log('✅ Inserção Drizzle funcionou:', insertedBranch);
    
    // Remover o registro de teste
    await db.delete(branches).where(branches.id.eq(insertedBranch.id));
    console.log('✅ Registro de teste removido');
    
  } catch (error) {
    console.error('❌ Erro no teste Drizzle:', error);
  } finally {
    await pool.end();
  }
}

testDrizzle().catch(console.error);
