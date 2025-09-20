import { pool, withConnection } from "./db";

export async function addCpfField() {
  try {
    console.log('🔄 [MIGRATION] Adicionando campo CPF à tabela users...');

    // Verifica se o campo CPF já existe
    const checkField = await withConnection(async (client) => {
      const { rows } = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'rh_db' 
        AND table_name = 'users' 
        AND column_name = 'cpf'
      `);
      return rows.length > 0;
    });

    if (checkField) {
      console.log('✅ [MIGRATION] Campo CPF já existe na tabela users');
      return;
    }

    // Adiciona o campo CPF
    await withConnection(async (client) => {
      await client.query(`
        ALTER TABLE rh_db.users 
        ADD COLUMN cpf TEXT UNIQUE
      `);
    });

    console.log('✅ [MIGRATION] Campo CPF adicionado à tabela users');

    // Atualiza usuários existentes com CPF padrão se necessário
    await withConnection(async (client) => {
      const { rows } = await client.query(`
        SELECT id, email FROM rh_db.users WHERE cpf IS NULL
      `);

      for (const user of rows) {
        // Gera um CPF temporário baseado no email
        const tempCpf = `000.000.000-${String(user.id).slice(-2).padStart(2, '0')}`;
        
        await client.query(`
          UPDATE rh_db.users 
          SET cpf = $1 
          WHERE id = $2
        `, [tempCpf, user.id]);
      }
    });

    console.log('✅ [MIGRATION] CPFs temporários atribuídos aos usuários existentes');

  } catch (error) {
    console.error('❌ [MIGRATION] Erro ao adicionar campo CPF:', error);
    throw error;
  }
}

// Script pode ser executado diretamente se necessário
// Para executar: npx tsx server/add-cpf-field.ts
