import { prisma } from './prisma';

async function testConnection() {
  try {
    console.log('🔍 Testando conexão com o banco de dados...');
    
    // Testa a conexão
    await prisma.$connect();
    console.log('✅ Conectado ao Prisma');
    
    // Testa uma query simples
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query simples executada:', result);
    
    // Testa se existe usuário admin
    const adminUser = await prisma.user.findUnique({
      where: { cpf: '027.399.371-21' }
    });
    
    if (adminUser) {
      console.log('✅ Usuário admin encontrado:', {
        id: adminUser.id,
        name: adminUser.name,
        cpf: adminUser.cpf,
        active: adminUser.active
      });
    } else {
      console.log('❌ Usuário admin não encontrado');
    }
    
    console.log('✅ Teste de conexão concluído com sucesso');
  } catch (error) {
    console.error('❌ Erro no teste de conexão:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
