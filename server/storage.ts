import {
  users, permissionGroups, userGroups, modulePermissions, jobPositions,
  employees, vacations, terminations, advances, payroll, branches,
  type User, type InsertUser, type PermissionGroup, type InsertPermissionGroup,
  type UserGroup, type InsertUserGroup, type ModulePermission, type InsertModulePermission,
  type JobPosition, type InsertJobPosition, type Employee, type InsertEmployee,
  type Vacation, type InsertVacation, type Termination, type InsertTermination,
  type Advance, type InsertAdvance, type Payroll, type InsertPayroll,
  type Branch, type InsertBranch
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, count } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getUsers(): Promise<User[]>;

  // Permission Groups
  getPermissionGroups(): Promise<PermissionGroup[]>;
  getPermissionGroup(id: string): Promise<PermissionGroup | undefined>;
  createPermissionGroup(group: InsertPermissionGroup): Promise<PermissionGroup>;
  updatePermissionGroup(id: string, group: Partial<InsertPermissionGroup>): Promise<PermissionGroup>;
  deletePermissionGroup(id: string): Promise<void>;

  // User Groups
  getUserGroups(userId: string): Promise<UserGroup[]>;
  assignUserToGroup(assignment: InsertUserGroup): Promise<UserGroup>;
  removeUserFromGroup(userId: string, groupId: string): Promise<void>;

  // Module Permissions
  getModulePermissions(groupId: string): Promise<ModulePermission[]>;
  setModulePermission(permission: InsertModulePermission): Promise<ModulePermission>;
  deleteModulePermission(groupId: string, module: string): Promise<void>;

  // Job Positions
  getJobPositions(): Promise<JobPosition[]>;
  getJobPosition(id: string): Promise<JobPosition | undefined>;
  createJobPosition(position: InsertJobPosition): Promise<JobPosition>;
  updateJobPosition(id: string, position: Partial<InsertJobPosition>): Promise<JobPosition>;
  deleteJobPosition(id: string): Promise<void>;

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
  getEmployeeStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    onLeave: number;
  }>;

  // Vacations
  getVacations(): Promise<Vacation[]>;
  getVacation(id: string): Promise<Vacation | undefined>;
  getEmployeeVacations(employeeId: string): Promise<Vacation[]>;
  createVacation(vacation: InsertVacation): Promise<Vacation>;
  updateVacation(id: string, vacation: Partial<InsertVacation>): Promise<Vacation>;
  deleteVacation(id: string): Promise<void>;
  getVacationStats(): Promise<{
    pending: number;
    approved: number;
    active: number;
    expiring: number;
  }>;

  // Terminations
  getTerminations(): Promise<Termination[]>;
  getTermination(id: string): Promise<Termination | undefined>;
  createTermination(termination: InsertTermination): Promise<Termination>;
  updateTermination(id: string, termination: Partial<InsertTermination>): Promise<Termination>;
  deleteTermination(id: string): Promise<void>;

  // Advances
  getAdvances(): Promise<Advance[]>;
  getAdvance(id: string): Promise<Advance | undefined>;
  getEmployeeAdvances(employeeId: string): Promise<Advance[]>;
  createAdvance(advance: InsertAdvance): Promise<Advance>;
  updateAdvance(id: string, advance: Partial<InsertAdvance>): Promise<Advance>;
  deleteAdvance(id: string): Promise<void>;

  // Payroll
  getPayroll(): Promise<Payroll[]>;
  getPayrollEntry(id: string): Promise<Payroll | undefined>;
  getEmployeePayroll(employeeId: string): Promise<Payroll[]>;
  createPayrollEntry(payroll: InsertPayroll): Promise<Payroll>;
  updatePayrollEntry(id: string, payroll: Partial<InsertPayroll>): Promise<Payroll>;
  deletePayrollEntry(id: string): Promise<void>;
  getPayrollStats(): Promise<{
    totalThisMonth: number;
    processedThisMonth: number;
    pendingThisMonth: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getUsers(): Promise<User[]> {
    try {
      console.log("🔍 [STORAGE] getUsers - Iniciando consulta no banco");
      const result = await db.select().from(users).orderBy(asc(users.name));
      console.log("✅ [STORAGE] getUsers - Consulta executada com sucesso");
      console.log("📊 [STORAGE] getUsers - Registros encontrados:", result.length);
      console.log("📋 [STORAGE] getUsers - Dados:", JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error("❌ [STORAGE] getUsers - Erro na consulta:", error);
      throw error;
    }
  }

  // Permission Groups
  async getPermissionGroups(): Promise<PermissionGroup[]> {
    return await db.select().from(permissionGroups).orderBy(asc(permissionGroups.name));
  }

  async getPermissionGroup(id: string): Promise<PermissionGroup | undefined> {
    const [group] = await db.select().from(permissionGroups).where(eq(permissionGroups.id, id));
    return group || undefined;
  }

  async createPermissionGroup(group: InsertPermissionGroup): Promise<PermissionGroup> {
    const [newGroup] = await db.insert(permissionGroups).values(group).returning();
    return newGroup;
  }

  async updatePermissionGroup(id: string, group: Partial<InsertPermissionGroup>): Promise<PermissionGroup> {
    const [updatedGroup] = await db
      .update(permissionGroups)
      .set(group)
      .where(eq(permissionGroups.id, id))
      .returning();
    return updatedGroup;
  }

  async deletePermissionGroup(id: string): Promise<void> {
    await db.delete(permissionGroups).where(eq(permissionGroups.id, id));
  }

  // User Groups
  async getUserGroups(userId: string): Promise<UserGroup[]> {
    return await db.select().from(userGroups).where(eq(userGroups.userId, userId));
  }

  async assignUserToGroup(assignment: InsertUserGroup): Promise<UserGroup> {
    const [newAssignment] = await db.insert(userGroups).values(assignment).returning();
    return newAssignment;
  }

  async removeUserFromGroup(userId: string, groupId: string): Promise<void> {
    await db.delete(userGroups).where(
      and(eq(userGroups.userId, userId), eq(userGroups.groupId, groupId))
    );
  }

  // Module Permissions
  async getModulePermissions(groupId: string): Promise<ModulePermission[]> {
    return await db.select().from(modulePermissions).where(eq(modulePermissions.groupId, groupId));
  }

  async setModulePermission(permission: InsertModulePermission): Promise<ModulePermission> {
    const existing = await db.select().from(modulePermissions).where(
      and(
        eq(modulePermissions.groupId, permission.groupId),
        eq(modulePermissions.module, permission.module)
      )
    );

    if (existing.length > 0) {
      const [updated] = await db
        .update(modulePermissions)
        .set(permission)
        .where(
          and(
            eq(modulePermissions.groupId, permission.groupId),
            eq(modulePermissions.module, permission.module)
          )
        )
        .returning();
      return updated;
    } else {
      const [newPermission] = await db.insert(modulePermissions).values(permission).returning();
      return newPermission;
    }
  }

  async deleteModulePermission(groupId: string, module: string): Promise<void> {
    await db.delete(modulePermissions).where(
      and(eq(modulePermissions.groupId, groupId), eq(modulePermissions.module, module))
    );
  }

  // Job Positions
  async getJobPositions(): Promise<JobPosition[]> {
    return await db.select().from(jobPositions).orderBy(asc(jobPositions.name));
  }

  async getJobPosition(id: string): Promise<JobPosition | undefined> {
    const [position] = await db.select().from(jobPositions).where(eq(jobPositions.id, id));
    return position || undefined;
  }

  async createJobPosition(position: InsertJobPosition): Promise<JobPosition> {
    const [newPosition] = await db.insert(jobPositions).values(position).returning();
    return newPosition;
  }

  async updateJobPosition(id: string, position: Partial<InsertJobPosition>): Promise<JobPosition> {
    const [updatedPosition] = await db
      .update(jobPositions)
      .set(position)
      .where(eq(jobPositions.id, id))
      .returning();
    return updatedPosition;
  }

  async deleteJobPosition(id: string): Promise<void> {
    await db.delete(jobPositions).where(eq(jobPositions.id, id));
  }

  // Branches
  async getBranches(): Promise<Branch[]> {
    try {
      console.log("🔍 [STORAGE] getBranches - Iniciando consulta no banco");
      const result = await db.select().from(branches).orderBy(asc(branches.fantasyName));
      console.log("✅ [STORAGE] getBranches - Consulta executada com sucesso");
      console.log("📊 [STORAGE] getBranches - Registros encontrados:", result.length);
      console.log("📋 [STORAGE] getBranches - Dados:", JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error("❌ [STORAGE] getBranches - Erro na consulta:", error);
      throw error;
    }
  }

  async getBranch(id: string): Promise<Branch | undefined> {
    const [branch] = await db.select().from(branches).where(eq(branches.id, id));
    return branch || undefined;
  }

  async createBranch(branch: InsertBranch): Promise<Branch> {
    try {
      console.log("🔍 [STORAGE] createBranch - Inserindo filial:", branch);
      const [newBranch] = await db.insert(branches).values(branch).returning();
      console.log("✅ [STORAGE] createBranch - Filial inserida:", newBranch);
      return newBranch;
    } catch (error) {
      console.error("❌ [STORAGE] createBranch - Erro na inserção:", error);
      throw error;
    }
  }

  async updateBranch(id: string, branch: Partial<InsertBranch>): Promise<Branch> {
    const [updatedBranch] = await db
      .update(branches)
      .set(branch)
      .where(eq(branches.id, id))
      .returning();
    return updatedBranch;
  }

  async deleteBranch(id: string): Promise<void> {
    await db.delete(branches).where(eq(branches.id, id));
  }

  // Employees
  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(employees).orderBy(asc(employees.name));
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }

  async updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee> {
    const [updatedEmployee] = await db
      .update(employees)
      .set({ ...employee, updatedAt: sql`now()` })
      .where(eq(employees.id, id))
      .returning();
    return updatedEmployee;
  }

  async deleteEmployee(id: string): Promise<void> {
    await db.delete(employees).where(eq(employees.id, id));
  }

  async getEmployeeStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    onLeave: number;
  }> {
    const [stats] = await db
      .select({
        total: count(),
        active: sql<number>`sum(case when status = 'ativo' then 1 else 0 end)`,
        inactive: sql<number>`sum(case when status = 'inativo' then 1 else 0 end)`,
        onLeave: sql<number>`sum(case when status = 'afastado' then 1 else 0 end)`,
      })
      .from(employees);
    
    return {
      total: stats.total,
      active: Number(stats.active) || 0,
      inactive: Number(stats.inactive) || 0,
      onLeave: Number(stats.onLeave) || 0,
    };
  }

  // Vacations
  async getVacations(): Promise<Vacation[]> {
    return await db.select().from(vacations).orderBy(desc(vacations.createdAt));
  }

  async getVacation(id: string): Promise<Vacation | undefined> {
    const [vacation] = await db.select().from(vacations).where(eq(vacations.id, id));
    return vacation || undefined;
  }

  async getEmployeeVacations(employeeId: string): Promise<Vacation[]> {
    return await db
      .select()
      .from(vacations)
      .where(eq(vacations.employeeId, employeeId))
      .orderBy(desc(vacations.acquisitionPeriodStart));
  }

  async createVacation(vacation: InsertVacation): Promise<Vacation> {
    const [newVacation] = await db.insert(vacations).values(vacation).returning();
    return newVacation;
  }

  async updateVacation(id: string, vacation: Partial<InsertVacation>): Promise<Vacation> {
    const updateData: any = { ...vacation };
    if (vacation.status === "aprovado") {
      updateData.approvedAt = sql`now()`;
    }
    
    const [updatedVacation] = await db
      .update(vacations)
      .set(updateData)
      .where(eq(vacations.id, id))
      .returning();
    return updatedVacation;
  }

  async deleteVacation(id: string): Promise<void> {
    await db.delete(vacations).where(eq(vacations.id, id));
  }

  async getVacationStats(): Promise<{
    pending: number;
    approved: number;
    active: number;
    expiring: number;
  }> {
    const [stats] = await db
      .select({
        pending: sql<number>`sum(case when status = 'pendente' then 1 else 0 end)`,
        approved: sql<number>`sum(case when status = 'aprovado' then 1 else 0 end)`,
        active: sql<number>`sum(case when status = 'em_gozo' then 1 else 0 end)`,
        expiring: sql<number>`sum(case when status = 'pendente' and enjoyment_limit <= current_date + interval '30 days' then 1 else 0 end)`,
      })
      .from(vacations);
    
    return {
      pending: Number(stats.pending) || 0,
      approved: Number(stats.approved) || 0,
      active: Number(stats.active) || 0,
      expiring: Number(stats.expiring) || 0,
    };
  }

  // Terminations
  async getTerminations(): Promise<Termination[]> {
    return await db.select().from(terminations).orderBy(desc(terminations.terminationDate));
  }

  async getTermination(id: string): Promise<Termination | undefined> {
    const [termination] = await db.select().from(terminations).where(eq(terminations.id, id));
    return termination || undefined;
  }

  async createTermination(termination: InsertTermination): Promise<Termination> {
    const [newTermination] = await db.insert(terminations).values(termination).returning();
    return newTermination;
  }

  async updateTermination(id: string, termination: Partial<InsertTermination>): Promise<Termination> {
    const [updatedTermination] = await db
      .update(terminations)
      .set(termination)
      .where(eq(terminations.id, id))
      .returning();
    return updatedTermination;
  }

  async deleteTermination(id: string): Promise<void> {
    await db.delete(terminations).where(eq(terminations.id, id));
  }

  // Advances
  async getAdvances(): Promise<Advance[]> {
    return await db.select().from(advances).orderBy(desc(advances.year), desc(advances.month));
  }

  async getAdvance(id: string): Promise<Advance | undefined> {
    const [advance] = await db.select().from(advances).where(eq(advances.id, id));
    return advance || undefined;
  }

  async getEmployeeAdvances(employeeId: string): Promise<Advance[]> {
    return await db
      .select()
      .from(advances)
      .where(eq(advances.employeeId, employeeId))
      .orderBy(desc(advances.year), desc(advances.month));
  }

  async createAdvance(advance: InsertAdvance): Promise<Advance> {
    const [newAdvance] = await db.insert(advances).values(advance).returning();
    return newAdvance;
  }

  async updateAdvance(id: string, advance: Partial<InsertAdvance>): Promise<Advance> {
    const [updatedAdvance] = await db
      .update(advances)
      .set(advance)
      .where(eq(advances.id, id))
      .returning();
    return updatedAdvance;
  }

  async deleteAdvance(id: string): Promise<void> {
    await db.delete(advances).where(eq(advances.id, id));
  }

  // Payroll
  async getPayroll(): Promise<Payroll[]> {
    return await db.select().from(payroll).orderBy(desc(payroll.year), desc(payroll.month));
  }

  async getPayrollEntry(id: string): Promise<Payroll | undefined> {
    const [entry] = await db.select().from(payroll).where(eq(payroll.id, id));
    return entry || undefined;
  }

  async getEmployeePayroll(employeeId: string): Promise<Payroll[]> {
    return await db
      .select()
      .from(payroll)
      .where(eq(payroll.employeeId, employeeId))
      .orderBy(desc(payroll.year), desc(payroll.month));
  }

  async createPayrollEntry(payrollEntry: InsertPayroll): Promise<Payroll> {
    const [newEntry] = await db.insert(payroll).values(payrollEntry).returning();
    return newEntry;
  }

  async updatePayrollEntry(id: string, payrollEntry: Partial<InsertPayroll>): Promise<Payroll> {
    const updateData: any = { ...payrollEntry };
    if (payrollEntry.status === "processado") {
      updateData.processedAt = sql`now()`;
    }
    
    const [updatedEntry] = await db
      .update(payroll)
      .set(updateData)
      .where(eq(payroll.id, id))
      .returning();
    return updatedEntry;
  }

  async deletePayrollEntry(id: string): Promise<void> {
    await db.delete(payroll).where(eq(payroll.id, id));
  }

  async getPayrollStats(): Promise<{
    totalThisMonth: number;
    processedThisMonth: number;
    pendingThisMonth: number;
  }> {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const [stats] = await db
      .select({
        totalThisMonth: sql<number>`sum(case when month = ${currentMonth} and year = ${currentYear} then net_amount else 0 end)`,
        processedThisMonth: sql<number>`sum(case when month = ${currentMonth} and year = ${currentYear} and status = 'processado' then 1 else 0 end)`,
        pendingThisMonth: sql<number>`sum(case when month = ${currentMonth} and year = ${currentYear} and status = 'pendente' then 1 else 0 end)`,
      })
      .from(payroll);
    
    return {
      totalThisMonth: Number(stats.totalThisMonth) || 0,
      processedThisMonth: Number(stats.processedThisMonth) || 0,
      pendingThisMonth: Number(stats.pendingThisMonth) || 0,
    };
  }
}

export const storage = new DatabaseStorage();
