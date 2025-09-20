import "dotenv/config";
import pkg from "pg";
import { performance } from 'perf_hooks';

const { Pool } = pkg;

const toInt = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não configurado");
}

// Configurações otimizadas para o pool de conexões
export const pool = new Pool({
  connectionString,
  max: toInt(process.env.PG_POOL_MAX, 20),         // Máximo de conexões no pool
  min: toInt(process.env.PG_POOL_MIN, 2),          // Mínimo de conexões no pool
  idleTimeoutMillis: toInt(process.env.PG_IDLE_TIMEOUT_MS, 30_000),  // Tempo máximo de inatividade
  connectionTimeoutMillis: toInt(process.env.PG_CONNECTION_TIMEOUT_MS, 5_000), // Timeout de conexão
  allowExitOnIdle: false,                          // Não encerra o processo quando o pool está ocioso
  ssl: { rejectUnauthorized: false },
});

// Monitoramento de eventos do pool
pool.on('connect', () => {
  console.log('🔌 [DB] Nova conexão estabelecida com o banco de dados');
});

pool.on('error', (err) => {
  console.error('❌ [DB] Erro no pool de conexões:', err);
});

// Estatísticas do pool
let queryCount = 0;
let totalQueryTime = 0;
let slowQueryCount = 0;
const SLOW_QUERY_THRESHOLD = 500; // ms

// Função para executar queries com monitoramento de performance
export async function withConnection<T>(fn: (client: pkg.PoolClient) => Promise<T>, label?: string): Promise<T> {
  const startTime = performance.now();
  const client = await pool.connect();
  const queryLabel = label || 'Consulta anônima';
  
  try {
    queryCount++;
    const result = await fn(client);
    
    const duration = performance.now() - startTime;
    totalQueryTime += duration;
    
    // Registra consultas lentas
    if (duration > SLOW_QUERY_THRESHOLD) {
      slowQueryCount++;
      console.warn(`🐌 [DB] Consulta lenta (${duration.toFixed(2)}ms): ${queryLabel}`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ [DB] Erro na consulta (${queryLabel}):`, error);
    throw error;
  } finally {
    client.release();
  }
}

// Função para executar uma query simples com monitoramento
export async function executeQuery<T>(query: string, params: any[] = [], label?: string): Promise<T[]> {
  return withConnection(async (client) => {
    const result = await client.query(query, params);
    return result.rows as T[];
  }, label || query.slice(0, 50));
}

// Health check function com timeout
export async function checkConnection(timeoutMs: number = 5000): Promise<boolean> {
  try {
    // Cria uma promise com timeout
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => reject(new Error('Database connection timeout')), timeoutMs);
    });
    
    // Promise da consulta
    const queryPromise = withConnection(async (client) => {
      await client.query('SELECT 1');
      return true;
    }, 'Health Check');
    
    // Retorna o primeiro que resolver
    return await Promise.race([queryPromise, timeoutPromise]);
  } catch (error) {
    console.error('❌ [DB] Database connection check failed:', error);
    return false;
  }
}

// Função para obter estatísticas do pool
export function getPoolStats() {
  const avgQueryTime = queryCount > 0 ? totalQueryTime / queryCount : 0;
  
  return {
    totalQueries: queryCount,
    slowQueries: slowQueryCount,
    avgQueryTime: `${avgQueryTime.toFixed(2)}ms`,
    slowQueryPercentage: queryCount > 0 ? `${((slowQueryCount / queryCount) * 100).toFixed(2)}%` : '0%',
    poolSize: pool.totalCount,
    idleConnections: pool.idleCount,
    waitingClients: pool.waitingCount
  };
}