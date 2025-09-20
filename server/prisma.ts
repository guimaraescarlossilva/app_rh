import { PrismaClient } from '../generated/prisma';

// Configuração do Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query', 'error', 'warn'],
  errorFormat: 'pretty',
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Função para conectar ao banco
export async function connectPrisma() {
  try {
    await prisma.$connect();
    console.log('✅ [PRISMA] Conectado ao banco de dados');
  } catch (error) {
    console.error('❌ [PRISMA] Erro ao conectar ao banco:', error);
    throw error;
  }
}

// Função para desconectar do banco
export async function disconnectPrisma() {
  try {
    await prisma.$disconnect();
    console.log('✅ [PRISMA] Desconectado do banco de dados');
  } catch (error) {
    console.error('❌ [PRISMA] Erro ao desconectar do banco:', error);
  }
}

// Função para verificar a conexão
export async function checkPrismaConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('❌ [PRISMA] Erro na verificação de conexão:', error);
    return false;
  }
}
