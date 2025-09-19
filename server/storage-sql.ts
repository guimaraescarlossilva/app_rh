import { pool, withConnection } from "./db";

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  active: boolean;
  createdAt: Date;
}

export interface InsertUser {
  name: string;
  email: string;
  password: string;
  active?: boolean;
}

export interface Branch {
  id: string;
  fantasyName: string;
  address: string;
  phone?: string;
  email?: string;
  cnpj: string;
  city: string;
  state: string;
  neighborhood: string;
  zipCode: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertBranch {
  fantasyName: string;
  address: string;
  phone?: string;
  email?: string;
  cnpj: string;
  city: string;
  state: string;
  neighborhood: string;
  zipCode: string;
  active?: boolean;
}

export interface Employee {
  id: string;
  name: string;
  cpf: string;
  email?: string;
  phone?: string;
  address?: string;
  branchId: string;
  positionId?: string;
  admissionDate: Date;
  baseSalary: number;
  agreedSalary: number;
  advancePercentage: number;
  status: 'ativo' | 'inativo' | 'afastado';
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertEmployee {
  name: string;
  cpf: string;
  email?: string;
  phone?: string;
  address?: string;
  branchId: string;
  positionId?: string;
  admissionDate: Date;
  baseSalary: number;
  agreedSalary: number;
  advancePercentage?: number;
  status?: 'ativo' | 'inativo' | 'afastado';
}

export interface PermissionGroup {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface InsertPermissionGroup {
  name: string;
  description?: string;
}

export interface ModulePermission {
  id: string;
  groupId: string;
  module: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface InsertModulePermission {
  groupId: string;
  module: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface PayrollEntry {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  baseSalary: number;
  agreedSalary: number;
  advance: number;
  nightShiftAdditional: number;
  nightShiftDsr: number;
  overtime: number;
  overtimeDsr: number;
  vacationBonus: number;
  fiveYearBonus: number;
  positionGratification: number;
  generalGratification: number;
  cashierGratification: number;
  familyAllowance: number;
  holidayPay: number;
  unhealthiness: number;
  maternityLeave: number;
  tips: number;
  others: number;
  vouchers: number;
  grossAmount: number;
  inss: number;
  inssVacation: number;
  irpf: number;
  unionFee: number;
  absences: number;
  absenceReason?: string;
  netAmount: number;
  status: string;
  processedAt?: Date;
  createdAt: Date;
}

export interface InsertPayrollEntry {
  employeeId: string;
  month: number;
  year: number;
  baseSalary: number;
  agreedSalary: number;
  advance?: number;
  nightShiftAdditional?: number;
  nightShiftDsr?: number;
  overtime?: number;
  overtimeDsr?: number;
  vacationBonus?: number;
  fiveYearBonus?: number;
  positionGratification?: number;
  generalGratification?: number;
  cashierGratification?: number;
  familyAllowance?: number;
  holidayPay?: number;
  unhealthiness?: number;
  maternityLeave?: number;
  tips?: number;
  others?: number;
  vouchers?: number;
  grossAmount: number;
  inss?: number;
  inssVacation?: number;
  irpf?: number;
  unionFee?: number;
  absences?: number;
  absenceReason?: string;
  netAmount: number;
  status?: string;
}

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(params?: { limit?: number; offset?: number; search?: string }): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Branches
  getBranches(params?: { limit?: number; offset?: number; search?: string }): Promise<Branch[]>;
  getBranch(id: string): Promise<Branch | undefined>;
  createBranch(branch: InsertBranch): Promise<Branch>;
  updateBranch(id: string, branch: Partial<InsertBranch>): Promise<Branch>;
  deleteBranch(id: string): Promise<void>;

  // Employees
  getEmployees(params?: { limit?: number; offset?: number; search?: string }): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee>;
  deleteEmployee(id: string): Promise<void>;

  // Permission Groups
  getPermissionGroups(params?: { limit?: number; offset?: number; search?: string }): Promise<PermissionGroup[]>;
  getPermissionGroup(id: string): Promise<PermissionGroup | undefined>;
  createPermissionGroup(group: InsertPermissionGroup): Promise<PermissionGroup>;
  updatePermissionGroup(id: string, group: Partial<InsertPermissionGroup>): Promise<PermissionGroup>;
  deletePermissionGroup(id: string): Promise<void>;

  // Module Permissions
  getModulePermissions(groupId: string): Promise<ModulePermission[]>;
  setModulePermission(permission: InsertModulePermission): Promise<ModulePermission>;
  deleteModulePermission(groupId: string, module: string): Promise<void>;

  // Payroll
  getPayroll(params?: { limit?: number; offset?: number; search?: string }): Promise<PayrollEntry[]>;
  getPayrollEntry(id: string): Promise<PayrollEntry | undefined>;
  createPayrollEntry(entry: InsertPayrollEntry): Promise<PayrollEntry>;
  updatePayrollEntry(id: string, entry: Partial<InsertPayrollEntry>): Promise<PayrollEntry>;
  deletePayrollEntry(id: string): Promise<void>;
}

export class SQLStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    return withConnection(async (client) => {
      const { rows } = await client.query(
        `SELECT id, name, email, password, active, created_at
         FROM rh_db.users
         WHERE id = $1`,
        [id]
      );
      return rows[0] ? this.mapUserRow(rows[0]) : undefined;
    });
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return withConnection(async (client) => {
      const { rows } = await client.query(
        `SELECT id, name, email, password, active, created_at
         FROM rh_db.users
         WHERE email = $1`,
        [email]
      );
      return rows[0] ? this.mapUserRow(rows[0]) : undefined;
    });
  }

