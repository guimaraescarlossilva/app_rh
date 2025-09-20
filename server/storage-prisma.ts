import { prisma } from './prisma';
import bcrypt from 'bcrypt';
import { withCache, CacheKeys, cache } from './cache';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  password: string;
  active: boolean;
  createdAt: Date;
}

export interface InsertUser {
  name: string;
  email: string;
  cpf: string;
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
  positionId?: string | null;
  admissionDate: Date;
  baseSalary: number;
  agreedSalary: number;
  advancePercentage?: number;
  status?: 'ativo' | 'inativo' | 'afastado';
}

export interface JobPosition {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface InsertJobPosition {
  name: string;
  description?: string;
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
  getUserByCpf(cpf: string): Promise<User | undefined>;
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

export class PrismaStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const user = await prisma.user.findUnique({
      where: { id }
    });
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await prisma.user.findUnique({
      where: { email }
    });
    return user || undefined;
  }

  async getUserByCpf(cpf: string): Promise<User | undefined> {
    const user = await prisma.user.findUnique({
      where: { cpf }
    });
    return user || undefined;
  }

  async getUsers({ limit = 50, offset = 0, search }: { limit?: number; offset?: number; search?: string } = {}): Promise<User[]> {
    const cacheKey = CacheKeys.users(search, limit, offset);
    
    return withCache(cacheKey, async () => {
      const cappedLimit = Math.min(Math.max(limit, 1), 200);
      
      const where = search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { cpf: { contains: search, mode: 'insensitive' as const } }
        ]
      } : {};

      const users = await prisma.user.findMany({
        where,
        take: cappedLimit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          userGroups: {
            include: {
              group: true
            }
          },
          userBranches: {
            include: {
              branch: true
            }
          }
        }
      });

