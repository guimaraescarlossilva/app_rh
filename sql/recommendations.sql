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

-- IDX04 - Permission Groups por busca e ordenação
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permission_groups_search
  ON rh_db.permission_groups USING gin (to_tsvector('portuguese', name || ' ' || COALESCE(description, '')));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permission_groups_created_at
  ON rh_db.permission_groups (created_at DESC);

-- IDX05 - Module Permissions por grupo e módulo
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_module_permissions_group_module
  ON rh_db.module_permissions (group_id, module);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_module_permissions_group
  ON rh_db.module_permissions (group_id);

-- IDX06 - Payroll por funcionário e período
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_employee_period
  ON rh_db.payroll (employee_id, year, month);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_created_at
  ON rh_db.payroll (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_status
  ON rh_db.payroll (status);

-- IDX07 - User Groups e User Branches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_groups_user
  ON rh_db.user_groups (user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_groups_group
  ON rh_db.user_groups (group_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_branches_user
  ON rh_db.user_branches (user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_branches_branch
  ON rh_db.user_branches (branch_id);

-- IDX08 - Vacations por employee/status para estatísticas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vacations_employee_status
  ON rh_db.vacations (employee_id, status);

-- Rollback commands (se necessário)
-- DROP INDEX IF EXISTS idx_branches_updated_at;
-- DROP INDEX IF EXISTS idx_branches_search;
-- DROP INDEX IF EXISTS idx_employees_status_updated_at;
-- DROP INDEX IF EXISTS idx_employees_branch_status;
-- DROP INDEX IF EXISTS idx_users_email;
-- DROP INDEX IF EXISTS idx_users_active_created;
-- DROP INDEX IF EXISTS idx_permission_groups_search;
-- DROP INDEX IF EXISTS idx_permission_groups_created_at;
-- DROP INDEX IF EXISTS idx_module_permissions_group_module;
-- DROP INDEX IF EXISTS idx_module_permissions_group;
-- DROP INDEX IF EXISTS idx_payroll_employee_period;
-- DROP INDEX IF EXISTS idx_payroll_created_at;
-- DROP INDEX IF EXISTS idx_payroll_status;
-- DROP INDEX IF EXISTS idx_user_groups_user;
-- DROP INDEX IF EXISTS idx_user_groups_group;
-- DROP INDEX IF EXISTS idx_user_branches_user;
-- DROP INDEX IF EXISTS idx_user_branches_branch;
-- DROP INDEX IF EXISTS idx_vacations_employee_status;
