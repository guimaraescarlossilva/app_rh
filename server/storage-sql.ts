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
}

export const storage = new SQLStorage();
