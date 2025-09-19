import {
  type User, type InsertUser, type PermissionGroup, type InsertPermissionGroup,
  type UserGroup, type InsertUserGroup, type ModulePermission, type InsertModulePermission,
  type JobPosition, type InsertJobPosition, type Employee, type InsertEmployee,
  type Vacation, type InsertVacation, type Termination, type InsertTermination,
  type Advance, type InsertAdvance, type Payroll, type InsertPayroll,
  type Branch, type InsertBranch
} from "@shared/schema";

// Mock data
let mockBranches: Branch[] = [
  {
    id: "1",
    fantasyName: "Filial Principal",
    address: "Rua das Flores, 123",
    phone: "(11) 99999-9999",
    email: "contato@empresa.com",
    cnpj: "12.345.678/0001-90",
    city: "São Paulo",
    state: "SP",
    neighborhood: "Centro",
    zipCode: "01234-567",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

let mockEmployees: Employee[] = [
  {
    id: "1",
    name: "João Silva",
    cpf: "123.456.789-00",
    email: "joao@empresa.com",
    phone: "(11) 99999-8888",
    address: "Rua A, 456",
    branchId: "1",
    positionId: "1",
    admissionDate: "2023-01-15",
    baseSalary: "5000.00",
    agreedSalary: "5000.00",
    advancePercentage: "40.00",
    status: "ativo",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

let mockJobPositions: JobPosition[] = [
  {
    id: "1",
    name: "Desenvolvedor",
    description: "Desenvolvedor de software",
    baseSalary: "5000.00",
    createdAt: new Date()
  }
];

export class MockStorage {
  // Branches
  async getBranches(): Promise<Branch[]> {
    console.log("🔍 [MOCK] getBranches - Retornando dados mockados");
    return mockBranches;
  }

  async getBranch(id: string): Promise<Branch | undefined> {
    return mockBranches.find(b => b.id === id);
  }

  async createBranch(branch: InsertBranch): Promise<Branch> {
    const newBranch: Branch = {
      id: Math.random().toString(36).substr(2, 9),
      ...branch,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockBranches.push(newBranch);
    console.log("✅ [MOCK] createBranch - Filial criada:", newBranch);
    return newBranch;
  }

  async updateBranch(id: string, branch: Partial<InsertBranch>): Promise<Branch> {
    const index = mockBranches.findIndex(b => b.id === id);
    if (index === -1) throw new Error("Branch not found");
    
    mockBranches[index] = { ...mockBranches[index], ...branch, updatedAt: new Date() };
    return mockBranches[index];
  }

  async deleteBranch(id: string): Promise<void> {
    mockBranches = mockBranches.filter(b => b.id !== id);
  }

  // Employees
  async getEmployees(): Promise<Employee[]> {
    console.log("🔍 [MOCK] getEmployees - Retornando dados mockados");
    return mockEmployees;
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    return mockEmployees.find(e => e.id === id);
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const newEmployee: Employee = {
      id: Math.random().toString(36).substr(2, 9),
      ...employee,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockEmployees.push(newEmployee);
    console.log("✅ [MOCK] createEmployee - Funcionário criado:", newEmployee);
    return newEmployee;
  }

  async updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee> {
    const index = mockEmployees.findIndex(e => e.id === id);
    if (index === -1) throw new Error("Employee not found");
    
    mockEmployees[index] = { ...mockEmployees[index], ...employee, updatedAt: new Date() };
    return mockEmployees[index];
  }

  async deleteEmployee(id: string): Promise<void> {
    mockEmployees = mockEmployees.filter(e => e.id !== id);
  }

  async getEmployeeStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    onLeave: number;
  }> {
    return {
      total: mockEmployees.length,
      active: mockEmployees.filter(e => e.status === "ativo").length,
      inactive: mockEmployees.filter(e => e.status === "inativo").length,
      onLeave: mockEmployees.filter(e => e.status === "afastado").length,
    };
  }

  // Job Positions
  async getJobPositions(): Promise<JobPosition[]> {
    return mockJobPositions;
  }

  async getJobPosition(id: string): Promise<JobPosition | undefined> {
    return mockJobPositions.find(p => p.id === id);
  }

  async createJobPosition(position: InsertJobPosition): Promise<JobPosition> {
    const newPosition: JobPosition = {
      id: Math.random().toString(36).substr(2, 9),
      ...position,
      createdAt: new Date()
    };
    mockJobPositions.push(newPosition);
    return newPosition;
  }

  async updateJobPosition(id: string, position: Partial<InsertJobPosition>): Promise<JobPosition> {
    const index = mockJobPositions.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Job position not found");
    
    mockJobPositions[index] = { ...mockJobPositions[index], ...position };
    return mockJobPositions[index];
  }

  async deleteJobPosition(id: string): Promise<void> {
    mockJobPositions = mockJobPositions.filter(p => p.id !== id);
  }

  // Users
  async getUsers(): Promise<User[]> {
    return [];
  }

  async getUser(id: string): Promise<User | undefined> {
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    throw new Error("Not implemented");
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User> {
    throw new Error("Not implemented");
  }

  async deleteUser(id: string): Promise<void> {
    throw new Error("Not implemented");
  }

  // Permission Groups
  async getPermissionGroups(): Promise<PermissionGroup[]> {
    return [];
  }

  async getPermissionGroup(id: string): Promise<PermissionGroup | undefined> {
    return undefined;
  }

  async createPermissionGroup(group: InsertPermissionGroup): Promise<PermissionGroup> {
    throw new Error("Not implemented");
  }

  async updatePermissionGroup(id: string, group: Partial<InsertPermissionGroup>): Promise<PermissionGroup> {
    throw new Error("Not implemented");
  }

  async deletePermissionGroup(id: string): Promise<void> {
    throw new Error("Not implemented");
  }

  // User Groups
  async getUserGroups(userId: string): Promise<UserGroup[]> {
    return [];
  }

  async assignUserToGroup(assignment: InsertUserGroup): Promise<UserGroup> {
    throw new Error("Not implemented");
  }

  async removeUserFromGroup(userId: string, groupId: string): Promise<void> {
    throw new Error("Not implemented");
  }

  // Module Permissions
  async getModulePermissions(groupId: string): Promise<ModulePermission[]> {
    return [];
  }

  async setModulePermission(permission: InsertModulePermission): Promise<ModulePermission> {
    throw new Error("Not implemented");
  }

  async deleteModulePermission(groupId: string, module: string): Promise<void> {
    throw new Error("Not implemented");
  }

  // Vacations
  async getVacations(): Promise<Vacation[]> {
    return [];
  }

  async getVacation(id: string): Promise<Vacation | undefined> {
    return undefined;
  }

  async getEmployeeVacations(employeeId: string): Promise<Vacation[]> {
    return [];
  }

  async createVacation(vacation: InsertVacation): Promise<Vacation> {
    throw new Error("Not implemented");
  }

  async updateVacation(id: string, vacation: Partial<InsertVacation>): Promise<Vacation> {
    throw new Error("Not implemented");
  }

  async deleteVacation(id: string): Promise<void> {
    throw new Error("Not implemented");
  }

  async getVacationStats(): Promise<{
    pending: number;
    approved: number;
    active: number;
    expiring: number;
  }> {
    return { pending: 0, approved: 0, active: 0, expiring: 0 };
  }

  // Terminations
  async getTerminations(): Promise<Termination[]> {
    return [];
  }

  async getTermination(id: string): Promise<Termination | undefined> {
    return undefined;
  }

  async createTermination(termination: InsertTermination): Promise<Termination> {
    throw new Error("Not implemented");
  }

  async updateTermination(id: string, termination: Partial<InsertTermination>): Promise<Termination> {
    throw new Error("Not implemented");
  }

  async deleteTermination(id: string): Promise<void> {
    throw new Error("Not implemented");
  }

  // Advances
  async getAdvances(): Promise<Advance[]> {
    return [];
  }

  async getAdvance(id: string): Promise<Advance | undefined> {
    return undefined;
  }

  async getEmployeeAdvances(employeeId: string): Promise<Advance[]> {
    return [];
  }

  async createAdvance(advance: InsertAdvance): Promise<Advance> {
    throw new Error("Not implemented");
  }

  async updateAdvance(id: string, advance: Partial<InsertAdvance>): Promise<Advance> {
    throw new Error("Not implemented");
  }

  async deleteAdvance(id: string): Promise<void> {
    throw new Error("Not implemented");
  }

  // Payroll
  async getPayroll(): Promise<Payroll[]> {
    return [];
  }

  async getPayrollEntry(id: string): Promise<Payroll | undefined> {
    return undefined;
  }

  async getEmployeePayroll(employeeId: string): Promise<Payroll[]> {
    return [];
  }

  async createPayrollEntry(payroll: InsertPayroll): Promise<Payroll> {
    throw new Error("Not implemented");
  }

  async updatePayrollEntry(id: string, payroll: Partial<InsertPayroll>): Promise<Payroll> {
    throw new Error("Not implemented");
  }

  async deletePayrollEntry(id: string): Promise<void> {
    throw new Error("Not implemented");
  }

  async getPayrollStats(): Promise<{
    totalThisMonth: number;
    processedThisMonth: number;
    pendingThisMonth: number;
  }> {
    return { totalThisMonth: 0, processedThisMonth: 0, pendingThisMonth: 0 };
  }
}

export const storage = new MockStorage();
