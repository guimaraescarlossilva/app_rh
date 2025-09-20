import { withConnection } from './db';
import bcrypt from 'bcrypt';

async function createDefaultUser() {
  try {
    console.log('🔄 [DEFAULT_USER] Criando usuário padrão...');

    // Verifica se já existe um usuário com este CPF
    const existingUser = await withConnection(async (client) => {
      const { rows } = await client.query(
        'SELECT id FROM rh_db.users WHERE cpf = $1',
        ['027.399.371-21']
      );
      return rows[0];
    });

    if (existingUser) {
      console.log('⚠️ [DEFAULT_USER] Usuário Carlos já existe');
      return;
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash('Carlinhos123', 10);

    // Cria o usuário
    const user = await withConnection(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO rh_db.users (name, email, cpf, password, active) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, name, email, cpf`,
        ['Carlos', 'carloseduguimaress@gmail.com', '027.399.371-21', hashedPassword, true]
      );
      return rows[0];
    });

    console.log('✅ [DEFAULT_USER] Usuário Carlos criado com sucesso');
    console.log('📧 Email: carloseduguimaress@gmail.com');
    console.log('🔑 Senha: Carlinhos123');
    console.log('🆔 CPF: 027.399.371-21');

    // Verifica se existe o grupo de administradores
    let adminGroup = await withConnection(async (client) => {
      const { rows } = await client.query(
        'SELECT id FROM rh_db.permission_groups WHERE name = $1',
        ['Administradores']
      );
      return rows[0];
    });

    if (!adminGroup) {
      // Cria o grupo de administradores
      adminGroup = await withConnection(async (client) => {
        const { rows } = await client.query(
          `INSERT INTO rh_db.permission_groups (name, description) 
           VALUES ($1, $2) 
           RETURNING id`,
          ['Administradores', 'Grupo de administradores com acesso total']
        );
        return rows[0];
      });
      console.log('✅ [DEFAULT_USER] Grupo Administradores criado');
    }

    // Verifica se existe a filial Matriz
    let matrizBranch = await withConnection(async (client) => {
      const { rows } = await client.query(
        'SELECT id FROM rh_db.branches WHERE fantasy_name = $1',
        ['Matriz']
      );
      return rows[0];
    });

    if (!matrizBranch) {
      // Cria a filial Matriz
      matrizBranch = await withConnection(async (client) => {
        const { rows } = await client.query(
          `INSERT INTO rh_db.branches (fantasy_name, address, cnpj, city, state, neighborhood, zip_code, active) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
           RETURNING id`,
          ['Matriz', 'Rua Exemplo, 123', '00.000.000/0001-00', 'Cidade Exemplo', 'EX', 'Bairro Exemplo', '00000-000', true]
        );
        return rows[0];
      });
      console.log('✅ [DEFAULT_USER] Filial Matriz criada');
    }

    // Associa o usuário ao grupo de administradores
    await withConnection(async (client) => {
      // Verifica se já existe a associação
      const { rows } = await client.query(
        'SELECT id FROM rh_db.user_groups WHERE user_id = $1 AND group_id = $2',
        [user.id, adminGroup.id]
      );
      
      if (rows.length === 0) {
        await client.query(
          'INSERT INTO rh_db.user_groups (user_id, group_id) VALUES ($1, $2)',
          [user.id, adminGroup.id]
        );
      }
    });
    console.log('✅ [DEFAULT_USER] Usuário associado ao grupo Administradores');

    // Associa o usuário à filial Matriz
    await withConnection(async (client) => {
      // Verifica se já existe a associação
      const { rows } = await client.query(
        'SELECT id FROM rh_db.user_branches WHERE user_id = $1 AND branch_id = $2',
        [user.id, matrizBranch.id]
      );
      
      if (rows.length === 0) {
        await client.query(
          'INSERT INTO rh_db.user_branches (user_id, branch_id) VALUES ($1, $2)',
          [user.id, matrizBranch.id]
        );
      }
    });
    console.log('✅ [DEFAULT_USER] Usuário associado à filial Matriz');

    // Define permissões completas para o grupo de administradores
    const modules = ['users', 'branches', 'employees', 'permissions', 'payroll', 'vacations', 'terminations', 'advances', 'job_positions'];
    
    for (const module of modules) {
      await withConnection(async (client) => {
        await client.query(
          `INSERT INTO rh_db.module_permissions (group_id, module, can_read, can_create, can_update, can_delete) 
           VALUES ($1, $2, $3, $4, $5, $6) 
           ON CONFLICT (group_id, module) DO UPDATE SET 
           can_read = $3, can_create = $4, can_update = $5, can_delete = $6`,
          [adminGroup.id, module, true, true, true, true]
        );
      });
    }
    console.log('✅ [DEFAULT_USER] Permissões completas definidas para o grupo Administradores');

  } catch (error) {
    console.error('❌ [DEFAULT_USER] Erro ao criar usuário padrão:', error);
    throw error;
  }
}

// Script pode ser executado diretamente se necessário
// Para executar: npx tsx server/create-default-user.ts

export { createDefaultUser };