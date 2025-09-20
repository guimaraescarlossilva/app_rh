import { prisma } from './prisma';
import bcrypt from 'bcrypt';

async function createDefaultUser() {
  try {
    console.log('🔄 [DEFAULT_USER] Criando usuário padrão...');

    // Verifica se já existe um usuário com este CPF
    const existingUser = await prisma.user.findUnique({
      where: { cpf: '027.399.371-21' }
    });

    if (existingUser) {
      console.log('⚠️ [DEFAULT_USER] Usuário Carlos já existe');
      return;
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash('Carlinhos123', 10);

    // Cria o usuário
    const user = await prisma.user.create({
      data: {
        name: 'Carlos',
        email: 'carloseduguimaress@gmail.com',
        cpf: '027.399.371-21',
        password: hashedPassword,
        active: true
      }
    });

    console.log('✅ [DEFAULT_USER] Usuário Carlos criado com sucesso:', {
      id: user.id,
      name: user.name,
      email: user.email,
      cpf: user.cpf
    });

    // Cria um grupo de permissão padrão (Admin)
    const adminGroup = await prisma.permissionGroup.upsert({
      where: { name: 'Administrador' },
      update: {},
      create: {
        name: 'Administrador',
        description: 'Grupo com todas as permissões do sistema'
      }
    });

    console.log('✅ [DEFAULT_USER] Grupo Administrador criado/encontrado');

    // Associa o usuário ao grupo de administrador
    await prisma.userGroup.upsert({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: adminGroup.id
        }
      },
      update: {},
      create: {
        userId: user.id,
        groupId: adminGroup.id
      }
    });

    console.log('✅ [DEFAULT_USER] Usuário associado ao grupo Administrador');

    // Cria permissões para todos os módulos
    const modules = [
      'users', 'branches', 'employees', 'vacations', 
      'terminations', 'advances', 'payroll', 'permissions'
    ];

    for (const module of modules) {
      await prisma.modulePermission.upsert({
        where: {
          groupId_module: {
            groupId: adminGroup.id,
            module: module
          }
        },
        update: {
          canRead: true,
          canCreate: true,
          canUpdate: true,
          canDelete: true
        },
        create: {
          groupId: adminGroup.id,
          module: module,
          canRead: true,
          canCreate: true,
          canUpdate: true,
          canDelete: true
        }
      });
    }

    console.log('✅ [DEFAULT_USER] Permissões de administrador criadas para todos os módulos');

    // Cria uma filial padrão se não existir
    const defaultBranch = await prisma.branch.upsert({
      where: { cnpj: '12.345.678/0001-90' },
      update: {},
      create: {
        fantasyName: 'Restaurante Principal',
        address: 'Rua Principal, 123',
        phone: '(11) 99999-9999',
        email: 'contato@restaurante.com',
        cnpj: '12.345.678/0001-90',
        city: 'São Paulo',
        state: 'SP',
        neighborhood: 'Centro',
        zipCode: '01234-567',
        active: true
      }
    });

    console.log('✅ [DEFAULT_USER] Filial padrão criada/encontrada');

    // Associa o usuário à filial padrão
    await prisma.userBranch.upsert({
      where: {
        userId_branchId: {
          userId: user.id,
          branchId: defaultBranch.id
        }
      },
      update: {},
      create: {
        userId: user.id,
        branchId: defaultBranch.id
      }
    });

    console.log('✅ [DEFAULT_USER] Usuário associado à filial padrão');

    console.log('🎉 [DEFAULT_USER] Usuário padrão criado com sucesso!');
    console.log('📋 [DEFAULT_USER] Credenciais:');
    console.log('   CPF: 027.399.371-21');
    console.log('   Senha: Carlinhos123');

  } catch (error) {
    console.error('❌ [DEFAULT_USER] Erro ao criar usuário padrão:', error);
    throw error;
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  createDefaultUser()
    .then(() => {
      console.log('✅ [DEFAULT_USER] Script executado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ [DEFAULT_USER] Erro no script:', error);
      process.exit(1);
    });
}

export { createDefaultUser };
