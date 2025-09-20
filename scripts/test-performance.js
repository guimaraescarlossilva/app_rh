/**
 * Script para testar as melhorias de performance implementadas
 * Executa testes de performance para banco de dados, cache e API
 */

const { performance } = require('perf_hooks');
const { pool, getPoolStats } = require('../server/db');
const { MemoryCache, getStats } = require('../server/cache');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Cores para saída no console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

/**
 * Executa um teste de performance e exibe os resultados
 * @param {string} name - Nome do teste
 * @param {Function} fn - Função a ser testada
 * @param {number} iterations - Número de iterações
 */
async function runPerformanceTest(name, fn, iterations = 100) {
  console.log(`${colors.bright}Executando teste: ${colors.cyan}${name}${colors.reset}`);
  
  const times = [];
  let errors = 0;
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    try {
      await fn(i);
      const end = performance.now();
      times.push(end - start);
    } catch (error) {
      errors++;
      console.error(`${colors.red}Erro na iteração ${i}:${colors.reset}`, error.message);
    }
    
    // Exibir progresso a cada 10 iterações
    if ((i + 1) % 10 === 0) {
      process.stdout.write(`${colors.yellow}${i + 1}/${iterations}${colors.reset} `);
    }
  }
  
  console.log('\n');
  
  if (times.length === 0) {
    console.log(`${colors.red}Todas as iterações falharam${colors.reset}`);
    return;
  }
  
  // Calcular estatísticas
  const total = times.reduce((sum, time) => sum + time, 0);
  const avg = total / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  
  // Ordenar tempos para calcular percentis
  times.sort((a, b) => a - b);
  const p50 = times[Math.floor(times.length * 0.5)];
  const p90 = times[Math.floor(times.length * 0.9)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const p99 = times[Math.floor(times.length * 0.99)];
  
  // Exibir resultados
  console.log(`${colors.bright}Resultados para ${colors.cyan}${name}${colors.reset}:`);
  console.log(`  Iterações: ${colors.green}${times.length}${colors.reset} (${colors.red}${errors} falhas${colors.reset})`);
  console.log(`  Tempo total: ${colors.green}${total.toFixed(2)}ms${colors.reset}`);
  console.log(`  Tempo médio: ${colors.green}${avg.toFixed(2)}ms${colors.reset}`);
  console.log(`  Tempo mínimo: ${colors.green}${min.toFixed(2)}ms${colors.reset}`);
  console.log(`  Tempo máximo: ${colors.green}${max.toFixed(2)}ms${colors.reset}`);
  console.log(`  Percentil 50: ${colors.green}${p50.toFixed(2)}ms${colors.reset}`);
  console.log(`  Percentil 90: ${colors.green}${p90.toFixed(2)}ms${colors.reset}`);
  console.log(`  Percentil 95: ${colors.green}${p95.toFixed(2)}ms${colors.reset}`);
  console.log(`  Percentil 99: ${colors.green}${p99.toFixed(2)}ms${colors.reset}`);
  console.log('');
  
  return { total, avg, min, max, p50, p90, p95, p99, errors, iterations: times.length };
}

/**
 * Testes de performance para o banco de dados
 */
async function testDatabasePerformance() {
  console.log(`\n${colors.bright}${colors.cyan}=== TESTES DE PERFORMANCE DO BANCO DE DADOS ===${colors.reset}\n`);
  
  // Teste de conexão com o banco
  await runPerformanceTest('Conexão com o banco', async () => {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
    } finally {
      client.release();
    }
  }, 50);
  
  // Teste de consulta simples
  await runPerformanceTest('Consulta simples', async () => {
    const client = await pool.connect();
    try {
      await client.query('SELECT * FROM "User" LIMIT 10');
    } finally {
      client.release();
    }
  }, 50);
  
  // Teste de consulta com join
  await runPerformanceTest('Consulta com join', async () => {
    const client = await pool.connect();
    try {
      await client.query(`
        SELECT e.*, b.name as branch_name, j.title as job_title 
        FROM "Employee" e 
        JOIN "Branch" b ON e."branchId" = b.id 
        JOIN "JobPosition" j ON e."jobPositionId" = j.id 
        LIMIT 10
      `);
    } finally {
      client.release();
    }
  }, 50);
  
  // Teste com Prisma
  await runPerformanceTest('Consulta com Prisma', async () => {
    await prisma.user.findMany({
      take: 10,
    });
  }, 50);
  
  // Exibir estatísticas do pool
  console.log(`${colors.bright}Estatísticas do pool:${colors.reset}`);
  const poolStats = getPoolStats();
  console.log(`  Total de queries: ${colors.green}${poolStats.totalQueries}${colors.reset}`);
  console.log(`  Queries lentas: ${colors.yellow}${poolStats.slowQueries}${colors.reset}`);
  console.log(`  Tempo médio: ${colors.green}${poolStats.averageTime.toFixed(2)}ms${colors.reset}`);
  console.log(`  Tamanho do pool: ${colors.green}${poolStats.poolSize}${colors.reset}`);
  console.log(`  Clientes ativos: ${colors.green}${poolStats.activeClients}${colors.reset}`);
  console.log(`  Clientes inativos: ${colors.green}${poolStats.idleClients}${colors.reset}`);
  console.log('');
}

/**
 * Testes de performance para o cache
 */
async function testCachePerformance() {
  console.log(`\n${colors.bright}${colors.cyan}=== TESTES DE PERFORMANCE DO CACHE ===${colors.reset}\n`);
  
  const cache = new MemoryCache();
  
  // Teste de escrita no cache
  await runPerformanceTest('Escrita no cache', async (i) => {
    cache.set(`key-${i}`, { value: `value-${i}` }, 60000);
  }, 1000);
  
  // Teste de leitura do cache (hit)
  await runPerformanceTest('Leitura do cache (hit)', async (i) => {
    cache.get(`key-${i % 1000}`);
  }, 5000);
  
  // Teste de leitura do cache (miss)
  await runPerformanceTest('Leitura do cache (miss)', async (i) => {
    cache.get(`nonexistent-key-${i}`);
  }, 1000);
  
  // Exibir estatísticas do cache
  console.log(`${colors.bright}Estatísticas do cache:${colors.reset}`);
  const cacheStats = cache.getStats();
  console.log(`  Total de entradas: ${colors.green}${cacheStats.size}${colors.reset}`);
  console.log(`  Hits: ${colors.green}${cacheStats.hits}${colors.reset}`);
  console.log(`  Misses: ${colors.yellow}${cacheStats.misses}${colors.reset}`);
  console.log(`  Hit rate: ${colors.green}${cacheStats.hitRate.toFixed(2)}%${colors.reset}`);
  console.log(`  Uso de memória estimado: ${colors.green}${(cacheStats.memoryUsage / 1024 / 1024).toFixed(2)} MB${colors.reset}`);
  console.log('');
}

/**
 * Função principal para executar todos os testes
 */
async function runAllTests() {
  console.log(`${colors.bright}${colors.cyan}=== INICIANDO TESTES DE PERFORMANCE ===${colors.reset}\n`);
  
  try {
    await testDatabasePerformance();
    await testCachePerformance();
    
    console.log(`${colors.bright}${colors.green}=== TESTES DE PERFORMANCE CONCLUÍDOS ===${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}Erro ao executar testes:${colors.reset}`, error);
  } finally {
    // Fechar conexões
    await prisma.$disconnect();
    await pool.end();
  }
}

// Executar testes
runAllTests();