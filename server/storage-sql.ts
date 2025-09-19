import { pool } from "./db";

// Types
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
  // Branches
  getBranches(): Promise<Branch[]>;
  getBranch(id: string): Promise<Branch | undefined>;
  createBranch(branch: InsertBranch): Promise<Branch>;
  updateBranch(id: string, branch: Partial<InsertBranch>): Promise<Branch>;
  deleteBranch(id: string): Promise<void>;

  // Employees
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee>;
  deleteEmployee(id: string): Promise<void>;
}

export class SQLStorage implements IStorage {
  // Branches
  async getBranches(): Promise<Branch[]> {
    try {
      console.log("🔍 [STORAGE] getBranches - Iniciando consulta no banco");
      const result = await pool.query(`
        SELECT id, fantasy_name, address, phone, email, cnpj, city, state, 
               neighborhood, zip_code, active, created_at, updated_at 
        FROM rh_db.branches 
        ORDER BY fantasy_name ASC
      `);
      console.log("✅ [STORAGE] getBranches - Consulta executada com sucesso");
      console.log("📊 [STORAGE] getBranches - Registros encontrados:", result.rows.length);
      return result.rows.map(row => ({
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
      }));
    } catch (error) {
      console.error("❌ [STORAGE] getBranches - Erro na consulta:", error);
      throw error;
    }
  }

  async getBranch(id: string): Promise<Branch | undefined> {
    try {
      const result = await pool.query(`
        SELECT id, fantasy_name, address, phone, email, cnpj, city, state, 
               neighborhood, zip_code, active, created_at, updated_at 
        FROM rh_db.branches 
        WHERE id = $1
      `, [id]);
      
      if (result.rows.length === 0) return undefined;
      
      const row = result.rows[0];
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
    } catch (error) {
      console.error("❌ [STORAGE] getBranch - Erro na consulta:", error);
      throw error;
    }
  }

  async createBranch(branch: InsertBranch): Promise<Branch> {
    try {
      console.log("🔍 [STORAGE] createBranch - Inserindo filial:", branch);
      const result = await pool.query(`
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
      
      const row = result.rows[0];
      const newBranch = {
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
      
      console.log("✅ [STORAGE] createBranch - Filial inserida:", newBranch);
      return newBranch;
    } catch (error) {
      console.error("❌ [STORAGE] createBranch - Erro na inserção:", error);
      throw error;
    }
  }

  async updateBranch(id: string, branch: Partial<InsertBranch>): Promise<Branch> {
    try {
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

      const result = await pool.query(`
        UPDATE rh_db.branches 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, fantasy_name, address, phone, email, cnpj, city, state, 
                  neighborhood, zip_code, active, created_at, updated_at
      `, values);

      const row = result.rows[0];
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
    } catch (error) {
      console.error("❌ [STORAGE] updateBranch - Erro na atualização:", error);
      throw error;
    }
  }

  async deleteBranch(id: string): Promise<void> {
    try {
      await pool.query('DELETE FROM rh_db.branches WHERE id = $1', [id]);
    } catch (error) {
      console.error("❌ [STORAGE] deleteBranch - Erro na exclusão:", error);
      throw error;
    }
  }

  // Employees
  async getEmployees(): Promise<Employee[]> {
    try {
      console.log("🔍 [STORAGE] getEmployees - Iniciando consulta no banco");
      const result = await pool.query(`
        SELECT id, name, cpf, email, phone, address, branch_id, position_id,
               admission_date, base_salary, agreed_salary, advance_percentage,
               status, created_at, updated_at 
        FROM rh_db.employees 
        ORDER BY name ASC
      `);
      console.log("✅ [STORAGE] getEmployees - Consulta executada com sucesso");
      console.log("📊 [STORAGE] getEmployees - Registros encontrados:", result.rows.length);
      return result.rows.map(row => ({
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
      }));
    } catch (error) {
      console.error("❌ [STORAGE] getEmployees - Erro na consulta:", error);
      throw error;
    }
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    try {
      const result = await pool.query(`
        SELECT id, name, cpf, email, phone, address, branch_id, position_id,
               admission_date, base_salary, agreed_salary, advance_percentage,
               status, created_at, updated_at 
        FROM rh_db.employees 
        WHERE id = $1
      `, [id]);
      
      if (result.rows.length === 0) return undefined;
      
      const row = result.rows[0];
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
    } catch (error) {
      console.error("❌ [STORAGE] getEmployee - Erro na consulta:", error);
      throw error;
    }
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    try {
      console.log("🔍 [STORAGE] createEmployee - Inserindo funcionário:", employee);
      const result = await pool.query(`
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
      
      const row = result.rows[0];
      const newEmployee = {
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
      
      console.log("✅ [STORAGE] createEmployee - Funcionário inserido:", newEmployee);
      return newEmployee;
    } catch (error) {
      console.error("❌ [STORAGE] createEmployee - Erro na inserção:", error);
      throw error;
    }
  }

  async updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee> {
    try {
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

      const result = await pool.query(`
        UPDATE rh_db.employees 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, name, cpf, email, phone, address, branch_id, position_id,
                  admission_date, base_salary, agreed_salary, advance_percentage,
                  status, created_at, updated_at
      `, values);

      const row = result.rows[0];
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
    } catch (error) {
      console.error("❌ [STORAGE] updateEmployee - Erro na atualização:", error);
      throw error;
    }
  }

  async deleteEmployee(id: string): Promise<void> {
    try {
      await pool.query('DELETE FROM rh_db.employees WHERE id = $1', [id]);
    } catch (error) {
      console.error("❌ [STORAGE] deleteEmployee - Erro na exclusão:", error);
      throw error;
    }
  }
}

export const storage = new SQLStorage();