      return users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        password: user.password,
        active: user.active,
        createdAt: user.createdAt,
        groupNames: user.userGroups.map(ug => ug.group.name).join(', ') || null,
        branchNames: user.userBranches.map(ub => ub.branch.fantasyName).join(', ') || null
      }));
    }, 2 * 60 * 1000); // Cache por 2 minutos
  }

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    const newUser = await prisma.user.create({
      data: {
        ...user,
        password: hashedPassword
      }
    });
    
    // Invalida cache de usuários
    cache.invalidatePattern('^users:');
    
    return newUser;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User> {
    const updateData: any = { ...user };
    
    if (user.password) {
      updateData.password = await bcrypt.hash(user.password, 10);
    }
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    });
    
    // Invalida cache de usuários
    cache.invalidatePattern('^users:');
    
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id }
    });
    
    // Invalida cache de usuários
    cache.invalidatePattern('^users:');
  }

  // Branches
  async getBranches({ limit = 50, offset = 0, search }: { limit?: number; offset?: number; search?: string } = {}): Promise<Branch[]> {
    const cacheKey = CacheKeys.branches(search, limit, offset);
    
    return withCache(cacheKey, async () => {
      const cappedLimit = Math.min(Math.max(limit, 1), 200);
      
      const where = search ? {
        OR: [
          { fantasyName: { contains: search, mode: 'insensitive' as const } },
          { cnpj: { contains: search, mode: 'insensitive' as const } }
        ]
      } : {};

      const branches = await prisma.branch.findMany({
        where,
        take: cappedLimit,
        skip: offset,
        orderBy: { updatedAt: 'desc' }
      });

      return branches.map(branch => ({
        id: branch.id,
        fantasyName: branch.fantasyName,
        address: branch.address,
        phone: branch.phone,
        email: branch.email,
        cnpj: branch.cnpj,
        city: branch.city,
        state: branch.state,
        neighborhood: branch.neighborhood,
        zipCode: branch.zipCode,
        active: branch.active,
        createdAt: branch.createdAt,
        updatedAt: branch.updatedAt
      }));
    }, 5 * 60 * 1000); // Cache por 5 minutos
  }

  async getBranch(id: string): Promise<Branch | undefined> {
    const branch = await prisma.branch.findUnique({
      where: { id }
    });
    return branch || undefined;
  }

  async createBranch(branch: InsertBranch): Promise<Branch> {
    const newBranch = await prisma.branch.create({
      data: branch
    });
    
    // Invalida cache de filiais
    cache.invalidatePattern('^branches:');
    
    return newBranch;
  }

  async updateBranch(id: string, branch: Partial<InsertBranch>): Promise<Branch> {
    const updatedBranch = await prisma.branch.update({
      where: { id },
      data: branch
    });
    
    // Invalida cache de filiais
    cache.invalidatePattern('^branches:');
    
    return updatedBranch;
  }

  async deleteBranch(id: string): Promise<void> {
    await prisma.branch.delete({
      where: { id }
    });
    
    // Invalida cache de filiais
    cache.invalidatePattern('^branches:');
  }

  // Job Positions
  async getJobPositions(): Promise<JobPosition[]> {
    const cacheKey = 'job_positions:list:all';
    
    return withCache(cacheKey, async () => {
      const positions = await prisma.jobPosition.findMany({
        orderBy: { name: 'asc' }
      });
      
      return positions.map(position => ({
        id: position.id,
        name: position.name,
        description: position.description,
        createdAt: position.createdAt.toISOString()
      }));
    }, 10 * 60 * 1000); // Cache por 10 minutos
  }

  async getJobPosition(id: string): Promise<JobPosition | undefined> {
    const position = await prisma.jobPosition.findUnique({
      where: { id }
    });
    
    if (!position) return undefined;
    
    return {
      id: position.id,
      name: position.name,
      description: position.description,
      createdAt: position.createdAt.toISOString()
    };
  }

  async createJobPosition(position: InsertJobPosition): Promise<JobPosition> {
    const newPosition = await prisma.jobPosition.create({
      data: position
    });
    
    // Invalida cache de cargos
    cache.invalidatePattern('^job_positions:');
    
    return {
      id: newPosition.id,
      name: newPosition.name,
      description: newPosition.description,
      createdAt: newPosition.createdAt.toISOString()
    };
  }

  async updateJobPosition(id: string, position: Partial<InsertJobPosition>): Promise<JobPosition> {
    const updatedPosition = await prisma.jobPosition.update({
      where: { id },
      data: position
    });
    
    // Invalida cache de cargos
    cache.invalidatePattern('^job_positions:');
    
    return {
      id: updatedPosition.id,
      name: updatedPosition.name,
      description: updatedPosition.description,
      createdAt: updatedPosition.createdAt.toISOString()
    };
  }

  async deleteJobPosition(id: string): Promise<void> {
    await prisma.jobPosition.delete({
      where: { id }
    });
    
    // Invalida cache de cargos
    cache.invalidatePattern('^job_positions:');
  }

  // Employees
  async getEmployees({ limit = 50, offset = 0, search }: { limit?: number; offset?: number; search?: string } = {}): Promise<Employee[]> {
    const cacheKey = CacheKeys.employees(search, limit, offset);
    
    return withCache(cacheKey, async () => {
      const cappedLimit = Math.min(Math.max(limit, 1), 200);
      
      const where = search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { cpf: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } }
        ]
      } : {};

      const employees = await prisma.employee.findMany({
        where,
        take: cappedLimit,
        skip: offset,
        orderBy: { updatedAt: 'desc' }
      });

      return employees.map(employee => ({
        id: employee.id,
        name: employee.name,
        cpf: employee.cpf,
        email: employee.email,
        phone: employee.phone,
        address: employee.address,
        branchId: employee.branchId,
        positionId: employee.positionId,
        admissionDate: employee.admissionDate,
        baseSalary: Number(employee.baseSalary),
        agreedSalary: Number(employee.agreedSalary),
        advancePercentage: Number(employee.advancePercentage),
        status: employee.status,
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt
      }));
    }, 2 * 60 * 1000); // Cache por 2 minutos
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const employee = await prisma.employee.findUnique({
      where: { id }
    });
    return employee || undefined;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const newEmployee = await prisma.employee.create({
      data: employee
    });
    
    // Invalida cache de funcionários
    cache.invalidatePattern('^employees:');
    
    return {
      id: newEmployee.id,
      name: newEmployee.name,
      cpf: newEmployee.cpf,
      email: newEmployee.email,
      phone: newEmployee.phone,
      address: newEmployee.address,
      branchId: newEmployee.branchId,
      positionId: newEmployee.positionId,
      admissionDate: newEmployee.admissionDate,
      baseSalary: Number(newEmployee.baseSalary),
      agreedSalary: Number(newEmployee.agreedSalary),
      advancePercentage: Number(newEmployee.advancePercentage),
      status: newEmployee.status,
      createdAt: newEmployee.createdAt,
      updatedAt: newEmployee.updatedAt
    };
  }

  async updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee> {
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: employee
    });
    
    // Invalida cache de funcionários
    cache.invalidatePattern('^employees:');
    
    return {
      id: updatedEmployee.id,
      name: updatedEmployee.name,
      cpf: updatedEmployee.cpf,
      email: updatedEmployee.email,
      phone: updatedEmployee.phone,
      address: updatedEmployee.address,
      branchId: updatedEmployee.branchId,
      positionId: updatedEmployee.positionId,
      admissionDate: updatedEmployee.admissionDate,
      baseSalary: Number(updatedEmployee.baseSalary),
      agreedSalary: Number(updatedEmployee.agreedSalary),
      advancePercentage: Number(updatedEmployee.advancePercentage),
      status: updatedEmployee.status,
      createdAt: updatedEmployee.createdAt,
      updatedAt: updatedEmployee.updatedAt
    };
  }

  async deleteEmployee(id: string): Promise<void> {
    await prisma.employee.delete({
      where: { id }
    });
    
    // Invalida cache de funcionários
    cache.invalidatePattern('^employees:');
  }

  // Permission Groups
  async getPermissionGroups({ limit = 50, offset = 0, search }: { limit?: number; offset?: number; search?: string } = {}): Promise<PermissionGroup[]> {
    const cacheKey = CacheKeys.permissionGroups(search, limit, offset);
    
    return withCache(cacheKey, async () => {
      const cappedLimit = Math.min(Math.max(limit, 1), 200);
      
      const where = search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } }
        ]
      } : {};

      const groups = await prisma.permissionGroup.findMany({
        where,
        take: cappedLimit,
        skip: offset,
        orderBy: { createdAt: 'desc' }
      });

      return groups;
    }, 5 * 60 * 1000); // Cache por 5 minutos
  }

  async getPermissionGroup(id: string): Promise<PermissionGroup | undefined> {
    const group = await prisma.permissionGroup.findUnique({
      where: { id }
    });
    return group || undefined;
  }

  async createPermissionGroup(group: InsertPermissionGroup): Promise<PermissionGroup> {
    const newGroup = await prisma.permissionGroup.create({
      data: group
    });
    
    // Invalida cache de grupos de permissão
    cache.invalidatePattern('^permission_groups:');
    
    return newGroup;
  }

  async updatePermissionGroup(id: string, group: Partial<InsertPermissionGroup>): Promise<PermissionGroup> {
    const updatedGroup = await prisma.permissionGroup.update({
      where: { id },
      data: group
    });
    
    // Invalida cache de grupos de permissão
    cache.invalidatePattern('^permission_groups:');
    
    return updatedGroup;
  }

  async deletePermissionGroup(id: string): Promise<void> {
    await prisma.permissionGroup.delete({
      where: { id }
    });
    
    // Invalida cache de grupos de permissão
    cache.invalidatePattern('^permission_groups:');
  }

  // Module Permissions
  async getModulePermissions(groupId: string): Promise<ModulePermission[]> {
    const permissions = await prisma.modulePermission.findMany({
      where: { groupId },
      orderBy: { module: 'asc' }
    });
    return permissions;
  }

  async setModulePermission(permission: InsertModulePermission): Promise<ModulePermission> {
    const existing = await prisma.modulePermission.findUnique({
      where: {
        groupId_module: {
          groupId: permission.groupId,
          module: permission.module
        }
      }
    });

    if (existing) {
      const updated = await prisma.modulePermission.update({
        where: {
          groupId_module: {
            groupId: permission.groupId,
            module: permission.module
          }
        },
        data: permission
      });
      return updated;
    } else {
      const newPermission = await prisma.modulePermission.create({
        data: permission
      });
      return newPermission;
    }
  }

  async deleteModulePermission(groupId: string, module: string): Promise<void> {
    await prisma.modulePermission.delete({
      where: {
        groupId_module: {
          groupId,
          module
        }
      }
    });
  }

  // Payroll
  async getPayroll({ limit = 50, offset = 0, search }: { limit?: number; offset?: number; search?: string } = {}): Promise<PayrollEntry[]> {
    const cacheKey = CacheKeys.payroll(search, limit, offset);
    
    return withCache(cacheKey, async () => {
      const cappedLimit = Math.min(Math.max(limit, 1), 200);
      
      const where = search ? {
        employee: {
          name: { contains: search, mode: 'insensitive' as const }
        }
      } : {};

      const payroll = await prisma.payroll.findMany({
        where,
        take: cappedLimit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          employee: true
        }
      });

      return payroll.map(entry => ({
        id: entry.id,
        employeeId: entry.employeeId,
        month: entry.month,
        year: entry.year,
        baseSalary: Number(entry.baseSalary),
        agreedSalary: Number(entry.agreedSalary),
        advance: Number(entry.advance),
        nightShiftAdditional: Number(entry.nightShiftAdditional),
        nightShiftDsr: Number(entry.nightShiftDsr),
        overtime: Number(entry.overtime),
        overtimeDsr: Number(entry.overtimeDsr),
        vacationBonus: Number(entry.vacationBonus),
        fiveYearBonus: Number(entry.fiveYearBonus),
        positionGratification: Number(entry.positionGratification),
        generalGratification: Number(entry.generalGratification),
        cashierGratification: Number(entry.cashierGratification),
        familyAllowance: Number(entry.familyAllowance),
        holidayPay: Number(entry.holidayPay),
        unhealthiness: Number(entry.unhealthiness),
        maternityLeave: Number(entry.maternityLeave),
        tips: Number(entry.tips),
        others: Number(entry.others),
        vouchers: Number(entry.vouchers),
        grossAmount: Number(entry.grossAmount),
        inss: Number(entry.inss),
        inssVacation: Number(entry.inssVacation),
        irpf: Number(entry.irpf),
        unionFee: Number(entry.unionFee),
        absences: Number(entry.absences),
        absenceReason: entry.absenceReason,
        netAmount: Number(entry.netAmount),
        status: entry.status,
        processedAt: entry.processedAt,
        createdAt: entry.createdAt
      }));
    }, 1 * 60 * 1000); // Cache por 1 minuto
  }

  async getPayrollEntry(id: string): Promise<PayrollEntry | undefined> {
    const entry = await prisma.payroll.findUnique({
      where: { id }
    });
    return entry || undefined;
  }

  async createPayrollEntry(entry: InsertPayrollEntry): Promise<PayrollEntry> {
    const newEntry = await prisma.payroll.create({
      data: entry
    });
    
    // Invalida cache de folha de pagamento
    cache.invalidatePattern('^payroll:');
    
    return {
      id: newEntry.id,
      employeeId: newEntry.employeeId,
      month: newEntry.month,
      year: newEntry.year,
      baseSalary: Number(newEntry.baseSalary),
      agreedSalary: Number(newEntry.agreedSalary),
      advance: Number(newEntry.advance),
      nightShiftAdditional: Number(newEntry.nightShiftAdditional),
      nightShiftDsr: Number(newEntry.nightShiftDsr),
      overtime: Number(newEntry.overtime),
      overtimeDsr: Number(newEntry.overtimeDsr),
      vacationBonus: Number(newEntry.vacationBonus),
      fiveYearBonus: Number(newEntry.fiveYearBonus),
      positionGratification: Number(newEntry.positionGratification),
      generalGratification: Number(newEntry.generalGratification),
      cashierGratification: Number(newEntry.cashierGratification),
      familyAllowance: Number(newEntry.familyAllowance),
      holidayPay: Number(newEntry.holidayPay),
      unhealthiness: Number(newEntry.unhealthiness),
      maternityLeave: Number(newEntry.maternityLeave),
      tips: Number(newEntry.tips),
      others: Number(newEntry.others),
      vouchers: Number(newEntry.vouchers),
      grossAmount: Number(newEntry.grossAmount),
      inss: Number(newEntry.inss),
      inssVacation: Number(newEntry.inssVacation),
      irpf: Number(newEntry.irpf),
      unionFee: Number(newEntry.unionFee),
      absences: Number(newEntry.absences),
      absenceReason: newEntry.absenceReason,
      netAmount: Number(newEntry.netAmount),
      status: newEntry.status,
      processedAt: newEntry.processedAt,
      createdAt: newEntry.createdAt
    };
  }

  async updatePayrollEntry(id: string, entry: Partial<InsertPayrollEntry>): Promise<PayrollEntry> {
    const updatedEntry = await prisma.payroll.update({
      where: { id },
      data: entry
    });
    
    // Invalida cache de folha de pagamento
    cache.invalidatePattern('^payroll:');
    
    return {
      id: updatedEntry.id,
      employeeId: updatedEntry.employeeId,
      month: updatedEntry.month,
      year: updatedEntry.year,
      baseSalary: Number(updatedEntry.baseSalary),
      agreedSalary: Number(updatedEntry.agreedSalary),
      advance: Number(updatedEntry.advance),
      nightShiftAdditional: Number(updatedEntry.nightShiftAdditional),
      nightShiftDsr: Number(updatedEntry.nightShiftDsr),
      overtime: Number(updatedEntry.overtime),
      overtimeDsr: Number(updatedEntry.overtimeDsr),
      vacationBonus: Number(updatedEntry.vacationBonus),
      fiveYearBonus: Number(updatedEntry.fiveYearBonus),
      positionGratification: Number(updatedEntry.positionGratification),
      generalGratification: Number(updatedEntry.generalGratification),
      cashierGratification: Number(updatedEntry.cashierGratification),
      familyAllowance: Number(updatedEntry.familyAllowance),
      holidayPay: Number(updatedEntry.holidayPay),
      unhealthiness: Number(updatedEntry.unhealthiness),
      maternityLeave: Number(updatedEntry.maternityLeave),
      tips: Number(updatedEntry.tips),
      others: Number(updatedEntry.others),
      vouchers: Number(updatedEntry.vouchers),
      grossAmount: Number(updatedEntry.grossAmount),
      inss: Number(updatedEntry.inss),
      inssVacation: Number(updatedEntry.inssVacation),
      irpf: Number(updatedEntry.irpf),
      unionFee: Number(updatedEntry.unionFee),
      absences: Number(updatedEntry.absences),
      absenceReason: updatedEntry.absenceReason,
      netAmount: Number(updatedEntry.netAmount),
      status: updatedEntry.status,
      processedAt: updatedEntry.processedAt,
      createdAt: updatedEntry.createdAt
    };
  }

  async deletePayrollEntry(id: string): Promise<void> {
    await prisma.payroll.delete({
      where: { id }
    });
    
    // Invalida cache de folha de pagamento
    cache.invalidatePattern('^payroll:');
  }
}

export const storage = new PrismaStorage();
