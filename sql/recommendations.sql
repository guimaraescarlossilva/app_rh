-- Índices sugeridos para reduzir full scans e ordenar listas críticas

-- IDX01: branches ordenadas por updated_at (usado em dashboards e listagens)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_branches_updated_at
  ON rh_db.branches (updated_at DESC);
-- Rollback:
-- DROP INDEX IF EXISTS idx_branches_updated_at;

-- IDX02: employees por status + updated_at para filtros frequentes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_status_updated_at
  ON rh_db.employees (status, updated_at DESC);
-- Rollback:
-- DROP INDEX IF EXISTS idx_employees_status_updated_at;

-- IDX03: user_groups por user_id (evita seq scan nas permissões do usuário)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_groups_user
  ON rh_db.user_groups (user_id);
-- Rollback:
-- DROP INDEX IF EXISTS idx_user_groups_user;

-- IDX04: module_permissions por group_id/module (consulta em dashboards de autorização)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_module_permissions_group_module
  ON rh_db.module_permissions (group_id, module);
-- Rollback:
-- DROP INDEX IF EXISTS idx_module_permissions_group_module;

-- IDX05: vacations por employee/status para estatísticas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vacations_employee_status
  ON rh_db.vacations (employee_id, status);
-- Rollback:
-- DROP INDEX IF EXISTS idx_vacations_employee_status;

-- IDX06: payroll por employee/mês para histórico e relatórios
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_employee_period
  ON rh_db.payroll (employee_id, year, month);
-- Rollback:
-- DROP INDEX IF EXISTS idx_payroll_employee_period;
