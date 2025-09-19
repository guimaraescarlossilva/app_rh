-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Índices B-tree para performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permission_groups_created_at
  ON rh_db.permission_groups (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at
  ON rh_db.users (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_created_at
  ON rh_db.payroll (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_module_permissions_group_module
  ON rh_db.module_permissions (group_id, module);

-- Índices GIN para busca full-text
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permission_groups_search
  ON rh_db.permission_groups USING gin (to_tsvector('portuguese', name || ' ' || COALESCE(description, '')));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_search
  ON rh_db.users USING gin (to_tsvector('portuguese', name || ' ' || email));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_search
  ON rh_db.employees USING gin (to_tsvector('portuguese', name || ' ' || cpf));

-- Índices trigram para busca ILIKE
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permission_groups_name_trgm
  ON rh_db.permission_groups USING gin (name gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_name_trgm
  ON rh_db.users USING gin (name gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_trgm
  ON rh_db.users USING gin (email gin_trgm_ops);

-- Índices para JOINs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_groups_user
  ON rh_db.user_groups (user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_groups_group
  ON rh_db.user_groups (group_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_branches_user
  ON rh_db.user_branches (user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_branches_branch
  ON rh_db.user_branches (branch_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_module_permissions_group
  ON rh_db.module_permissions (group_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_branch
  ON rh_db.employees (branch_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_employee
  ON rh_db.payroll (employee_id);

-- Rollback commands (se necessário)
-- DROP INDEX IF EXISTS idx_permission_groups_created_at;
-- DROP INDEX IF EXISTS idx_users_created_at;
-- DROP INDEX IF EXISTS idx_payroll_created_at;
-- DROP INDEX IF EXISTS idx_module_permissions_group_module;
-- DROP INDEX IF EXISTS idx_permission_groups_search;
-- DROP INDEX IF EXISTS idx_users_search;
-- DROP INDEX IF EXISTS idx_employees_search;
-- DROP INDEX IF EXISTS idx_permission_groups_name_trgm;
-- DROP INDEX IF EXISTS idx_users_name_trgm;
-- DROP INDEX IF EXISTS idx_users_email_trgm;
-- DROP INDEX IF EXISTS idx_user_groups_user;
-- DROP INDEX IF EXISTS idx_user_groups_group;
-- DROP INDEX IF EXISTS idx_user_branches_user;
-- DROP INDEX IF EXISTS idx_user_branches_branch;
-- DROP INDEX IF EXISTS idx_module_permissions_group;
-- DROP INDEX IF EXISTS idx_employees_branch;
-- DROP INDEX IF EXISTS idx_payroll_employee;
