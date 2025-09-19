import "dotenv/config";
import pkg from "pg";

const { Pool } = pkg;

const toInt = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não configurado");
}

export const pool = new Pool({
  connectionString,
  max: toInt(process.env.PG_POOL_MAX, 20),
  idleTimeoutMillis: toInt(process.env.PG_IDLE_TIMEOUT_MS, 30_000),
  connectionTimeoutMillis: toInt(process.env.PG_CONNECTION_TIMEOUT_MS, 5_000),
  ssl: { rejectUnauthorized: false },
});

export async function withConnection<T>(fn: (client: pkg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

// Health check function
export async function checkConnection(): Promise<boolean> {
  try {
    await withConnection(async (client) => {
      await client.query('SELECT 1');
    });
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}