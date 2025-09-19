import pkg from 'pg';
const { Pool } = pkg;

// Database configuration for Render PostgreSQL
export const pool = new Pool({ 
  host: 'dpg-d0cdphs9c44c73ds27tg-a.oregon-postgres.render.com',
  port: 5432,
  database: 'nativas_db',
  user: 'nativas_db_user',
  password: 'Hu01lD4toCQHs00i0nJZZNyfr0iJL8Jl',
  ssl: { rejectUnauthorized: false }
});