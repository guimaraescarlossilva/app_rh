-- Índices recomendados para performance
-- Execute estes comandos no banco PostgreSQL

-- IDX01 - Branches por ordenação/busca
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_branches_updated_at
  ON rh_db.branches (updated_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_branches_search
  ON rh_db.branches USING gin (to_tsvector('portuguese', fantasy_name || ' ' || cnpj));

-- IDX02 - Employees por status + ordenação
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_status_updated_at
  ON rh_db.employees (status, updated_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_branch_status
  ON rh_db.employees (branch_id, status);

-- IDX03 - Users por email e status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email
  ON rh_db.users (email);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_created
  ON rh_db.users (active, created_at DESC);

-- Rollback commands (se necessário)
-- DROP INDEX IF EXISTS idx_branches_updated_at;
-- DROP INDEX IF EXISTS idx_branches_search;
-- DROP INDEX IF EXISTS idx_employees_status_updated_at;
-- DROP INDEX IF EXISTS idx_employees_branch_status;
-- DROP INDEX IF EXISTS idx_users_email;
-- DROP INDEX IF EXISTS idx_users_active_created;