  async getUsers({ limit = 50, offset = 0, search }: { limit?: number; offset?: number; search?: string } = {}): Promise<User[]> {
    const cappedLimit = Math.min(Math.max(limit, 1), 200);
    const clauses: string[] = [];
    const params: unknown[] = [];

    if (search) {
      clauses.push(`(name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    params.push(cappedLimit);
    params.push(offset);

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const query = `
      SELECT id, name, email, password, active, created_at
      FROM rh_db.users
      ${where}
      ORDER BY created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    return withConnection(async (client) => {
      const { rows } = await client.query(query, params);
      return rows.map(this.mapUserRow);
    });
  }

  async createUser(user: InsertUser): Promise<User> {
    return withConnection(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO rh_db.users (name, email, password, active)
         VALUES ($1, $2, $3, COALESCE($4, TRUE))
         RETURNING id, name, email, password, active, created_at`,
        [user.name, user.email, user.password, user.active]
      );
      return this.mapUserRow(rows[0]);
    });
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    if (user.name !== undefined) {
      fields.push(`name = $${index++}`);
      values.push(user.name);
    }
    if (user.email !== undefined) {
      fields.push(`email = $${index++}`);
      values.push(user.email);
    }
    if (user.password !== undefined) {
      fields.push(`password = $${index++}`);
      values.push(user.password);
    }
    if (user.active !== undefined) {
      fields.push(`active = $${index++}`);
      values.push(user.active);
    }

    values.push(id);

    return withConnection(async (client) => {
      const { rows } = await client.query(
        `UPDATE rh_db.users
         SET ${fields.join(", ")}
         WHERE id = $${index}
         RETURNING id, name, email, password, active, created_at`,
        values
      );
      return this.mapUserRow(rows[0]);
    });
  }

  async deleteUser(id: string): Promise<void> {
    await withConnection((client) => client.query(
      `DELETE FROM rh_db.users WHERE id = $1`,
      [id]
    ));
  }

  private mapUserRow(row: any): User {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password,
      active: row.active,
      createdAt: row.created_at,
    };
  }

  // Branches
  async getBranches({ limit = 50, offset = 0, search }: { limit?: number; offset?: number; search?: string } = {}): Promise<Branch[]> {
    const cappedLimit = Math.min(Math.max(limit, 1), 200);
    const clauses: string[] = [];
    const params: unknown[] = [];

    if (search) {
      clauses.push(`(fantasy_name ILIKE $${params.length + 1} OR cnpj ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    params.push(cappedLimit);
    params.push(offset);

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const query = `
      SELECT id, fantasy_name, address, phone, email, cnpj, city, state,
             neighborhood, zip_code, active, created_at, updated_at
      FROM rh_db.branches
      ${where}
      ORDER BY updated_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    return withConnection(async (client) => {
      const { rows } = await client.query(query, params);
      return rows.map(this.mapBranchRow);
    });
  }

  private mapBranchRow(row: any): Branch {
    return {
      id: row.id,
      fantasyName: row.fantasy_name,
      address: row.address,
      phone: row.phone,
      email: row.email,
      cnpj: row.cnpj,
      city: row.city,
      state: row.state,
      neighborhood: row.neighborhood,
      zipCode: row.zip_code,
      active: row.active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async getBranch(id: string): Promise<Branch | undefined> {
    return withConnection(async (client) => {
      const { rows } = await client.query(`
        SELECT id, fantasy_name, address, phone, email, cnpj, city, state,
               neighborhood, zip_code, active, created_at, updated_at
        FROM rh_db.branches
        WHERE id = $1
      `, [id]);
      
      return rows[0] ? this.mapBranchRow(rows[0]) : undefined;
    });
  }

  async createBranch(branch: InsertBranch): Promise<Branch> {
    return withConnection(async (client) => {
      const { rows } = await client.query(`
        INSERT INTO rh_db.branches (
          fantasy_name, address, phone, email, cnpj, city, state,
          neighborhood, zip_code, active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING id, fantasy_name, address, phone, email, cnpj, city, state, 
                  neighborhood, zip_code, active, created_at, updated_at
      `, [
        branch.fantasyName,
        branch.address,
        branch.phone,
        branch.email,
        branch.cnpj,
        branch.city,
        branch.state,
        branch.neighborhood,
        branch.zipCode,
        branch.active ?? true
      ]);
      
      return this.mapBranchRow(rows[0]);
    });
  }

  async updateBranch(id: string, branch: Partial<InsertBranch>): Promise<Branch> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (branch.fantasyName !== undefined) {
      fields.push(`fantasy_name = $${paramCount++}`);
      values.push(branch.fantasyName);
    }
    if (branch.address !== undefined) {
      fields.push(`address = $${paramCount++}`);
      values.push(branch.address);
    }
    if (branch.phone !== undefined) {
      fields.push(`phone = $${paramCount++}`);
      values.push(branch.phone);
    }
    if (branch.email !== undefined) {
      fields.push(`email = $${paramCount++}`);
      values.push(branch.email);
    }
    if (branch.cnpj !== undefined) {
      fields.push(`cnpj = $${paramCount++}`);
      values.push(branch.cnpj);
    }
    if (branch.city !== undefined) {
      fields.push(`city = $${paramCount++}`);
      values.push(branch.city);
    }
    if (branch.state !== undefined) {
      fields.push(`state = $${paramCount++}`);
      values.push(branch.state);
    }
    if (branch.neighborhood !== undefined) {
      fields.push(`neighborhood = $${paramCount++}`);
      values.push(branch.neighborhood);
    }
    if (branch.zipCode !== undefined) {
      fields.push(`zip_code = $${paramCount++}`);
      values.push(branch.zipCode);
    }
    if (branch.active !== undefined) {
      fields.push(`active = $${paramCount++}`);
      values.push(branch.active);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    return withConnection(async (client) => {
      const { rows } = await client.query(`
        UPDATE rh_db.branches 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, fantasy_name, address, phone, email, cnpj, city, state, 
                  neighborhood, zip_code, active, created_at, updated_at
      `, values);

      return this.mapBranchRow(rows[0]);
    });
  }

  async deleteBranch(id: string): Promise<void> {
    await withConnection((client) => client.query('DELETE FROM rh_db.branches WHERE id = $1', [id]));
  }

  // Employees
  async getEmployees({ limit = 50, offset = 0, search }: { limit?: number; offset?: number; search?: string } = {}): Promise<Employee[]> {
    const cappedLimit = Math.min(Math.max(limit, 1), 200);
    const clauses: string[] = [];
    const params: unknown[] = [];

    if (search) {
      clauses.push(`(name ILIKE $${params.length + 1} OR cpf ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    params.push(cappedLimit);
    params.push(offset);

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const query = `
      SELECT id, name, cpf, email, phone, address, branch_id, position_id,
             admission_date, base_salary, agreed_salary, advance_percentage,
             status, created_at, updated_at 
      FROM rh_db.employees 
      ${where}
      ORDER BY updated_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    return withConnection(async (client) => {
      const { rows } = await client.query(query, params);
      return rows.map(this.mapEmployeeRow);
    });
  }

  private mapEmployeeRow(row: any): Employee {
    return {
      id: row.id,
      name: row.name,
      cpf: row.cpf,
      email: row.email,
      phone: row.phone,
      address: row.address,
      branchId: row.branch_id,
      positionId: row.position_id,
      admissionDate: row.admission_date,
      baseSalary: parseFloat(row.base_salary),
      agreedSalary: parseFloat(row.agreed_salary),
      advancePercentage: parseFloat(row.advance_percentage),
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    return withConnection(async (client) => {
      const { rows } = await client.query(`
        SELECT id, name, cpf, email, phone, address, branch_id, position_id,
               admission_date, base_salary, agreed_salary, advance_percentage,
               status, created_at, updated_at 
        FROM rh_db.employees 
        WHERE id = $1
      `, [id]);
      
      return rows[0] ? this.mapEmployeeRow(rows[0]) : undefined;
    });
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    return withConnection(async (client) => {
      const { rows } = await client.query(`
        INSERT INTO rh_db.employees (
          name, cpf, email, phone, address, branch_id, position_id,
          admission_date, base_salary, agreed_salary, advance_percentage,
          status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING id, name, cpf, email, phone, address, branch_id, position_id,
                  admission_date, base_salary, agreed_salary, advance_percentage,
                  status, created_at, updated_at
      `, [
        employee.name,
        employee.cpf,
        employee.email,
        employee.phone,
        employee.address,
        employee.branchId,
        employee.positionId,
        employee.admissionDate,
        employee.baseSalary,
        employee.agreedSalary,
        employee.advancePercentage ?? 40.00,
        employee.status ?? 'ativo'
      ]);
      
      return this.mapEmployeeRow(rows[0]);
    });
  }

  async updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (employee.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(employee.name);
    }
    if (employee.cpf !== undefined) {
      fields.push(`cpf = $${paramCount++}`);
      values.push(employee.cpf);
    }
    if (employee.email !== undefined) {
      fields.push(`email = $${paramCount++}`);
      values.push(employee.email);
    }
    if (employee.phone !== undefined) {
      fields.push(`phone = $${paramCount++}`);
      values.push(employee.phone);
    }
    if (employee.address !== undefined) {
      fields.push(`address = $${paramCount++}`);
      values.push(employee.address);
    }
    if (employee.branchId !== undefined) {
      fields.push(`branch_id = $${paramCount++}`);
      values.push(employee.branchId);
    }
    if (employee.positionId !== undefined) {
      fields.push(`position_id = $${paramCount++}`);
      values.push(employee.positionId);
    }
    if (employee.admissionDate !== undefined) {
      fields.push(`admission_date = $${paramCount++}`);
      values.push(employee.admissionDate);
    }
    if (employee.baseSalary !== undefined) {
      fields.push(`base_salary = $${paramCount++}`);
      values.push(employee.baseSalary);
    }
    if (employee.agreedSalary !== undefined) {
      fields.push(`agreed_salary = $${paramCount++}`);
      values.push(employee.agreedSalary);
    }
    if (employee.advancePercentage !== undefined) {
      fields.push(`advance_percentage = $${paramCount++}`);
      values.push(employee.advancePercentage);
    }
    if (employee.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(employee.status);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    return withConnection(async (client) => {
      const { rows } = await client.query(`
        UPDATE rh_db.employees 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, name, cpf, email, phone, address, branch_id, position_id,
                  admission_date, base_salary, agreed_salary, advance_percentage,
                  status, created_at, updated_at
      `, values);

      return this.mapEmployeeRow(rows[0]);
    });
  }

  async deleteEmployee(id: string): Promise<void> {
    await withConnection((client) => client.query('DELETE FROM rh_db.employees WHERE id = $1', [id]));
  }

  // Permission Groups
  async getPermissionGroups({ limit = 50, offset = 0, search }: { limit?: number; offset?: number; search?: string } = {}): Promise<PermissionGroup[]> {
    const cappedLimit = Math.min(Math.max(limit, 1), 200);
    const clauses: string[] = [];
    const params: unknown[] = [];

    if (search) {
      clauses.push(`(name ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    params.push(cappedLimit);
    params.push(offset);

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const query = `
      SELECT id, name, description, created_at
      FROM rh_db.permission_groups
      ${where}
      ORDER BY created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    return withConnection(async (client) => {
      const { rows } = await client.query(query, params);
      return rows.map(this.mapPermissionGroupRow);
    });
  }

  async getPermissionGroup(id: string): Promise<PermissionGroup | undefined> {
    return withConnection(async (client) => {
      const { rows } = await client.query(
        `SELECT id, name, description, created_at
         FROM rh_db.permission_groups
         WHERE id = $1`,
        [id]
      );
      return rows[0] ? this.mapPermissionGroupRow(rows[0]) : undefined;
    });
  }

  async createPermissionGroup(group: InsertPermissionGroup): Promise<PermissionGroup> {
    return withConnection(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO rh_db.permission_groups (name, description)
         VALUES ($1, $2)
         RETURNING id, name, description, created_at`,
        [group.name, group.description]
      );
      return this.mapPermissionGroupRow(rows[0]);
    });
  }

  async updatePermissionGroup(id: string, group: Partial<InsertPermissionGroup>): Promise<PermissionGroup> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (group.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(group.name);
    }
    if (group.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(group.description);
    }

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    values.push(id);

    return withConnection(async (client) => {
      const { rows } = await client.query(
        `UPDATE rh_db.permission_groups
         SET ${fields.join(", ")}
         WHERE id = $${paramCount}
         RETURNING id, name, description, created_at`,
        values
      );
      return this.mapPermissionGroupRow(rows[0]);
    });
  }

  async deletePermissionGroup(id: string): Promise<void> {
    return withConnection(async (client) => {
      await client.query(
        `DELETE FROM rh_db.permission_groups WHERE id = $1`,
        [id]
      );
    });
  }

  // Module Permissions
  async getModulePermissions(groupId: string): Promise<ModulePermission[]> {
    return withConnection(async (client) => {
      const { rows } = await client.query(
        `SELECT id, group_id, module, can_read, can_create, can_update, can_delete
         FROM rh_db.module_permissions
         WHERE group_id = $1
         ORDER BY module`,
        [groupId]
      );
      return rows.map(this.mapModulePermissionRow);
    });
  }

  async setModulePermission(permission: InsertModulePermission): Promise<ModulePermission> {
    return withConnection(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO rh_db.module_permissions (group_id, module, can_read, can_create, can_update, can_delete)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, group_id, module, can_read, can_create, can_update, can_delete`,
        [permission.groupId, permission.module, permission.canRead, permission.canCreate, permission.canUpdate, permission.canDelete]
      );
      return this.mapModulePermissionRow(rows[0]);
    });
  }

  async deleteModulePermission(groupId: string, module: string): Promise<void> {
    return withConnection(async (client) => {
      await client.query(
        `DELETE FROM rh_db.module_permissions WHERE group_id = $1 AND module = $2`,
        [groupId, module]
      );
    });
  }

  // Payroll
  async getPayroll({ limit = 50, offset = 0, search }: { limit?: number; offset?: number; search?: string } = {}): Promise<PayrollEntry[]> {
    const cappedLimit = Math.min(Math.max(limit, 1), 200);
    const clauses: string[] = [];
    const params: unknown[] = [];

    if (search) {
      clauses.push(`e.name ILIKE $${params.length + 1}`);
      params.push(`%${search}%`);
    }

    params.push(cappedLimit);
    params.push(offset);

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const query = `
      SELECT p.id, p.employee_id, p.month, p.year, p.base_salary, p.agreed_salary,
             p.advance, p.night_shift_additional, p.night_shift_dsr, p.overtime, p.overtime_dsr,
             p.vacation_bonus, p.five_year_bonus, p.position_gratification, p.general_gratification,
             p.cashier_gratification, p.family_allowance, p.holiday_pay, p.unhealthiness,
             p.maternity_leave, p.tips, p.others, p.vouchers, p.gross_amount, p.inss,
             p.inss_vacation, p.irpf, p.union_fee, p.absences, p.absence_reason, p.net_amount,
             p.status, p.processed_at, p.created_at
      FROM rh_db.payroll p
      JOIN rh_db.employees e ON p.employee_id = e.id
      ${where}
      ORDER BY p.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    return withConnection(async (client) => {
      const { rows } = await client.query(query, params);
      return rows.map(this.mapPayrollRow);
    });
  }

  async getPayrollEntry(id: string): Promise<PayrollEntry | undefined> {
    return withConnection(async (client) => {
      const { rows } = await client.query(
        `SELECT id, employee_id, month, year, base_salary, agreed_salary,
                advance, night_shift_additional, night_shift_dsr, overtime, overtime_dsr,
                vacation_bonus, five_year_bonus, position_gratification, general_gratification,
                cashier_gratification, family_allowance, holiday_pay, unhealthiness,
                maternity_leave, tips, others, vouchers, gross_amount, inss,
                inss_vacation, irpf, union_fee, absences, absence_reason, net_amount,
                status, processed_at, created_at
         FROM rh_db.payroll
         WHERE id = $1`,
        [id]
      );
      return rows[0] ? this.mapPayrollRow(rows[0]) : undefined;
    });
  }

  async createPayrollEntry(entry: InsertPayrollEntry): Promise<PayrollEntry> {
    return withConnection(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO rh_db.payroll (
           employee_id, month, year, base_salary, agreed_salary, advance, night_shift_additional,
           night_shift_dsr, overtime, overtime_dsr, vacation_bonus, five_year_bonus,
           position_gratification, general_gratification, cashier_gratification, family_allowance,
           holiday_pay, unhealthiness, maternity_leave, tips, others, vouchers, gross_amount,
           inss, inss_vacation, irpf, union_fee, absences, absence_reason, net_amount, status
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)
         RETURNING id, employee_id, month, year, base_salary, agreed_salary,
                   advance, night_shift_additional, night_shift_dsr, overtime, overtime_dsr,
                   vacation_bonus, five_year_bonus, position_gratification, general_gratification,
                   cashier_gratification, family_allowance, holiday_pay, unhealthiness,
                   maternity_leave, tips, others, vouchers, gross_amount, inss,
                   inss_vacation, irpf, union_fee, absences, absence_reason, net_amount,
                   status, processed_at, created_at`,
        [
          entry.employeeId, entry.month, entry.year, entry.baseSalary, entry.agreedSalary,
          entry.advance || 0, entry.nightShiftAdditional || 0, entry.nightShiftDsr || 0,
          entry.overtime || 0, entry.overtimeDsr || 0, entry.vacationBonus || 0,
          entry.fiveYearBonus || 0, entry.positionGratification || 0, entry.generalGratification || 0,
          entry.cashierGratification || 0, entry.familyAllowance || 0, entry.holidayPay || 0,
          entry.unhealthiness || 0, entry.maternityLeave || 0, entry.tips || 0, entry.others || 0,
          entry.vouchers || 0, entry.grossAmount, entry.inss || 0, entry.inssVacation || 0,
          entry.irpf || 0, entry.unionFee || 0, entry.absences || 0, entry.absenceReason,
          entry.netAmount, entry.status || 'pendente'
        ]
      );
      return this.mapPayrollRow(rows[0]);
    });
  }

  async updatePayrollEntry(id: string, entry: Partial<InsertPayrollEntry>): Promise<PayrollEntry> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(entry).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${dbKey} = $${paramCount++}`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    values.push(id);

    return withConnection(async (client) => {
      const { rows } = await client.query(
        `UPDATE rh_db.payroll
         SET ${fields.join(", ")}
         WHERE id = $${paramCount}
         RETURNING id, employee_id, month, year, base_salary, agreed_salary,
                   advance, night_shift_additional, night_shift_dsr, overtime, overtime_dsr,
                   vacation_bonus, five_year_bonus, position_gratification, general_gratification,
                   cashier_gratification, family_allowance, holiday_pay, unhealthiness,
                   maternity_leave, tips, others, vouchers, gross_amount, inss,
                   inss_vacation, irpf, union_fee, absences, absence_reason, net_amount,
                   status, processed_at, created_at`,
        values
      );
      return this.mapPayrollRow(rows[0]);
    });
  }

  async deletePayrollEntry(id: string): Promise<void> {
    return withConnection(async (client) => {
      await client.query(
        `DELETE FROM rh_db.payroll WHERE id = $1`,
        [id]
      );
    });
  }

  // Helper methods
  private mapPermissionGroupRow(row: any): PermissionGroup {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
    };
  }

  private mapModulePermissionRow(row: any): ModulePermission {
    return {
      id: row.id,
      groupId: row.group_id,
      module: row.module,
      canRead: row.can_read,
      canCreate: row.can_create,
      canUpdate: row.can_update,
      canDelete: row.can_delete,
    };
  }

  private mapPayrollRow(row: any): PayrollEntry {
    return {
      id: row.id,
      employeeId: row.employee_id,
      month: row.month,
      year: row.year,
      baseSalary: parseFloat(row.base_salary),
      agreedSalary: parseFloat(row.agreed_salary),
      advance: parseFloat(row.advance),
      nightShiftAdditional: parseFloat(row.night_shift_additional),
      nightShiftDsr: parseFloat(row.night_shift_dsr),
      overtime: parseFloat(row.overtime),
      overtimeDsr: parseFloat(row.overtime_dsr),
      vacationBonus: parseFloat(row.vacation_bonus),
      fiveYearBonus: parseFloat(row.five_year_bonus),
      positionGratification: parseFloat(row.position_gratification),
      generalGratification: parseFloat(row.general_gratification),
      cashierGratification: parseFloat(row.cashier_gratification),
      familyAllowance: parseFloat(row.family_allowance),
      holidayPay: parseFloat(row.holiday_pay),
      unhealthiness: parseFloat(row.unhealthiness),
      maternityLeave: parseFloat(row.maternity_leave),
      tips: parseFloat(row.tips),
      others: parseFloat(row.others),
      vouchers: parseFloat(row.vouchers),
      grossAmount: parseFloat(row.gross_amount),
      inss: parseFloat(row.inss),
      inssVacation: parseFloat(row.inss_vacation),
      irpf: parseFloat(row.irpf),
      unionFee: parseFloat(row.union_fee),
      absences: parseFloat(row.absences),
      absenceReason: row.absence_reason,
      netAmount: parseFloat(row.net_amount),
      status: row.status,
      processedAt: row.processed_at,
      createdAt: row.created_at,
    };
  }
}

export const storage = new SQLStorage();
